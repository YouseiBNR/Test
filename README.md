# パチスロ ホール分析ツール

パチスロのホールデータを分析し、高設定台を予測するCLIツール。

## 機能

- **設定推測** (`estimate`): BB/RB回数・差枚数からベイズ推定で各設定の確率を算出
- **ホール傾向分析** (`trend`): 台番号・曜日・末尾番号ごとの高設定配置パターンを分析
- **台選びレコメンド** (`recommend`): 過去の傾向から狙い台をスコアリング

## セットアップ

```bash
pip install -r requirements.txt
```

## 使い方

### CSVデータの準備

以下のフォーマットでCSVファイルを作成:

```csv
date,hall_name,machine_name,machine_number,total_games,bb_count,rb_count,diff_medals
2026-02-01,ホールA,マイジャグラーV,101,8200,32,22,+1500
```

### コマンド

```bash
# 登録済み機種一覧
python -m pachinko_analyzer machines

# 設定推測 (テーブル表示)
python -m pachinko_analyzer estimate -c data.csv -m マイジャグラーV

# 設定推測 (詳細表示)
python -m pachinko_analyzer estimate -c data.csv -m マイジャグラーV --detail

# ホール傾向分析
python -m pachinko_analyzer trend -c data.csv -m マイジャグラーV

# 台選びレコメンド
python -m pachinko_analyzer recommend -c data.csv -m マイジャグラーV --weekday 土 --event
```

## 対応機種

- マイジャグラーV
- アイムジャグラーEX
- ファンキージャグラー2
- 押忍!番長4
- からくりサーカス
- 北斗の拳

`pachinko_analyzer/specs.py` に機種を追加することで拡張可能。

## プロジェクト構成

```
pachinko_analyzer/
  models.py        # データモデル定義
  specs.py         # 機種別スペック定義
  estimator.py     # 設定推測エンジン (ベイズ推定)
  hall_analyzer.py # ホール傾向分析
  recommender.py   # 台選びレコメンド
  data_loader.py   # CSV読み込み
  formatter.py     # 出力フォーマッター
  cli.py           # CLIインターフェース
data/sample/       # サンプルデータ
```
