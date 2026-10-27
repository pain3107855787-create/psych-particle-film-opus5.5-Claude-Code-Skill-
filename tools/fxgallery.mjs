// 特效图鉴：把 shaders.js 的每个着色器、lottie 动画库里挑的动画各拼成一段 4×4 宫格视频
// 用法：node tools/fxgallery.mjs [输出目录]   → shaders_gallery.mp4 / .jpg、lottie_gallery.mp4 / .jpg
import fs from 'fs'; import { fileURLToPath } from 'url'; import path from 'path'; import { execSync } from 'child_process'; import { chromium } from 'playwright-core';
const here = path.dirname(fileURLToPath(import.meta.url)), tpl = path.join(here, '..', 'template');
const out = path.resolve(process.argv[2] || 'D:/claude/finish/style-board/fx'); fs.mkdirSync(out, { recursive: true });
const LOTTIE = ['broken-heart', 'bandaged-heart', 'beating-heart', 'fire-heart', 'cry', 'melting', 'eyes', 'thinking-face',
  'pleading', 'sunglasses-face', 'exploding-head', 'face-in-clouds', 'hourglass', 'fire', 'sparkles', 'party-popper'];
const html = `<!doctype html><meta charset=utf-8><canvas id=c width=1920 height=1080></canvas>
<script>${fs.readFileSync(path.join(tpl, 'lottie.min.js'), 'utf8')}</script><script>${fs.readFileSync(path.join(tpl, 'lottie.js'), 'utf8')}</script>
<script>${fs.readFileSync(path.join(tpl, 'shaders.js'), 'utf8')}</script>`;
const page = path.join(here, '_fx.html'); fs.writeFileSync(page, html);
const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] }), p = await b.newPage();
await p.goto('file:///' + page.split(path.sep).join('/'));
const have = fs.existsSync('D:/claude/lottie') ? new Set(fs.readdirSync('D:/claude/lottie').map(f => f.replace('.json', ''))) : new Set();
const lot = LOTTIE.map(n => have.has(n) ? n : [...have].find(h => h.startsWith(n.split('-')[0]) && !h.startsWith('_'))).filter(Boolean);

async function sheet(kind, file) {
  const dir = path.join(out, '_frames_' + kind); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const N = 96;
  for (let i = 0; i < N; i++) {
    const b64 = await p.evaluate(([kind, t, lot]) => {
      const g = document.getElementById('c').getContext('2d'); g.fillStyle = '#05050a'; g.fillRect(0, 0, 1920, 1080);
      const col = { a: '#ff5fa2', b: '#7c5cff', c: '#46d2ff' };
      // 后期类的输入：一张有字有图形的小画面
      const src = document.createElement('canvas'); src.width = 1920; src.height = 1080; const s = src.getContext('2d');
      const gr = s.createLinearGradient(0, 0, 1920, 1080); gr.addColorStop(0, '#1b1440'); gr.addColorStop(1, '#3a0f2e'); s.fillStyle = gr; s.fillRect(0, 0, 1920, 1080);
      s.fillStyle = '#ff5fa2'; s.beginPath(); s.arc(1400, 540, 220, 0, 7); s.fill(); s.fillStyle = '#fff'; s.font = '900 300px sans-serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText('内核', 800, 540);
      const items = kind === 'shader' ? [
        ['aurora 极光帘', { p: [.6, .5, .6] }], ['nebula 星云', { p: [.6, .6, .5] }], ['liquid 流体', { p: [.4, .4, .4] }],
        ['core 发光内核 · 稳', { p: [960, 540, 300, .05] }], ['core 发光内核 · 不稳', { p: [960, 540, 300, 1] }], ['rays 体积光', { p: [960, 200, 14, .6] }],
        ['warp 星空穿梭', { p: [.5, .6, .5] }], ['caustic 水底焦散', { p: [.3, .8] }], ['horizon 合成波网格', { p: [.5, .4, .4] }],
        ['ink 墨滴晕染', { p: [960, 540, (t % 4) / 4, .6] }], ['bokeh 漂浮光斑', { p: [.7, .5, .6] }], ['glitch 故障', { p: [.8, .4], src }],
        ['ripple 冲击波', { p: [960, 540, (t % 2) / 2, .8], src }], ['haze 热浪', { p: [1], src }], ['crt 老电视', { p: [.8, .6, .8], src }], ['chroma 色差', { p: [30], src }]]
        : lot.map(n => [n, null]);
      items.forEach(([name, o], k) => {
        const x = (k % 4) * 480, y = Math.floor(k / 4) * 270;
        if (kind === 'shader') { const id = name.split(' ')[0]; const cv = SH.render(id, t, { ...col, ...o, scale: .5 }); g.drawImage(cv, x, y, 480, 270); }
        else { g.fillStyle = k % 2 ? '#0b0b16' : '#0e0d1c'; g.fillRect(x, y, 480, 270); LT.draw(name, t, x + 240, y + 120, 200, { loop: true, ctx: g }); }
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(x + .5, y + .5, 479, 269);
        g.font = '700 26px "Microsoft YaHei", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(name, x + 14, y + 256); g.fillStyle = '#fff'; g.fillText(name, x + 14, y + 256);
      });
      return document.getElementById('c').toDataURL('image/jpeg', .9).split(',')[1];
    }, [kind, i / 24, lot]);
    fs.writeFileSync(path.join(dir, String(i).padStart(4, '0') + '.jpg'), Buffer.from(b64, 'base64'));
  }
  execSync(`ffmpeg -v error -y -framerate 24 -i "${dir}/%04d.jpg" -c:v libx264 -pix_fmt yuv420p -crf 20 "${path.join(out, file + '.mp4')}"`);
  fs.copyFileSync(path.join(dir, '0040.jpg'), path.join(out, file + '.jpg')); fs.rmSync(dir, { recursive: true, force: true });
  console.log('→', path.join(out, file + '.mp4'));
}
p.on('pageerror', e => console.log('页面错误', e.message));
await sheet('shader', 'shaders_gallery');
await sheet('lottie', 'lottie_gallery');
await b.close(); fs.rmSync(page);
