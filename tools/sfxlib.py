"""真实采样音效库（D:/claude/sfx，全部 CC0：Kenney 6 包 + OpenGameArt 若干）
在 sfx.py 里直接用：add(sfx, smp('ui/click', 2), 时刻, 增益)
  smp(键, 第几个=0, 变速=1.0)  → 48k 单声道 numpy；键 = '<组>/<名>'，同名多个版本用第几个区分（超出则循环）
  python tools/sfxlib.py           列出所有键（也写进 skill 的 reference/sfx_library.md）
组：ui 界面点击/开关 · iface 界面提示（确认/错误/提问/弹出）· digital 电子音（升降调/能量）· impact 撞击/脚步 · scifi 科幻（引擎/力场/门）
    casino 卡牌/筹码/骰子 · swish 挥动嗖声 · whoosh 风声 · key 键盘打字 · page 翻书 · heart 心跳 · misc 杂项（铃/锣/纸/玻璃/门/弹簧…）
"""
import os, re, glob, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

ROOT = os.environ.get('SFX_ROOT', 'D:/claude/sfx'); SR = 48000
PACKS = {'kenney_ui-audio': 'ui', 'kenney_interface-sounds': 'iface', 'kenney_digital-audio': 'digital', 'kenney_impact-sounds': 'impact', 'kenney_sci-fi-sounds': 'scifi',
         'kenney_casino-audio': 'casino', 'oga_swishes': 'swish', 'oga_whoosh': 'whoosh', 'oga_keyboard': 'key', 'oga_pages': 'page', 'oga_heartbeat': 'heart', 'oga_cc0_100': 'misc'}
_index, _cache = None, {}

def index():
    global _index
    if _index is None:
        _index = {}
        for d, g in PACKS.items():
            for f in sorted(glob.glob(os.path.join(ROOT, d, '**', '*.*'), recursive=True)):
                if not f.lower().endswith(('.ogg', '.wav', '.mp3', '.flac')) or os.path.basename(f).startswith('._'): continue
                stem = os.path.splitext(os.path.basename(f))[0]
                name = re.sub(r'[\s_.\-]*\d+$', '', stem).replace(' ', '_').lower() or stem.lower()
                _index.setdefault(f'{g}/{name}', []).append(f)
    return _index

def smp(key, i=0, rate=1.0):
    files = index().get(key)
    if not files: raise KeyError(f'没有音效 {key}；可用的键见 reference/sfx_library.md')
    f = files[i % len(files)]; ck = (f, rate)
    if ck not in _cache:
        x, sr = sf.read(f, dtype='float32')
        if x.ndim > 1: x = x.mean(1)
        sr2 = int(sr * rate); x = resample_poly(x, SR, sr2) if sr2 != SR else x
        _cache[ck] = (x / (np.abs(x).max() + 1e-9) * .9).astype(np.float64)
    return _cache[ck]

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    idx = index(); groups = {}
    for k, v in sorted(idx.items()): groups.setdefault(k.split('/')[0], []).append(f'`{k.split("/", 1)[1]}`×{len(v)}' if len(v) > 1 else f'`{k.split("/", 1)[1]}`')
    out = ['# 采样音效库（D:/claude/sfx，CC0）', '', '用法：sfx.py 里 `add(sfx, smp("组/名", 第几个, 变速), 时刻, 增益)`；×N 表示有 N 个版本。重新生成：`python tools/sfxlib.py`', '']
    for g, ks in groups.items(): out.append(f'**{g}**：' + ' '.join(ks)); out.append('')
    txt = '\n'.join(out); print(txt, f'\n共 {sum(len(v) for v in idx.values())} 个文件 / {len(idx)} 个键')
    here = os.path.dirname(os.path.abspath(__file__)); ref = os.path.join(here, '..', 'reference', 'sfx_library.md')
    if os.path.isdir(os.path.dirname(ref)) and os.path.basename(os.path.dirname(os.path.dirname(os.path.abspath(ref)))) == 'psych-particle-film': open(ref, 'w', encoding='utf-8').write(txt + '\n')
