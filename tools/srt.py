"""timeline.json → 字幕文件（去掉高亮标记；开头的 [术语] 标签写成"术语｜"）。用法：python tools/srt.py 输出.srt"""
import json, re, sys
sys.stdout.reconfigure(encoding="utf-8")
tl = json.load(open('timeline.json', encoding='utf-8'))
f = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t % 3600 // 60, t % 60, round(t % 1 * 1000) % 1000)
clean = lambda s: re.sub(r'^\[(.+?)\]', r'\1｜', re.sub(r'[{}<>]', '', s))
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(f"{i + 1}\n{f(l['start'])} --> {f(l['end'] + .25)}\n{clean(l['text'])}\n" for i, l in enumerate(tl['lines'])))
print('srt →', sys.argv[1])
