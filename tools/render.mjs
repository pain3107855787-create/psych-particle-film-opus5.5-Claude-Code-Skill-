// 逐帧渲染（在项目根目录运行）
//   node tools/render.mjs                         整片 → out/video.mp4（--fps 30 --workers 4，可选 --from s --to s）
//   node tools/render.mjs --still 3,12.5,40       抽帧检查 → out/stills/
//   node tools/render.mjs --preview              低清预览小样 → out/preview_v.mp4（960 宽 12fps，约 1 分钟）
//   node tools/render.mjs --covers                按 episode.json 出 3:4 + 4:3 两张封面
// 配色、标题、封面取帧时间都来自 episode.json；--theme 可临时覆盖配色
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process'; import { chromium } from 'playwright-core';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const root = process.cwd(), tl = JSON.parse(fs.readFileSync('timeline.json', 'utf8')), ep = JSON.parse(fs.readFileSync('episode.json', 'utf8'));
const PREV = flag('preview'), THEME = arg('theme', ep.theme), fps = PREV ? 12 : +arg('fps', 30), workers = +arg('workers', 4);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--font-render-hinting=none', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })   // GPU：给 scenes3d.js 的 3D 背景用;
async function page() {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file:///' + path.join(root, 'index.html').split(path.sep).join('/'));
  // 注意：page.evaluate 只接受一个参数，多个值要包成数组
  await p.evaluate(async ([tl, th, probe]) => {
    await document.fonts.ready;
    for (const f of ['500 40px "Noto Sans SC"', '700 40px "Noto Sans SC"', '900 40px "Noto Sans SC"', '900 40px "Noto Serif SC"', '700 40px "Playfair Display"', 'italic 700 40px "Playfair Display"', '700 40px "JetBrains Mono"', '500 40px "JetBrains Mono"']) await document.fonts.load(f, probe);
    setup(document.getElementById('c'), tl, th); if (window.M && M.ready) await M.ready();   // 等 assets/ 里的真实图片加载完
  }, [tl, THEME, ep.title + 'A1']);
  if (PREV) await p.evaluate(() => { E.preview = true; });
  return p;
}
const grab = async (p, t, q = .93) => Buffer.from((await p.evaluate(([t, q]) => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', q).split(',')[1]; }, [t, q])), 'base64');

if (flag('covers')) {
  const line = tl.lines.find(l => l.id === ep.cover.line), at = line.start + (ep.cover.offset || 0), cy = ep.cover.focusY || 465, cx = ep.cover.focusX || 960, zt = ep.cover.zoomTall ?? 1.05;
  const p = await page();
  for (const [file, size] of [['cover-3x4.jpg', '1080x1440'], ['cover-4x3.jpg', '1440x1080']]) {
    const b64 = await p.evaluate(([sz, at, title, sub, en, cy, cx, zt, wm]) => {
      const [w, h] = sz.split("x").map(Number); E.clean = true; E.cover = { w, h }; draw(at); const fr = document.getElementById('c');
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#030305'; g.fillRect(0, 0, w, h);
      const s = Math.max(w / 1920, h / 1080) * (w < h ? zt : 1), fx = w / 2 - cx * s, fy = Math.min(0, (w < h ? h * .36 : h * .4) - cy * s);
      g.drawImage(fr, fx, fy, 1920 * s, 1080 * s);
      const v = g.createLinearGradient(0, h * .5, 0, h); v.addColorStop(0, 'rgba(3,3,5,0)'); v.addColorStop(1, 'rgba(3,3,5,.85)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
      const keep = E.ctx; E.ctx = g; const big = Math.min(w < h ? 150 : 130, Math.floor(w * .86 / ([...title].length + .6))), ty = w < h ? h * .7 : h * .74;   // 标题按画面宽度自动缩小，长标题不出框
      E.neon(title, w / 2, ty, { size: big, color: E.TH.p, glow: E.TH.glow, spacing: 8 }, -9, 0);
      if (sub) E.neon(sub, w / 2, ty + big * .95, { size: w < h ? 42 : 38, color: E.TH.a, weight: 700, spacing: 3 }, -9, 0);
      if (en) E.neon(en, w / 2, ty + big * .95 + 66, { size: 22, color: E.TH.b, font: '"JetBrains Mono"', weight: 700, spacing: 8 }, -9, 0);
      g.font = 'italic 700 52px "Playfair Display"'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#f2f2f2'; g.globalAlpha = .7; g.shadowColor = E.TH.glow; g.shadowBlur = 10; if (wm) g.fillText(wm, w - 60, 84);
      E.ctx = keep; E.clean = false; E.cover = null; return c.toDataURL('image/jpeg', .95).split(',')[1];
    }, [size, at, ep.title, ep.cover.sub || '', ep.en || '', cy, cx, zt, ep.watermark ?? 'Pain']);
    fs.writeFileSync(file, Buffer.from(b64, 'base64')); console.log(file);
  }
  await browser.close(); process.exit(0);
}
const still = arg('still');
if (still) {
  const p = await page(), od = arg('out', 'out/stills'); fs.mkdirSync(od, { recursive: true });
  for (const t of still.split(',').map(Number)) fs.writeFileSync(path.join(od, `t${String(t.toFixed(1)).padStart(6, '0')}.jpg`), await grab(p, t));
  await browser.close(); console.log('stills →', od); process.exit(0);
}
const from = +arg('from', 0), to = +arg('to', tl.total), N = Math.round((to - from) * fps), per = Math.ceil(N / workers);
fs.mkdirSync('out/parts', { recursive: true });
const t0 = Date.now();
await Promise.all([...Array(workers)].map(async (_, w) => {
  const a = w * per, b = Math.min(N, a + per); if (a >= b) return;
  const p = await page();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', ...(PREV ? ['-vf', 'scale=960:-2'] : []), '-c:v', 'libx264', '-preset', PREV ? 'veryfast' : 'medium', '-crf', PREV ? '23' : '17', '-pix_fmt', 'yuv420p', `out/parts/p${w}.mp4`]);
  for (let i = a; i < b; i++) {
    const buf = await grab(p, from + i / fps, PREV ? .72 : .93);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (w === 0 && i % 150 === 0) console.log(`frame ${i}/${b} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}));
fs.writeFileSync('out/parts/list.txt', [...Array(workers)].map((_, w) => `file 'p${w}.mp4'`).join('\n'));
await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'out/parts/list.txt', '-c', 'copy', PREV ? 'out/preview_v.mp4' : 'out/video.mp4'], { stdio: 'inherit' }).on('close', r));
await browser.close(); console.log('video done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
