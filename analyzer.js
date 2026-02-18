/**
 * ジャグラー設定推測・期待値計算エンジン
 * ベイズ推定を用いて各設定の確率を算出し、期待値を計算する
 */

import { JUGGLER_SPECS } from './data.js';

/**
 * ベイズ推定で各設定の事後確率を計算する
 * @param {string} model - 機種名
 * @param {number} totalGames - 総回転数
 * @param {number} bbCount - BIG回数
 * @param {number} rbCount - REG回数
 * @param {number[]} priors - 設定1-6の事前確率（デフォルト: 均等）
 * @returns {Object} 各設定の事後確率
 */
function estimateSettings(model, totalGames, bbCount, rbCount, priors = null) {
  const spec = JUGGLER_SPECS[model];
  if (!spec) throw new Error(`Unknown model: ${model}`);

  // デフォルトの事前確率（ホールの傾向として低設定が多い現実的な分布）
  if (!priors) {
    priors = [0.30, 0.25, 0.20, 0.12, 0.08, 0.05]; // 設定1が最も多い
  }

  const results = {};
  let totalLikelihood = 0;

  for (let s = 1; s <= 6; s++) {
    const setting = spec.settings[s];
    const bbProb = setting.bb;
    const rbProb = setting.rb;

    // 二項分布の尤度を対数で計算（アンダーフロー防止）
    const logLikelihoodBB = bbCount * Math.log(bbProb * totalGames)
      - totalGames * bbProb
      - logFactorial(bbCount);
    const logLikelihoodRB = rbCount * Math.log(rbProb * totalGames)
      - totalGames * rbProb
      - logFactorial(rbCount);

    // ポアソン近似の対数尤度
    const logLikelihood = logLikelihoodBB + logLikelihoodRB;
    const likelihood = Math.exp(logLikelihood) * priors[s - 1];

    results[s] = {
      setting: s,
      likelihood: likelihood,
      bbTheoretical: setting.bb,
      rbTheoretical: setting.rb,
      combinedTheoretical: 1 / (1/setting.bb + 1/setting.rb) * (1/setting.bb + 1/setting.rb) /
        (1 / (1/setting.bb + 1/setting.rb)),
      payout: setting.payout
    };

    totalLikelihood += likelihood;
  }

  // 正規化して事後確率を算出
  for (let s = 1; s <= 6; s++) {
    results[s].probability = totalLikelihood > 0
      ? results[s].likelihood / totalLikelihood
      : 1/6;
  }

  return results;
}

/**
 * 対数階乗（スターリング近似を使用）
 */
function logFactorial(n) {
  if (n <= 1) return 0;
  if (n < 20) {
    let result = 0;
    for (let i = 2; i <= n; i++) result += Math.log(i);
    return result;
  }
  // スターリング近似
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
}

/**
 * 実測確率を計算
 */
function calculateActualProbabilities(totalGames, bbCount, rbCount) {
  return {
    bbProb: totalGames > 0 ? bbCount / totalGames : 0,
    rbProb: totalGames > 0 ? rbCount / totalGames : 0,
    combinedProb: totalGames > 0 ? (bbCount + rbCount) / totalGames : 0,
    bbRatio: totalGames > 0 ? totalGames / Math.max(bbCount, 1) : 0,
    rbRatio: totalGames > 0 ? totalGames / Math.max(rbCount, 1) : 0,
    combinedRatio: totalGames > 0 ? totalGames / Math.max(bbCount + rbCount, 1) : 0
  };
}

/**
 * 期待収支を計算（これからの打ち込みに対する期待値）
 * @param {Object} settingProbs - 設定推測結果
 * @param {string} model - 機種名
 * @param {number} remainingGames - これから回す予定のゲーム数
 * @param {number} rate - メダルレート（円）
 * @returns {Object} 期待収支情報
 */
function calculateExpectedValue(settingProbs, model, remainingGames, rate = 20) {
  const spec = JUGGLER_SPECS[model];
  let weightedPayout = 0;

  for (let s = 1; s <= 6; s++) {
    weightedPayout += settingProbs[s].probability * spec.settings[s].payout;
  }

  const betPerGame = spec.betPerGame * rate;  // 1ゲームあたりの投資額（円）
  const totalInvestment = betPerGame * remainingGames;
  const expectedReturn = totalInvestment * (weightedPayout / 100);
  const expectedProfit = expectedReturn - totalInvestment;

  return {
    weightedPayout,
    totalInvestment,
    expectedReturn,
    expectedProfit,
    profitPerGame: expectedProfit / remainingGames,
    isPositiveEV: weightedPayout > 100
  };
}

/**
 * 総合判定を行う
 */
function getVerdict(settingProbs, expectedValue, totalGames) {
  const highSettingProb = (settingProbs[4]?.probability || 0) +
    (settingProbs[5]?.probability || 0) +
    (settingProbs[6]?.probability || 0);
  const setting56Prob = (settingProbs[5]?.probability || 0) +
    (settingProbs[6]?.probability || 0);

  // 最も確率の高い設定を取得
  let mostLikely = 1;
  let maxProb = 0;
  for (let s = 1; s <= 6; s++) {
    if (settingProbs[s].probability > maxProb) {
      maxProb = settingProbs[s].probability;
      mostLikely = s;
    }
  }

  // 信頼度の計算（回転数が多いほど信頼度が上がる）
  const confidenceLevel = Math.min(totalGames / 8000, 1.0);
  let confidence;
  if (totalGames < 1000) confidence = "低（データ不足）";
  else if (totalGames < 3000) confidence = "中（参考程度）";
  else if (totalGames < 6000) confidence = "高";
  else confidence = "非常に高い";

  // 判定
  let verdict, verdictClass, explanation;

  if (totalGames < 500) {
    verdict = "⏳ データ不足";
    verdictClass = "neutral";
    explanation = "まだ回転数が少なすぎます。最低でも1000G以上のデータが必要です。";
  } else if (expectedValue.weightedPayout >= 103 && highSettingProb >= 0.6) {
    verdict = "🔥 激アツ！続行推奨";
    verdictClass = "strong-positive";
    explanation = `高設定の可能性が${(highSettingProb * 100).toFixed(1)}%。期待機械割${expectedValue.weightedPayout.toFixed(1)}%で非常に好条件です。`;
  } else if (expectedValue.weightedPayout >= 100.5 && highSettingProb >= 0.4) {
    verdict = "✅ 続行OK";
    verdictClass = "positive";
    explanation = `高設定の可能性が${(highSettingProb * 100).toFixed(1)}%。プラス期待値で打てる状況です。`;
  } else if (expectedValue.weightedPayout >= 99.0) {
    verdict = "⚠️ 微妙";
    verdictClass = "warning";
    explanation = `期待機械割${expectedValue.weightedPayout.toFixed(1)}%。ほぼトントンの状況で、もう少し様子を見るか、ヤメ時を検討してください。`;
  } else {
    verdict = "🛑 ヤメ推奨";
    verdictClass = "negative";
    explanation = `低設定の可能性が高く、期待機械割${expectedValue.weightedPayout.toFixed(1)}%です。この台からの撤退を推奨します。`;
  }

  return {
    verdict,
    verdictClass,
    explanation,
    mostLikely,
    mostLikelyProb: maxProb,
    highSettingProb,
    setting56Prob,
    confidence,
    confidenceLevel
  };
}

/**
 * メイン分析関数 - すべての分析を統合
 */
function analyzeJuggler(model, totalGames, bbCount, rbCount, rate = 20, remainingGames = 2000) {
  const settingProbs = estimateSettings(model, totalGames, bbCount, rbCount);
  const actualProbs = calculateActualProbabilities(totalGames, bbCount, rbCount);
  const expectedValue = calculateExpectedValue(settingProbs, model, remainingGames, rate);
  const verdict = getVerdict(settingProbs, expectedValue, totalGames);

  return {
    input: { model, totalGames, bbCount, rbCount, rate, remainingGames },
    settingProbs,
    actualProbs,
    expectedValue,
    verdict
  };
}

export {
  analyzeJuggler,
  estimateSettings,
  calculateActualProbabilities,
  calculateExpectedValue,
  getVerdict
};
