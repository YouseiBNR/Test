---
name: video-edit
description: Edit video/audio with ffmpeg - trim, concat, resize, speed change, GIF, audio extraction/mixing, subtitles, compression, and platform presets (YouTube, Shorts, TikTok, Instagram). Use when the user asks to cut, convert, compress, caption, or optimize video or audio files, or mentions 動画編集/切り抜き/字幕/変換.
---

# 動画編集(ffmpeg)

ffmpeg で動画・音声を編集するワークフロー。コマンド一覧は同ディレクトリの `recipes.md` を参照。

## 前提チェック(必ず最初にやる)

1. `which ffmpeg ffprobe` — なければインストールする(`sudo apt-get install -y ffmpeg` / mac は `brew install ffmpeg`)
2. 入力ファイルを ffprobe で確認してから作業する:

```bash
ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=codec_name,codec_type,width,height,r_frame_rate -of default=noprint_wrappers=1 input.mp4
```

解像度・コーデック・長さを把握せずにコマンドを打たない。

## ワークフロー

1. **方針を先に一言で示す**: 複数ファイルにまたがる編集や、長い加工チェーンになる場合は「どう切って、どう繋いで、何を焼き込むか」を平文で示してから実行する(単発の変換・トリムはそのまま実行してよい)
2. **小さく試す**: 重い処理(再エンコード・フィルタ)は `-t 10` で先頭10秒だけ試してから全体に適用する
3. **出力は `edit/` に**: 元ファイルと同じ場所に `edit/` ディレクトリを作って出力する。**元ファイルは絶対に上書きしない**
4. **検証してから報告する**: 出力を ffprobe で確認(長さ・解像度・音声の有無)。カット編集をした場合は各カット境界付近からフレームを抜いて確認する:

```bash
ffmpeg -ss <境界秒-1> -i out.mp4 -frames:v 3 -vf fps=1 check_%d.png
```

## 編集の作法(壊れた動画を作らないためのルール)

- **字幕は最後に焼く**: フィルタチェーンでは字幕をすべてのオーバーレイより後に置く。先に焼くとオーバーレイが字幕を隠す
- **カット→結合は「セグメント切り出し + `-c copy` concat」**: 1本の巨大 filtergraph でやらない。無劣化で繋げるし、失敗時のやり直しも1セグメントで済む
- **セグメント境界に短い音声フェード(30ms)**: `afade=t=in:st=0:d=0.03` / `afade=t=out:st=<末尾-0.03>:d=0.03`。入れないと繋ぎ目でプチッと鳴る
- **単語の途中で切らない**: 文字起こしベースでカットする場合、カット位置は必ず単語境界にスナップする。境界には 30〜200ms の余白を持たせる(タイムスタンプのズレ吸収)
- **再エンコードは必要なときだけ**: コンテナ変換・トリム(キーフレーム単位)は `-c copy`。フィルタを使うときだけ再エンコード
- **Web 配信用は `-movflags +faststart`** を必ず付ける
- **文字起こしはキャッシュする**: 同じ素材を二度文字起こししない。`edit/transcripts/` に保存して使い回す

## 品質の目安(H.264 / CRF)

| 用途 | CRF | preset |
|------|-----|--------|
| アーカイブ・素材 | 18 | slow |
| 通常の完成品 | 20〜23 | medium |
| Web・SNS共有 | 23〜26 | medium |
| とにかく軽く | 28 | fast |

## クレジット

このskillは MIT ライセンスの [ychoi-kr/claude-ffmpeg-skill](https://github.com/ychoi-kr/claude-ffmpeg-skill) と [browser-use/video-use](https://github.com/browser-use/video-use) の知見を再構成したもの。
