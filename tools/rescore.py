"""配音补打分：tts_index.py 没能加载识别模型时，事后对 voices/takes/<id>_<k>.wav 逐个识别打分，选最好的覆盖 voices/<id>.wav，更新 dur.json。
用法（PowerShell）：& D:/tts-indextts/.venv/Scripts/python.exe tools/rescore.py lines.json voices [--only a1,b2]"""
import sys, os, json, re, difflib, glob
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import numpy as np, soundfile as sf, soxr
from faster_whisper import WhisperModel
lines, out = sys.argv[1], sys.argv[2]; only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else set()
L = json.load(open(lines, encoding='utf-8')); asr = WhisperModel('small', device='cpu', compute_type='int8')
plain = lambda s: re.sub(r'<([^|>]+)\|[^>]+>', r'\1', s); keep = lambda s: re.sub(r'[^\u4e00-\u9fff0-9A-Za-z]', '', plain(s)).upper()
durp = os.path.join(out, 'dur.json'); durs = json.load(open(durp)) if os.path.exists(durp) else {}
for l in L:
    if only and l['id'] not in only: continue
    best = None
    for f in sorted(glob.glob(os.path.join(out, 'takes', f"{l['id']}_[0-9].wav"))):
        y, sr = sf.read(f); y = y.mean(1) if y.ndim > 1 else y
        segs, _ = asr.transcribe(soxr.resample(y.astype(np.float32), sr, 16000), language='zh', initial_prompt='以下是普通话的句子。'); got = ''.join(s.text for s in segs)
        sc = difflib.SequenceMatcher(None, keep(l['say']), keep(got)).ratio(); print(f"{l['id']} {os.path.basename(f)} {sc:.2f} | {got}", flush=True)
        if best is None or sc > best[0]: best = (sc, y, sr, f)
    if best: y = best[1] / (np.abs(best[1]).max() + 1e-9) * .9; sf.write(os.path.join(out, l['id'] + '.wav'), y, best[2]); durs[l['id']] = round(len(y) / best[2], 3); print(f"→ {l['id']} {os.path.basename(best[3])} {best[0]:.2f}", flush=True)
json.dump(durs, open(durp, 'w'), indent=1)
