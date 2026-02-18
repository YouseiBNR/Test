"""CLI インターフェース"""

import argparse
import sys

from pachinko_analyzer.data_loader import load_csv
from pachinko_analyzer.estimator import estimate_batch
from pachinko_analyzer.hall_analyzer import analyze_hall
from pachinko_analyzer.recommender import recommend_machines
from pachinko_analyzer.specs import get_spec, list_machines, ALL_SPECS
from pachinko_analyzer.formatter import (
    format_estimation_table,
    format_hall_trend,
    format_recommendations,
    format_estimation,
)


def cmd_estimate(args: argparse.Namespace) -> None:
    """設定推測コマンド"""
    spec = get_spec(args.machine)
    if spec is None:
        print(f"エラー: 機種 '{args.machine}' のスペックが見つかりません。")
        print(f"登録済み機種: {', '.join(list_machines())}")
        sys.exit(1)

    data_list = load_csv(args.csv)
    # 機種名でフィルタ
    filtered = [d for d in data_list if d.machine_name == spec.name or args.machine in d.machine_name]
    if not filtered:
        # フィルタなしで全データを使用
        filtered = data_list

    estimations = estimate_batch(filtered, spec)

    if args.detail:
        for est in sorted(estimations, key=lambda e: e.score, reverse=True):
            print(format_estimation(est))
            print()
    else:
        print(format_estimation_table(estimations))


def cmd_trend(args: argparse.Namespace) -> None:
    """ホール傾向分析コマンド"""
    spec = get_spec(args.machine)
    if spec is None:
        print(f"エラー: 機種 '{args.machine}' のスペックが見つかりません。")
        print(f"登録済み機種: {', '.join(list_machines())}")
        sys.exit(1)

    data_list = load_csv(args.csv)
    filtered = [d for d in data_list if d.machine_name == spec.name or args.machine in d.machine_name]
    if not filtered:
        filtered = data_list

    trend = analyze_hall(filtered, spec)
    print(format_hall_trend(trend))


def cmd_recommend(args: argparse.Namespace) -> None:
    """台選びレコメンドコマンド"""
    spec = get_spec(args.machine)
    if spec is None:
        print(f"エラー: 機種 '{args.machine}' のスペックが見つかりません。")
        print(f"登録済み機種: {', '.join(list_machines())}")
        sys.exit(1)

    data_list = load_csv(args.csv)
    filtered = [d for d in data_list if d.machine_name == spec.name or args.machine in d.machine_name]
    if not filtered:
        filtered = data_list

    trend = analyze_hall(filtered, spec)

    available = None
    if args.numbers:
        available = [int(n) for n in args.numbers.split(",")]

    recs = recommend_machines(
        trend,
        available_numbers=available,
        target_weekday=args.weekday,
        is_event_day=args.event,
    )
    print(format_recommendations(recs))


def cmd_machines(args: argparse.Namespace) -> None:
    """登録済み機種一覧コマンド"""
    print("登録済み機種一覧:")
    print("-" * 50)
    for name, spec in ALL_SPECS.items():
        payout_str = ""
        if spec.payout_rate:
            payout_str = f"  機械割: {spec.payout_rate[0]:.1f}%〜{spec.payout_rate[5]:.1f}%"
        print(f"  {name}{payout_str}")
    print("-" * 50)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="パチスロ ホール分析ツール - 高設定台予測",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 設定推測
  python -m pachinko_analyzer estimate -c data.csv -m マイジャグラーV

  # ホール傾向分析
  python -m pachinko_analyzer trend -c data.csv -m マイジャグラーV

  # 台選びレコメンド (土曜のイベント日)
  python -m pachinko_analyzer recommend -c data.csv -m マイジャグラーV --weekday 土 --event

  # 登録済み機種一覧
  python -m pachinko_analyzer machines
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="サブコマンド")

    # estimate コマンド
    p_est = subparsers.add_parser("estimate", help="設定推測")
    p_est.add_argument("-c", "--csv", required=True, help="入力CSVファイル")
    p_est.add_argument("-m", "--machine", required=True, help="機種名")
    p_est.add_argument("--detail", action="store_true", help="詳細表示")
    p_est.set_defaults(func=cmd_estimate)

    # trend コマンド
    p_trend = subparsers.add_parser("trend", help="ホール傾向分析")
    p_trend.add_argument("-c", "--csv", required=True, help="入力CSVファイル")
    p_trend.add_argument("-m", "--machine", required=True, help="機種名")
    p_trend.set_defaults(func=cmd_trend)

    # recommend コマンド
    p_rec = subparsers.add_parser("recommend", help="台選びレコメンド")
    p_rec.add_argument("-c", "--csv", required=True, help="入力CSVファイル")
    p_rec.add_argument("-m", "--machine", required=True, help="機種名")
    p_rec.add_argument("--numbers", help="選択可能な台番号 (カンマ区切り)")
    p_rec.add_argument("--weekday", help="狙う曜日 (例: 土)")
    p_rec.add_argument("--event", action="store_true", help="イベント日フラグ")
    p_rec.set_defaults(func=cmd_recommend)

    # machines コマンド
    p_machines = subparsers.add_parser("machines", help="登録済み機種一覧")
    p_machines.set_defaults(func=cmd_machines)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
