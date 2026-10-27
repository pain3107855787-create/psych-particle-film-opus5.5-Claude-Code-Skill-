"""配音质检：列出每句选中版本的语音识别结果，标出可疑句（在项目根目录运行：python tools/check_voice.py [日志...]）
数字被转成阿拉伯数字（1930年 vs 一九三零年）造成的低分属正常；其余低于 0.95 的要重配（tts_index.py --only id --takes 5 --seed 41），
必要时改措辞，比如在句尾加"了"让收尾更完整。同一个词在别的句子里识别正确、只在这句出错 → 是配音读偏了，不是识别问题"""
import re, sys, glob
sys.stdout.reconfigure(encoding="utf-8")
logs = sys.argv[1:] or sorted(glob.glob('out/tts*.log'))
takes, chosen = {}, {}
for p in logs:
    for l in open(p, encoding='utf-8', errors='ignore'):
        m = re.match(r'(\w+) take(\d) ([\d.]+)s asr ([\d.]+) total ([\-\d.]+) \| (.*)', l.strip())
        if m: takes[(m[1], m[2])] = (float(m[3]), float(m[4]), m[6])
        m = re.match(r'→ (\w+) take(\d)', l.strip())
        if m: chosen[m[1]] = takes[(m[1], m[2])]
for k, (d, a, txt) in chosen.items():
    flag = '' if a >= .95 else ('  ← 含数字，多半正常' if re.search(r'\d', txt) else '  ← 可疑，请重配或改措辞')
    print(f'{k:4} {d:5.2f}s asr {a:.2f}  {txt}{flag}')
