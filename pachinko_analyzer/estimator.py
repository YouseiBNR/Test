"""設定推測エンジン

ボーナス確率・小役確率から各設定の尤度を計算し、
設定推測スコアを算出する。
"""

import math
from dataclasses import dataclass

from pachinko_analyzer.models import DailyMachineData, MachineSpec


@dataclass
class SettingEstimation:
    """設定推測結果"""
    machine_number: int
    date: str
    total_games: int
    bb_count: int
    rb_count: int
    diff_medals: int
    # 各設定の確率 (%) - インデックス0=設定1 ... 5=設定6
    setting_probs: list[float]
    # 最も可能性が高い設定
    most_likely_setting: int
    # 高設定(456)の確率
    high_setting_prob: float
    # 総合スコア (0-100)
    score: float


def _binomial_log_likelihood(n: int, k: int, prob_denom: float) -> float:
    """二項分布の対数尤度を計算する（定数項を除く）

    Args:
        n: 試行回数 (総ゲーム数)
        k: 成功回数 (ボーナス回数)
        prob_denom: 確率の分母 (1/prob_denom が確率)
    """
    if k == 0 and n == 0:
        return 0.0
    p = 1.0 / prob_denom
    if p <= 0 or p >= 1:
        return -float('inf')
    if k == 0:
        return n * math.log(1 - p)
    if k > n:
        return -float('inf')
    return k * math.log(p) + (n - k) * math.log(1 - p)


def estimate_setting(data: DailyMachineData, spec: MachineSpec) -> SettingEstimation:
    """1台分の設定推測を行う

    ベイズ推定を使い、各設定の事後確率を計算する。
    事前確率は均一分布（全設定同確率）とする。
    """
    log_likelihoods = []

    for i in range(6):
        ll = 0.0

        # BB確率からの尤度
        ll += _binomial_log_likelihood(
            data.total_games, data.bb_count, spec.bb_prob[i]
        )

        # RB確率からの尤度
        ll += _binomial_log_likelihood(
            data.total_games, data.rb_count, spec.rb_prob[i]
        )

        # 小役確率からの尤度
        for kouyaku_name, spec_probs in spec.kouyaku_probs.items():
            if kouyaku_name in data.kouyaku_counts:
                count = data.kouyaku_counts[kouyaku_name]
                ll += _binomial_log_likelihood(
                    data.total_games, count, spec_probs[i]
                )

        log_likelihoods.append(ll)

    # 対数尤度を確率に変換 (log-sum-exp trick)
    max_ll = max(log_likelihoods)
    exp_values = [math.exp(ll - max_ll) for ll in log_likelihoods]
    total = sum(exp_values)
    probs = [v / total * 100 for v in exp_values]

    # 最も可能性が高い設定
    most_likely = probs.index(max(probs)) + 1

    # 高設定(4,5,6)の確率
    high_prob = sum(probs[3:6])

    # 総合スコア (高設定確率をベースに、差枚数も加味)
    score = _calculate_score(probs, data.diff_medals, data.total_games)

    return SettingEstimation(
        machine_number=data.machine_number,
        date=data.date,
        total_games=data.total_games,
        bb_count=data.bb_count,
        rb_count=data.rb_count,
        diff_medals=data.diff_medals,
        setting_probs=probs,
        most_likely_setting=most_likely,
        high_setting_prob=high_prob,
        score=score,
    )


def _calculate_score(probs: list[float], diff_medals: int, total_games: int) -> float:
    """総合スコアを計算する (0-100)

    - 高設定確率: 70%のウェイト
    - 差枚数の評価: 30%のウェイト
    """
    # 高設定確率からのスコア (0-100)
    high_prob = sum(probs[3:6])
    prob_score = high_prob  # すでに0-100%

    # 差枚数からのスコア
    if total_games == 0:
        medal_score = 50.0
    else:
        # 1000Gあたりの差枚数で評価
        diff_per_1000g = diff_medals / (total_games / 1000)
        # -100〜+100枚/1000Gを0-100にマッピング
        medal_score = max(0, min(100, (diff_per_1000g + 100) / 200 * 100))

    return prob_score * 0.7 + medal_score * 0.3


def estimate_batch(
    data_list: list[DailyMachineData],
    spec: MachineSpec,
) -> list[SettingEstimation]:
    """複数台の設定推測を一括で行う"""
    return [estimate_setting(d, spec) for d in data_list]
