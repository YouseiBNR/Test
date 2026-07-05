# ffmpeg レシピ集

`video-edit` skill のコマンドリファレンス。`in.mp4` → `edit/out.mp4` の形で書く。

## トリム(切り出し)

```bash
# 無劣化(キーフレーム単位。開始位置が数秒ズレることがある)
ffmpeg -ss 00:01:30 -to 00:02:45 -i in.mp4 -c copy edit/out.mp4

# フレーム精度(再エンコード)
ffmpeg -ss 00:01:30 -to 00:02:45 -i in.mp4 -c:v libx264 -crf 20 -c:a aac edit/out.mp4

# 先頭から60秒だけ
ffmpeg -i in.mp4 -t 60 -c copy edit/out.mp4
```

## 結合(concat)

```bash
# 同一コーデック・同一解像度なら無劣化 demuxer 方式
printf "file '%s'\n" seg1.mp4 seg2.mp4 seg3.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy edit/out.mp4

# コーデックや解像度が違う場合は filter 方式(再エンコード)
ffmpeg -i a.mp4 -i b.mp4 -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" edit/out.mp4
```

## リサイズ・アスペクト比

```bash
# 幅1280に(高さは自動・偶数保証)
ffmpeg -i in.mp4 -vf "scale=1280:-2" -c:a copy edit/out.mp4

# 9:16 (1080x1920) に収めて黒帯パディング(横動画→縦枠)
ffmpeg -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" edit/out.mp4

# 9:16 に中央クロップ(横動画→縦に切り抜き)
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih" edit/out.mp4
```

## 速度変更

```bash
# 2倍速(映像+音声)
ffmpeg -i in.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" edit/out.mp4

# 0.5倍速
ffmpeg -i in.mp4 -vf "setpts=2.0*PTS" -af "atempo=0.5" edit/out.mp4
# atempo は 0.5〜2.0 の範囲。それ以上は連結する: -af "atempo=2.0,atempo=2.0" (4倍)
```

## 音声

```bash
# 音声抽出 → MP3
ffmpeg -i in.mp4 -vn -c:a libmp3lame -q:a 2 edit/out.mp3

# 音声抽出 → WAV(文字起こし用: 16kHz mono)
ffmpeg -i in.mp4 -vn -ar 16000 -ac 1 edit/out.wav

# BGM を重ねる(元音声を残してミックス、BGM は 20% 音量・動画の長さで打ち切り)
ffmpeg -i in.mp4 -i bgm.mp3 -filter_complex "[1:a]volume=0.2[bgm];[0:a][bgm]amix=inputs=2:duration=first" -c:v copy edit/out.mp4

# 音声の差し替え
ffmpeg -i in.mp4 -i voice.wav -map 0:v -map 1:a -c:v copy -shortest edit/out.mp4

# 音量ノーマライズ(ラウドネス -14 LUFS: YouTube 基準)
ffmpeg -i in.mp4 -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy edit/out.mp4

# 無音部分の検出(カット候補探し)
ffmpeg -i in.mp4 -af "silencedetect=noise=-35dB:d=0.6" -f null - 2>&1 | grep silence
```

## 字幕

```bash
# 焼き込み(ハードサブ)— フィルタチェーンでは必ず最後に置く
ffmpeg -i in.mp4 -vf "subtitles=subs.srt:force_style='FontSize=22,Outline=1'" edit/out.mp4

# ソフトサブ(mp4 に埋め込み、表示ON/OFF可)
ffmpeg -i in.mp4 -i subs.srt -c copy -c:s mov_text edit/out.mp4

# 動画から字幕を抽出
ffmpeg -i in.mp4 -map 0:s:0 edit/subs.srt
```

文字起こしから SRT を作る場合は `whisper`(openai-whisper)か `faster-whisper` を使う:

```bash
pip install faster-whisper && python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('small')
segments, _ = model.transcribe('edit/out.wav', language='ja', word_timestamps=True)
# segments から SRT を組み立てる(単語タイムスタンプ付き)
"
```

## GIF

```bash
# 高品質(パレット方式)。fps=12, 幅480
ffmpeg -ss 5 -t 3 -i in.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" edit/out.gif
```

## 圧縮・変換

```bash
# 標準的な Web 用圧縮
ffmpeg -i in.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart edit/out.mp4

# MOV → MP4(コーデック互換なら無劣化)
ffmpeg -i in.mov -c copy -movflags +faststart edit/out.mp4

# 静止画 + 音声 → 動画
ffmpeg -loop 1 -i cover.png -i audio.mp3 -c:v libx264 -tune stillimage -c:a aac -shortest -pix_fmt yuv420p edit/out.mp4

# サムネイル抽出(10秒地点)
ffmpeg -ss 10 -i in.mp4 -frames:v 1 -q:v 2 edit/thumb.jpg
```

## プラットフォーム別プリセット

```bash
# YouTube(1080p / H.264 / -14 LUFS)
ffmpeg -i in.mp4 -c:v libx264 -crf 21 -preset slow -vf "scale=1920:-2" -c:a aac -b:a 192k -af "loudnorm=I=-14:TP=-1.5" -movflags +faststart edit/yt.mp4

# YouTube Shorts / TikTok / Reels(9:16 1080x1920, 60秒以内目安)
ffmpeg -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 23 -c:a aac -b:a 128k -movflags +faststart edit/vertical.mp4

# X (Twitter)(16:9, 720p, 140秒以内, 512MB以下)
ffmpeg -i in.mp4 -vf "scale=1280:-2" -c:v libx264 -crf 24 -c:a aac -b:a 128k -movflags +faststart edit/x.mp4
```

## セグメント結合時の音声フェード(プチノイズ防止)

```bash
# 各セグメントの頭と尻に 30ms フェード(DUR は ffprobe で取得した秒数)
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 seg1.mp4)
ffmpeg -i seg1.mp4 -af "afade=t=in:st=0:d=0.03,afade=t=out:st=$(echo "$DUR-0.03" | bc):d=0.03" -c:v copy edit/seg1_faded.mp4
```
