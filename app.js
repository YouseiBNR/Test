/**
 * ジャグラー設定推測ツール - メインアプリケーション
 * OCR / 手動入力 → 統計分析 → 結果表示 → チャート描画
 */

import { JUGGLER_SPECS, RATE_OPTIONS } from './data.js';
import { analyzeJuggler } from './analyzer.js';
import { performOCR, preprocessImage } from './ocr.js';

// ========================================
// DOM要素の参照
// ========================================
const elements = {
  // タブ
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabCamera: document.getElementById('tab-camera'),
  tabManual: document.getElementById('tab-manual'),

  // カメラ/OCR
  cameraArea: document.getElementById('camera-area'),
  cameraInput: document.getElementById('camera-input'),
  cameraPlaceholder: document.getElementById('camera-placeholder'),
  previewImage: document.getElementById('preview-image'),
  ocrStatus: document.getElementById('ocr-status'),
  ocrNotice: document.getElementById('ocr-notice'),

  // フォーム
  modelSelect: document.getElementById('model-select'),
  totalGames: document.getElementById('total-games'),
  bbCount: document.getElementById('bb-count'),
  rbCount: document.getElementById('rb-count'),
  rateSelect: document.getElementById('rate-select'),
  remainingGames: document.getElementById('remaining-games'),
  analyzeBtn: document.getElementById('analyze-btn'),

  // 結果
  results: document.getElementById('results'),
  verdictBanner: document.getElementById('verdict-banner'),
  verdictText: document.getElementById('verdict-text'),
  verdictExplanation: document.getElementById('verdict-explanation'),
  confidenceFill: document.getElementById('confidence-fill'),
  confidenceText: document.getElementById('confidence-text'),

  // 実測データ
  actualBBRatio: document.getElementById('actual-bb-ratio'),
  actualBBSub: document.getElementById('actual-bb-sub'),
  actualRBRatio: document.getElementById('actual-rb-ratio'),
  actualRBSub: document.getElementById('actual-rb-sub'),
  actualCombinedRatio: document.getElementById('actual-combined-ratio'),
  actualCombinedSub: document.getElementById('actual-combined-sub'),
  totalBonus: document.getElementById('total-bonus'),
  totalBonusSub: document.getElementById('total-bonus-sub'),

  // 期待収支
  weightedPayout: document.getElementById('weighted-payout'),
  expectedProfit: document.getElementById('expected-profit'),
  expectedProfitSub: document.getElementById('expected-profit-sub'),
  highSettingProb: document.getElementById('high-setting-prob'),
  setting56Prob: document.getElementById('setting-56-prob'),

  // テーブル
  settingTableBody: document.getElementById('setting-table-body'),

  // チャート
  settingChart: document.getElementById('setting-chart'),
  comparisonChart: document.getElementById('comparison-chart'),

  // 履歴
  saveHistoryBtn: document.getElementById('save-history-btn'),
  historySection: document.getElementById('history-section'),
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
};

let settingChartInstance = null;
let comparisonChartInstance = null;

// ========================================
// タブ切り替え
// ========================================
elements.tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    elements.tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    elements.tabCamera.style.display = tab === 'camera' ? 'block' : 'none';
    elements.tabManual.style.display = tab === 'manual' ? 'block' : 'none';
  });
});

// ========================================
// カメラ / 写真入力
// ========================================
elements.cameraArea.addEventListener('click', () => {
  elements.cameraInput.click();
});

elements.cameraInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // プレビュー表示
  const url = URL.createObjectURL(file);
  elements.previewImage.src = url;
  elements.previewImage.style.display = 'block';
  elements.cameraPlaceholder.style.display = 'none';

  // OCR実行
  elements.analyzeBtn.disabled = true;
  elements.analyzeBtn.textContent = 'OCR処理中...';

  try {
    // 画像前処理
    const img = new Image();
    img.src = url;
    await new Promise(resolve => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    preprocessImage(canvas);

    // OCR実行
    const result = await performOCR(canvas.toDataURL());

    // 結果をフォームに反映
    if (result.totalGames) {
      elements.totalGames.value = result.totalGames;
    }
    if (result.bbCount !== null) {
      elements.bbCount.value = result.bbCount;
    }
    if (result.rbCount !== null) {
      elements.rbCount.value = result.rbCount;
    }

    // OCR通知
    elements.ocrNotice.style.display = 'block';
    if (result.rawText) {
      console.log('OCR Raw Text:', result.rawText);
      console.log('OCR Confidence:', result.confidence);
    }
  } catch (err) {
    console.error('OCR Error:', err);
    elements.ocrStatus.textContent = 'OCR処理に失敗しました。手動で入力してください。';
  }

  elements.analyzeBtn.disabled = false;
  elements.analyzeBtn.textContent = '分析する';
});

// ========================================
// 分析実行
// ========================================
elements.analyzeBtn.addEventListener('click', () => {
  const model = elements.modelSelect.value;
  const totalGames = parseInt(elements.totalGames.value, 10);
  const bbCount = parseInt(elements.bbCount.value, 10);
  const rbCount = parseInt(elements.rbCount.value, 10);
  const rate = parseInt(elements.rateSelect.value, 10);
  const remainingGames = parseInt(elements.remainingGames.value, 10);

  // バリデーション
  if (!totalGames || totalGames < 1) {
    alert('総回転数を入力してください');
    elements.totalGames.focus();
    return;
  }
  if (isNaN(bbCount) || bbCount < 0) {
    alert('BIG回数を入力してください');
    elements.bbCount.focus();
    return;
  }
  if (isNaN(rbCount) || rbCount < 0) {
    alert('REG回数を入力してください');
    elements.rbCount.focus();
    return;
  }

  // 分析実行
  const result = analyzeJuggler(model, totalGames, bbCount, rbCount, rate, remainingGames);
  displayResults(result);
});

// ========================================
// 結果表示
// ========================================
function displayResults(result) {
  const { settingProbs, actualProbs, expectedValue, verdict, input } = result;

  // 結果エリアを表示
  elements.results.classList.add('visible');

  // 判定バナー
  elements.verdictBanner.className = `verdict-banner ${verdict.verdictClass}`;
  elements.verdictText.textContent = verdict.verdict;
  elements.verdictExplanation.textContent = verdict.explanation;
  elements.confidenceFill.style.width = `${verdict.confidenceLevel * 100}%`;
  elements.confidenceText.textContent = verdict.confidence;

  // 実測データ
  elements.actualBBRatio.textContent = `1/${actualProbs.bbRatio.toFixed(1)}`;
  elements.actualBBSub.textContent = `${input.bbCount}回 / ${input.totalGames}G`;
  elements.actualRBRatio.textContent = `1/${actualProbs.rbRatio.toFixed(1)}`;
  elements.actualRBSub.textContent = `${input.rbCount}回 / ${input.totalGames}G`;
  elements.actualCombinedRatio.textContent = `1/${actualProbs.combinedRatio.toFixed(1)}`;
  elements.actualCombinedSub.textContent = `${input.bbCount + input.rbCount}回 / ${input.totalGames}G`;
  elements.totalBonus.textContent = `${input.bbCount + input.rbCount}回`;
  elements.totalBonusSub.textContent = `BB:${input.bbCount} / RB:${input.rbCount}`;

  // 期待収支
  const payoutClass = expectedValue.weightedPayout >= 100.5 ? 'positive' :
    expectedValue.weightedPayout >= 99.5 ? 'neutral' : 'negative';
  elements.weightedPayout.className = `stat-value ${payoutClass}`;
  elements.weightedPayout.textContent = `${expectedValue.weightedPayout.toFixed(1)}%`;

  const profitClass = expectedValue.expectedProfit >= 0 ? 'positive' : 'negative';
  elements.expectedProfit.className = `stat-value ${profitClass}`;
  elements.expectedProfit.textContent = `${expectedValue.expectedProfit >= 0 ? '+' : ''}${Math.round(expectedValue.expectedProfit).toLocaleString()}円`;
  elements.expectedProfitSub.textContent = `残り${input.remainingGames}Gの期待値`;

  elements.highSettingProb.textContent = `${(verdict.highSettingProb * 100).toFixed(1)}%`;
  elements.highSettingProb.className = `stat-value ${verdict.highSettingProb >= 0.5 ? 'positive' : verdict.highSettingProb >= 0.3 ? 'neutral' : 'negative'}`;
  elements.setting56Prob.textContent = `${(verdict.setting56Prob * 100).toFixed(1)}%`;
  elements.setting56Prob.className = `stat-value ${verdict.setting56Prob >= 0.4 ? 'positive' : verdict.setting56Prob >= 0.2 ? 'neutral' : 'negative'}`;

  // 設定推測テーブル
  renderSettingTable(settingProbs, verdict.mostLikely);

  // チャート描画
  renderSettingChart(settingProbs);
  renderComparisonChart(result);

  // スクロール
  elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========================================
// 設定推測テーブル
// ========================================
function renderSettingTable(settingProbs, mostLikely) {
  let html = '';
  for (let s = 1; s <= 6; s++) {
    const sp = settingProbs[s];
    const prob = (sp.probability * 100).toFixed(1);
    const isHighlight = s === mostLikely;
    const barClass = sp.probability >= 0.25 ? 'high' : sp.probability >= 0.1 ? 'mid' : 'low';

    html += `
      <tr class="${isHighlight ? 'highlight' : ''}">
        <td>設定${s}</td>
        <td>
          <strong>${prob}%</strong>
          <div class="prob-bar">
            <div class="prob-bar-fill ${barClass}" style="width:${Math.min(prob * 2, 100)}%"></div>
          </div>
        </td>
        <td>1/${(1/sp.bbTheoretical).toFixed(1)}</td>
        <td>1/${(1/sp.rbTheoretical).toFixed(1)}</td>
        <td>${sp.payout}%</td>
      </tr>
    `;
  }
  elements.settingTableBody.innerHTML = html;
}

// ========================================
// チャート: 設定確率分布
// ========================================
function renderSettingChart(settingProbs) {
  if (settingChartInstance) {
    settingChartInstance.destroy();
  }

  const labels = ['設定1', '設定2', '設定3', '設定4', '設定5', '設定6'];
  const data = [];
  const colors = [];
  const colorMap = {
    1: '#ff5252', 2: '#ff7b52', 3: '#ffab00',
    4: '#66bb6a', 5: '#42a5f5', 6: '#ffd700'
  };

  for (let s = 1; s <= 6; s++) {
    data.push((settingProbs[s].probability * 100).toFixed(1));
    colors.push(colorMap[s]);
  }

  settingChartInstance = new Chart(elements.settingChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '推測確率 (%)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(c => c + '80'),
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#9898cc',
            callback: (v) => v + '%'
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: '#9898cc' },
          grid: { display: false }
        }
      }
    }
  });
}

// ========================================
// チャート: 理論値 vs 実測値
// ========================================
function renderComparisonChart(result) {
  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
  }

  const { settingProbs, actualProbs, verdict } = result;
  const mostLikely = verdict.mostLikely;
  const spec = settingProbs[mostLikely];

  const labels = ['BB確率', 'RB確率', '合算確率'];
  const theoreticalData = [
    (1 / spec.bbTheoretical).toFixed(1),
    (1 / spec.rbTheoretical).toFixed(1),
    (1 / (spec.bbTheoretical + spec.rbTheoretical)).toFixed(1)
  ];
  const actualData = [
    actualProbs.bbRatio.toFixed(1),
    actualProbs.rbRatio.toFixed(1),
    actualProbs.combinedRatio.toFixed(1)
  ];

  comparisonChartInstance = new Chart(elements.comparisonChart, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `設定${mostLikely}理論値 (1/X)`,
          data: theoreticalData,
          backgroundColor: 'rgba(68, 138, 255, 0.6)',
          borderColor: '#448aff',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6
        },
        {
          label: '実測値 (1/X)',
          data: actualData,
          backgroundColor: 'rgba(255, 107, 53, 0.6)',
          borderColor: '#ff6b35',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9898cc', boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: 1/${ctx.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9898cc',
            callback: (v) => '1/' + v
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        x: {
          ticks: { color: '#9898cc' },
          grid: { display: false }
        }
      }
    }
  });
}

// ========================================
// 履歴管理
// ========================================
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('juggler_history') || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(result) {
  const history = getHistory();
  const entry = {
    timestamp: new Date().toISOString(),
    model: result.input.model,
    totalGames: result.input.totalGames,
    bbCount: result.input.bbCount,
    rbCount: result.input.rbCount,
    verdict: result.verdict.verdict,
    verdictClass: result.verdict.verdictClass,
    weightedPayout: result.expectedValue.weightedPayout
  };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem('juggler_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    elements.historySection.style.display = 'none';
    return;
  }

  elements.historySection.style.display = 'block';
  elements.historyList.innerHTML = history.map((h, i) => {
    const date = new Date(h.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `
      <div class="history-item" data-index="${i}">
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${h.model}</div>
          <div class="history-meta">${dateStr} | ${h.totalGames}G | BB:${h.bbCount} RB:${h.rbCount}</div>
        </div>
        <div class="history-verdict" style="color:${h.verdictClass === 'positive' || h.verdictClass === 'strong-positive' ? 'var(--green)' : h.verdictClass === 'negative' ? 'var(--red)' : 'var(--yellow)'}">
          ${h.weightedPayout.toFixed(1)}%
        </div>
      </div>
    `;
  }).join('');

  // 履歴クリックで復元
  elements.historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index, 10);
      const h = history[idx];
      elements.modelSelect.value = h.model;
      elements.totalGames.value = h.totalGames;
      elements.bbCount.value = h.bbCount;
      elements.rbCount.value = h.rbCount;
      elements.analyzeBtn.click();
    });
  });
}

elements.saveHistoryBtn.addEventListener('click', () => {
  const model = elements.modelSelect.value;
  const totalGames = parseInt(elements.totalGames.value, 10);
  const bbCount = parseInt(elements.bbCount.value, 10);
  const rbCount = parseInt(elements.rbCount.value, 10);
  const rate = parseInt(elements.rateSelect.value, 10);
  const remainingGames = parseInt(elements.remainingGames.value, 10);

  if (!totalGames) return;

  const result = analyzeJuggler(model, totalGames, bbCount, rbCount, rate, remainingGames);
  saveToHistory(result);
  elements.saveHistoryBtn.textContent = '✅ 保存しました';
  setTimeout(() => {
    elements.saveHistoryBtn.textContent = '📋 この結果を保存';
  }, 2000);
});

elements.clearHistoryBtn.addEventListener('click', () => {
  if (confirm('履歴をすべて削除しますか？')) {
    localStorage.removeItem('juggler_history');
    renderHistory();
  }
});

// ========================================
// 初期化
// ========================================
renderHistory();

// PWA用 service worker は省略（静的ホスティング用）
console.log('Juggler Analyzer initialized');
