"""下载 Lottie 动画到 D:/claude/lottie/（Google Noto 动态表情，881 个，每个约 10~150 KB）
用法：python tools/lottie_fetch.py broken-heart crying 1f525      按名字 / 码点下载
      python tools/lottie_fetch.py --tag love                    按标签 / 分类关键词批量下载
      python tools/lottie_fetch.py --list [关键词]                只列出可用的名字，不下载
      python tools/lottie_fetch.py --all                         全部下载（约 60 MB）
名字取自官方标签（:broken-heart: → broken-heart）。下载后自动更新 D:/claude/lottie/index.md
来源：https://googlefonts.github.io/noto-emoji-animation/ ，用到的期在发布文案里署名 "Animated emoji: Google Noto Emoji"。"""
import sys, os, json, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
LIB = 'D:/claude/lottie'
API = 'https://googlefonts.github.io/noto-emoji-animation/data/api.json'
URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/{cp}/lottie.json'

def icons():
    p = os.path.join(LIB, '_api.json')
    if not os.path.exists(p):
        os.makedirs(LIB, exist_ok=True); urllib.request.urlretrieve(API, p)
    out = []
    for ic in json.load(open(p, encoding='utf-8'))['icons']:
        name = (ic['tags'][0] if ic['tags'] else ic['codepoint']).strip(':')
        out.append({'name': name, 'cp': ic['codepoint'].replace(' ', '_'), 'cat': ic['categories'][0] if ic['categories'] else '', 'tags': [x.strip(':') for x in ic['tags']]})
    return out

def fetch(ic):
    dst = os.path.join(LIB, ic['name'] + '.json')
    if os.path.exists(dst): return os.path.getsize(dst)
    urllib.request.urlretrieve(URL.format(cp=ic['cp']), dst); return os.path.getsize(dst)

def index(all_icons):
    have = {f[:-5] for f in os.listdir(LIB) if f.endswith('.json') and not f.startswith('_')}
    rows = [f"| {i['name']} | {i['cat']} | {round(os.path.getsize(os.path.join(LIB, i['name'] + '.json')) / 1024)} KB |" for i in all_icons if i['name'] in have]
    total = sum(os.path.getsize(os.path.join(LIB, n + '.json')) for n in have)
    open(os.path.join(LIB, 'index.md'), 'w', encoding='utf-8').write(
        f"# Lottie 动画库（{len(rows)} 个，{total / 1e6:.1f} MB）\n来源 Google Noto 动态表情。film.js 里 LT.draw('名字', t, x, y, 尺寸, {{start}})\n\n| 名字 | 分类 | 大小 |\n|---|---|---|\n" + '\n'.join(rows) + '\n')

if __name__ == '__main__':
    a = sys.argv[1:]; ics = icons()
    if not a or a[0] == '--list':
        kw = a[1] if len(a) > 1 else ''
        for i in ics:
            if kw in i['name'] or kw in i['cat'] or any(kw in t for t in i['tags']): print(i['name'], i['cp'], i['cat'])
        sys.exit()
    if a[0] == '--all': pick = ics
    elif a[0] == '--tag': pick = [i for i in ics if any(k in i['cat'].lower() or any(k in t for t in i['tags']) for k in a[1:])]
    else: pick = [i for i in ics if i['name'] in a or i['cp'] in a]
    tot = 0
    for i in pick:
        try: s = fetch(i); tot += s; print(f"{i['name']:<28} {s / 1024:6.0f} KB")
        except Exception as e: print('失败', i['name'], e)
    index(ics); print(f'共 {len(pick)} 个，{tot / 1e6:.1f} MB → {LIB}')
