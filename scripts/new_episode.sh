#!/bin/sh
# 开新的一期：sh new_episode.sh <slug> <theme: aurora|gold|crimson|stardust|phosphor|tide> <中文标题>
# 在 D:/claude/finish/心理学概念系列/<slug>/ 生成项目骨架（模板 + 工具），装好 playwright-core
set -e
SK=$(cd "$(dirname "$0")/.." && pwd); SLUG=$1; THEME=${2:-crimson}; TITLE=${3:-$1}
[ -n "$SLUG" ] || { echo "用法: sh new_episode.sh <slug> <theme> <标题>"; exit 1; }
DST=D:/claude/finish/心理学概念系列/$SLUG
[ -e "$DST" ] && { echo "已存在: $DST（不覆盖）"; exit 1; }
mkdir -p "$DST/tools" "$DST/voices" "$DST/out" "$DST/fonts"
cp "$SK"/template/* "$DST/"; find "$SK/tools" -maxdepth 1 -type f -exec cp {} "$DST/tools/" \;   # 只拷文件（跳过 __pycache__）
node -e "const f='$DST/episode.json',fs=require('fs'),e=JSON.parse(fs.readFileSync(f,'utf8'));e.slug='$SLUG';e.theme='$THEME';e.title='$TITLE';fs.writeFileSync(f,JSON.stringify(e,null,1))"
# playwright-core：优先从已有的一期复制（离线可用），否则联网安装；浏览器用本机 ms-playwright 缓存
SRC=$(ls -d D:/claude/finish/心理学概念系列/*/node_modules/playwright-core 2>/dev/null | head -1)
if [ -n "$SRC" ]; then mkdir -p "$DST/node_modules"; cp -r "$SRC" "$DST/node_modules/"; else (cd "$DST" && npm install --silent); fi
echo "ok: $DST  (theme=$THEME)"
