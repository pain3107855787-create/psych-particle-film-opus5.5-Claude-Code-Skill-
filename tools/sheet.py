"""把 out/stills 里的抽帧按时间顺序拼成联系表 out/sheet_*.jpg（每张 16 格），方便一眼检查画面"""
import glob, os, subprocess, shutil, sys
od = sys.argv[1] if len(sys.argv) > 1 else 'out/stills'
fs = sorted(glob.glob(os.path.join(od, 't*.jpg'))); tmp = os.path.join('out', '_sheet'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
for i, f in enumerate(fs): shutil.copy(f, os.path.join(tmp, f's_{i:03d}.jpg'))
for k in range(0, len(fs), 16):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-start_number', str(k), '-i', os.path.join(tmp, 's_%03d.jpg'), '-vf', 'scale=640:-1,tile=4x4', '-frames:v', '1', f'out/sheet_{k // 16 + 1}.jpg'], check=True)
shutil.rmtree(tmp); print('sheets:', sorted(glob.glob('out/sheet_*.jpg')))
