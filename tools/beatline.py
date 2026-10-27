# 卡拍时间轴（episode.json 有 music 时由 timeline.mjs 自动调用）：默认每句、每张章节卡从重拍开始、占整数小节；music.grid = "beat" 时句子按单拍排（有配音时用，避免空白太长）；
# 需要时在小节线上把配乐跳到指定段落（如高潮），输出 out/music.wav（剪好的配乐）+ timeline.json（含剪辑后的 beats / bars，给 film.js 卡拍用）
# episode.json：
#   "music": {"src": "D:/claude/dubbing/Pain1.mp3", "beats": "D:/claude/dubbing/Pain1_beats.json",
#             "jumps": {"场景名": 原曲秒数, ...},   # 进入这个场景时，配乐跳到原曲这个时刻附近的重拍（小节线上无缝拼接）
#             "tail": 4.0}                          # 最后一句之后再留几秒
#   lines.json 每句可写 "bars": n 指定占几个小节；不写就按阅读时间（pace.cps 字/秒 + pad）自动取整到小节
import json, math, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
EP = json.load(open('episode.json', encoding='utf-8')); LINES = json.load(open('lines.json', encoding='utf-8')); MU = EP['music']
BJ = json.load(open(MU['beats'], encoding='utf-8')); B = BJ['bars']; BEATS = BJ['beats']; BAR = 60 / BJ['bpm'] * 4
B = B + [B[-1] + BAR * (i + 1) for i in range(64)]   # 原曲的小节用完时按速度往后推算（最后会被淡出 / 截断）
PACE = {'cps': 11, 'pad': .3, 'min': 1.3, 'card': 1.2, **EP.get('pace', {})}
chars = lambda s: len([ch for ch in s if '\u4e00' <= ch <= '\u9fff' or ch.isalnum()])
read = lambda l: l.get('hold') or max(PACE['min'], chars(l['text'].replace('{', '').replace('}', '')) / PACE['cps'] + PACE['pad'])
# 有配音时：按配音实际时长排；"pop"（只跳出来、不读的半句）在配音之后再留出阅读时间
DUR = json.load(open('voices/dur.json')) if os.path.exists('voices/dur.json') and not EP.get('noVoice') else {}
def need(l):
    if l['id'] not in DUR: return read(l)
    return l.get('hold') or DUR[l['id']] + (chars(l.get('pop', '').replace('{', '').replace('}', '')) / 9 + .35 if l.get('pop') else 0) + .3
# 网格：默认按小节；episode.json music.grid = "beat" 时按单拍（句子只对齐最近一拍，章节卡和配乐拼接仍落在重拍上）
BEAT_MODE = MU.get('grid') == 'beat'; UNIT = BAR / 4 if BEAT_MODE else BAR
G = (BEATS + [BEATS[-1] + UNIT * (i + 1) for i in range(256)]) if BEAT_MODE else B
DOWN = set(round(x, 2) for x in B)
isdown = lambda i: (not BEAT_MODE) or any(abs(G[i] - x) < .06 for x in B[max(0, int(G[i] / BAR) - 3):int(G[i] / BAR) + 4])
nunits = lambda sec: max(1, math.ceil(sec / UNIT - (.1 if BEAT_MODE else .2)))
nbars = nunits
chs = {c['scene']: c for c in EP.get('chapters', [])}
nearest_down = lambda sec: min((i for i in range(len(G)) if isdown(i)), key=lambda i: abs(G[i] - sec))
def to_down(i):
    while not isdown(i): i += 1
    return i

segs = []                     # [原曲起点秒, 原曲终点秒, 成片起点秒]
k = 0; seg_o = 0.0; seg_e = 0.0   # 当前段：原曲从 seg_o 开始，对应成片 seg_e
E = lambda i: seg_e + (G[i] - seg_o)   # 原曲第 i 个网格点在成片里的时刻
out, chapters, prev, num = [], [], None, 0
for l in LINES:
    if l['scene'] != prev:
        first = prev is None; prev = l['scene']; c = chs.get(l['scene'], {})
        if not first and PACE.get('chapterDown', True): k = to_down(k)   # 章节从重拍开始（pace.chapterDown=false 时只对齐单拍，换章不再干等，2026-10-27 用户嫌换章停太久）
        if not first and l['scene'] in MU.get('jumps', {}):   # 重拍上跳到原曲的另一段
            j = nearest_down(MU['jumps'][l['scene']]); t_here = E(k); segs.append([seg_o, G[k], seg_e]); seg_o, seg_e, k = G[j], t_here, j
        rec = {'scene': l['scene'], 'title': c.get('title', l['scene']), 'intro': c.get('intro', ''), 'en': c.get('en', ''), 'num': 0 if first else (num := num + 1), 'a': round(0 if first else E(k), 3)}
        if c.get('card', not first):
            il = chars(c.get('intro', '')); cb = c.get('bars') or nunits(max(PACE['card'], .55 + il / PACE.get('cardCps', 8) + PACE.get('cardTail', .6)))
            rec['card'] = {'a': round(E(k), 3), 'b': round(E(k + cb) - .15, 3)}; k += cb
        chapters.append(rec)
    n = l.get('units') or l.get('bars') or nunits(need(l)); st = EP.get('startAt', .3) if not out else E(k)
    rec = {'id': l['id'], 'scene': l['scene'], 'text': l['text'], 'start': round(st, 3), 'end': round(E(k + n) - .12, 3), 'units': n}
    if l.get('noSub') or (EP.get('noVoice') and not l.get('sub')): rec['noSub'] = True
    if l['id'] in DUR: rec['vend'] = round(st + DUR[l['id']], 3)   # 配音结束时刻（pop 在这之后跳出来）
    if l.get('pop'): rec['pop'] = l['pop']
    ga = l.get('gapAfter', 0); out.append(rec); k += n + (math.ceil(ga / UNIT) if BEAT_MODE and ga else (1 if ga >= .6 else 0))   # 情绪节点后多留一点
last_end = E(k); orig_end = BJ['duration']; total = round(min(last_end + MU.get('tail', 2.0), seg_e + (orig_end - seg_o)), 2)
segs.append([seg_o, seg_o + (total - seg_e) + .05, seg_e])
# 剪辑后的拍点
def remap(ts): return [round(e + (t - o), 3) for o, o2, e in segs for t in ts if o - 1e-3 <= t < o2]
beats_e, bars_e = remap(BEATS), remap(B)
scenes = [{'name': c['scene'], 'a': c['card']['a'] if c.get('card') else (0 if i == 0 else next(x['start'] for x in out if x['scene'] == c['scene']) - .7),
           'b': chapters[i + 1]['a'] + .8 if i + 1 < len(chapters) else total} for i, c in enumerate(chapters)]
tl = {'total': total, **({'watermark': EP['watermark']} if 'watermark' in EP else {}), **({'noFadeIn': True} if EP.get('noFadeIn') else {}), **({'noVoice': True} if EP.get('noVoice') else {}), 'lines': out, 'scenes': scenes, 'chapters': chapters,
      'music': {'bpm': BJ['bpm'], 'key': BJ['key'], 'beats': beats_e, 'bars': bars_e, 'segments': segs}}
json.dump(tl, open('timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# 剪配乐：每个拼接点 40ms 交叉淡化，结尾 2.5 秒淡出
SR = 48000; tmp = os.path.join(tempfile.gettempdir(), 'beatline_src.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MU['src'], '-ar', str(SR), '-ac', '2', tmp], check=True)
x, _ = sf.read(tmp); N = int(total * SR); y = np.zeros((N, 2)); xf = int(.04 * SR)
for o, o2, e in segs:
    a, b, d = int(o * SR), int(o2 * SR), int(e * SR); piece = x[a:min(b + xf, len(x))].copy(); n = min(len(piece), N - d)
    if n <= 0: continue
    piece = piece[:n]; m = min(xf, n)
    if d > 0: piece[:m] *= np.linspace(0, 1, m)[:, None]          # 拼接处淡入
    tail = len(piece) - int((o2 - o) * SR)                          # 多取的 40ms 用来淡出、和下一段交叉
    if tail > 0: piece[-tail:] *= np.linspace(1, 0, tail)[:, None]
    y[d:d + n] += piece
fo = int(2.5 * SR); y[-fo:] *= np.linspace(1, 0, fo)[:, None]
os.makedirs('out', exist_ok=True); sf.write(os.path.join('out', 'music.wav'), y.astype(np.float32), SR)
mm = lambda s: f'{int(s // 60):02d}:{s % 60:05.2f}'
print(f"total {total}s · {BJ['bpm']} BPM · 每小节 {BAR:.3f}s · 配乐段落：" + ' | '.join(f"成片 {mm(e)} ← 原曲 {mm(o)}~{mm(o2)}" for o, o2, e in segs))
print(' | '.join(f"{mm(c['a'])} {c['title']}{' [卡]' if c.get('card') else ''}" for c in chapters))
