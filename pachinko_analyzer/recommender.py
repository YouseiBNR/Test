"""台選びレコメンド機能

過去のホール傾向データと当日の状況から、
狙い台をレコメンドする。
"""

from dataclasses import dataclass

from pachinko_analyzer.hall_analyzer import HallTrend


@dataclass
class Recommendation:
    """台選びレコメンド"""
    machine_number: int
    score: float                # 推奨スコア (0-100)
    reasons: list[str]          # 推奨理由


def recommend_machines(
    trend: HallTrend,
    available_numbers: list[int] | None = None,
    target_weekday: str | None = None,
    is_event_day: bool = False,
) -> list[Recommendation]:
    """過去の傾向から狙い台をレコメンドする

    Args:
        trend: ホール傾向分析結果
        available_numbers: 選択可能な台番号のリスト (Noneなら全台)
        target_weekday: 狙う曜日 (例: "土")
        is_event_day: イベント日かどうか

    Returns:
        スコア降順のレコメンドリスト
    """
    candidates = available_numbers or trend.hot_numbers
    recommendations = []

    for num in candidates:
        score = 50.0  # ベーススコア
        reasons = []

        # 1. 過去の台番号傾向
        if num in trend.hot_numbers:
            rank = trend.hot_numbers.index(num)
            bonus = max(0, (10 - rank) * 3)  # 上位ほどボーナス大
            score += bonus
            reasons.append(f"過去の高設定台番号ランキング {rank + 1}位")

        # 2. 末尾番号傾向
        suffix = num % 10
        if suffix in trend.suffix_scores:
            suffix_score = trend.suffix_scores[suffix]
            if suffix_score > 55:
                score += (suffix_score - 55) * 0.5
                reasons.append(f"末尾{suffix}番の過去平均スコア: {suffix_score:.1f}")

        # 3. 曜日傾向
        if target_weekday and target_weekday in trend.weekday_scores:
            wd_score = trend.weekday_scores[target_weekday]
            if wd_score > 55:
                score += (wd_score - 55) * 0.3
                reasons.append(f"{target_weekday}曜日の平均スコア: {wd_score:.1f}")

        # 4. イベント日ボーナス
        if is_event_day:
            event_bonus = trend.avg_high_setting_ratio * 0.2
            score += event_bonus
            reasons.append(f"イベント日 (過去の高設定率: {trend.avg_high_setting_ratio:.1f}%)")

        # 5. 角台・端台ボーナス (一般的に高設定が入りやすい)
        if num % 10 == 1 or num % 10 == 0:
            score += 3
            reasons.append("角台/端台ボーナス")

        if not reasons:
            reasons.append("特筆すべき傾向なし")

        score = max(0, min(100, score))
        recommendations.append(Recommendation(
            machine_number=num,
            score=score,
            reasons=reasons,
        ))

    recommendations.sort(key=lambda r: r.score, reverse=True)
    return recommendations
