---
name: learnings
description: Record durable project learnings as one markdown file per insight under learnings/, updating instead of duplicating and deleting disproven ones. Use when a non-obvious fact about this codebase/tooling is discovered, when the user says "学びを残して" or "メモして", or at the end of a task that surfaced gotchas.
---

# 学びを残して積み上げる

プロンプトは使い捨てだが、学習ファイルは複利で積み上がる。毎回ゼロから説明させないために、気づいた学びを `learnings/` に記録する。

## 記録するもの

- このコードベース固有の罠・暗黙の前提(例:「テストは X を先に起動しないと落ちる」)
- 調べないと分からなかった仕様・挙動
- ユーザーの好み・決定事項(例:「抽象化より重複を許容する方針」)

**記録しないもの**: 一般常識、公式ドキュメントを見れば分かること、そのタスク限りの一時情報。

## ルール

1. **1つの学び = 1ファイル**: `learnings/<kebab-case-topic>.md`。1ファイルに雑多に追記しない。
2. **重複を作らない**: 新しい学びを書く前に `learnings/` 内を検索し、既存ファイルがあれば**更新**する。似た内容の2ファイル目を作らない。
3. **間違いと分かったら消す**: 検証の結果、誤りだと判明した学びはファイルごと削除する(「古い情報です」と注記して残さない)。
4. **形式**: 各ファイルは以下の構成。

```markdown
# <学びの一文要約>

- 確認日: YYYY-MM-DD
- 根拠: <どうやって確認したか(実行結果・ファイルパスなど)>

<本文: 何が真で、なぜ重要で、次に何をすべきか。数行で。>
```

5. **タスク終了時に振り返る**: タスク完了の報告前に「次回も使える学びはあったか」を確認し、あれば記録してから報告する。
