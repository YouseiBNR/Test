"""CSVデータ読み込みモジュール"""

import csv
from pathlib import Path

from pachinko_analyzer.models import DailyMachineData


def load_csv(file_path: str | Path) -> list[DailyMachineData]:
    """CSVファイルからデータを読み込む

    CSVフォーマット:
        date,hall_name,machine_name,machine_number,total_games,bb_count,rb_count,diff_medals

    ヘッダー行は自動スキップ。
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"ファイルが見つかりません: {path}")

    data_list = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data_list.append(DailyMachineData(
                date=row["date"],
                hall_name=row["hall_name"],
                machine_name=row["machine_name"],
                machine_number=int(row["machine_number"]),
                total_games=int(row["total_games"]),
                bb_count=int(row["bb_count"]),
                rb_count=int(row["rb_count"]),
                diff_medals=int(row.get("diff_medals", 0)),
            ))

    return data_list


def load_multiple_csv(file_paths: list[str | Path]) -> list[DailyMachineData]:
    """複数のCSVファイルからデータを読み込む"""
    all_data = []
    for fp in file_paths:
        all_data.extend(load_csv(fp))
    return all_data
