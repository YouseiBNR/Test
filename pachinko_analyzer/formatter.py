"""出力フォーマッター

分析結果をターミナルに見やすく表示する。
"""

from pachinko_analyzer.estimator import SettingEstimation
from pachinko_analyzer.hall_analyzer import HallTrend
from pachinko_analyzer.recommender import Recommendation


def format_estimation(est: SettingEstimation) -> str:
    """設定推測結果を文字列にフォーマットする"""
    lines = []
    lines.append(f"  台番号: {est.machine_number}  |  日付: {est.date}")
    lines.append(f"  総G数: {est.total_games:,}  BB: {est.bb_count}  RB: {est.rb_count}  差枚: {est.diff_medals:+,}")
    lines.append(f"  BB確率: 1/{est.total_games / est.bb_count:.1f}" if est.bb_count > 0 else "  BB確率: -")
    lines.append(f"  RB確率: 1/{est.total_games / est.rb_count:.1f}" if est.rb_count > 0 else "  RB確率: -")

    # 各設定の確率をバー表示
    lines.append("  ┌─ 設定推測 ─────────────────────────┐")
    for i, prob in enumerate(est.setting_probs):
        bar_len = int(prob / 100 * 30)
        bar = "█" * bar_len + "░" * (30 - bar_len)
        marker = " ◀" if (i + 1) == est.most_likely_setting else ""
        lines.append(f"  │ 設定{i+1}: {bar} {prob:5.1f}%{marker:3s}│")
    lines.append("  └────────────────────────────────────┘")

    lines.append(f"  高設定(456)確率: {est.high_setting_prob:.1f}%  |  スコア: {est.score:.1f}")
    return "\n".join(lines)


def format_estimation_table(estimations: list[SettingEstimation]) -> str:
    """設定推測結果を表形式でフォーマットする"""
    lines = []
    lines.append("=" * 90)
    lines.append(f"{'台番':>6} {'総G数':>7} {'BB':>4} {'RB':>4} {'差枚':>7} "
                 f"{'設1':>5} {'設2':>5} {'設3':>5} {'設4':>5} {'設5':>5} {'設6':>5} "
                 f"{'高設定%':>7} {'スコア':>6}")
    lines.append("-" * 90)

    sorted_est = sorted(estimations, key=lambda e: e.score, reverse=True)
    for est in sorted_est:
        probs = est.setting_probs
        high_mark = "★" if est.high_setting_prob >= 60 else "☆" if est.high_setting_prob >= 40 else " "
        lines.append(
            f"{est.machine_number:>6} {est.total_games:>7,} {est.bb_count:>4} {est.rb_count:>4} "
            f"{est.diff_medals:>+7,} "
            f"{probs[0]:>5.1f} {probs[1]:>5.1f} {probs[2]:>5.1f} "
            f"{probs[3]:>5.1f} {probs[4]:>5.1f} {probs[5]:>5.1f} "
            f"{est.high_setting_prob:>6.1f}% {est.score:>5.1f}{high_mark}"
        )

    lines.append("=" * 90)
    lines.append("  ★ = 高設定確率60%以上  ☆ = 高設定確率40%以上")
    return "\n".join(lines)


def format_hall_trend(trend: HallTrend) -> str:
    """ホール傾向分析結果をフォーマットする"""
    lines = []
    lines.append("=" * 60)
    lines.append(f" ホール傾向分析: {trend.hall_name}")
    lines.append("=" * 60)
    lines.append(f"  分析日数: {trend.total_days}日")
    lines.append(f"  平均高設定率: {trend.avg_high_setting_ratio:.1f}%")
    lines.append("")

    # 出玉が良かった日
    lines.append("  ▼ 出玉が良かった日 (上位5日)")
    for i, date in enumerate(trend.best_dates, 1):
        lines.append(f"    {i}. {date}")
    lines.append("")

    # 高設定が入りやすい台番号
    lines.append("  ▼ 高設定が入りやすい台番号 (上位10台)")
    for i, num in enumerate(trend.hot_numbers, 1):
        lines.append(f"    {i}. 台番号 {num}")
    lines.append("")

    # 曜日別スコア
    lines.append("  ▼ 曜日別平均スコア")
    for wd in ["月", "火", "水", "木", "金", "土", "日"]:
        if wd in trend.weekday_scores:
            score = trend.weekday_scores[wd]
            bar_len = int(score / 100 * 20)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"    {wd}: {bar} {score:.1f}")
    lines.append("")

    # 末尾番号傾向
    lines.append("  ▼ 末尾番号別平均スコア")
    for suffix in sorted(trend.suffix_scores.keys()):
        score = trend.suffix_scores[suffix]
        bar_len = int(score / 100 * 20)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        lines.append(f"    末尾{suffix}: {bar} {score:.1f}")

    lines.append("=" * 60)
    return "\n".join(lines)


def format_recommendations(recs: list[Recommendation], limit: int = 10) -> str:
    """レコメンド結果をフォーマットする"""
    lines = []
    lines.append("=" * 60)
    lines.append(" 台選びレコメンド")
    lines.append("=" * 60)

    for i, rec in enumerate(recs[:limit], 1):
        score_bar_len = int(rec.score / 100 * 15)
        score_bar = "█" * score_bar_len + "░" * (15 - score_bar_len)
        lines.append(f"  {i:>2}. 台番号 {rec.machine_number:<6}  スコア: {score_bar} {rec.score:.1f}")
        for reason in rec.reasons:
            lines.append(f"      - {reason}")
        lines.append("")

    lines.append("=" * 60)
    return "\n".join(lines)
