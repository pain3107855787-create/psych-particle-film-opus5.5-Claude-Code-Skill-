// ============================================================================
// 粒子叙事引擎（Pain 心理学系列通用）
// 粒子在"形状"之间无缝变形（弧线 / 爆散 / 内爆），带运镜、白光闪切、冲击波、霓虹字、字幕、水印
// 本期内容写在 film.js：调用 E.key / E.cam / E.flash / E.wave 排时间轴，overlay() 画叠加层
// ============================================================================
const W = 1920, H = 1080, N = 2800;
const E = (() => {
  let ctx, layer, lctx, TH, TL, L = {}, KEYS = [], CAMS = [], FLASH = [], WAVES = [], PR = [], SHAPES = {};
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k = clamp(k), k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const eOut = k => (k = clamp(k), 1 - Math.pow(1 - k, 4));
  const eIn = k => (k = clamp(k), k * k * k);
  const prog = (t, a, d) => clamp((t - a) / d);
  const vis = (t, a, b, fi = .4, fo = .4) => ease((t - a) / fi) * ease((b - t) / fo);
  function R(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------------- 配色（按概念类型选） ----------------
  // stardust 严肃科学 · crimson 百搭 · gold 讲道理 · aurora 情感/恋爱 · phosphor 实验/大脑/仪器感 · tide 亲密关系/安静的情感 · blood 血色（傲慢）· marble / ember / smoke / cyber 草案
  const THEMES = {
    stardust: { p: '#d6ecff', a: '#ffb35c', b: '#7cc4ff', glow: '#7cc4ff', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 700,
      bg(t) { const g = ctx.createRadialGradient(W * .35, H * .4, 50, W * .5, H * .5, W * .8); g.addColorStop(0, '#0d1a33'); g.addColorStop(.5, '#060c18'); g.addColorStop(1, '#010205'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(5); ctx.fillStyle = '#cfe6ff'; for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, s = r(); ctx.globalAlpha = (.15 + .5 * s) * (.6 + .4 * Math.sin(t * 2 + i)); ctx.fillRect(x, y, 1 + s * 1.5, 1 + s * 1.5); } ctx.globalAlpha = 1; } },
    crimson: { p: '#f4f4f4', a: '#ff2d55', b: '#9aa0a6', glow: '#ff2d55', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 700,
      bg(t) { ctx.fillStyle = '#050506'; ctx.fillRect(0, 0, W, H); const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .7); g.addColorStop(0, 'rgba(40,40,48,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1); } },
    gold: { p: '#f3d08a', a: '#fff1d0', b: '#c98b3a', glow: '#e8b65a', font: '"Noto Serif SC"', num: '"Playfair Display"', weight: 900,
      bg(t) { const g = ctx.createRadialGradient(W / 2, H * .42, 60, W / 2, H / 2, W * .75); g.addColorStop(0, '#1a140b'); g.addColorStop(.5, '#0b0906'); g.addColorStop(1, '#020201'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(9); for (let i = 0; i < 120; i++) { const x = (r() * W + t * 8 * (r() - .5) + W) % W, y = (r() * H + t * (10 + r() * 20)) % H; ctx.fillStyle = `rgba(243,208,138,${.08 + r() * .25})`; ctx.beginPath(); ctx.arc(x, y, .6 + r() * 1.6, 0, 6.3); ctx.fill(); } } },
    aurora: { p: '#ece8ff', a: '#ff4fd8', b: '#2de6c8', glow: '#8f7bff', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#030208'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r, c, sp] of [[.25, .3, 640, '110,80,255', .13], [.75, .65, 720, '25,227,197', .09], [.55, .2, 500, '255,79,216', .17]]) { const cx = W * x + Math.sin(t * sp * 2.2) * 160, cy = H * y + Math.cos(t * sp * 1.8) * 90; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${c},${E.auroraBoost || .15})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.restore(); const r = R(5); ctx.fillStyle = '#e8e4ff'; for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * H, s = r(); ctx.globalAlpha = (.08 + .3 * s) * (.6 + .4 * Math.sin(t * 1.5 + i)); ctx.fillRect(x, y, 1 + s, 1 + s); } ctx.globalAlpha = 1; } },
    // 草案（未用于成片）：热成像 —— 冷蓝底 + 缓慢漂移的热斑，冷=好（青白）、热=坏（橙红）
    thermal: { p: '#d8f3ff', a: '#ff5a1f', b: '#36c2ff', glow: '#ff5a1f', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 700,
      bg(t) { ctx.fillStyle = '#02050b'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r, c, sp, al] of [[.2, .75, 760, '20,70,160', .07, .22], [.8, .25, 680, '10,110,170', .09, .16], [.62, .7, 420, '255,80,30', .11, .07]]) { const cx = W * x + Math.sin(t * sp * 2) * 140, cy = H * y + Math.cos(t * sp * 1.7) * 80, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${c},${al})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.restore(); ctx.fillStyle = 'rgba(120,200,255,.03)'; for (let y = (t * 40) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 2); } },
    // E 示波器（负面偏向起用） —— 墨绿黑底 + 极淡的刻度网格，磷光绿读数，坏消息用警报红
    phosphor: { p: '#d4ffe2', a: '#ff3b5c', b: '#3dff9a', glow: '#3dff9a', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 700,
      bg(t) { const g = ctx.createRadialGradient(W / 2, H * .45, 80, W / 2, H / 2, W * .75); g.addColorStop(0, '#071a10'); g.addColorStop(.6, '#030a06'); g.addColorStop(1, '#000201'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(61,255,154,.045)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= W; x += 120) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y <= H; y += 120) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        ctx.fillStyle = 'rgba(61,255,154,.07)'; for (let x = 0; x <= W; x += 24) ctx.fillRect(x, H / 2 - 4, 1, 8); for (let y = 0; y <= H; y += 24) ctx.fillRect(W / 2 - 4, y, 8, 1); } },
    // 草案（未用于成片）：暗房 —— 安全灯下的暗红底 + 胶片颗粒，暖白字，血红只给最坏的东西
    darkroom: { p: '#fff0e8', a: '#ff1e3c', b: '#ffae8c', glow: '#ff3a3a', font: '"Noto Serif SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { const g = ctx.createRadialGradient(W * .5, H * .1, 40, W / 2, H * .5, W * .8); g.addColorStop(0, '#2a0507'); g.addColorStop(.45, '#100203'); g.addColorStop(1, '#030000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(Math.floor(t * 12) + 3); ctx.fillStyle = 'rgba(255,190,170,.05)'; for (let i = 0; i < 900; i++) ctx.fillRect(r() * W, r() * H, 1.5, 1.5); } },
    // 草案（未用于成片）：夜灯 —— 深棕黑底，左上一盏暖黄小夜灯的光晕 + 失焦的光斑；奶油白主色，玫瑰粉 / 雾青两种依恋
    nightlight: { p: '#fff0d8', a: '#ff8a9a', b: '#7fd3d6', glow: '#ffb867', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#0a0604'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const lx = W * .22 + Math.sin(t * .2) * 30, ly = H * .18, g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 900); g.addColorStop(0, 'rgba(255,170,80,.20)'); g.addColorStop(.4, 'rgba(255,140,60,.06)'); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(12); for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, rad = 20 + r() * 70, c = r() < .7 ? '255,190,120' : r() < .5 ? '255,138,154' : '127,211,214', al = (.025 + r() * .05) * (.7 + .3 * Math.sin(t * .6 + i)); const gg = ctx.createRadialGradient(x, y, rad * .6, x, y, rad); gg.addColorStop(0, `rgba(${c},${al})`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x + Math.sin(t * .3 + i) * 12, y, rad, 0, 6.3); ctx.fill(); }
        ctx.restore(); } },
    // 草案（未用于成片）：旧相片 —— 褪色的棕褐底 + 暗角 + 颗粒和细划痕，衬线字；像翻一本童年相册，褪色红 / 褪色青
    oldphoto: { p: '#f3e4c8', a: '#e5766c', b: '#8fbcb2', glow: '#e2b98a', font: '"Noto Serif SC"', num: '"Playfair Display"', weight: 900,
      bg(t) { const g = ctx.createRadialGradient(W / 2, H * .45, 100, W / 2, H / 2, W * .72); g.addColorStop(0, '#2a1f16'); g.addColorStop(.55, '#15100b'); g.addColorStop(1, '#050302'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(Math.floor(t * 10) + 5); ctx.fillStyle = 'rgba(243,228,200,.045)'; for (let i = 0; i < 1100; i++) ctx.fillRect(r() * W, r() * H, 1.4, 1.4);
        ctx.strokeStyle = 'rgba(243,228,200,.06)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) { const x = r() * W; ctx.moveTo(x, 0); ctx.lineTo(x + (r() - .5) * 30, H); } ctx.stroke(); } },
    // F 月潮（依恋理论起用） —— 深靛蓝夜海，右上一轮朦胧月光，底部缓慢起伏的潮线；月白主色，潮粉 / 海青
    tide: { p: '#e8eeff', a: '#ff8fbd', b: '#69d8ff', glow: '#9fb4ff', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060a1e'); g.addColorStop(.6, '#040716'); g.addColorStop(1, '#02030a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const mg = ctx.createRadialGradient(W * .8, H * .16, 0, W * .8, H * .16, 520); mg.addColorStop(0, 'rgba(180,200,255,.16)'); mg.addColorStop(1, 'rgba(180,200,255,0)'); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
        for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(140,170,255,${.05 - k * .01})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 0; x <= W; x += 12) { const y = H * (.8 + k * .05) + Math.sin(x * .004 + t * (.4 + k * .1) + k) * 14; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
        const r = R(5); ctx.fillStyle = '#dfe6ff'; for (let i = 0; i < 120; i++) { const x = r() * W, y = r() * H * .7, s = r(); ctx.globalAlpha = (.06 + .25 * s) * (.6 + .4 * Math.sin(t * 1.3 + i)); ctx.fillRect(x, y, 1 + s, 1 + s); } ctx.restore(); } },
    // R 夜霓虹（内核稳定起用，参考视频 20261027）—— 深靛紫夜色，粉 / 紫光晕慢慢漂，细颗粒；白字 + 热粉强调 + 琥珀第二色
    neon: { p: '#f6f0ff', a: '#ff5fa2', b: '#ffb347', glow: '#ff5fa2', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0a26'); g.addColorStop(.55, '#0a0720'); g.addColorStop(1, '#05040f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r, c, sp, al] of [[.18, .25, 700, '124,92,255', .07, .16], [.82, .7, 760, '255,95,162', .06, .12], [.6, .15, 520, '255,179,71', .09, .05]]) { const cx = W * x + Math.sin(t * sp * 2.4 + x * 7) * 150, cy = H * y + Math.cos(t * sp * 2 + y * 5) * 80, gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); gg.addColorStop(0, `rgba(${c},${al})`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
        ctx.restore(); const r = R(31); ctx.fillStyle = '#efe6ff'; for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, s = r(); ctx.globalAlpha = (.05 + .22 * s) * (.6 + .4 * Math.sin(t * 1.4 + i)); ctx.fillRect(x, y, 1 + s, 1 + s); } ctx.globalAlpha = 1;
        const v = ctx.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, W * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); } },
    // G 纸页（浅色，参考视频"明明还不了解"）：米白纸底 + 极淡纸纹，墨色字、胭脂红线；底部可由 E.paperDusk(0~1) 拉出一段暗色渐变
    paper: { p: '#2b2427', a: '#d23a52', b: '#8c7f82', glow: '#d23a52', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 700, light: true, ink: '#2b2427', muted: '#8c7f82', card: '#fffaf7', line: '#e6d9d3',
      bg(t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f4eee9'); g.addColorStop(1, '#ece3dd'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(13); ctx.fillStyle = 'rgba(120,90,80,.035)'; for (let i = 0; i < 700; i++) ctx.fillRect(r() * W, r() * H, 1.2, 1.2);
        const d = E.paperDusk || 0; if (d > 0) { const dg = ctx.createLinearGradient(0, H * (1 - .55 * d), 0, H); dg.addColorStop(0, 'rgba(26,20,30,0)'); dg.addColorStop(.45, `rgba(60,40,52,${.55 * d})`); dg.addColorStop(1, `rgba(16,12,20,${.97 * d})`); ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H); } } },
    // K 血色（傲慢起用）—— 近黑的牛血红底，暗红烟雾缓慢翻涌，顶部偶尔有血痕往下淌，暗角 + 颗粒；骨白衬线字，鲜血红强调，干涸的暗红做第二色
    blood: { p: '#f1e6df', a: '#e0102a', b: '#9a3a34', glow: '#c0001c', font: '"Noto Serif SC"', num: '"Playfair Display"', weight: 900,
      bg(t) { const g = ctx.createRadialGradient(W * .5, H * .32, 40, W * .5, H * .5, W * .78); g.addColorStop(0, '#220307'); g.addColorStop(.5, '#0d0103'); g.addColorStop(1, '#020000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, r, sp, al] of [[.2, .7, 720, .05, .16], [.78, .3, 640, .07, .13], [.5, .85, 900, .04, .12], [.6, .55, 420, .09, .08]]) { const cx = W * x + Math.sin(t * sp * 3 + x * 9) * 180, cy = H * y + Math.cos(t * sp * 2.4 + y * 7) * 90, gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); gg.addColorStop(0, `rgba(150,0,18,${al})`); gg.addColorStop(1, 'rgba(150,0,18,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
        ctx.restore();
        const r = R(21); for (let i = 0; i < 14; i++) { const x = 40 + r() * (W - 80), sp = .025 + r() * .045, ph = r(), w = 2.5 + r() * 6, u = (t * sp + ph) % 1, len = H * (.1 + r() * .55) * Math.pow(u, .7), al = .8 * Math.min(1, (1 - u) * 4);
          const lg = ctx.createLinearGradient(0, 0, 0, len); lg.addColorStop(0, `rgba(90,0,10,${al})`); lg.addColorStop(1, `rgba(170,0,22,${al})`); ctx.fillStyle = lg; ctx.fillRect(x - w / 2, 0, w, len);
          ctx.fillStyle = `rgba(185,0,25,${al})`; ctx.beginPath(); ctx.ellipse(x, len, w * 1.3, w * 1.9, 0, 0, 6.3); ctx.fill(); }
        const pool = ctx.createLinearGradient(0, H * .78, 0, H); pool.addColorStop(0, 'rgba(70,0,8,0)'); pool.addColorStop(1, `rgba(95,0,12,${.55 + .08 * Math.sin(t * .7)})`); ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H);
        const v = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
        const rg = R(Math.floor(t * 12) + 7); ctx.fillStyle = 'rgba(255,170,160,.04)'; for (let i = 0; i < 900; i++) ctx.fillRect(rg() * W, rg() * H, 1.5, 1.5); } },
    // L 大理石 —— 黑色大理石：极淡的灰白石纹 + 缓慢扫过的一道冷光；象牙白衬线字，旧金强调；适合哲学 / 人性 / 古典意象（雕像、名言）
    marble: { p: '#f2f0ea', a: '#c9a96e', b: '#8a8f99', glow: '#d9d4c8', font: '"Noto Serif SC"', num: '"Playfair Display"', weight: 900,
      bg(t) { const g = ctx.createRadialGradient(W * .45, H * .4, 60, W / 2, H / 2, W * .8); g.addColorStop(0, '#1c1c1f'); g.addColorStop(.55, '#0c0c0e'); g.addColorStop(1, '#030304'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const r = R(44); ctx.lineCap = 'round';
        for (let i = 0; i < 16; i++) { let x = r() * W, y = r() * H; const a = r() * 6.28, al = .06 + r() * .1; ctx.strokeStyle = `rgba(225,225,232,${al})`; ctx.lineWidth = .6 + r() * 1.8; ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 0; k < 9; k++) { const nx = x + Math.cos(a + (r() - .5) * 1.4) * 160, ny = y + Math.sin(a + (r() - .5) * 1.4) * 160; ctx.quadraticCurveTo(x + (r() - .5) * 90, y + (r() - .5) * 90, nx, ny); x = nx; y = ny; } ctx.stroke(); }
        const sx = ((t * .08) % 1.6 - .3) * W, sg = ctx.createLinearGradient(sx - 300, 0, sx + 300, H * .4); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.035)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); } },
    // M 余烬 —— 焦黑底，底部一层暗橙热光，火星往上飘、忽明忽暗；适合愤怒 / 倦怠 / 燃尽 / 执念
    // P 毒翡翠（嫉妒起用）—— 墨绿黑底、底部一层酸绿雾、慢慢上浮的绿色微光；酸绿 = 嫉妒，暖金 = 别人窗里的光
    jade: { p: '#e8fff1', a: '#8dff5a', b: '#ffc86b', glow: '#4dff8a', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#020806'; ctx.fillRect(0, 0, W, H); const g = ctx.createLinearGradient(0, H * .4, 0, H); g.addColorStop(0, 'rgba(20,90,50,0)'); g.addColorStop(1, `rgba(30,140,70,${.22 + .04 * Math.sin(t * 1.1)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = R(23);
        for (let i = 0; i < 120; i++) { const x0 = r() * W, sp = 12 + r() * 30, ph = r() * H, s = .8 + r() * 2, y = H - ((t * sp + ph) % (H * 1.1)), x = x0 + Math.sin(t * (.3 + r() * .5) + i) * 30, al = (.25 + .5 * Math.abs(Math.sin(t * (1 + r() * 2) + i))) * Math.min(1, y / H * 1.5) * .6;
          ctx.fillStyle = `rgba(${120 + (i % 4) * 20},255,${140 + (i % 3) * 30},${al})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill(); }
        ctx.restore(); } },
    // Q 薄冰（过度自信起用）—— 墨蓝黑底、底部一层冷白冰雾、细小的冰晶慢慢飘落；冰白 + 冰蓝，危险时一点警示橙
    frost: { p: '#eef7ff', a: '#7fd4ff', b: '#ffae5c', glow: '#8fdcff', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#02050b'; ctx.fillRect(0, 0, W, H); const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(60,110,160,0)'); g.addColorStop(1, `rgba(90,150,210,${.2 + .03 * Math.sin(t * .9)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = R(31);
        for (let i = 0; i < 140; i++) { const x0 = r() * W, sp = 10 + r() * 25, ph = r() * H, s = .7 + r() * 1.8, y = (t * sp + ph) % (H * 1.1), x = x0 + Math.sin(t * (.3 + r() * .4) + i) * 25, al = (.25 + .45 * Math.abs(Math.sin(t * (1 + r()) + i))) * .55;
          ctx.fillStyle = `rgba(200,235,255,${al})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill(); }
        ctx.restore(); } },
    // P 分屏 —— 左半边冷蓝（关系冷了、不敢走），右半边霓虹粉（屏幕的光、停不下来），中间一道暗缝；适合"两种人 / 两种选择"对照（机会成本起）
    split: { p: '#eef2ff', a: '#ff4fa3', b: '#6fb6ff', glow: '#b48cff', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#04040a'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [x, c, sp] of [[.24, '60,130,255', .11], [.76, '255,60,160', .15]]) { const cx = W * x + Math.sin(t * sp * 2) * 60, cy = H * .5 + Math.cos(t * sp * 1.7) * 50, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760); g.addColorStop(0, `rgba(${c},.16)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.restore(); const s = ctx.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0); s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(.5, 'rgba(0,0,0,.55)'); s.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = s; ctx.fillRect(W / 2 - 160, 0, 320, H);
        const r = R(23); for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H, z = r(); ctx.fillStyle = x < W / 2 ? `rgba(170,205,255,${(.08 + .25 * z) * (.6 + .4 * Math.sin(t * 1.3 + i))})` : `rgba(255,170,215,${(.08 + .25 * z) * (.6 + .4 * Math.sin(t * 1.7 + i))})`; ctx.fillRect(x, y, 1 + z, 1 + z); } } },
    ember: { p: '#ffeedd', a: '#ff6a1a', b: '#ffc27a', glow: '#ff7a2a', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { ctx.fillStyle = '#070302'; ctx.fillRect(0, 0, W, H); const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(120,30,0,0)'); g.addColorStop(1, `rgba(150,45,5,${.32 + .05 * Math.sin(t * 1.3)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = R(17);
        for (let i = 0; i < 150; i++) { const x0 = r() * W, sp = 30 + r() * 90, ph = r() * H, s = .8 + r() * 2.4, y = H - ((t * sp + ph) % (H * 1.1)), x = x0 + Math.sin(t * (.5 + r()) + i) * 40, fl = .4 + .6 * Math.abs(Math.sin(t * (3 + r() * 5) + i)), al = fl * Math.min(1, y / H * 1.6) * .8;
          ctx.fillStyle = `rgba(255,${120 + (i % 5) * 20},40,${al})`; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill(); }
        ctx.restore(); } },
    // N 白烟 —— 纯黑底上缓慢翻卷的白色烟雾，冷静、留白多；白字，一点鲜红强调；适合记忆 / 遗忘 / 迷茫 / 虚无
    smoke: { p: '#f5f5f5', a: '#ff3b3b', b: '#9aa3ad', glow: '#ffffff', font: '"Noto Serif SC"', num: '"Playfair Display"', weight: 900,
      bg(t) { ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = R(8);
        for (let i = 0; i < 34; i++) { const bx = r() * W, by = H * (.35 + r() * .75), rad = 160 + r() * 360, sp = .02 + r() * .05, u = (t * sp + r()) % 1, x = bx + Math.sin(t * .15 + i) * 120, y = by - u * H * .6, al = .045 * Math.sin(u * Math.PI);
          const gg = ctx.createRadialGradient(x, y, 0, x, y, rad * (1 + u * .6)); gg.addColorStop(0, `rgba(230,232,238,${al})`); gg.addColorStop(1, 'rgba(230,232,238,0)'); ctx.fillStyle = gg; ctx.fillRect(x - rad * 1.6, y - rad * 1.6, rad * 3.2, rad * 3.2); }
        ctx.restore(); } },
    // O 赛博 —— 深紫黑底，地平线一道品红辉光，透视网格地面往镜头方向滚动；适合欲望 / 消费 / 网络 / 未来感
    cyber: { p: '#f0e8ff', a: '#ff2bd6', b: '#21e6ff', glow: '#ff2bd6', font: '"Noto Sans SC"', num: '"JetBrains Mono"', weight: 900,
      bg(t) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05010d'); g.addColorStop(.62, '#1a0630'); g.addColorStop(.64, '#07020f'); g.addColorStop(1, '#030008'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const hy = H * .63; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const hg = ctx.createRadialGradient(W / 2, hy, 0, W / 2, hy, W * .6); hg.addColorStop(0, 'rgba(255,43,214,.22)'); hg.addColorStop(1, 'rgba(255,43,214,0)'); ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,43,214,.28)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = -14; i <= 14; i++) { ctx.moveTo(W / 2 + i * 40, hy); ctx.lineTo(W / 2 + i * 260, H); }
        for (let k = 0; k < 14; k++) { const u = ((k + (t * .6) % 1) / 14), y = hy + (H - hy) * u * u; ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        const r = R(3); ctx.fillStyle = '#d8ccff'; for (let i = 0; i < 120; i++) { ctx.globalAlpha = .15 + .3 * r() * (.6 + .4 * Math.sin(t * 2 + i)); ctx.fillRect(r() * W, r() * hy * .9, 1.5, 1.5); } ctx.restore(); } },
  };

  // ---------------- 形状库：都返回 N 个 [x, y, 颜色 0=p 1=a 2=b] ----------------
  function sampleCanvas(draw, n, flag, seed = 31, step = 2) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = g.strokeStyle = '#fff'; draw(g);
    const d = g.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 120) pts.push([x, y]);
    const r = R(seed), out = []; for (let i = 0; i < n; i++) { const p = pts.length ? pts[Math.floor(r() * pts.length)] : [W / 2, H / 2]; out.push([p[0] + (r() - .5) * step, p[1] + (r() - .5) * step, flag]); } return out;
  }
  const S = {
    scatter(seed = 1, spread = 1) { const r = R(seed); return [...Array(N)].map(() => { const a = r() * 6.283, d = (700 + r() * 900) * spread; return [W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d * .7, 0]; }); },
    dust(cx, cy, rx, ry, flag = 0, seed = 2) { const r = R(seed); return [...Array(N)].map(() => { const a = r() * 6.283, d = Math.sqrt(r()); return [cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, flag]; }); },
    point(cx, cy, flag = 0, rad = 6, seed = 3) { return S.dust(cx, cy, rad, rad, flag, seed); },
    ring(cx, cy, rad, th = 10, flag = 0, seed = 4) { const r = R(seed); return [...Array(N)].map(() => { const a = r() * 6.283, d = rad + (r() - .5) * th; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d, flag]; }); },
    text(str, size, cx, cy, flag = 0, font, weight) { return sampleCanvas(g => { g.font = `${weight || TH.weight} ${size}px ${font || TH.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, cx, cy); }, N, flag); },
    path(draw, flag = 0, seed) { return sampleCanvas(draw, N, flag, seed); },
    heart(cx, cy, s, flag = 1) { return sampleCanvas(g => { g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200 * 6.2832, x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s); } g.fill(); }, N, flag); },
    heartOutline(cx, cy, s, flag = 1) { return sampleCanvas(g => { g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = i / 200 * 6.2832, x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? g.lineTo(cx + x * s, cy + y * s) : g.moveTo(cx + x * s, cy + y * s); } g.stroke(); }, N, flag); },
    bubble(x, y, w, h, tailLeft = true, flag = 0) { return sampleCanvas(g => { g.lineWidth = 6; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.stroke(); const tx = tailLeft ? x - w / 2 + 40 : x + w / 2 - 40; g.beginPath(); g.moveTo(tx - 14, y + h / 2 - 2); g.lineTo(tx + (tailLeft ? -26 : 26), y + h / 2 + 30); g.lineTo(tx + 14, y + h / 2 - 2); g.stroke(); }, N, flag); },
    clock(cx, cy, rad, flag = 0) { return sampleCanvas(g => { g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, rad, 0, 6.3); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, l = i % 3 ? 14 : 30; g.lineWidth = i % 3 ? 4 : 7; g.beginPath(); g.moveTo(cx + Math.cos(a) * (rad - 18), cy + Math.sin(a) * (rad - 18)); g.lineTo(cx + Math.cos(a) * (rad - 18 - l), cy + Math.sin(a) * (rad - 18 - l)); g.stroke(); } }, N, flag); },
    moon(cx, cy, rad, flag = 0) { return sampleCanvas(g => { g.beginPath(); g.arc(cx, cy, rad, 0, 6.3); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx + rad * .42, cy - rad * .22, rad * .86, 0, 6.3); g.fill(); }, N, flag); },
    dome(cx, cy, w, h, flag = 0) { return sampleCanvas(g => { g.beginPath(); g.ellipse(cx, cy, w / 2, h, 0, Math.PI, 0); g.lineTo(cx + w / 2 + 30, cy + 26); g.quadraticCurveTo(cx, cy + 50, cx - w / 2 - 30, cy + 26); g.closePath(); g.fill(); }, N, flag); },
    wave(x1, y1, x2, y2, amp = 26, cycles = 3, flag = 0, th = 4) { const r = R(8); return [...Array(N)].map(() => { const u = r(), x = lerp(x1, x2, u), y = lerp(y1, y2, u) + Math.sin(u * cycles * 6.283) * amp * Math.sin(u * Math.PI) + (r() - .5) * th; return [x, y, flag]; }); },
    dotsRow(n, cx, cy, gap, flag = 1, rad = 9, seed = 6) { const r = R(seed); return [...Array(N)].map((_, i) => { const j = i % n, a = r() * 6.283, d = rad * Math.sqrt(r()); return [cx + (j - (n - 1) / 2) * gap + Math.cos(a) * d, cy + Math.sin(a) * d, flag]; }); },
    // 按比例合并几个形状：[[shape, 权重], ...]
    mix(parts) { const tot = parts.reduce((s, p) => s + p[1], 0), out = []; let k = 0; for (const [sh, w] of parts) { const n = Math.round(N * w / tot); for (let i = 0; i < n && out.length < N; i++) out.push(sh[(k + i * 7) % N]); k += 13; } while (out.length < N) out.push(parts[0][0][out.length]); return out; },
  };

  // ---------------- 粒子关键帧 ----------------
  // key(t, 形状, {d: 过渡时长, type: 'swirl'|'burst'|'implode', cx, cy, alpha, shake, size})
  function key(t, shape, o = {}) { const name = 'k' + KEYS.length; SHAPES[name] = shape; KEYS.push({ t, s: name, d: o.d || 0, type: o.type || 'swirl', cx: o.cx ?? W / 2, cy: o.cy ?? 470, alpha: o.alpha ?? 1, shake: o.shake || 0, spread: o.spread || 1, flicker: o.flicker || 0 }); }
  function cam(t, z = 1, x = 0, y = 0, r = 0) { CAMS.push({ t, z, x, y, r }); }
  const flash = (t, s = .38) => FLASH.push({ t, s });
  const wave = (t, x, y, color, r0 = 60) => WAVES.push({ t, x, y, color, r0 });

  function seg(t) { let k = 0; while (k < KEYS.length - 1 && KEYS[k + 1].t <= t) k++; return k; }
  function particle(i, t) {
    const k = seg(t), A = KEYS[k], B = KEYS[k + 1], p = PR[i]; const a = SHAPES[A.s][i];
    let x = a[0], y = a[1], col = a[2], al = A.alpha, sh = A.shake, fl = A.flicker;
    if (B && B.d && t > B.t - B.d) {
      const t0 = B.t - B.d, local = clamp((t - t0) / B.d), u = ease(clamp((local - p.d * .35) / .65)), b = SHAPES[B.s][i], m = 1 - u;
      let cx = (a[0] + b[0]) / 2 + p.sw * 240, cy = (a[1] + b[1]) / 2 - 140 * p.bx;
      if (B.type === 'burst') { const ang = Math.atan2(a[1] - B.cy, a[0] - B.cx) + p.sw * .8, dd = (380 + p.d * 760) * B.spread; cx = B.cx + Math.cos(ang) * dd; cy = B.cy + Math.sin(ang) * dd * .8; }
      if (B.type === 'implode') { cx = B.cx + p.sw * 30; cy = B.cy + p.bx * 30; }
      if (B.type === 'drift') { cx = (a[0] + b[0]) / 2 + p.sw * 60; cy = (a[1] + b[1]) / 2 + p.bx * 60; }
      x = m * m * a[0] + 2 * m * u * cx + u * u * b[0]; y = m * m * a[1] + 2 * m * u * cy + u * u * b[1];
      col = u > .5 ? b[2] : a[2]; al = lerp(A.alpha, B.alpha, local); sh = lerp(A.shake, B.shake, local); fl = lerp(A.flicker, B.flicker, local);
    }
    x += Math.sin(t * 1.3 + p.ph) * 1.6 + (sh ? Math.sin(t * 37 + p.ph * 9) * sh * p.d : 0);
    y += Math.cos(t * 1.1 + p.ph) * 1.6 + (sh ? Math.cos(t * 41 + p.ph * 7) * sh * p.d : 0);
    if (fl) al *= 1 - fl * ((Math.sin(t * 23.1) * Math.sin(t * 7.7 + 1) > .2) ? .75 : 0);
    return [x, y, col, al];
  }
  function camAt(t) { let k = 0; while (k < CAMS.length - 1 && CAMS[k + 1].t <= t) k++; const a = CAMS[k], b = CAMS[k + 1] || a, u = ease(b === a ? 0 : (t - a.t) / (b.t - a.t)); return { z: lerp(a.z, b.z, u), x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), r: lerp(a.r, b.r, u) }; }
  function applyCam(c, g) { g.translate(W / 2, H / 2); g.rotate(c.r); g.scale(c.z, c.z); g.translate(-W / 2 - c.x, -H / 2 - c.y); }

  // ---------------- 叠加层工具 ----------------
  function neon(s, x, y, o, t0, t) {
    const k = prog(t, t0, .55); if (k <= 0) return; const a = o.alpha ?? 1;
    ctx.save(); ctx.font = `${o.weight || TH.weight} ${o.size}px ${o.font || TH.font}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
    const split = (1 - eOut(k)) * 24, blur = (1 - eOut(k)) * 9; ctx.globalAlpha *= a * eOut(k);
    if (split > .5) { ctx.save(); ctx.globalCompositeOperation = TH.light ? 'multiply' : 'lighter'; ctx.filter = `blur(${blur}px)`; ctx.fillStyle = 'rgba(255,60,140,.7)'; ctx.fillText(s, x - split, y); ctx.fillStyle = 'rgba(40,220,255,.7)'; ctx.fillText(s, x + split, y); ctx.restore(); }
    const col = o.color || TH.p; ctx.save(); ctx.shadowColor = o.glow || col; ctx.shadowBlur = TH.light ? 0 : 12; ctx.globalAlpha *= .85; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
    ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
  }
  function orb(x, y, r, color, a = 1, t = 0) {
    if (a <= .01) return; const pulse = 1 + .08 * Math.sin(t * 2.4 + x * .01);
    ctx.save(); ctx.globalCompositeOperation = TH.light ? 'source-over' : 'lighter'; ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6 * pulse); g.addColorStop(0, color + 'aa'); g.addColorStop(.15, color + '44'); g.addColorStop(1, color + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 6 * pulse, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, 6.3); ctx.fill(); ctx.restore();
  }
  // 两点之间的波浪光线（参考视频里的"纠缠线"）；k 控制画到哪
  function link(x1, y1, x2, y2, c1, c2, t, o = {}) {
    const a = o.alpha ?? 1; if (a <= .01) return; const amp = o.amp ?? 22, k = o.k ?? 1, cyc = o.cycles ?? 3;
    ctx.save(); ctx.globalAlpha *= a; ctx.globalCompositeOperation = TH.light ? 'source-over' : 'lighter'; const g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, c1); g.addColorStop(1, c2);
    for (const [ph, w, al] of [[0, 2.2, .9], [Math.PI, 1.2, .5]]) {
      ctx.strokeStyle = g; ctx.lineWidth = w; ctx.globalAlpha = a * al; ctx.shadowColor = c1; ctx.shadowBlur = 10; ctx.beginPath();
      for (let i = 0; i <= 160 * k; i++) { const u = i / 160, x = lerp(x1, x2, u), y = lerp(y1, y2, u) + Math.sin(u * cyc * 6.283 + t * 2 + ph) * amp * Math.sin(u * Math.PI); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function bubbleBox(x, y, w, h, color, a, tailLeft = true) {
    if (a <= .01) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = 'rgba(255,255,255,.04)';
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // 字幕：58px 粗体；以 [术语] 开头的句子在前面画一个强调色小标签（参考视频"自我关注"那种）；noSub 的句子不出字幕（开场大字标题已经写在画面上）
  const SUB = { size: 58, y: 984, tag: 34 };
  function subtitles(t) {
    for (const l of TL.lines) {
      if (l.noSub) continue; const al = vis(t, l.start - .12, l.end + .25, .18, .25); if (al <= 0) continue;
      let text = l.text, tagS = ''; const m = text.match(/^\[(.+?)\]/); if (m) { tagS = m[1]; text = text.slice(m[0].length); }
      const INK = TH.ink || '#f2f2f2'; const parts = []; let cur = '', col = INK;
      for (const ch of text) { if ('{<'.includes(ch)) { cur && parts.push([cur, col]); cur = ''; col = ch === '{' ? TH.a : TH.b; } else if ('}>'.includes(ch)) { cur && parts.push([cur, col]); cur = ''; col = INK; } else cur += ch; }
      cur && parts.push([cur, col]);
      ctx.save(); ctx.font = `700 ${SUB.size}px "Noto Sans SC"`; ctx.letterSpacing = '2px'; ctx.textBaseline = 'middle'; ctx.globalAlpha = al;
      const w = parts.reduce((s, p) => s + ctx.measureText(p[0]).width, 0); let tw = 0;
      if (tagS) { ctx.save(); ctx.font = `700 ${SUB.tag}px "Noto Sans SC"`; ctx.letterSpacing = '1px'; tw = ctx.measureText(tagS).width + 36 + 22; ctx.restore(); }
      let x = W / 2 - (w + tw) / 2; const y = SUB.y + (1 - eOut(prog(t, l.start - .12, .3))) * 8;
      if (tagS) { ctx.save(); const bw = tw - 22, bh = SUB.tag + 22; ctx.fillStyle = TH.a + '26'; ctx.strokeStyle = TH.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y - bh / 2, bw, bh, 8); ctx.fill(); ctx.stroke();
        ctx.font = `700 ${SUB.tag}px "Noto Sans SC"`; ctx.letterSpacing = '1px'; ctx.fillStyle = TH.a; ctx.fillText(tagS, x + 18, y + 1); ctx.restore(); x += tw; }
      for (const [s, c] of parts) { const acc = c !== INK; ctx.fillStyle = c; ctx.shadowColor = acc ? c : 'rgba(0,0,0,.9)'; ctx.shadowBlur = TH.light ? 0 : 8; ctx.fillText(s, x, y); if (acc) { ctx.shadowBlur = 0; ctx.fillText(s, x, y); } x += ctx.measureText(s).width; }
      ctx.restore();
    }
  }
  function chrome(t, tag) {
    if (tag) { const [en, zh] = tag; ctx.save(); ctx.fillStyle = TH.p; ctx.globalAlpha = .85; ctx.fillRect(84, 62, 4, 66); ctx.font = '700 20px "JetBrains Mono"'; ctx.letterSpacing = '5px'; ctx.textBaseline = 'middle'; ctx.fillText(en, 102, 76); ctx.font = '700 36px "Noto Sans SC"'; ctx.letterSpacing = '3px'; ctx.fillText(zh, 102, 110); ctx.restore(); }
    ctx.save(); ctx.font = 'italic 700 46px "Playfair Display"'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = TH.ink || '#f2f2f2'; ctx.globalAlpha = .65; ctx.shadowColor = TH.glow; ctx.shadowBlur = TH.light ? 0 : 8; ctx.fillText(TL.watermark ?? 'Pain', W - 80, 90); ctx.restore();
  }

  function autoTag(t) { let cur = null; for (const ch of TL.chapters || []) if (t >= ch.a + (ch.card ? ch.card.b - ch.card.a : .3)) cur = [ch.num ? `CHAPTER ${String(ch.num).padStart(2, '0')}` : 'PROLOGUE', ch.title]; return cur; }
  // ---------------- 章节卡（timeline.json 的 chapters 里 card 不为空的段落） ----------------
  function chapterCards(t) {
    for (const ch of TL.chapters || []) {
      if (!ch.card) continue; const { a, b } = ch.card, al = vis(t, a, b, .35, .5); if (al <= 0) continue;
      ctx.save(); ctx.fillStyle = TH.light ? `rgba(244,238,233,${.94 * al})` : `rgba(0,0,0,${.72 * al})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      const cy = 470, out = prog(t, b - .5, .5);   // 退场：整体上移 + 模糊
      ctx.save(); ctx.globalAlpha = al; ctx.translate(0, -out * 30); if (out > 0) ctx.filter = `blur(${out * 8}px)`;
      neon(`CHAPTER ${String(ch.num).padStart(2, '0')}`, W / 2, cy - 110, { size: 26, color: TH.b, font: '"JetBrains Mono"', weight: 700, spacing: 12 }, a + .05, t);
      neon(ch.title, W / 2, cy - 20, { size: 132, color: TH.p, spacing: 10 }, a + .15, t);
      const ci = E.cardIntro ?? .55, lw = 360 * eOut(prog(t, a + ci - .2, .6));   // E.cardIntro：小问题浮现时刻（默认 .55；卡片缩短时调小） ctx.save(); ctx.strokeStyle = TH.a; ctx.lineWidth = 2; ctx.shadowColor = TH.a; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(W / 2 - lw, cy + 62); ctx.lineTo(W / 2 + lw, cy + 62); ctx.stroke(); ctx.restore();
      if (ch.intro) neon(ch.intro, W / 2, cy + 130, { size: 56, color: TH.light ? TH.muted : '#d9d6ea', weight: 700, spacing: 3 }, a + ci, t);
      if (ch.en) neon(ch.en, W / 2, cy + 205, { size: 24, color: TH.b, font: '"JetBrains Mono"', weight: 500, spacing: 8, alpha: .8 }, a + ci + .2, t);
      ctx.restore();
    }
  }
  // ---------------- 全局后期（2026-10-28，学自 ajydxw 源码）：震动表 / 径向冲刺 / 泛光 / 暗角 / 动态颗粒 ----------------
  // film.top(t)：画在后期之后的东西（字幕、HUD），不受震动 / 冲刺 / 颗粒影响
  // film.js 里：E.shake(时刻, 强度px, 时长=.45) 噪声衰减抖动；E.zoom(时刻, 强度≈.08, x, y, 时长=.5) 径向冲刺模糊（揭晓、砸字）
  //            E.post = { bloom: .3, vignette: .4, grain: .06 } 覆盖默认值（0 = 关）
  const SHAKES = [], ZOOMS = [];
  function shake(t0, amp, d = .45) { SHAKES.push([t0, amp, d]); }
  function zoom(t0, amt = .08, x = W / 2, y = H / 2, d = .5) { ZOOMS.push([t0, amt, x, y, d]); }
  const hs = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const nz = (u, sd) => { const i = Math.floor(u), f = u - i, w = f * f * (3 - 2 * f); return lerp(hs(i + sd * 71.3), hs(i + 1 + sd * 71.3), w) * 2 - 1; };
  let PB = null, PS = null, PS2 = null, GR = null;
  const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function postFx(t) {
    const P = { bloom: .16, vignette: .4, grain: .06, ...(E.post || {}) };
    if (!PB) { PB = mkc(W, H); PS = mkc(480, 270); PS2 = mkc(480, 270); GR = mkc(512, 512); const g = GR.getContext('2d'), d = g.createImageData(512, 512), r = R(9); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
    const pb = PB.getContext('2d');
    // 震动
    let sx = 0, sy = 0, sr = 0; for (const [t0, a, d] of SHAKES) { const u = t - t0; if (u < 0 || u > d) continue; const k = a * Math.pow(1 - u / d, 2); sx += nz(u * 38, t0) * k; sy += nz(u * 41, t0 + 3) * k; sr += nz(u * 30, t0 + 5) * k * .0012; }
    if (sx || sy) { pb.clearRect(0, 0, W, H); pb.drawImage(ctx.canvas, 0, 0); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(sr); ctx.scale(1.02, 1.02); ctx.drawImage(PB, -W / 2, -H / 2); ctx.restore(); }
    // 径向冲刺
    for (const [t0, amt, x, y, d] of ZOOMS) { const u = (t - t0) / d; if (u < 0 || u > 1) continue; const a = amt * Math.pow(1 - u, 2); pb.clearRect(0, 0, W, H); pb.drawImage(ctx.canvas, 0, 0);
      ctx.save(); for (let i = 1; i <= 8; i++) { const s = 1 + a * i / 8; ctx.globalAlpha = .8 / (i + 1); ctx.setTransform(s, 0, 0, s, x * (1 - s), y * (1 - s)); ctx.drawImage(PB, 0, 0); } ctx.restore(); }
    // 泛光：缩小 → 只留亮部 → 模糊 → screen 叠回
    if (P.bloom > 0 && !TH.light) { const a = PS.getContext('2d'), b = PS2.getContext('2d'); a.save(); a.filter = 'brightness(0.55) contrast(3.2)';   // 只留真正亮的部分，别把整片底色提灰 a.clearRect(0, 0, 480, 270); a.drawImage(ctx.canvas, 0, 0, 480, 270); a.restore();
      b.save(); b.clearRect(0, 0, 480, 270); b.filter = 'blur(10px)'; b.drawImage(PS, 0, 0); b.restore(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = P.bloom; ctx.drawImage(PS2, 0, 0, W, H); ctx.restore(); }
    if (P.vignette > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${P.vignette})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (P.grain > 0 && !E.cover) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = P.grain; const f = Math.floor(t * 30), ox = Math.floor(hs(f) * 512), oy = Math.floor(hs(f + 7) * 512); for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(GR, x, y); ctx.restore(); }
  }
  // ---------------- 主循环 ----------------
  function setup(canvas, tl, theme) {
    ctx = canvas.getContext('2d'); TL = tl; TH = THEMES[theme]; for (const l of tl.lines) L[l.id] = l;
    layer = document.createElement('canvas'); layer.width = W; layer.height = H; lctx = layer.getContext('2d');
    const r = R(7); PR = [...Array(N)].map(() => ({ d: r(), s: .9 + r() * 2.0, ph: r() * 6.28, sw: r() - .5, bx: r() - .5 }));
  }
  function finalize() { KEYS.sort((a, b) => a.t - b.t); CAMS.sort((a, b) => a.t - b.t); if (!CAMS.length) cam(0); }
  function frame(t, film) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
    film.pre && film.pre(t); TH.bg(t); film.under && film.under(t);
    const c = camAt(t);
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, W, H); applyCam(c, lctx); lctx.globalCompositeOperation = TH.light ? 'source-over' : 'lighter';
    const cols = [TH.p, TH.a, TH.b];
    for (let i = 0; i < N; i++) { const [x, y, col, al] = particle(i, t), p = PR[i]; const tw = .55 + .45 * Math.sin(t * 3 + p.ph * 3); lctx.globalAlpha = clamp(tw * al); lctx.fillStyle = cols[col]; const s = p.s * (col ? 1.3 : 1); lctx.fillRect(x - s / 2, y - s / 2, s, s); }
    ctx.save(); if (TH.light) { ctx.filter = 'blur(2px)'; ctx.globalAlpha = .5; ctx.drawImage(layer, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.drawImage(layer, 0, 0); } else { ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(10px)'; ctx.globalAlpha = .9; ctx.drawImage(layer, 0, 0); ctx.filter = 'blur(3px)'; ctx.globalAlpha = .8; ctx.drawImage(layer, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.drawImage(layer, 0, 0); } ctx.restore();
    for (const w of WAVES) { const k = (t - w.t) / 1.1; if (k > 0 && k < 1) { ctx.save(); applyCam(c, ctx); ctx.strokeStyle = w.color; ctx.globalAlpha = (1 - k) * .8; ctx.lineWidth = 3 * (1 - k) + .5; ctx.shadowColor = w.color; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(w.x, w.y, w.r0 + eOut(k) * 900, 0, 6.3); ctx.stroke(); ctx.restore(); } }
    ctx.save(); applyCam(c, ctx); film.overlay(t); ctx.restore();
    if (!E.clean) film.screen && film.screen(t);
    chapterCards(t);
    for (const f of FLASH) { const k = t - f.t; if (k > 0 && k < .5) { ctx.fillStyle = `rgba(255,255,255,${f.s * Math.pow(1 - k / .5, 2)})`; ctx.fillRect(0, 0, W, H); } }
    if (E.post !== false) postFx(t);
    film.top && film.top(t);   // 顶层：字幕 / 读数 / 进度条画在后期之后，不跟着震、不被模糊
    if (E.clean) return;
    chrome(t, film.tag ? film.tag(t) : autoTag(t)); subtitles(t);
    if (E.preview) { ctx.save(); ctx.font = '700 22px "Noto Sans SC"'; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillText('预览小样 · PREVIEW', 70, H - 40); ctx.restore(); }
    const fd = Math.min(TL.noFadeIn ? 1 : ease(t / .8), ease((TL.total - t) / .8)); if (fd < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fd})`; ctx.fillRect(0, 0, W, H); }
  }
  return { setup, finalize, frame, key, cam, flash, wave, shake, zoom, S, neon, orb, link, bubbleBox, THEMES, get TH() { return TH; }, get ctx() { return ctx; }, set ctx(v) { ctx = v; },
    T: id => L[id].start, End: id => L[id].end, D: id => L[id].end - L[id].start, clamp, lerp, ease, eOut, eIn, prog, vis, R, auroraBoost: .15 };
})();
