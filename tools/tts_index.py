"""配音（2026-10-19 起默认）：IndexTTS-2.5 零样本克隆 D:/claude/voice/_ref 的女声。比 CosyVoice2 更稳，支持拼音指定多音字。
运行（PowerShell，项目根目录）：
  $env:PYTHONIOENCODING='utf-8'; & D:\\tts-indextts\\.venv\\Scripts\\python.exe tools\\tts_index.py lines.json voices --ref D:/claude/voice/_ref/ref24k.wav --takes 3 *> out\\tts.log
say 写法：
  '/'  短停顿（段内换成逗号，语调连贯）
  '//' 长停顿（换成句号，整句仍一次合成——不要分段合成再拼，情绪会断）
  多音字：<调|TIAO2>、<看|KAN4>、轻声用 5（如 <看|KAN5>）（拼音 + 声调数字，脚本会换成 tiao2 送进模型，合法拼音见 D:/tts-indextts/checkpoints/pinyin.vocab）——字幕 text 照常写汉字
  TA 在 say 里写"他"（模型会把 TA 念成字母）
每句可选：speed（duration_factor，<1 更快，默认 --speed）、longPause、takes
挑选：每句 K 个版本（不同随机种子），用 faster-whisper 识别打分（多音字按拼音比对不了，只比汉字），写 voices/<id>.wav 与 dur.json"""
import sys, os, json, argparse, re, difflib
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = 'D:/tts-indextts'; sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf, torch
ap = argparse.ArgumentParser(); ap.add_argument('lines'); ap.add_argument('out'); ap.add_argument('--ref', default='D:/claude/voice/_ref/ref24k.wav'); ap.add_argument('--takes', type=int, default=3)
ap.add_argument('--only', default=''); ap.add_argument('--seed', type=int, default=11); ap.add_argument('--speed', type=float, default=.92); ap.add_argument('--ref-text', default='')
A = ap.parse_args()
L = json.load(open(A.lines, encoding='utf-8')); only = set(filter(None, A.only.split(',')))
os.makedirs(os.path.join(A.out, 'takes'), exist_ok=True)
cwd = os.getcwd(); os.chdir(ROOT)
from indextts.infer_v2_5 import IndexTTS2
tts = IndexTTS2(cfg_path='checkpoints/config.yaml', model_dir='checkpoints', use_bf16=True)
os.chdir(cwd)
try:
    from faster_whisper import WhisperModel; asr = WhisperModel('small', device='cpu', compute_type='int8')
except Exception as e: asr = None; print('（没有 faster-whisper，不做识别打分：', e, '）')
plain = lambda s: re.sub(r'<([^|>]+)\|[^>]+>', r'\1', s)                         # <调|TIAO2> → 调
keep = lambda s: re.sub(r'[^\u4e00-\u9fff0-9A-Za-z]', '', plain(s)).upper()
durp = os.path.join(A.out, 'dur.json'); durs = json.load(open(durp)) if os.path.exists(durp) else {}

def trim(x, sr, db=-40):
    a = np.abs(x); thr = a.max() * 10 ** (db / 20); idx = np.where(a > thr)[0]
    return x if not len(idx) else x[max(0, idx[0] - int(.03 * sr)):min(len(x), idx[-1] + int(.08 * sr))]

EMO = {}   # 情绪：lines.json 每句可写 emo（8 维 [开心,生气,难过,害怕,厌恶,忧郁,惊讶,平静]），试听后再定
def synth(text, path, speed):
    tts.infer(spk_audio_prompt=A.ref, text=text, lang='ZH', output_path=path, duration_factor=speed, verbose=False)
    y, sr = sf.read(path); y = y.mean(1) if y.ndim > 1 else y; return trim(y.astype(np.float32), sr), sr

for line in L:
    if only and line['id'] not in only: continue
    model_text = re.sub(r'<[^|>]+\|([^>]+)>', lambda m: m.group(1).lower(), line['say'])   # <调|TIAO2> → tiao2（IndexTTS 只认"拼音+声调"直接替换汉字）
    # 整句一次合成（2026-10-19 用户：分段合成再拼，情绪接不上、读着累）：'//' → 句号，'/' → 逗号，停顿交给模型
    parts = [re.sub(r'\s*/\s*', '，', re.sub(r'\s*//\s*', '。', model_text)).strip('，')]; best = None
    for k in range(line.get('takes', A.takes)):
        torch.manual_seed(A.seed + k * 101); np.random.seed(A.seed + k * 101); ys = []; sr = 22050
        for j, q in enumerate(filter(None, parts)):
            y, sr = synth(q, os.path.join(A.out, 'takes', f"{line['id']}_{k}_{j}.wav"), line.get('speed', A.speed)); ys.append(y)
        gap = np.zeros(int(line.get('longPause', .4) * sr), np.float32); y = np.concatenate([v for i, v in enumerate(ys) for v in ([gap, v] if i else [v])])
        sf.write(os.path.join(A.out, 'takes', f"{line['id']}_{k}.wav"), y, sr); d = len(y) / sr; score, got = 1.0, ''
        if asr:
            import soxr
            segs, _ = asr.transcribe(soxr.resample(y, sr, 16000), language='zh', initial_prompt='以下是普通话的句子。'); got = ''.join(s.text for s in segs)
            score = difflib.SequenceMatcher(None, keep(line['say']), keep(got)).ratio()
        rate = len(keep(line['say'])) / max(d, .1); total = score - abs(rate - line.get('cps', 4.8)) * .03
        print(f"{line['id']} take{k} {d:.2f}s asr {score:.2f} total {total:.2f} | {got}", flush=True)
        if best is None or total > best[0]: best = (total, y, d, k, sr)
    y = best[1] / (np.abs(best[1]).max() + 1e-9) * .9; sf.write(os.path.join(A.out, line['id'] + '.wav'), y, best[4]); durs[line['id']] = round(best[2], 3)
    print(f"→ {line['id']} take{best[3]} {best[2]:.2f}s", flush=True)
    json.dump(durs, open(durp, 'w'), indent=1)
