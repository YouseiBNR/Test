"""データモデル定義"""

from dataclasses import dataclass, field
from enum import IntEnum


class Setting(IntEnum):
    """パチスロ設定"""
    S1 = 1
    S2 = 2
    S3 = 3
    S4 = 4
    S5 = 5
    S6 = 6


@dataclass
class MachineSpec:
    """機種スペック定義

    各設定ごとのボーナス確率・小役確率を定義する。
    確率は「1/x」の x 部分（分母）で指定する。
    """
    name: str
    # ボーナス確率 (分母) - 設定1〜6
    bb_prob: list[float]       # BIG BONUS 確率
    rb_prob: list[float]       # REG BONUS 確率
    # 合算確率は自動計算
    # 小役確率 (分母) - 設定差がある小役
    kouyaku_probs: dict[str, list[float]] = field(default_factory=dict)
    # 機械割 (%) - 設定1〜6
    payout_rate: list[float] = field(default_factory=list)
    # 1日のゲーム数の目安 (デフォルト8000G)
    games_per_day: int = 8000

    def combined_prob(self, setting_idx: int) -> float:
        """合算ボーナス確率の分母を返す"""
        bb = 1 / self.bb_prob[setting_idx]
        rb = 1 / self.rb_prob[setting_idx]
        return 1 / (bb + rb)


@dataclass
class DailyMachineData:
    """1台1日分の実績データ"""
    date: str                  # 日付 (YYYY-MM-DD)
    hall_name: str             # ホール名
    machine_name: str          # 機種名
    machine_number: int        # 台番号
    total_games: int           # 総ゲーム数
    bb_count: int              # BIG BONUS 回数
    rb_count: int              # REG BONUS 回数
    diff_medals: int = 0       # 差枚数
    # オプション: 小役カウント
    kouyaku_counts: dict[str, int] = field(default_factory=dict)

    @property
    def combined_count(self) -> int:
        return self.bb_count + self.rb_count

    @property
    def bb_prob_actual(self) -> float:
        """実際のBB確率 (分母)"""
        if self.bb_count == 0:
            return float('inf')
        return self.total_games / self.bb_count

    @property
    def rb_prob_actual(self) -> float:
        """実際のRB確率 (分母)"""
        if self.rb_count == 0:
            return float('inf')
        return self.total_games / self.rb_count

    @property
    def combined_prob_actual(self) -> float:
        """実際の合算確率 (分母)"""
        total = self.combined_count
        if total == 0:
            return float('inf')
        return self.total_games / total


@dataclass
class HallEvent:
    """ホールイベント情報"""
    date: str
    hall_name: str
    event_type: str            # 例: "特定日", "新台入替", "旧イベ", "取材"
    description: str = ""
