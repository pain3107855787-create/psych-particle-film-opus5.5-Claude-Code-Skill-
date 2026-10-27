// ============================================================================
// 插画场景库（参考视频 030609 / SJ1 / SJ2：扁平插画 + 强光影 + 场景会"变状态" + 镜头一直在推）
// 全部用 canvas 矢量绘制：剪影人物、房间、窗外城市、台灯光锥、手机光、暗角、胶片颗粒
// 用法（film.js 的 under(t)）：I.bedroom(t, {zoom, fx, fy, ...}) / I.building(t, {...}) …… 每个场景自己带镜头（zoom 以 fx,fy 为中心）
// 返回值：场景里关键物体在屏幕上的位置（比如手机屏幕矩形），方便 overlay 往上叠内容
// ============================================================================
const I = (() => {
  const W = 1920, H = 1080, ctx = () => E.ctx, BLD_SK = -.07;
  /** 楼的第 idx 扇窗（9 列 × 7 行）中心的世界坐标（已算透视），给镜头对准用 */
  const winPos = idx => { const i = idx % 9, j = Math.floor(idx / 9), x = 420 + 40 + i * 120 + 43; return [x, 140 + 50 + j * 120 + 55 + BLD_SK * (x - 420)]; };
  const R = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  // 镜头：以 (fx,fy) 为中心缩放 zoom；返回 世界坐标→屏幕坐标 的函数
  function camera(g, o) { const z = o.zoom || 1, fx = o.fx ?? W / 2, fy = o.fy ?? H / 2, rot = o.rot || 0; g.translate(W / 2, H / 2); g.rotate(rot); g.scale(z, z); g.translate(-fx, -fy);
    return (x, y) => { const dx = (x - fx) * z, dy = (y - fy) * z; return [W / 2 + dx * Math.cos(rot) - dy * Math.sin(rot), H / 2 + dx * Math.sin(rot) + dy * Math.cos(rot)]; }; }
  const glow = (g, x, y, r, rgb, a) => { if (a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.35, `rgba(${rgb},${a * .35})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  function vignette(g, a = .75) { const gr = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  function grain(g, t, a = .05) { const r = R(Math.floor(t * 24) + 7); g.fillStyle = `rgba(255,255,255,${a})`; for (let i = 0; i < 1400; i++) g.fillRect(r() * W, r() * H, 1.3, 1.3); }
  // 色温：warm 1 暖黄 → 0 冷蓝（整体蒙一层）
  function grade(g, warm, a = .18) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = warm > .5 ? `rgba(255,170,90,${a * (warm - .5) * 2})` : `rgba(80,130,255,${a * (.5 - warm) * 2})`; g.fillRect(0, 0, W, H); g.restore(); }

  // ---------------- 道具 ----------------
  function skyline(g, x0, x1, base, seed, t, o = {}) {
    const r = R(seed); let x = x0;
    while (x < x1) { const w = 40 + r() * 90, h = 80 + r() * (o.tall || 260); g.fillStyle = o.color || '#0a1020'; g.fillRect(x, base - h, w, h);
      for (let wy = base - h + 10; wy < base - 8; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 13) { const k = r(); if (k > .72) { const tw = .6 + .4 * Math.sin(t * (.5 + k * 3) + wx); g.fillStyle = k > .93 ? `rgba(160,200,255,${.5 * tw})` : `rgba(255,205,120,${.55 * tw})`; g.fillRect(wx, wy, 5, 7); } }
      x += w + 4 + r() * 10; }
  }
  /** 剪影人物（侧背坐姿，双手把手机举在脸前）。(x,y)=臀部位置，s=缩放，light={x,y,rgb,a,r} 打在身上的光（手机光会勾出脸和手的轮廓） */
  function sitter(g, x, y, s, light, o = {}) {
    const c = document.createElement('canvas'); c.width = 560 * s; c.height = 560 * s; const h = c.getContext('2d'); h.scale(s, s); h.translate(220, 460);
    h.fillStyle = o.color || '#04060b';
    // 头 + 短发轮廓
    h.beginPath(); h.ellipse(8, -292, 30, 35, .15, 0, 6.3); h.fill();
    h.beginPath(); h.moveTo(-26, -300); h.quadraticCurveTo(-30, -342, 10, -334); h.quadraticCurveTo(44, -330, 40, -300); h.quadraticCurveTo(20, -318, -26, -300); h.fill();
    h.beginPath(); h.moveTo(-6, -262); h.lineTo(18, -262); h.lineTo(20, -240); h.lineTo(-8, -240); h.fill();   // 脖子
    // 上身（宽松卫衣，微微驼背）
    h.beginPath(); h.moveTo(-70, -236); h.quadraticCurveTo(-10, -258, 54, -236); h.quadraticCurveTo(84, -200, 80, -120); h.quadraticCurveTo(86, -60, 70, 0); h.lineTo(-74, 0); h.quadraticCurveTo(-96, -90, -84, -170); h.quadraticCurveTo(-82, -220, -70, -236); h.fill();
    // 盘起的腿 + 膝盖
    h.beginPath(); h.moveTo(-80, -10); h.quadraticCurveTo(10, -46, 120, -36); h.quadraticCurveTo(210, -30, 236, -4); h.quadraticCurveTo(240, 22, 200, 26); h.quadraticCurveTo(60, 34, -86, 24); h.closePath(); h.fill();
    // 前臂 + 手（把手机举到脸前）
    h.beginPath(); h.moveTo(50, -200); h.quadraticCurveTo(80, -150, 112, -156); h.quadraticCurveTo(122, -190, 106, -232); h.lineTo(92, -228); h.quadraticCurveTo(100, -196, 96, -172); h.quadraticCurveTo(70, -176, 62, -214); h.fill();
    h.beginPath(); h.ellipse(104, -238, 14, 18, .3, 0, 6.3); h.fill();
    // 兜帽（搭在后颈）
    h.beginPath(); h.moveTo(-40, -244); h.quadraticCurveTo(-70, -262, -62, -214); h.quadraticCurveTo(-30, -226, -10, -246); h.closePath(); h.fill();
    // 褶皱 / 结构线：比剪影略亮一点的细线（暗处也能看出衣服）
    h.strokeStyle = 'rgba(70,90,130,.22)'; h.lineWidth = 2.2; h.lineCap = 'round';
    for (const [a, b, c, d, e, f] of [[-60, -200, -40, -150, -50, -90], [20, -210, 34, -170, 30, -120], [-30, -120, 0, -100, 30, -110], [60, -190, 76, -176, 92, -170], [70, -164, 84, -160, 100, -162]]) { h.beginPath(); h.moveTo(a, b); h.quadraticCurveTo(c, d, e, f); h.stroke(); }
    h.beginPath(); h.moveTo(-6, -236); h.lineTo(-10, -196); h.moveTo(14, -236); h.lineTo(18, -200); h.stroke();     // 抽绳
    h.beginPath(); h.moveTo(-40, 6); h.quadraticCurveTo(40, -14, 120, -20); h.moveTo(60, 18); h.quadraticCurveTo(140, 10, 210, 4); h.stroke();   // 腿部褶线
    h.lineWidth = 1.5; for (let k = 0; k < 5; k++) { h.beginPath(); h.moveTo(-18 + k * 12, -330); h.quadraticCurveTo(-10 + k * 13, -320, -6 + k * 12, -306); h.stroke(); }   // 发丝
    if (light) { h.globalCompositeOperation = 'source-atop'; const lx = (light.x - x) / s + 220, ly = (light.y - y) / s + 460, gr = h.createRadialGradient(lx, ly, 0, lx, ly, light.r || 200);
      gr.addColorStop(0, `rgba(${light.rgb},${light.a})`); gr.addColorStop(.25, `rgba(${light.rgb},${light.a * .45})`); gr.addColorStop(1, `rgba(${light.rgb},0)`); h.fillStyle = gr; h.fillRect(-400, -700, 1200, 1300);
      // 轮廓光：沿着朝向光源的边缘再提一道亮边
      h.globalCompositeOperation = 'source-atop'; h.strokeStyle = `rgba(${light.rgb},${.55 * light.a})`; h.lineWidth = 3; h.beginPath(); h.ellipse(8, -292, 30, 35, .15, -1.1, 1.0); h.stroke(); h.beginPath(); h.moveTo(54, -236); h.quadraticCurveTo(84, -200, 80, -120); h.stroke(); }
    g.drawImage(c, x - 220 * s, y - 460 * s);
    return { phone: [x + 112 * s, y - 252 * s], face: [x + 8 * s, y - 292 * s] };
  }
  /** 站立剪影（参考视频人群）：(x,y) 脚底，h 身高，o: {rim 轮廓光 rgb, a, phone 手机光 0~1, v 变体 0 短发 / 1 长发 / 2 背包 / 3 戴帽} */
  function stander(g, x, y, h, o = {}) {
    const s = h / 400, v = o.v ?? 0; g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = o.color || '#06080e';
    g.beginPath(); g.ellipse(0, -360, 27, 31, 0, 0, 6.3); g.fill();
    if (v === 1) { g.beginPath(); g.moveTo(-30, -372); g.quadraticCurveTo(-40, -300, -26, -262); g.lineTo(26, -262); g.quadraticCurveTo(40, -300, 30, -372); g.quadraticCurveTo(0, -400, -30, -372); g.fill(); }
    if (v === 3) { g.fillRect(-36, -392, 72, 12); g.beginPath(); g.ellipse(0, -394, 26, 18, 0, Math.PI, 0); g.fill(); }
    g.beginPath(); g.moveTo(-12, -330); g.lineTo(12, -330); g.lineTo(14, -312); g.lineTo(-14, -312); g.fill();
    // 躯干（外套下摆略宽）
    g.beginPath(); g.moveTo(-56, -312); g.quadraticCurveTo(0, -326, 56, -312); g.lineTo(62, -200); g.lineTo(52, -150); g.lineTo(-52, -150); g.lineTo(-62, -200); g.closePath(); g.fill();
    // 腿
    g.beginPath(); g.moveTo(-48, -152); g.lineTo(-40, 0); g.lineTo(-10, 0); g.lineTo(-2, -120); g.lineTo(2, -120); g.lineTo(10, 0); g.lineTo(40, 0); g.lineTo(48, -152); g.fill();
    // 手臂：持手机时一只手弯到胸前
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = g.fillStyle; g.lineWidth = 22;
    g.beginPath(); g.moveTo(-58, -300); g.quadraticCurveTo(-74, -230, -66, -160); g.stroke();
    if (o.phone) { g.beginPath(); g.moveTo(58, -300); g.quadraticCurveTo(72, -250, 40, -236); g.lineTo(10, -244); g.stroke(); }
    else { g.beginPath(); g.moveTo(58, -300); g.quadraticCurveTo(74, -230, 66, -160); g.stroke(); }
    if (v === 2) { g.beginPath(); g.roundRect(-82, -300, 34, 110, 12); g.fill(); }
    if (o.rim) { g.strokeStyle = `rgba(${o.rim},${o.a ?? .6})`; g.lineWidth = 3; g.beginPath(); g.moveTo(-56, -312); g.quadraticCurveTo(0, -326, 56, -312); g.stroke(); g.beginPath(); g.ellipse(0, -360, 27, 31, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
    if (o.phone) { glow(g, 4, -250, 80, '170,205,255', .55 * o.phone); g.fillStyle = `rgba(225,238,255,${o.phone})`; g.fillRect(-4, -266, 18, 30);
      g.save(); g.globalCompositeOperation = 'source-atop'; g.restore(); g.strokeStyle = `rgba(170,205,255,${.5 * o.phone})`; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -360, 27, 31, -.3, -1.0, .6); g.stroke(); }
    g.restore();
  }

  // ---------------- 场景：深夜卧室 ----------------
  /** o: {zoom, fx, fy, glow 手机亮度 0~1, wall 墙上投影文字 [字…] 及 wallK 0~1, warm 色温, phoneScreen(g, x,y,w,h) 回调画屏幕内容} → {screen:[x,y,w,h] 屏幕坐标} */
  function bedroom(t, o = {}) {
    const g = ctx(); g.save(); const P = camera(g, o), gl = o.glow ?? 1;
    // 墙与地板
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1222'); gr.addColorStop(.72, '#0e1628'); gr.addColorStop(.721, '#080c16'); gr.addColorStop(1, '#05070c'); g.fillStyle = gr; g.fillRect(-400, -300, W + 800, H + 600);
    // 窗：夜空、月亮、城市
    const wx = 220, wy = 170, ww = 520, wh = 470; g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#0d1d3c'); gr.addColorStop(1, '#1d2f55'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    glow(g, wx + 380, wy + 110, 160, '200,220,255', .35); g.fillStyle = '#eef3ff'; g.beginPath(); g.arc(wx + 380, wy + 110, 34, 0, 6.3); g.fill();
    skyline(g, wx - 20, wx + ww + 20, wy + wh, 11, t, { tall: 230, color: '#0a1428' }); skyline(g, wx - 40, wx + ww + 40, wy + wh, 23, t, { tall: 140, color: '#070d1c' }); g.restore();
    g.strokeStyle = '#1e2a44'; g.lineWidth = 14; g.strokeRect(wx, wy, ww, wh); g.lineWidth = 8; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .45); g.lineTo(wx + ww, wy + wh * .45); g.stroke();
    // 窗帘
    for (const [cx, dir] of [[wx - 40, 1], [wx + ww + 40, -1]]) { gr = g.createLinearGradient(cx - 70, 0, cx + 70, 0); gr.addColorStop(0, '#141d33'); gr.addColorStop(.5, '#1d2944'); gr.addColorStop(1, '#101829'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 70, wy - 60); g.lineTo(cx + 70, wy - 60); g.quadraticCurveTo(cx + 40 * dir + 30, wy + 300, cx + 70, wy + wh + 120); g.lineTo(cx - 70, wy + wh + 120); g.closePath(); g.fill(); }
    // 月光投在地上
    g.save(); g.globalCompositeOperation = 'lighter'; gr = g.createLinearGradient(wx, wy, wx + 400, H); gr.addColorStop(0, 'rgba(120,160,255,.10)'); gr.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww, wy + wh); g.lineTo(wx + ww + 420, H + 40); g.lineTo(wx + 260, H + 40); g.closePath(); g.fill(); g.restore();
    // 墙上的装饰：海报、书架
    g.fillStyle = '#121a2d'; g.fillRect(1480, 210, 210, 280); g.strokeStyle = '#1f2a43'; g.lineWidth = 4; g.strokeRect(1480, 210, 210, 280); g.fillStyle = '#1a2440'; g.beginPath(); g.arc(1585, 320, 60, 0, 6.3); g.fill();
    g.fillStyle = '#0e1525'; g.fillRect(1730, 380, 190, 14); g.fillRect(1730, 500, 190, 14); const rb = R(5); for (let i = 0; i < 9; i++) { g.fillStyle = ['#1b2540', '#22304e', '#162036'][i % 3]; const bh = 60 + rb() * 40; g.fillRect(1740 + i * 19, 380 - bh, 15, bh); }
    // 床
    g.fillStyle = '#0c1220'; g.fillRect(820, 480, 760, 140);               // 床头板
    g.fillStyle = '#121a2c'; g.beginPath(); g.roundRect(780, 600, 860, 150, 20); g.fill();   // 床垫
    gr = g.createLinearGradient(0, 640, 0, 800); gr.addColorStop(0, '#1a2440'); gr.addColorStop(1, '#0d1322'); g.fillStyle = gr; g.beginPath(); g.moveTo(760, 650); g.quadraticCurveTo(1200, 620, 1660, 660); g.lineTo(1680, 800); g.lineTo(740, 800); g.closePath(); g.fill();   // 被子
    g.fillStyle = '#1d2846'; g.beginPath(); g.roundRect(860, 560, 190, 70, 30); g.fill();   // 枕头
    // 床头柜 + 闹钟
    g.fillStyle = '#0d1424'; g.fillRect(560, 620, 170, 180); g.fillStyle = '#ff6b6b'; g.font = '700 30px "JetBrains Mono"'; g.textAlign = 'center'; g.fillText(o.clock || '01:47', 645, 600); glow(g, 645, 590, 70, '255,90,90', .18);
    // 手机光：照亮墙和天花板
    const SX = 1150, SY = 700, SS = 1.0, px = SX + 112 * SS, py = SY - 262 * SS; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, px, py, 620 * (.6 + .4 * gl), '120,165,255', .16 * gl); glow(g, px, py, 240, '170,205,255', .22 * gl); g.restore();
    // 墙上的投影字（手机里的描述溢出来，铺满墙）
    if (o.wall && (o.wallK || 0) > 0) { g.save(); const rw = R(3); o.wall.forEach((s, i) => { const k = clamp((o.wallK * o.wall.length - i) / 1.2); if (k <= 0) return; const x = 300 + rw() * 1300, y = 250 + rw() * 260, sz = 26 + rw() * 30;
        g.globalAlpha = k * (.35 + rw() * .4); g.font = `700 ${sz}px "Noto Serif SC"`; g.fillStyle = '#bcd3ff'; g.textAlign = 'center'; g.shadowColor = '#7fa8ff'; g.shadowBlur = 14; g.fillText(s, lerp(px, x, k), lerp(py, y, k)); }); g.restore(); }
    // 人：坐在床上捧着手机
    const man = sitter(g, SX, SY, SS, { x: px, y: py, rgb: '160,200,255', a: .95 * gl, r: 210 });
    // 手机本体
    const sw = 40, sh = 70; g.save(); g.translate(px + 4, py - 6); g.rotate(-.12); g.fillStyle = '#0a0f1a'; g.beginPath(); g.roundRect(-sw / 2 - 4, -sh / 2 - 4, sw + 8, sh + 8, 9); g.fill();
    gr = g.createLinearGradient(0, -sh / 2, 0, sh / 2); gr.addColorStop(0, `rgba(215,232,255,${.95 * gl})`); gr.addColorStop(1, `rgba(160,195,255,${.9 * gl})`); g.fillStyle = gr; g.beginPath(); g.roundRect(-sw / 2, -sh / 2, sw, sh, 6); g.fill();
    if (o.phoneScreen) { g.save(); g.beginPath(); g.roundRect(-sw / 2, -sh / 2, sw, sh, 6); g.clip(); o.phoneScreen(g, -sw / 2, -sh / 2, sw, sh); g.restore(); }
    g.restore();
    g.restore();
    grade(g, o.warm ?? .3); vignette(g, .8); grain(g, t);
    const [sx, sy] = P(px, py); return { phone: [sx, sy], zoom: o.zoom || 1 };
  }

  // ---------------- 场景：深夜公寓楼立面（每扇窗里一个人在看手机） ----------------
  /** o: {zoom, fx, fy, lit 有人亮窗比例 0~1, tags [字…] 显示在窗边, tagK 0~1, off 0~1 灯一盏盏灭, rise 0~1 窗光升起成光点, odd 第几扇窗不一样, oddK} → {windows:[[x,y]...屏幕坐标]} */
  function building(t, o = {}) {
    const g = ctx(); g.save(); const P = camera(g, o);
    let gr = g.createLinearGradient(0, -400, 0, H); gr.addColorStop(0, '#050a18'); gr.addColorStop(1, '#13203d'); g.fillStyle = gr; g.fillRect(-1600, -1200, W + 3200, H + 2400);
    glow(g, 1650, 120, 220, '200,220,255', .3); g.fillStyle = '#eef3ff'; g.beginPath(); g.arc(1650, 120, 40, 0, 6.3); g.fill();
    skyline(g, -1600, W + 1600, H + 200, 31, t, { tall: 520, color: '#0a1226' });
    // 主楼（带透视：正立面向右上收、右侧露出侧立面）
    const bx = 420, by = 140, cols = 9, rows = 7, cw = 120, rh = 120, bw = cols * cw + 60, bh = rows * rh + 140, SK = BLD_SK;
    // 侧立面
    g.save(); g.transform(1, .26, 0, 1, 0, -.26 * (bx + bw)); g.transform(1, 0, 0, 1, 0, SK * bw);
    let sg = g.createLinearGradient(bx + bw, 0, bx + bw + 300, 0); sg.addColorStop(0, '#080d19'); sg.addColorStop(1, '#04070e'); g.fillStyle = sg; g.fillRect(bx + bw, by, 300, bh + 400);
    const rs = R(23); for (let j = 0; j < rows; j++) for (let i = 0; i < 3; i++) { const x = bx + bw + 30 + i * 90, y = by + 50 + j * rh; g.fillStyle = '#05080f'; g.fillRect(x, y, 56, 92); if (rs() < .6) { g.fillStyle = rs() < .3 ? 'rgba(255,190,110,.35)' : 'rgba(120,160,240,.25)'; g.fillRect(x + 4, y + 4, 48, 84); } }
    g.restore();
    g.save(); g.transform(1, SK, 0, 1, 0, -SK * bx);
    gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#111a2e'); gr.addColorStop(1, '#0b1222'); g.fillStyle = gr; g.fillRect(bx, by, bw, bh + 400);
    for (let j = 0; j <= rows; j++) { const y = by + 40 + j * rh; g.fillStyle = '#0d1528'; g.fillRect(bx - 10, y - 6, bw + 20, 12); g.fillStyle = 'rgba(120,150,210,.12)'; g.fillRect(bx - 10, y - 6, bw + 20, 2); }
    g.fillStyle = '#0a0f1c'; g.fillRect(bx + bw * .62, by - 120, 120, 120); g.fillRect(bx + bw * .62 + 50, by - 170, 20, 50); g.fillRect(bx + 120, by - 60, 260, 60);
    g.strokeStyle = '#0a0f1c'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx + 200, by - 60); g.lineTo(bx + 200, by - 200); g.stroke(); glow(g, bx + 200, by - 204, 40, '255,60,60', .5 + .5 * Math.sin(t * 3)); g.fillStyle = '#ff5050'; g.beginPath(); g.arc(bx + 200, by - 204, 5, 0, 6.3); g.fill();
    const r = R(17), wins = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = bx + 40 + i * cw, y = by + 50 + j * rh, idx = j * cols + i, rv = r(), has = idx === o.odd || rv < (o.lit ?? 1), off = clamp(((o.off || 0) * 1.2 - r() * .2) * 1) > r() * .9 + .05;
      const warm = r() < .25 || (idx === o.odd && (o.oddK ?? 0) > .3); g.fillStyle = '#060a14'; g.fillRect(x, y, 86, 92);
      if (has && !off) { gr = g.createLinearGradient(0, y, 0, y + 92); gr.addColorStop(0, warm ? '#3a2a1c' : '#1a2a4a'); gr.addColorStop(1, warm ? '#20160f' : '#0e182e'); g.fillStyle = gr; g.fillRect(x, y, 86, 92);
        const isOdd = idx === o.odd, pa = isOdd ? (o.oddK ?? 0) : 1; stander(g, x + 43, y + 92, 64, { phone: .9 * (1 - (o.rise || 0) * .8), color: '#04060b', v: (idx * 7) % 4 });
        g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x + 43, y + 55, 60, isOdd && pa > 0 ? '255,190,110' : '140,180,255', (.28 + .1 * Math.sin(t * 2 + idx)) * (1 - (o.rise || 0))); g.restore();
        wins.push([x + 43, y + 55 + SK * (x + 43 - bx), idx]); }
      g.strokeStyle = '#1b2640'; g.lineWidth = 3; g.strokeRect(x, y, 86, 92);
      g.strokeStyle = '#141d33'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 8; k++) { g.moveTo(x - 6 + k * 12.25, y + 92); g.lineTo(x - 6 + k * 12.25, y + 108); } g.moveTo(x - 8, y + 92); g.lineTo(x + 94, y + 92); g.stroke();
      if ((i * 7 + j * 3) % 5 === 0) { g.fillStyle = '#121a2d'; g.fillRect(x + 90, y + 50, 22, 30); g.fillStyle = '#0b111f'; g.beginPath(); g.arc(x + 101, y + 65, 8, 0, 6.3); g.fill(); }
    }
    g.restore();
    // 窗边的 MBTI 标签
    if (o.tags && (o.tagK || 0) > 0) { const rt = R(9); g.save(); g.font = '700 22px "JetBrains Mono"'; g.textAlign = 'center';
      wins.forEach(([x, y, idx], k) => { const s = o.tags[idx % o.tags.length], a = clamp((o.tagK * wins.length - k * .7) / 4); if (a <= 0 || rt() < .3) return; g.globalAlpha = a * .9; g.fillStyle = 'rgba(8,14,28,.8)'; g.fillRect(x - 32, y - 82, 64, 26); g.fillStyle = '#ffb35c'; g.fillText(s, x, y - 62); }); g.restore(); }
    const gy = by + bh + 380; g.fillStyle = '#05070d'; g.fillRect(-1600, gy, W + 3200, 900); g.fillStyle = 'rgba(255,200,120,.08)'; g.fillRect(-1600, gy, W + 3200, 4);
    for (let k = -6; k < 12; k++) { const lx = k * 260 + 80; g.fillStyle = '#0a0d16'; g.fillRect(lx, gy - 230, 8, 230); g.fillRect(lx, gy - 230, 50, 8); glow(g, lx + 46, gy - 220, 120, '255,200,120', .25); }
    g.restore(); vignette(g, .7); grain(g, t, .04);
    return { windows: wins.map(([x, y, i]) => [...P(x, y), i]) };
  }


  // ---------------- 场景：1948 年的教室（暖棕旧照片色调） ----------------
  /** o: {zoom, fx, fy, papers 0~1 发下报告, read 0~1 学生低头读（纸发光）, rise 0~1 所有纸飞起来叠成一张, board 黑板文字, boardK 0~1 粉笔写出} → {stack:[x,y] 叠纸处屏幕坐标} */
  function classroom(t, o = {}) {
    const g = ctx(); g.save(); const P = camera(g, o);
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a1d14'); gr.addColorStop(.62, '#3a2819'); gr.addColorStop(.621, '#1c140d'); gr.addColorStop(1, '#0f0a07'); g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
    // 侧窗进来的光柱
    for (const wx of [120, 1640]) { g.fillStyle = '#d9b27a'; g.fillRect(wx, 150, 170, 300); g.strokeStyle = '#2a1d14'; g.lineWidth = 10; g.strokeRect(wx, 150, 170, 300); g.beginPath(); g.moveTo(wx + 85, 150); g.lineTo(wx + 85, 450); g.moveTo(wx, 300); g.lineTo(wx + 170, 300); g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter'; const dir = wx < 900 ? 1 : -1; gr = g.createLinearGradient(wx, 300, wx + dir * 600, 900); gr.addColorStop(0, 'rgba(255,210,140,.16)'); gr.addColorStop(1, 'rgba(255,210,140,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(wx, 150); g.lineTo(wx + 170, 150); g.lineTo(wx + 170 + dir * 520, 1000); g.lineTo(wx + dir * 520, 1000); g.closePath(); g.fill(); g.restore(); }
    // 黑板 + 粉笔字
    g.fillStyle = '#1d2a22'; g.fillRect(560, 130, 800, 330); g.strokeStyle = '#5a3d24'; g.lineWidth = 16; g.strokeRect(560, 130, 800, 330);
    if (o.board) { g.save(); g.beginPath(); g.rect(560, 130, 800 * clamp(o.boardK ?? 1), 330); g.clip(); g.fillStyle = 'rgba(235,235,220,.9)'; g.font = '700 64px "Noto Serif SC"'; g.textAlign = 'center'; o.board.forEach((s, i) => g.fillText(s, 960, 240 + i * 90)); g.restore(); }
    // 讲台 + 老师
    g.fillStyle = '#140e09'; g.fillRect(860, 470, 200, 110); stander(g, 760, 600, 210, { color: '#0d0906', rim: '255,200,130', a: .35 });
    // 课桌和学生（背影），从后往前三排
    const seats = []; const rows = [[640, .62, 5], [760, .82, 5], [900, 1.05, 4]];
    rows.forEach(([y, sc, n], ri) => { for (let i = 0; i < n; i++) { const x = 960 + (i - (n - 1) / 2) * 330 * sc;
      g.fillStyle = '#20160e'; g.fillRect(x - 110 * sc, y - 10 * sc, 220 * sc, 18 * sc); g.fillRect(x - 100 * sc, y + 8 * sc, 14 * sc, 70 * sc); g.fillRect(x + 86 * sc, y + 8 * sc, 14 * sc, 70 * sc);
      const pk = clamp((o.papers ?? 0) * 1.4 - (ri * n + i) * .05), rk = clamp((o.rise ?? 0) * 1.3 - (ri * n + i) * .02);
      if (pk > 0 && rk < 1) { const sx = lerp(x, 960, rk * rk), sy = lerp(y - 22 * sc, 560, rk), ss = lerp(sc, .7, rk); g.save(); g.translate(sx, sy); g.rotate((1 - rk) * (i % 2 ? .08 : -.06)); g.fillStyle = '#efe4cf'; g.fillRect(-40 * ss, -26 * ss, 80 * ss, 52 * ss);
        g.fillStyle = 'rgba(80,60,40,.6)'; for (let l = 0; l < 4; l++) g.fillRect(-30 * ss, (-14 + l * 9) * ss, 60 * ss, 2 * ss); if ((o.read ?? 0) > 0) { g.globalCompositeOperation = 'lighter'; glow(g, 0, 0, 70 * ss, '255,220,160', .35 * o.read); } g.restore(); }
      // 学生背影（坐着：头 + 肩）
      const hy = y - 70 * sc - (o.read ?? 0) * 8 * sc; g.fillStyle = '#0c0805'; g.beginPath(); g.arc(x, hy, 26 * sc, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(x - 62 * sc, y + 40 * sc); g.quadraticCurveTo(x - 60 * sc, hy + 30 * sc, x, hy + 26 * sc); g.quadraticCurveTo(x + 60 * sc, hy + 30 * sc, x + 62 * sc, y + 40 * sc); g.fill();
      g.strokeStyle = 'rgba(255,200,130,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, hy, 26 * sc, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      seats.push([x, y]); } });
    // 叠成一张的报告（rise 到顶后放大）
    const st = clamp((o.rise ?? 0) * 1.3 - .5) ; if (st > 0 && st < 1) { const sz = lerp(.7, 1.6, st * st); g.save(); g.globalAlpha *= 1 - clamp((st - .55) / .45); g.translate(960, 560); g.fillStyle = '#efe4cf'; g.shadowColor = 'rgba(255,220,160,.6)'; g.shadowBlur = 40; g.fillRect(-40 * sz, -26 * sz, 80 * sz, 52 * sz); g.restore(); }
    g.restore(); grade(g, .85, .25); vignette(g, .8); grain(g, t, .07);
    return { stack: P(960, 560) };
  }

  // ---------------- 场景：夜里的算命摊（红灯笼、帘子、水晶球） ----------------
  /** o: {zoom, fx, fy, lanterns:[字…] 挂着的三盏灯笼, lanternK 0~1, ball 水晶球亮度, crowd 0~1 排队的人} */
  function fortune(t, o = {}) {
    const g = ctx(); g.save(); camera(g, o);
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#07060f'); gr.addColorStop(1, '#140a14'); g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
    skyline(g, -600, W + 600, 700, 41, t, { tall: 360, color: '#0d0a16' });
    g.fillStyle = '#0a0709'; g.fillRect(-600, 700, W + 1200, 600);
    // 摊位：顶棚 + 布帘 + 桌子
    g.fillStyle = '#3a0f14'; g.beginPath(); g.moveTo(560, 330); g.lineTo(1360, 330); g.lineTo(1420, 400); g.lineTo(500, 400); g.closePath(); g.fill();
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#5c1a20' : '#2a0b0f'; g.beginPath(); g.moveTo(500 + i * 76.6, 400); g.lineTo(538 + i * 76.6, 440); g.lineTo(576 + i * 76.6, 400); g.fill(); }
    g.fillStyle = '#170a0d'; g.fillRect(560, 400, 800, 330); gr = g.createLinearGradient(600, 0, 1320, 0); gr.addColorStop(0, '#2b0d12'); gr.addColorStop(.5, '#40141a'); gr.addColorStop(1, '#2b0d12'); g.fillStyle = gr; g.fillRect(600, 420, 720, 300);
    g.fillStyle = '#1a0c0a'; g.fillRect(620, 640, 680, 40); g.fillRect(660, 680, 30, 120); g.fillRect(1230, 680, 30, 120);
    // 算命先生（剪影，披斗篷）+ 水晶球
    g.fillStyle = '#07040a'; g.beginPath(); g.arc(960, 500, 44, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(860, 640); g.quadraticCurveTo(870, 540, 960, 530); g.quadraticCurveTo(1050, 540, 1060, 640); g.fill();
    g.beginPath(); g.moveTo(905, 470); g.quadraticCurveTo(960, 400, 1015, 470); g.quadraticCurveTo(960, 455, 905, 470); g.fill();
    const bl = o.ball ?? 1; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 960, 610, 200, '170,120,255', .35 * bl); glow(g, 960, 610, 60, '220,200,255', .6 * bl); g.restore();
    gr = g.createRadialGradient(948, 598, 4, 960, 610, 38); gr.addColorStop(0, 'rgba(240,230,255,.95)'); gr.addColorStop(1, 'rgba(120,80,220,.5)'); g.fillStyle = gr; g.beginPath(); g.arc(960, 610, 38, 0, 6.3); g.fill();
    // 灯笼（可写字）
    (o.lanterns || ['', '', '']).forEach((s, i) => { const x = 640 + i * 320, y = 300 + Math.sin(t * 1.4 + i) * 6, k = clamp((o.lanternK ?? 1) * 3 - i);
      g.strokeStyle = '#2a1410'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 200); g.lineTo(x, y - 60); g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 170, '255,110,60', .25 + .35 * k); g.restore();
      gr = g.createRadialGradient(x - 15, y - 15, 5, x, y, 70); gr.addColorStop(0, k > 0 ? '#ffb070' : '#7a2a1c'); gr.addColorStop(1, k > 0 ? '#c8301e' : '#4a140e'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 56, 64, 0, 0, 6.3); g.fill();
      g.fillStyle = '#2a1410'; g.fillRect(x - 30, y - 70, 60, 10); g.fillRect(x - 30, y + 60, 60, 10);
      if (s && k > 0) { g.fillStyle = `rgba(255,240,210,${k})`; g.font = '900 30px "Noto Serif SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; [...s].forEach((ch, ci) => g.fillText(ch, x, y - (s.length - 1) * 16 + ci * 32)); } });
    // 排队的人
    const cr = o.crowd ?? 0; if (cr > 0) for (let i = 0; i < 6; i++) { const x = 1480 + i * 90, a = clamp(cr * 6 - i); if (a > 0) { g.globalAlpha = a; stander(g, x, 830, 230 - i * 10, { color: '#050307', rim: '255,120,80', a: .4 }); g.globalAlpha = 1; } }
    g.restore(); vignette(g, .75); grain(g, t, .05);
  }

  // ---------------- 场景：记忆档案室（大脑在翻抽屉，手电光扫过） ----------------
  /** o: {zoom, fx, fy, beam:[x,y] 光束照到的点（世界坐标）, items:[[字, 命中?],…], open 0~1 抽屉拉开, judge 0~1 命中的变金、没命中的变暗} */
  function archive(t, o = {}) {
    const g = ctx(); g.save(); camera(g, o);
    g.fillStyle = '#05070c'; g.fillRect(-600, -400, W + 1200, H + 800);
    const cols = 8, rows = 5, x0 = 260, y0 = 170, cw = 175, rh = 140, r = R(3), items = o.items || [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = x0 + i * cw, y = y0 + j * rh, idx = j * cols + i, it = items[idx % 11 === 3 ? (idx * 7) % items.length : -1];
      g.fillStyle = '#0c111c'; g.fillRect(x, y, cw - 14, rh - 14); g.strokeStyle = '#1a2335'; g.lineWidth = 2; g.strokeRect(x, y, cw - 14, rh - 14); g.fillStyle = '#26324a'; g.fillRect(x + cw / 2 - 30, y + 18, 46, 10);
      g.fillStyle = '#c9b48a33'; g.fillRect(x + 20, y + 44, cw - 54, 30); }
    // 拉开的抽屉（命中的变金）
    items.forEach(([s, hit], k) => { const i = [1, 5, 2, 6, 0, 4][k % 6], j = [1, 1, 2, 3, 3, 2][k % 6], x = x0 + i * cw, y = y0 + j * rh, op = clamp((o.open ?? 0) * items.length - k * .8), jd = o.judge ?? 0;
      if (op <= 0) return; const dy = op * 30, a = hit ? 1 : 1 - .75 * jd, col = hit && jd > 0 ? `rgba(255,${lerp(220, 180, jd)},${lerp(220, 90, jd)},${a})` : `rgba(210,220,240,${a})`;
      g.save(); g.globalAlpha = a; g.fillStyle = '#18202f'; g.fillRect(x - 6, y + dy - 6, cw - 2, rh - 2); g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x - 6, y + dy - 6, cw - 2, rh - 2);
      if (hit && jd > 0) { g.globalCompositeOperation = 'lighter'; glow(g, x + cw / 2, y + rh / 2 + dy, 160, '255,180,90', .35 * jd); g.globalCompositeOperation = 'source-over'; }
      g.fillStyle = col; g.font = '700 25px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; const words = s.length > 7 ? [s.slice(0, 7), s.slice(7)] : [s]; words.forEach((w, wi) => g.fillText(w, x + cw / 2 - 10, y + rh / 2 + dy - 8 - (words.length - 1) * 12 + wi * 26)); g.restore(); });
    // 手电光束
    if (o.beam) { const [bxp, byp] = o.beam; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(bxp, byp, 0, bxp, byp, 260); gr.addColorStop(0, 'rgba(255,240,210,.35)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(960, H + 200); g.lineTo(bxp - 200, byp - 60); g.lineTo(bxp + 200, byp + 60); g.closePath(); g.fill(); glow(g, bxp, byp, 240, '255,240,210', .3); g.restore(); }
    g.restore(); vignette(g, .85); grain(g, t, .05);
  }

  // ---------------- 场景：马戏团大帐篷（条纹帐顶、彩灯、聚光灯下的领班） ----------------
  /** o: {zoom, fx, fy, spot 0~1, crowd 0~1, bulbs 0~1} */
  function circus(t, o = {}) {
    const g = ctx(); g.save(); camera(g, o);
    g.fillStyle = '#080406'; g.fillRect(-600, -400, W + 1200, H + 800);
    for (let i = -10; i <= 10; i++) { g.fillStyle = i % 2 ? '#3a0c12' : '#1c0a0c'; g.beginPath(); g.moveTo(960, -40); g.lineTo(960 + i * 160, 520); g.lineTo(960 + (i + 1) * 160, 520); g.closePath(); g.fill(); }
    const bl = o.bulbs ?? 1; for (let k = 0; k < 3; k++) for (let i = 0; i <= 24; i++) { const u = i / 24, x = lerp(-80, 2000, u), y = 380 + k * 40 + Math.sin(u * Math.PI) * -120 + Math.sin(u * 12) * 6, on = (i + Math.floor(t * 4) + k) % 3 !== 0;
      g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, 26, '255,200,110', on ? .5 * bl : .12 * bl); g.restore(); g.fillStyle = on ? '#ffe2a8' : '#5a4630'; g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill(); }
    // 观众席
    const cr = o.crowd ?? 1; for (let row = 0; row < 3; row++) for (let i = 0; i < 26; i++) { const x = -40 + i * 78 + (row % 2) * 39, y = 760 + row * 70; if (Math.abs(x - 960) < 220 && row === 0) continue; g.globalAlpha = cr; g.fillStyle = '#050204'; g.beginPath(); g.arc(x, y - 40, 20, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(x, y + 10, 34, 40, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1; }
    // 聚光灯 + 地上的光圈
    const sp = o.spot ?? 1; g.save(); g.globalCompositeOperation = 'lighter'; let gr = g.createLinearGradient(960, -40, 960, 760); gr.addColorStop(0, `rgba(255,220,150,${.05 * sp})`); gr.addColorStop(1, `rgba(255,220,150,${.22 * sp})`); g.fillStyle = gr; g.beginPath(); g.moveTo(900, -40); g.lineTo(1020, -40); g.lineTo(1180, 740); g.lineTo(740, 740); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(960, 740, 230, 46, 0, 0, 6.3); g.fillStyle = `rgba(255,220,150,${.25 * sp})`; g.fill(); g.restore();
    // 领班剪影：高礼帽 + 燕尾服，抬手
    g.fillStyle = '#060304'; g.save(); g.translate(960, 740); g.beginPath(); g.arc(0, -300, 26, 0, 6.3); g.fill(); g.fillRect(-26, -386, 52, 64); g.fillRect(-42, -326, 84, 10);
    g.beginPath(); g.moveTo(-50, -270); g.quadraticCurveTo(0, -286, 50, -270); g.lineTo(58, -120); g.lineTo(76, -40); g.lineTo(34, -100); g.lineTo(28, 0); g.lineTo(6, 0); g.lineTo(0, -120); g.lineTo(-6, 0); g.lineTo(-28, 0); g.lineTo(-34, -100); g.lineTo(-76, -40); g.lineTo(-58, -120); g.closePath(); g.fill();
    g.lineWidth = 16; g.strokeStyle = '#060304'; g.lineCap = 'round'; g.beginPath(); g.moveTo(44, -260); g.quadraticCurveTo(110, -300, 130, -370 - Math.sin(t * 2) * 8); g.stroke(); g.restore();
    g.restore(); grade(g, .9, .2); vignette(g, .8); grain(g, t, .05);
  }

  return { winPos, classroom, fortune, archive, circus, bedroom, building, sitter, stander, glow, vignette, grain, grade, skyline, camera };
})();
