"""ホール傾向分析モジュール

ホールごとの設定配分傾向、特定日パターン、
台番号の配置傾向を分析する。
"""

from collections import defaultdict
from dataclasses import dataclass, field

import pandas as pd

from pachinko_analyzer.models import DailyMachineData, MachineSpec
from pachinko_analyzer.estimator import estimate_setting, SettingEstimation


@dataclass
class HallTrend:
    """ホール傾向分析結果"""
    hall_name: str
    total_days: int
    avg_high_setting_ratio: float       # 高設定と推測される台の割合 (%)
    best_dates: list[str]               # 出玉が多かった日 (上位)
    # 台番号パターン
    hot_numbers: list[int]              # 高設定が入りやすい台番号
    # 曜日別傾向
    weekday_scores: dict[str, float]    # 曜日ごとの平均スコア
    # 機種別傾向
    machine_scores: dict[str, float]    # 機種ごとの平均スコア
    # 末尾番号傾向
    suffix_scores: dict[int, float]     # 台番号末尾ごとの平均スコア


@dataclass
class DateAnalysis:
    """日別分析結果"""
    date: str
    hall_name: str
    total_machines: int
    avg_diff_medals: float
    high_setting_count: int
    high_setting_ratio: float
    estimations: list[SettingEstimation] = field(default_factory=list)


WEEKDAY_NAMES = {
    0: "月", 1: "火", 2: "水", 3: "木", 4: "金", 5: "土", 6: "日",
}


def analyze_hall(
    data_list: list[DailyMachineData],
    spec: MachineSpec,
    high_setting_threshold: float = 50.0,
) -> HallTrend:
    """ホールの傾向を分析する

    Args:
        data_list: 同一ホール・同一機種の複数日のデータ
        spec: 機種スペック
        high_setting_threshold: 高設定と判定するスコアの閾値
    """
    if not data_list:
        raise ValueError("データが空です")

    hall_name = data_list[0].hall_name
    estimations = [estimate_setting(d, spec) for d in data_list]

    # 日別にグルーピング
    date_groups: dict[str, list[SettingEstimation]] = defaultdict(list)
    for est in estimations:
        date_groups[est.date].append(est)

    # 日別分析
    date_analyses: list[DateAnalysis] = []
    for date, ests in sorted(date_groups.items()):
        high_count = sum(1 for e in ests if e.high_setting_prob >= high_setting_threshold)
        date_analyses.append(DateAnalysis(
            date=date,
            hall_name=hall_name,
            total_machines=len(ests),
            avg_diff_medals=sum(e.diff_medals for e in ests) / len(ests),
            high_setting_count=high_count,
            high_setting_ratio=high_count / len(ests) * 100 if ests else 0,
            estimations=ests,
        ))

    # 出玉が良かった日 (平均差枚数の上位5日)
    best_dates = sorted(date_analyses, key=lambda x: x.avg_diff_medals, reverse=True)
    best_date_strs = [da.date for da in best_dates[:5]]

    # 高設定台の割合
    total_high = sum(da.high_setting_count for da in date_analyses)
    total_machines = sum(da.total_machines for da in date_analyses)
    avg_high_ratio = total_high / total_machines * 100 if total_machines > 0 else 0

    # 台番号別スコア
    number_scores: dict[int, list[float]] = defaultdict(list)
    for est in estimations:
        number_scores[est.machine_number].append(est.score)

    # 高設定が入りやすい台番号 (平均スコア上位)
    avg_number_scores = {
        num: sum(scores) / len(scores) for num, scores in number_scores.items()
    }
    hot_numbers = sorted(
        avg_number_scores, key=lambda x: avg_number_scores[x], reverse=True
    )[:10]

    # 曜日別スコア
    weekday_scores_raw: dict[int, list[float]] = defaultdict(list)
    for est, data in zip(estimations, data_list):
        dt = pd.Timestamp(data.date)
        weekday_scores_raw[dt.weekday()].append(est.score)

    weekday_scores = {}
    for wd, scores in weekday_scores_raw.items():
        weekday_scores[WEEKDAY_NAMES[wd]] = sum(scores) / len(scores)

    # 末尾番号傾向
    suffix_scores_raw: dict[int, list[float]] = defaultdict(list)
    for est in estimations:
        suffix = est.machine_number % 10
        suffix_scores_raw[suffix].append(est.score)

    suffix_scores = {}
    for suffix, scores in suffix_scores_raw.items():
        suffix_scores[suffix] = sum(scores) / len(scores)

    # 機種別スコア (このメソッドは単一機種前提だが拡張用)
    machine_scores = {spec.name: sum(e.score for e in estimations) / len(estimations)}

    return HallTrend(
        hall_name=hall_name,
        total_days=len(date_groups),
        avg_high_setting_ratio=avg_high_ratio,
        best_dates=best_date_strs,
        hot_numbers=hot_numbers,
        weekday_scores=weekday_scores,
        machine_scores=machine_scores,
        suffix_scores=suffix_scores,
    )


def analyze_multi_machine(
    data_list: list[DailyMachineData],
    specs: dict[str, MachineSpec],
    high_setting_threshold: float = 50.0,
) -> dict[str, HallTrend]:
    """複数機種のホール傾向を分析する

    Args:
        data_list: 全機種の混在データ
        specs: 機種名→スペックの辞書
        high_setting_threshold: 高設定の閾値

    Returns:
        機種名→HallTrend の辞書
    """
    # 機種ごとにグループ化
    machine_groups: dict[str, list[DailyMachineData]] = defaultdict(list)
    for d in data_list:
        machine_groups[d.machine_name].append(d)

    results = {}
    for machine_name, group_data in machine_groups.items():
        if machine_name in specs:
            results[machine_name] = analyze_hall(
                group_data, specs[machine_name], high_setting_threshold
            )

    return results
