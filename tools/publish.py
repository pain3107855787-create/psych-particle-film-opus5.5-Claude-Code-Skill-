"""生成 TikTok 发布文案 → 发布文案.md（在项目根目录运行：python tools/publish.py）
内容来自 episode.json 的 publish 字段（由 Claude 按本期内容撰写）：
  titles   备选首句/标题（TikTok 文案第一行就是"标题"，要在前 1~2 行抓住人）
  caption  正文（2~4 短句，口语，结尾抛问题引导评论）
  hashtags 话题标签（中英混合 5~8 个，大类 + 细分 + 系列标签）
  pinned   置顶评论（一个让人想回答的问题）
分段时间戳由 timeline.json 的章节自动生成，附在正文下面"""
import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
ep = json.load(open('episode.json', encoding='utf-8')); tl = json.load(open('timeline.json', encoding='utf-8'))
pb = ep.get('publish', {})
mmss = lambda s: f'{int(s // 60):02d}:{int(s % 60):02d}'
chap = '\n'.join(f"{mmss(0 if i == 0 else c['a'])} {c['title']}" + (f" —— {c['intro']}" if c.get('intro') else '') for i, c in enumerate(tl.get('chapters', [])))
tags = ' '.join('#' + h.lstrip('#') for h in pb.get('hashtags', []))
cred = '\n'.join(pb.get('credits', []))   # episode.json publish.credits：素材署名（如 Lottie 表情 "Animated emoji: Google Noto Emoji"）
body = '\n'.join(x for x in [pb.get('titles', [''])[0], '', pb.get('caption', ''), '', '📍 分段', chap, '', *([cred, ''] if cred else []), tags] if x is not None)
md = f"""# 发布文案 · {ep['title']}

## 直接复制（TikTok 文案）
```
{body}
```
共 {len(body)} 字（TikTok 上限 4000）

## 备选首句
""" + '\n'.join(f'{i + 1}. {t}' for i, t in enumerate(pb.get('titles', []))) + f"""

## 置顶评论
```
{pb.get('pinned', '')}
```

## 封面
- cover-3x4.jpg（竖版缩略图位）、cover-4x3.jpg
"""
# 真实图片的来源（tools/fetch_image.py 写的 assets/credits.json）：CC BY / BY-SA 必须署名
if os.path.exists('assets/credits.json'):
    cr = json.load(open('assets/credits.json', encoding='utf-8'))
    if cr: md += '\n## 图片来源（发布时放进简介或置顶评论）\n' + ''.join(f"- {v['title'].replace('File:', '')} · {v['author']} · {v['license']} · {v['page']}\n" for v in cr.values())
open('发布文案.md', 'w', encoding='utf-8').write(md); print(body)
