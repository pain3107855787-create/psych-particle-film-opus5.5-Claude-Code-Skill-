#!/bin/sh
# 一键出片：sh build.sh          高清成片 + 两张封面 + 字幕 + 发布文案
#           sh build.sh preview  低清预览小样 preview.mp4（约 1 分钟，带配音配乐，先给用户看节奏）
# 配音不在这里跑（TTS 在 Git Bash 下会段错误），改了文案先在 PowerShell 里重配：
#   $env:PYTHONIOENCODING='utf-8'; & D:/tts-indextts/.venv/Scripts/python.exe tools/tts_index.py lines.json voices --ref D:/claude/voice/_ref/ref24k.wav --takes 3 *> out/tts.log
set -e; cd "$(dirname "$0")"
SLUG=$(node -e "console.log(require('./episode.json').slug)")
node tools/timeline.mjs
node tools/fonts.mjs
if [ "$1" = "preview" ]; then
  node tools/render.mjs --preview
  python tools/mix.py
  ffmpeg -v error -y -i out/preview_v.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart preview.mp4
  echo "preview: preview.mp4"; exit 0
fi
node tools/render.mjs --covers
node tools/render.mjs --fps 30 --workers 4
python tools/mix.py
ffmpeg -v error -y -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$SLUG.mp4"   # 统一到 -14 LUFS（只有拟音时 mix 偏小）
python tools/srt.py "$SLUG.srt"
python tools/publish.py > /dev/null
rm -f preview.mp4
echo "done: $SLUG.mp4 + 发布文案.md"
