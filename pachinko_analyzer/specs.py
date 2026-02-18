"""人気機種のスペック定義

確率は全て「1/x」の分母(x)で定義。
インデックス 0=設定1, 1=設定2, ..., 5=設定6
"""

from pachinko_analyzer.models import MachineSpec

# =============================================================================
# 6号機・スマスロ 人気機種スペック
# =============================================================================

JUGGLER_SPECS = {
    "マイジャグラーV": MachineSpec(
        name="マイジャグラーV",
        bb_prob=[273.1, 270.8, 266.4, 254.0, 240.9, 229.1],
        rb_prob=[409.6, 385.5, 336.1, 290.9, 273.1, 229.1],
        kouyaku_probs={
            "ぶどう": [6.35, 6.30, 6.25, 6.20, 6.10, 6.02],
        },
        payout_rate=[97.0, 98.7, 101.0, 104.0, 107.0, 110.9],
    ),
    "アイムジャグラーEX": MachineSpec(
        name="アイムジャグラーEX",
        bb_prob=[273.1, 270.8, 269.7, 259.0, 255.0, 255.0],
        rb_prob=[439.8, 399.6, 331.0, 315.1, 255.0, 225.4],
        kouyaku_probs={
            "ぶどう": [6.35, 6.30, 6.25, 6.20, 6.10, 6.02],
        },
        payout_rate=[95.9, 97.8, 100.8, 103.4, 106.5, 109.4],
    ),
    "ファンキージャグラー2": MachineSpec(
        name="ファンキージャグラー2",
        bb_prob=[260.1, 253.0, 246.4, 237.4, 232.4, 219.9],
        rb_prob=[452.0, 408.5, 371.5, 332.7, 304.8, 268.6],
        kouyaku_probs={
            "ぶどう": [6.34, 6.29, 6.25, 6.20, 6.10, 6.02],
        },
        payout_rate=[97.0, 98.9, 101.1, 104.0, 106.8, 110.0],
    ),
}

AT_SPECS = {
    "押忍!番長4": MachineSpec(
        name="押忍!番長4",
        bb_prob=[319.7, 309.1, 298.6, 278.9, 258.0, 238.3],
        rb_prob=[496.5, 468.1, 420.2, 385.5, 356.2, 319.7],
        payout_rate=[97.6, 99.2, 101.8, 105.1, 108.5, 113.0],
    ),
    "からくりサーカス": MachineSpec(
        name="からくりサーカス",
        bb_prob=[339.6, 327.7, 310.6, 291.3, 268.6, 245.5],
        rb_prob=[489.1, 455.1, 420.2, 385.5, 356.2, 330.1],
        payout_rate=[97.5, 99.0, 101.5, 104.8, 108.2, 112.5],
    ),
    "北斗の拳": MachineSpec(
        name="北斗の拳",
        bb_prob=[310.6, 298.6, 284.9, 268.6, 252.1, 234.1],
        rb_prob=[496.5, 455.1, 420.2, 385.5, 356.2, 330.1],
        payout_rate=[97.8, 99.5, 102.0, 105.5, 109.0, 113.5],
    ),
}

# 全機種辞書
ALL_SPECS: dict[str, MachineSpec] = {**JUGGLER_SPECS, **AT_SPECS}


def get_spec(machine_name: str) -> MachineSpec | None:
    """機種名からスペックを取得する。部分一致で検索。"""
    # 完全一致
    if machine_name in ALL_SPECS:
        return ALL_SPECS[machine_name]
    # 部分一致
    for name, spec in ALL_SPECS.items():
        if machine_name in name or name in machine_name:
            return spec
    return None


def list_machines() -> list[str]:
    """登録済み機種名の一覧を返す"""
    return list(ALL_SPECS.keys())
