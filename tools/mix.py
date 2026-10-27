"""混音（在项目根目录运行）：原创配乐（按 episode.json 的配色选预设）+ 本期拟音（sfx.py）+ 配音 → out/mix.wav
配乐预设：aurora 温柔钢琴弦乐 · gold 黑色爵士 · crimson 低沉脉冲 · stardust 空灵铃音 · phosphor 冷调心跳+仪器铃音 · tide 慢速钢琴分解和弦+长音
sfx.py 里可用：T(id) E(id) Dn(id) SC(场景名) add(buf, x, at, g) sfx(缓冲区) 和下面的音效函数；可选定义 INTENSITY=[(秒, 0~1), ...] 覆盖配乐强度
响度：输出约 −14 LUFS（用 ffmpeg ebur128 复查）；配音处配乐自动闪避"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

HERE = os.getcwd(); SR = 48000
EP = json.load(open('episode.json', encoding='utf-8'))
TL = json.load(open('timeline.json', encoding='utf-8'))
L = {l['id']: l for l in TL['lines']}; SCN = {s['name']: s for s in TL['scenes']}
TOT = TL['total']; N = int(TOT * SR)
T = lambda i: L[i]['start']; E = lambda i: L[i]['end']; Dn = lambda i: E(i) - T(i); SC = lambda n: SCN[n]['a']
rng = np.random.default_rng(21)
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n] * g
def env(d, a=.005, r=.3): t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def reverb(x, mix=.35):
    y = np.zeros_like(x)
    for d, g in ((.031, .6), (.047, .55), (.061, .5), (.083, .45), (.113, .4)):
        k = int(d * SR); z = np.copy(x)
        for _ in range(6): z = np.concatenate([np.zeros(k), z[:-k]]) * g; y += z * .2
    return x * (1 - mix) + filt(y, 'lowpass', 5000) * mix

# ---------------- 音效库 ----------------
def ding(f=1320, d=1.2): t = tt(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t)) * env(d, .002, .25)
def tick(): return filt(rng.standard_normal(int(.03 * SR)), 'bandpass', [2500, 6000]) * env(.03, .0005, .006)
def heart(): t = tt(.35); return np.sin(2 * np.pi * 52 * t) * env(.35, .004, .08)
def boom(f0=50, d=2.2): t = tt(d); return np.sin(2 * np.pi * f0 * t * (1 + .7 * np.exp(-t * 5))) * env(d, .005, .55)
def whoosh(d=1.0, lo=300, hi=3500): t = tt(d); return filt(rng.standard_normal(len(t)), 'bandpass', [lo, hi]) * np.sin(np.pi * t / d) ** 2 * .5
def shimmer(d=1.6):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (.3 + i * .08)) for i, f in enumerate((2093, 2637, 3136, 4186)))
    return x * np.minimum(1, t / .02) * .4
def pop(): t = tt(.25); return np.sin(2 * np.pi * (300 + 900 * np.exp(-t * 30)) * t) * env(.25, .002, .05)
def suck(d=.5): t = tt(d); return filt(rng.standard_normal(len(t)), 'bandpass', [400, 2500]) * (t / d) ** 2 * .6
def click(f=3200): x = filt(rng.standard_normal(int(.06 * SR)), 'bandpass', [f * .6, f * 1.6]) * env(.06, .0005, .012); return x + .4 * np.sin(2 * np.pi * f * tt(.06)) * env(.06, .0005, .02)
def glitch(d=.5): t = tt(d); x = np.sign(np.sin(2 * np.pi * 180 * t * (1 + 3 * (t % .07)))) * (rng.random(len(t)) < .7); return filt(x, 'bandpass', [400, 4000]) * env(d, .002, .25) * .35
def hiss(d=1.2): t = tt(d); return filt(rng.standard_normal(len(t)), 'highpass', 5000) * np.exp(-t / .25)

# ---------------- 乐器音效（记忆起用：每个关键动作配一个乐器音，音高写音名，落在配乐的调里） ----------------
# 用法：add(sfx, musicbox('Ab5'), 时刻, 增益)；chord(kalimba, ['F4','Ab4','C5'], .06) 分解和弦；配乐调性见 timeline.json 的 music.key
_NM = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def nf(n): return mtof(12 * (int(n[-1]) + 1) + _NM[n[:-1]]) if isinstance(n, str) else mtof(n)
def _part(f, d, parts, attack=.002):
    t = tt(d); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dec) for r, a, dec in parts) * np.minimum(1, t / attack)
def musicbox(n, d=2.4): f = nf(n); return _part(f, d, [(1, 1, .9), (3.98, .35, .25), (9.9, .12, .08)]) * .5
def celesta(n, d=1.8): f = nf(n); return _part(f, d, [(1, 1, .7), (2, .3, .3), (4.1, .08, .1)]) * .5
def kalimba(n, d=1.2): f = nf(n); t = tt(d); return (np.sin(2 * np.pi * f * t * (1 + .004 * np.exp(-t * 30))) * np.exp(-t / .45) + .3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / .05)) * np.minimum(1, t / .002) * .5
def pluck(n, d=1.6):   # Karplus-Strong 拨弦
    f = nf(n); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(int(d * SR))
    for i in range(len(out)): out[i] = buf[i % p]; buf[i % p] = .996 * .5 * (buf[i % p] + buf[(i + 1) % p])
    return filt(out, 'lowpass', 5000) * .5
def piano(n, d=3.0): f = nf(n); x = _part(f, d, [(1, 1, 1.2), (2, .45, .7), (3, .2, .45), (4, .1, .3), (5.02, .05, .2)], .003); return (x + filt(rng.standard_normal(len(x)), 'bandpass', [800, 3000]) * env(d, .001, .01) * .3) * .45
def rpiano(n, d=1.4): x = piano(n, d); return x[::-1] * np.linspace(0, 1, len(x)) ** 2   # 反向钢琴：慢慢涌上来
def chord(fn, notes, gap=.05, **kw):
    xs = [fn(n, **kw) for n in notes]; out = np.zeros(max(len(x) for x in xs) + int(gap * SR * len(xs)))
    for i, x in enumerate(xs): j = int(i * gap * SR); out[j:j + len(x)] += x
    return out / len(xs) ** .5

# ---------------- 配乐预设 ----------------
PRESETS = {
    'aurora':   dict(bpm=66, chords=[[49, 61, 65, 68, 72, 75], [46, 58, 61, 65, 68, 72], [42, 54, 61, 65, 68, 73], [44, 56, 61, 63, 68, 72]], bars_per=1, piano='arp8', bass='long', hats=False, rev=.4, pad=.35),
    'gold':     dict(bpm=76, chords=[[38, 50, 53, 57, 64, 69], [34, 46, 50, 53, 57, 62], [31, 43, 50, 53, 57, 62], [33, 45, 50, 52, 55, 61]], bars_per=2, piano='sparse', bass='heart', hats=True, rev=.25, pad=.5),
    'crimson':  dict(bpm=84, chords=[[33, 45, 52, 57, 60, 64], [29, 41, 48, 53, 57, 60], [36, 48, 52, 55, 60, 64], [31, 43, 50, 55, 59, 62]], bars_per=2, piano='sparse', bass='pulse8', hats=True, rev=.25, pad=.4),
    'stardust': dict(bpm=60, chords=[[36, 48, 55, 59, 64, 66], [38, 50, 57, 62, 66, 69], [33, 45, 52, 57, 60, 64], [40, 52, 55, 59, 64, 67]], bars_per=2, piano='bells', bass='long', hats=False, rev=.5, pad=.45),
    'phosphor': dict(bpm=72, chords=[[38, 50, 57, 60, 64, 65], [34, 46, 53, 57, 62, 65], [31, 43, 50, 53, 57, 62], [33, 45, 52, 55, 57, 64]], bars_per=2, piano='bells', bass='heart', hats=False, rev=.35, pad=.45),
    'tide':     dict(bpm=62, chords=[[40, 52, 59, 63, 66, 71], [36, 48, 55, 59, 64, 67], [43, 55, 59, 62, 66, 71], [38, 50, 57, 62, 66, 69]], bars_per=2, piano='arp8', bass='long', hats=False, rev=.5, pad=.42),
}
P = PRESETS.get(EP['theme'], PRESETS['stardust']); BEAT = 60 / P['bpm']; BAR = BEAT * 4
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try: from sfxlib import smp   # 真实采样音效库（D:/claude/sfx），sfx.py 里 smp('组/名', i)
except Exception as e: smp = None; print('sfxlib 不可用:', e)
ns = {k: v for k, v in globals().items()}; ns['sfx'] = np.zeros(N)
if os.path.exists('sfx.py'): exec(open('sfx.py', encoding='utf-8').read(), ns)
sfx = ns['sfx']
for ch in TL.get('chapters', []):   # 章节卡：进场呼啸 + 微光
    if ch.get('card'): a = ch['card']['a']; add(sfx, whoosh(1.0, 300, 3000), a - .1, .25); add(sfx, shimmer(1.8), a + .12, .22); add(sfx, boom(55, 1.6), a + .05, .2)
if 'INTENSITY' in ns: pts = ns['INTENSITY']
else: pts = [(0, 0), (2, .55)] + [(s['a'] + .5, .55 + .1 * (i % 3)) for i, s in enumerate(TL['scenes'][1:])] + [(TOT - 3, .6), (TOT, 0)]
xs, ys = zip(*sorted(pts)); inten = np.interp(np.arange(N) / SR, xs, ys)

# 外部配乐（episode.json：musicFile 文件路径，musicStart 进入时刻（秒或句子 id），musicFadeIn 淡入秒数）
# 例：MusicGen 生成的 tools/musicgen.py 输出；不够长就循环（2 秒交叉淡化）
def external_music():
    x, sr0 = sf.read(EP['musicFile'])
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr0) if sr0 != SR else x
    st = EP.get('musicStart', 0); st = T(st) if isinstance(st, str) else float(st)
    need = N - int(st * SR); xf = int(2 * SR); out = x.copy()
    while len(out) < need: ramp = np.linspace(0, 1, xf); out = np.concatenate([out[:-xf], out[-xf:] * (1 - ramp) + x[:xf] * ramp, x[xf:]])
    m = np.zeros(N); m[int(st * SR):] = out[:need]
    fi = EP.get('musicFadeIn', 6.0); tt_ = np.arange(N) / SR - st; m *= np.clip(tt_ / fi, 0, 1) ** 1.5
    return m / (np.abs(m).max() + 1e-9) * .8
if EP.get('musicFile') and not EP.get('noMusic'): MUSIC_EXT = external_music()
music = np.zeros(N)
for k in range(int(TOT / BAR) + 1 if not EP.get('musicFile') else 0):
    t0 = k * BAR; ch = P['chords'][(k // P['bars_per']) % 4]; d = BAR * 1.2; t = tt(d)
    e = np.minimum(1, t / 1.0) * np.clip((d - t) / .8, 0, 1)
    pad = sum(np.sin(2 * np.pi * mtof(m) * t * (1 + dt)) for m in ch[1:4] for dt in (-.003, .003)) / 6
    add(music, filt(pad, 'lowpass', 2200) * e * P['pad'], t0)
    if P['bass'] == 'long': add(music, np.sin(2 * np.pi * mtof(ch[0]) * tt(BAR)) * env(BAR, .02, 1.6) * .35, t0)
    else:
        step = BEAT if P['bass'] == 'heart' else BEAT / 2
        for b in range(int(round(BAR / step))):
            bt = tt(.45); x = np.sin(2 * np.pi * mtof(ch[0]) * bt + 2 * np.exp(-bt * 30)) * env(.45, .004, .16)
            add(music, x * (.5 if b % 2 == 0 else .28), t0 + b * step)
    if P['piano'] == 'arp8':
        arp = [ch[1] + 12, ch[3] + 12, ch[4] + 12, ch[5] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[3] + 12]; slots = [(j * BEAT / 2, m) for j, m in enumerate(arp) if rng.random() > .18]
    elif P['piano'] == 'sparse': slots = [(b * BEAT + (BEAT / 2 if rng.random() < .3 else 0), [ch[2], ch[3], ch[4], ch[3]][b] + 12) for b in range(4) if rng.random() < .55]
    else: slots = [(b * BEAT * 2 + rng.random() * .3, ch[3 + b % 3] + 24) for b in range(2) if rng.random() < .8]
    for at, m in slots:
        f = mtof(m); pt = tt(2.6 if P['piano'] != 'bells' else 4.0)
        harm = ((1, 1), (2, .4), (3, .15), (4, .07)) if P['piano'] != 'bells' else ((1, 1), (2.76, .3), (5.4, .1))
        x = sum(np.sin(2 * np.pi * f * h * pt) * a * np.exp(-pt * h * (.9 if P['piano'] != 'bells' else .35)) for h, a in harm) * np.minimum(1, pt / .004)
        add(music, x * .14, t0 + at)
if P['hats']:
    hat = filt(rng.standard_normal(int(.09 * SR)), 'highpass', 6000) * env(.09, .001, .03)
    for k in range(int(TOT / (BEAT / 2))):
        at = k * BEAT / 2; i = min(N - 1, int(at * SR))
        if inten[i] > .6: add(music, hat * (.12 if k % 2 else .06) * (inten[i] - .5) * 2, at)
music = np.zeros(N) if EP.get('noMusic') else MUSIC_EXT * 1.1 if EP.get('musicFile') else reverb(music * inten, P['rev']) * .9   # noMusic: 整片只留音效
def warp_pos(t, t0, t1, k, ramp=1.0):   # 变速段的播放位置（和 film.js 的 warpPos 同一个公式）：[t0, t1] 里速度在 ramp 秒内从 1 升到 k，t1 处跳回实时
    u = np.clip((t - t0) / ramp, 0, None); extra = np.where(u < 1, u * u / 2, u - .5) * ramp * (k - 1)
    return np.where((t >= t0) & (t < t1), t + extra, t)
if 'MUSIC_WARP' in ns:   # sfx.py 写 MUSIC_WARP=[(t0, t1, k)…]：这一段配乐被"带快"（变速变调），t1 处 .3 秒交叉淡化回到原来的位置
    tt_all = np.arange(N) / SR
    for t0, t1, k in ns['MUSIC_WARP']:
        pos = warp_pos(tt_all, t0, t1, k); warped = np.interp(pos * SR, np.arange(N), music)
        xf = np.clip((tt_all - (t1 - .3)) / .3, 0, 1); inside = (tt_all >= t0) & (tt_all < t1 + .01)
        music = np.where(inside, warped * (1 - xf) + music * xf, music)
if 'MUSIC_GAIN' in ns: gx, gy = zip(*sorted(ns['MUSIC_GAIN'])); music = music * np.interp(np.arange(N) / SR, gx, gy)   # sfx.py 可写 MUSIC_GAIN=[(秒, 增益)…]：比如定格时让配乐停下来
def lpf4(x, fc):   # 频域四阶低通（整段一次算完，比逐段滤波快）
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X / (1 + (f / fc) ** 4), len(x))
if 'MUSIC_TONE' in ns:   # MUSIC_TONE=[(秒, 0~1)…]：0 = 很闷（低通 380Hz，隔墙听）、.5 = 半闷（1100Hz）、1 = 原声；蓄力时闷着，揭晓那一拍从 0 跳到 1 = "砰"地打开（学自 ajydxw 源码）
    tx, ty = zip(*sorted(ns['MUSIC_TONE'])); v = np.interp(np.arange(N) / SR, tx, ty)
    w0, w1 = np.clip(1 - 2 * v, 0, 1), np.clip(2 * v - 1, 0, 1); m0, m5 = lpf4(music, 380) * 1.25, lpf4(music, 1100) * 1.1   # 闷的版本稍微补一点音量
    music = m0 * w0 + m5 * (1 - w0 - w1) + music * w1
if 'DUCKS' in ns:   # DUCKS=[(秒, dB, 时长)…]：重击 / 揭晓下面配乐瞬间压低再弹回（sidechain 手感），一般 -4~-6 dB、.4~.6 秒
    duck = np.zeros(N)
    for t0, db, d in ns['DUCKS']:
        i, n = int(t0 * SR), int(d * SR); seg = db * (1 - np.arange(n) / n) ** 2; j = min(N, i + n)
        if i < N: duck[i:j] = np.minimum(duck[i:j], seg[:j - i])
    music = music * 10 ** (duck / 20)
sfx = reverb(sfx, .3)

vo = np.zeros(N)
for l in ([] if EP.get('noVoice') else TL['lines']):
    x, sr = sf.read(os.path.join('voices', l['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    x = filt(resample_poly(x, SR, sr), 'highpass', 70); add(vo, x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * .1, l['start'])
act = np.zeros(N)
for l in ([] if EP.get('noVoice') else TL['lines']): act[max(0, int((l['start'] - .15) * SR)):int((l['end'] + .2) * SR)] = 1
# 滑动平均用累加和（np.convolve 在几百万采样点上会慢到卡死）
k = int(.3 * SR); cs = np.concatenate([[0], np.cumsum(act)]); idx = np.clip(np.arange(N) + k // 2, 0, N); act = (cs[idx] - cs[np.clip(idx - k, 0, N)]) / k
mix = vo + music * (1 - .45 * act) * .55 + sfx * .5
mix = filt(mix, 'highpass', 30); mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.4) * (.68 if EP.get('noVoice') else .9)   # 无配音时整体压低到约 −14 LUFS
fade = np.minimum(1, np.arange(N) / (SR * .8)) * np.minimum(1, (N - np.arange(N)) / (SR * 2.0))
os.makedirs('out', exist_ok=True)
sf.write(os.path.join('out', 'mix.wav'), np.stack([mix * fade] * 2, 1).astype(np.float32), SR)
print('mix ok', round(TOT, 1), 's', EP['theme'])
