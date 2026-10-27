# 分析配乐：BPM、每拍 / 每个重拍（小节第一拍）的秒数、调性、能量曲线、段落切换点 → <音乐名>_beats.json + <音乐名>_beats.png
# 用法：python tools/beats.py D:/claude/dubbing/Pain1.mp3 [--out 目录]
# film.js 里用 E.beat / E.bar（timeline.json 的 music 字段）把画面动作卡在拍子上；sfx.py 用同一份拍点
import sys, os, json, numpy as np, librosa
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
src = sys.argv[1]; out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.dirname(src)
name = os.path.splitext(os.path.basename(src))[0]
import subprocess, tempfile
tmp = os.path.join(tempfile.gettempdir(), name + '_beats.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '22050', tmp], check=True)   # mp3 先转 wav，避免 libsndfile 解码出错
y, sr = librosa.load(tmp, sr=22050, mono=True); dur = len(y) / sr
hop = 512; oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop)
tempo = float(np.atleast_1d(tempo)[0]); bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
# 重拍：4/4 拍，挑让"第一拍"能量（低频 + 起音）最大的相位
S = np.abs(librosa.stft(y, hop_length=hop)); freqs = librosa.fft_frequencies(sr=sr); bass = S[freqs < 150].sum(0)
score = [np.mean([bass[min(len(bass) - 1, b)] + oenv[min(len(oenv) - 1, b)] * bass.mean() / (oenv.mean() + 1e-9) for b in beats[p::4]]) for p in range(4)]
ph = int(np.argmax(score)); bars = bt[ph::4]
# 调性（Krumhansl 模板）
chroma = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(y), sr=sr).mean(1)
maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]); mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
best = max(((np.corrcoef(np.roll(m, k), chroma)[0, 1], NAMES[k] + (' 大调' if i == 0 else ' 小调'), k, i) for i, m in enumerate([maj, mnr]) for k in range(12)))
# 能量曲线（每 0.5 秒）+ 段落切换（按小节聚合的 MFCC/能量新颖度）
rms = librosa.feature.rms(y=y, hop_length=hop)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
e05 = [float(rms[(rt >= a) & (rt < a + .5)].mean()) for a in np.arange(0, dur, .5)]; emax = max(e05) or 1; e05 = [round(v / emax, 3) for v in e05]
mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=13); bf = librosa.time_to_frames(bars, sr=sr, hop_length=hop)
seg = np.array([np.r_[mf[:, a:b].mean(1), rms[a:b].mean() * 50] for a, b in zip(bf[:-1], bf[1:]) if b > a]); nov = np.r_[0, np.linalg.norm(np.diff(seg, axis=0), axis=1)]
cut = [float(bars[i]) for i in np.argsort(nov)[::-1][:12] if nov[i] > np.percentile(nov, 80)]; cut = sorted(c for i, c in enumerate(sorted(cut)) if i == 0 or c - sorted(cut)[i - 1] > 6)
res = {'file': src, 'duration': round(dur, 3), 'bpm': round(tempo, 2), 'beat_sec': round(60 / tempo, 4), 'key': best[1], 'key_root': NAMES[best[2]], 'minor': bool(best[3]),
       'beats': [round(float(b), 3) for b in bt], 'bars': [round(float(b), 3) for b in bars], 'sections': [round(c, 2) for c in cut], 'energy_05s': e05}
json.dump(res, open(os.path.join(out, name + '_beats.json'), 'w', encoding='utf-8'), ensure_ascii=False)
try:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    plt.rcParams['font.sans-serif'] = ['Microsoft YaHei']; fig, ax = plt.subplots(figsize=(16, 3.6)); xs = np.arange(len(e05)) * .5
    ax.fill_between(xs, e05, color='#c46', alpha=.6); [ax.axvline(b, color='#999', lw=.4) for b in bars]; [ax.axvline(c, color='#26f', lw=2) for c in cut]
    ax.set_title(f'{name}  ·  {tempo:.1f} BPM  ·  {best[1]}  ·  {dur:.1f}s  （灰线 = 重拍，蓝线 = 段落切换）'); ax.set_xlim(0, dur); ax.set_xticks(np.arange(0, dur, 10)); fig.tight_layout(); fig.savefig(os.path.join(out, name + '_beats.png'), dpi=90)
except Exception as e: print('（图没画：', e, '）')
print(f"{name}: {tempo:.1f} BPM（每拍 {60 / tempo:.3f}s），{best[1]}，{dur:.1f}s，{len(bt)} 拍 / {len(bars)} 小节，第一个重拍 {bars[0]:.2f}s")
print('段落切换：', ', '.join(f'{c:.1f}s' for c in cut))
print('前 8 个重拍：', ', '.join(f'{b:.2f}' for b in bars[:8]))
