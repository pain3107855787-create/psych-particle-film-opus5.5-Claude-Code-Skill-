// ============================================================================
// 元素库：可复用的叠加层图形（在 film.js 的 overlay(t) 里调用，世界坐标，跟随镜头）
// 全部用当前配色（E.TH.p / a / b / glow）画霓虹细线；参数 al = 透明度，t = 当前时间，t0 = 进场时刻
// 图鉴：reference/elements.md + reference/elements_gallery.jpg。新元素加在这里，并补进图鉴
// ============================================================================
const M = (() => {
  const c = () => E.ctx, th = () => E.TH;
  const line = (col, w, blur, fn, al = 1) => { const g = c(); g.save(); g.globalAlpha *= al; g.strokeStyle = col; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = blur; g.beginPath(); fn(g); g.stroke(); g.restore(); };
  const fill = (col, blur, fn, al = 1) => { const g = c(); g.save(); g.globalAlpha *= al; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = blur; g.beginPath(); fn(g); g.fill(); g.restore(); };
  const label = (s, x, y, o = {}, t0 = -9, t = 0) => E.neon(s, x, y, { size: 28, color: th().muted || '#a9a6c0', weight: 600, ...o }, t0, t);
  const mono = '"JetBrains Mono"';

  return {
    // ---------------- 关系 / 情感 ----------------
    /** 恋人：两颗光点 + 波浪连线。o: {ca, cb 颜色, aa, ab 透明度, link 连线透明度, broken 0~1 断开程度, names: ['你','TA']} */
    lovers(x1, x2, y, t, o = {}) {
      const T = th(), ca = o.ca || T.a, cb = o.cb || T.b, lk = o.link ?? .9, br = o.broken || 0;
      if (lk > .01) {
        if (br > 0) { E.link(x1, y, E.lerp(x1, x2, .5 - br * .3), y, ca, cb, t, { alpha: lk }); E.link(E.lerp(x1, x2, .5 + br * .3), y, x2, y, ca, cb, t, { alpha: lk * (1 - br) }); }
        else E.link(x1, y, x2, y, ca, cb, t, { alpha: lk });
      }
      E.orb(x1, y, 7, ca, o.aa ?? 1, t); E.orb(x2, y, 7, cb, o.ab ?? 1, t);
      if (o.names) { label(o.names[0], x1, y + 56, { color: ca, size: 24, alpha: o.aa ?? 1 }); label(o.names[1], x2, y + 56, { color: cb, size: 24, font: mono, alpha: o.ab ?? 1 }); }
    },
    /** 对话气泡 + 文字（粒子气泡用 S.bubble，这里画清晰的框和字）。o: {color, w, h, status:'未读'|'已读', al, style:'ios' 实心亮蓝气泡（参考视频 2）, incoming 灰色对方气泡, size} */
    chat(x, y, text, t0, t, o = {}) {
      const col = o.color || th().a, al = o.al ?? 1, w = o.w || text.length * 46 + 90, h = o.h || 100;
      if (o.style === 'ios') { const k = E.eOut(E.prog(t, t0, .35)), me = !o.incoming, g = c(), bg = me ? '#2f7cf6' : '#e9e9eb', fg = me ? '#ffffff' : '#111111', sz = o.size || 40; if (k <= 0) return;
        g.save(); g.font = `600 ${sz}px "Noto Sans SC"`; const bw = o.w || g.measureText(text).width + sz * 1.3, bh = o.h || sz * 1.9; g.globalAlpha *= al * k; g.translate(x, y + (1 - k) * 18); g.scale(.9 + .1 * k, .9 + .1 * k);
        g.fillStyle = bg; g.shadowColor = me ? 'rgba(47,124,246,.55)' : 'rgba(0,0,0,.25)'; g.shadowBlur = 24; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); g.fill();
        g.beginPath(); const tx = me ? bw / 2 - 10 : -bw / 2 + 10, d = me ? 1 : -1; g.moveTo(tx - 14 * d, bh / 2 - 22); g.quadraticCurveTo(tx + 6 * d, bh / 2 - 2, tx + 18 * d, bh / 2 + 2); g.quadraticCurveTo(tx - 4 * d, bh / 2 + 2, tx - 22 * d, bh / 2 - 8); g.fill();
        g.shadowBlur = 0; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 2); g.restore();
        if (o.status) label(o.status, x + (me ? bw / 2 : -bw / 2), y + bh / 2 + 26, { align: me ? 'right' : 'left', size: 24, alpha: al * k }, -9, 0); return; }
      E.bubbleBox(x, y, w, h, col, al * .9); E.neon(text, x, y, { size: 44, color: col, alpha: al }, t0, t);
      if (o.status) label(o.status, x + w / 2 + 10, y + h / 2 - 10, { align: 'left', alpha: al }, t0 + .4, t);
    },
    /** 聊天记录快速滚动（越滚越快）。box: [x, y, w, h] */
    chatScroll(t, t0, al, box = [400, 140, 1120, 720]) {
      const g = c(), T = th(), u = Math.max(0, t - t0), off = u * 120 + u * u * 70, [bx, by, bw, bh] = box;
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
      for (let i = 0; i < 30; i++) {
        const y = by + bh + 60 + i * 110 - off; if (y < by - 60 || y > by + bh + 60) continue;
        const left = (i * 7) % 3 !== 0, w = 220 + ((i * 53) % 200), x = left ? bx + 240 + w / 2 - 60 : bx + bw - 240 - w / 2 + 60;
        E.bubbleBox(x, y, w, 66, left ? T.a : T.b, al * .9);
        g.save(); g.globalAlpha = al * .5; g.fillStyle = left ? T.a : T.b; g.fillRect(x - w / 2 + 34, y - 5, w - 68 - ((i * 31) % 50), 6); g.restore();
      }
      g.restore();
    },
    /** 时钟指针 + 数字读数（表盘用 S.clock 粒子）。从 fromMin 走到 toMin（分钟，可跨天），k = 0~1 */
    clockHands(cx, cy, fromMin, toMin, k, al = 1, t0 = -9, t = 0) {
      const T = th(), mins = fromMin + (toMin - fromMin) * k, h = (mins / 60) % 12, m = mins % 60;
      for (const [ang, len, w, col] of [[h / 12 * 6.283 - 1.5708, 100, 7, T.a], [m / 60 * 6.283 - 1.5708, 150, 4, T.p]]) line(col, w, 14, g => { g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len); }, al);
      const hh = Math.floor(mins / 60) % 24, mm = Math.floor(m);
      E.neon(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, cx, cy + 260, { size: 40, color: T.p, font: mono, weight: 700, alpha: al }, t0, t);
    },
    /** 眼睛（"看"/观察者），label 小字在上方 */
    eye(x, y, al = 1, lbl = '', t0 = -9, t = 0) {
      const T = th(); line(T.p, 3, 14, g => { g.moveTo(x - 80, y); g.quadraticCurveTo(x, y - 60, x + 80, y); g.quadraticCurveTo(x, y + 60, x - 80, y); }, al);
      fill(T.p, 10, g => g.arc(x, y + 8, 15, 0, 6.3), al); if (lbl) label(lbl, x, y - 90, { font: mono, spacing: 4, alpha: al }, t0, t);
    },
    /** 药丸标签（"不在身边""刚吵完架"这类小注释） */
    pill(s, x, y, al = 1, t0 = -9, t = 0) { const g = c(); g.save(); g.font = '700 38px "Noto Sans SC"'; const w = g.measureText(s).width + 64; g.restore(); E.bubbleBox(x, y, w, 70, '#9b96b8', al * .8); E.neon(s, x, y + 1, { size: 38, color: th().p, weight: 700, alpha: al }, t0, t); },
    /** 睡着的 z z z */
    zzz(x, y, t, al = 1) { for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; E.neon('z', x + 40 + ph * 50, y - 50 - ph * 110, { size: 30 + ph * 20, color: th().b, weight: 700, font: '"Playfair Display"', alpha: al * Math.sin(ph * Math.PI) }, -9, t); } },
    /** 词语星座：[[字, x, y, 颜色, 字号], ...] 虚线连成多边形 */
    constellation(words, al, t0, t) {
      line(th().p, 1, 0, g => { g.setLineDash([4, 8]); words.forEach(([, x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }, al * .5);
      words.forEach(([s, x, y, col, sz], i) => E.neon(s, x, y, { size: sz || 80, color: col || th().p, alpha: al }, t0 + i * .25, t));
    },

    // ---------------- 概率 / 决策 ----------------
    /** 硬币：phase 为翻转角度（弧度），face '正'|'反' */
    coin(x, y, r, face, phase = 0, col, al = 1) {
      col = col || th().a; const sy = Math.cos(phase), f = sy >= 0 ? face : (face === '正' ? '反' : '正'), g = c();
      g.save(); g.translate(x, y); g.scale(1, Math.max(.04, Math.abs(sy)));
      line(col, 4, 18, gg => gg.arc(0, 0, r, 0, 6.3), al); line(col, 1.6, 8, gg => gg.arc(0, 0, r * .8, 0, 6.3), al);
      if (Math.abs(sy) > .25) E.neon(f, 0, 4, { size: r * .95, color: col, alpha: al * Math.abs(sy) }, -9, 0);
      g.restore();
    },
    /** 欧式轮盘（37 格），hi = 高亮格序号，rot = 旋转 */
    roulette(cx, cy, R, rot, hi = -1, al = 1) {
      const g = c(), T = th(), ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26], REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]), s = 6.2832 / 37;
      g.save(); g.globalAlpha *= al;
      for (let i = 0; i < 37; i++) { const a0 = rot + i * s, n = ORDER[i]; g.beginPath(); g.arc(cx, cy, R * .92, a0, a0 + s); g.arc(cx, cy, R * .7, a0 + s, a0, true); g.closePath(); g.fillStyle = n === 0 ? 'rgba(47,191,113,.5)' : REDS.has(n) ? 'rgba(220,40,70,.55)' : 'rgba(5,5,8,.9)'; g.fill(); g.strokeStyle = T.p + '88'; g.lineWidth = 1; g.stroke(); }
      g.restore();
      line(T.p, 2.5, 14, gg => gg.arc(cx, cy, R, 0, 6.3), al); line(T.p, 1.5, 8, gg => gg.arc(cx, cy, R * .68, 0, 6.3), al); line(T.p, 2, 10, gg => gg.arc(cx, cy, R * .28, 0, 6.3), al);
      for (let k = 0; k < 4; k++) { const a = rot + k * 1.5708; line(T.p, 2, 8, gg => { gg.moveTo(cx + Math.cos(a) * R * .1, cy + Math.sin(a) * R * .1); gg.lineTo(cx + Math.cos(a) * R * .28, cy + Math.sin(a) * R * .28); }, al); }
      if (hi >= 0) { const am = rot + hi * s + s / 2; fill('#fff', 16, gg => gg.arc(cx + Math.cos(am) * R * .81, cy + Math.sin(am) * R * .81, R * .03, 0, 6.3), al); }
    },
    /** 筹码堆：n 枚，fall 0~1 时散落 */
    chips(x, y, n, col, al = 1, fall = 0) {
      col = col || th().a; const g = c();
      for (let i = 0; i < n; i++) { const yy = y - i * 16 + fall ** 3 * (500 + i * 30), xx = x + Math.sin(i * 2.3) * 6 + fall * Math.sin(i) * 120;
        g.save(); g.globalAlpha *= al * (1 - fall); g.fillStyle = col + '40'; g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 10; g.beginPath(); g.ellipse(xx, yy, 70, 14, 0, 0, 6.3); g.fill(); g.stroke();
        g.setLineDash([8, 10]); g.strokeStyle = th().p; g.lineWidth = 1.5; g.beginPath(); g.ellipse(xx, yy, 52, 9, 0, 0, 6.3); g.stroke(); g.restore(); }
    },
    /** 柱状对比：items [{label, value(0~100), color}]，k = 生长进度 */
    bars(items, x, base, k, al = 1, o = {}) {
      const gap = o.gap || 300, sc = o.scale || 6, w = o.w || 140;
      items.forEach((it, i) => { const cx = x + (i - (items.length - 1) / 2) * gap, h = it.value * sc * E.eOut(k), col = it.color || (i ? th().b : th().a);
        fill(col + '30', 0, g => g.rect(cx - w / 2, base - h, w, h), al); line(col, 3, 14, g => g.rect(cx - w / 2, base - h, w, h), al);
        E.neon(Math.round(it.value * Math.min(1, k * 1.2)) + (o.unit ?? '%'), cx, base - h - 46, { size: 52, color: col, font: mono, weight: 700, alpha: al }, -9, 0);
        E.neon(it.label, cx, base + 40, { size: 28, color: th().p, weight: 700, alpha: al }, -9, 0); });
      line(th().p, 1.5, 0, g => { g.moveTo(x - gap * items.length / 2, base); g.lineTo(x + gap * items.length / 2, base); }, al * .6);
    },
    /** 天平：tilt 弧度（左低为正），左右托盘上的字 */
    scale(cx, cy, tilt, left, right, al = 1) {
      const T = th(), L = 380, lx = cx - L * Math.cos(tilt), ly = cy + L * Math.sin(tilt), rx = cx + L * Math.cos(tilt), ry = cy - L * Math.sin(tilt);
      line(T.p, 3, 14, g => { g.moveTo(cx, cy); g.lineTo(cx, cy + 390); g.moveTo(cx - 120, cy + 390); g.lineTo(cx + 120, cy + 390); g.moveTo(lx, ly); g.lineTo(rx, ry); }, al);
      for (const [px, py, col, s] of [[lx, ly, T.p, left], [rx, ry, T.a, right]]) {
        line(T.p, 1.5, 6, g => { g.moveTo(px, py); g.lineTo(px - 110, py + 190); g.moveTo(px, py); g.lineTo(px + 110, py + 190); }, al);
        line(col, 3, 16, g => { g.moveTo(px - 140, py + 190); g.quadraticCurveTo(px, py + 260, px + 140, py + 190); }, al);
        E.neon(s, px, py + 160, { size: 40, color: col, alpha: al }, -9, 0);
      }
      fill(T.p, 12, g => g.arc(cx, cy, 12, 0, 6.3), al);
    },
    /** 篮框 + 篮网 */
    hoop(x, y, al = 1) {
      const T = th(); line(T.p, 2.5, 12, g => { g.rect(x - 120, y - 150, 240, 150); g.rect(x - 45, y - 75, 90, 60); }, al);
      line(T.a, 3.5, 18, g => g.ellipse(x, y + 10, 56, 13, 0, 0, 6.3), al);
      line(T.p + 'aa', 1.2, 4, g => { for (let i = -4; i <= 4; i++) { g.moveTo(x + i * 13, y + 18); g.lineTo(x + i * 8, y + 100); } g.moveTo(x - 42, y + 55); g.lineTo(x + 42, y + 55); }, al);
    },
    /** 线条小人，arm 0~1 抬手 */
    stick(x, y, arm = 0, al = 1) {
      line(th().p, 3, 14, g => { g.moveTo(x + 18, y - 150); g.arc(x, y - 150, 18, 0, 6.3); g.moveTo(x, y - 130); g.lineTo(x, y - 60); g.lineTo(x - 22, y); g.moveTo(x, y - 60); g.lineTo(x + 22, y);
        g.moveTo(x, y - 115); g.lineTo(x + 30 + arm * 10, y - 150 - arm * 40); g.moveTo(x, y - 115); g.lineTo(x + 20 + arm * 14, y - 140 - arm * 44); }, al);
    },

    // ---------------- 数据 / HUD（新增，取自参考视频的语汇） ----------------
    /** 环形进度表：frac 0~1，中间大数字 */
    gauge(cx, cy, r, frac, al = 1, o = {}) {
      const T = th(), col = o.color || T.a;
      line(T.p + '33', 10, 0, g => g.arc(cx, cy, r, 0, 6.3), al);
      line(col, 10, 22, g => g.arc(cx, cy, r, -1.5708, -1.5708 + 6.2832 * frac), al);
      for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, l = i % 5 ? 6 : 14; line(T.p + '66', 1, 0, g => { g.moveTo(cx + Math.cos(a) * (r + 18), cy + Math.sin(a) * (r + 18)); g.lineTo(cx + Math.cos(a) * (r + 18 + l), cy + Math.sin(a) * (r + 18 + l)); }, al); }
      E.neon(o.text ?? Math.round(frac * 100) + '%', cx, cy, { size: r * .55, color: col, font: mono, weight: 700, alpha: al }, -9, 0);
      if (o.label) label(o.label, cx, cy + r * .45, { alpha: al, spacing: 4 });
    },
    /** 计数器：数字滚动到 value（k 0~1），等宽字 + 小标签，可做"Δx 240,000 km"式读数 */
    counter(x, y, value, k, al = 1, o = {}) {
      const v = value * E.eOut(k), s = (o.decimals ? v.toFixed(o.decimals) : Math.round(v).toLocaleString('en-US')) + (o.unit || '');
      E.neon(s, x, y, { size: o.size || 120, color: o.color || th().p, font: mono, weight: 700, alpha: al, align: o.align }, -9, 0);
      if (o.label) label(o.label, x, y - (o.size || 120) * .75, { font: mono, spacing: 6, alpha: al, align: o.align });
    },
    /** 年代时间轴：items [{year, label}]，k 0~1 画到哪 */
    timeline(x1, x2, y, items, k, al = 1) {
      const T = th(), xe = E.lerp(x1, x2, E.eOut(k)); line(T.p, 2, 10, g => { g.moveTo(x1, y); g.lineTo(xe, y); }, al);
      items.forEach((it, i) => { const x = E.lerp(x1, x2, (i + .5) / items.length); if (x > xe) return;
        fill(i === items.length - 1 ? T.a : T.p, 14, g => g.arc(x, y, 8, 0, 6.3), al);
        E.neon(String(it.year), x, y - 46, { size: 34, color: T.p, font: mono, weight: 700, alpha: al }, -9, 0); label(it.label, x, y + 44, { alpha: al, size: 24 }); });
    },
    /** 轨道环：几圈缓慢旋转的虚线椭圆（HUD 氛围，放在主体后面） */
    orbits(cx, cy, t, al = .5, o = {}) {
      const n = o.n || 3, col = o.color || th().b;
      for (let i = 0; i < n; i++) line(col, 1, 6, g => { g.setLineDash([2, 10 + i * 4]); g.lineDashOffset = -t * (20 + i * 12) * (i % 2 ? -1 : 1); g.ellipse(cx, cy, 260 + i * 120, 90 + i * 40, -.25, 0, 6.3); }, al * (1 - i * .2));
    },
    /** 尺寸线：两点之间带端点和读数（"相距多远"） */
    measure(x1, y1, x2, y2, text, al = 1) {
      const T = th(), an = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(an) * 14, ny = Math.cos(an) * 14;
      line(T.p, 1.2, 0, g => { g.moveTo(x1, y1); g.lineTo(x2, y2); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x1 - nx, y1 - ny); g.moveTo(x2 + nx, y2 + ny); g.lineTo(x2 - nx, y2 - ny); }, al * .8);
      label(text, (x1 + x2) / 2 - nx * 2.5, (y1 + y2) / 2 - ny * 2.5, { font: mono, size: 20, spacing: 3, alpha: al });
    },
    /** HUD 角框：框住一个主体 */
    brackets(x, y, w, h, al = 1, col) {
      col = col || th().p; const b = 26; line(col, 1.5, 8, g => { for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { g.moveTo(cx, cy + sy * b); g.lineTo(cx, cy); g.lineTo(cx + sx * b, cy); } }, al);
    },
    /** 自旋箭头：圆点 + 上/下箭头（"两个状态相反"） */
    spin(x, y, up, col, al = 1) {
      col = col || th().a; line(col, 2, 12, g => g.arc(x, y, 34, 0, 6.3), al); fill('#fff', 16, g => g.arc(x, y, 6, 0, 6.3), al);
      const d = up ? -1 : 1; line(col, 3, 10, g => { g.moveTo(x, y - d * 46); g.lineTo(x, y + d * 46); g.moveTo(x - 10, y + d * 34); g.lineTo(x, y + d * 46); g.lineTo(x + 10, y + d * 34); }, al);
    },
    /** 心电/脉搏线：情绪波动，amp 振幅，bpm 速度 */
    pulse(x1, x2, y, t, al = 1, o = {}) {
      const col = o.color || th().a, amp = o.amp ?? 90, sp = (o.bpm || 70) / 60;
      line(col, 2.5, 16, g => { for (let x = x1; x <= x2; x += 4) { const u = ((x - x1) / 220 - t * sp) % 1, ph = (u + 1) % 1; let dy = 0; if (ph > .45 && ph < .5) dy = -amp * (ph - .45) / .05; else if (ph >= .5 && ph < .55) dy = -amp + amp * 1.6 * (ph - .5) / .05; else if (ph >= .55 && ph < .6) dy = amp * .6 - amp * .6 * (ph - .55) / .05; x === x1 ? g.moveTo(x, y + dy) : g.lineTo(x, y + dy); } }, al);
    },

    // ---------------- 轨迹 / 读数 / 文字（2026-10-16 参考视频 3、4 启发） ----------------
    /** 彗星轨迹：path(u)→[x,y]（u 0~1），头部在 k 处，尾长 len（u 单位）。o: {color, label, width, head, len} */
    comet(path, k, al = 1, o = {}) {
      const g = c(), col = o.color || th().p, len = o.len ?? .35, n = 48, k0 = Math.max(0, k - len);
      g.save(); g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 12; const base = g.globalAlpha;
      for (let i = 0; i < n; i++) { const u0 = k0 + (k - k0) * i / n, u1 = k0 + (k - k0) * (i + 1) / n, [x0, y0] = path(u0), [x1, y1] = path(u1), f = (i + 1) / n;
        g.strokeStyle = col; g.globalAlpha = base * al * f * f; g.lineWidth = (o.width || 3) * (.3 + .7 * f); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
      g.restore(); const [hx, hy] = path(k); if (o.head !== false) E.orb(hx, hy, 6, col, al, k * 9);
      if (o.label) label(o.label, hx + 18, hy - 22, { align: 'left', color: col, size: 22, alpha: al });
    },
    /** 读数滑条：val 0~1。o: {label 中文, en 英文, text 右侧读数, color} */
    meter(x, y, w, val, al = 1, o = {}) {
      const T = th(), col = o.color || T.b, px = x + w * Math.max(0, Math.min(1, val));
      line(T.p + '44', 1.2, 0, g => { g.moveTo(x, y); g.lineTo(x + w, y); for (let i = 0; i <= 20; i++) { const xx = x + w * i / 20; g.moveTo(xx, y - (i % 5 ? 3 : 7)); g.lineTo(xx, y + (i % 5 ? 3 : 7)); } }, al);
      line(col, 3, 14, g => { g.moveTo(x, y); g.lineTo(px, y); }, al); fill('#fff', 18, g => g.arc(px, y, 7, 0, 6.3), al); fill(col, 26, g => g.arc(px, y, 12, 0, 6.3), al * .4);
      if (o.label) E.neon(o.label + (o.en ? '  ' + o.en : ''), x, y - 28, { size: 20, color: '#a9a6c0', weight: 500, align: 'left', spacing: 3, alpha: al }, -9, 0);
      if (o.text) E.neon(o.text, x + w, y - 28, { size: 22, color: col, font: mono, weight: 700, align: 'right', alpha: al }, -9, 0);
    },
    /** 候选字滚动：prefix 前半句（右对齐到 x），候选字竖排滚动，k 0~1 滚到第 pick 个停住 */
    slotText(prefix, x, y, cands, pick, k, al = 1, o = {}) {
      const g = c(), T = th(), size = o.size || 72, col = o.color || T.a, step = size * 1.15;
      E.neon(prefix, x, y, { size, color: T.p, align: 'right', alpha: al }, -9, 0);
      g.save(); g.font = `${o.weight || 900} ${size}px ${o.font || T.font}`; const cw = Math.max(...cands.map(s => g.measureText(s).width)); g.restore();
      const cx = x + 18 + cw / 2, spins = o.spins ?? 2, pos = E.eOut(k) * (spins * cands.length + pick);
      g.save(); g.beginPath(); g.rect(x + 8, y - step * 1.6, cw + 24, step * 3.2); g.clip();
      for (let j = -2; j <= 2; j++) { const idx = Math.floor(pos) + j, s = cands[((idx % cands.length) + cands.length) % cands.length], dy = (idx - pos) * step, near = Math.max(0, 1 - Math.abs(dy) / (step * 1.4)), hit = Math.abs(dy) < step * .3;
        E.neon(s, cx, y + dy, { size, color: hit ? col : T.p, alpha: al * near * (hit ? 1 : .35) }, -9, 0); }
      g.restore(); line(col, 2, 10, gg => { gg.moveTo(x + 14, y + size * .62); gg.lineTo(x + 22 + cw, y + size * .62); }, al);
    },
    /** 坐标网格：微微透视的淡网格 + y 轴刻度（实验 / 科学场景的背景） */
    axisGrid(t, al = .5, o = {}) {
      const col = o.color || th().p, g = c(), sk = .06 * Math.sin(t * .1);
      g.save(); g.globalAlpha *= al * .25; g.strokeStyle = col; g.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(960 + i * 220, -100); g.lineTo(960 + i * 220 * 1.25 + sk * 400, 1180); g.stroke(); }
      for (let j = 0; j < 8; j++) { const y = 80 + j * 140; g.beginPath(); g.moveTo(-100, y + sk * 60); g.lineTo(2020, y - sk * 60); g.stroke(); }
      g.globalAlpha = al * .6; g.font = '500 14px "JetBrains Mono"'; g.fillStyle = col; for (let j = 0; j < 7; j++) g.fillText(String(6 - j), 52, 140 + j * 140);
      g.fillText('y', 52, 100); g.restore();
    },

    // ---------------- 实验 / 情境道具（习得性无助） ----------------
    /** 门：open 0~1 推开程度（门扇透视收窄，门缝透光） */
    door(x, y, w, h, open, al = 1, o = {}) {
      const T = th(), col = o.color || T.p, lw = w * Math.cos(open * 1.25);
      if (open > .01) { const g = c(), gr = g.createLinearGradient(x + lw, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.05)'); g.save(); g.globalAlpha *= al; g.fillStyle = gr; g.fillRect(x + lw, y, w - lw, h); g.restore(); }
      line(col, 3, 14, g => g.rect(x - 10, y - 10, w + 20, h + 10), al);
      line(col, 2.5, 12, g => { g.moveTo(x, y); g.lineTo(x + lw, y + open * 20); g.lineTo(x + lw, y + h - open * 20); g.lineTo(x, y + h); g.closePath(); }, al);
      fill(col, 10, g => g.arc(x + lw * .82, y + h * .52, 6, 0, 6.3), al);
    },
    /** 穿梭箱：长方形箱子 + 中间矮墙（barrier 为墙高比例），可选左右标签 */
    shuttleBox(x, y, w, h, barrier = .3, al = 1, o = {}) {
      const T = th(); line(T.p, 2.5, 12, g => g.rect(x, y, w, h), al);
      line(o.wallColor || T.a, 4, 16, g => { g.moveTo(x + w / 2, y + h); g.lineTo(x + w / 2, y + h - h * barrier); }, al);
      if (o.left) label(o.left, x + w * .25, y + h + 36, { alpha: al, size: 24 }); if (o.right) label(o.right, x + w * .75, y + h + 36, { alpha: al, size: 24 });
    },
    /** 闪电：从 (x1,y1) 到 (x2,y2) 的折线，随 t 抖动闪烁 */
    bolt(x1, y1, x2, y2, t, al = 1, col) {
      col = col || th().a; const r = E.R(Math.floor(t * 14) * 7 + 3); if (r() < .25) return;
      line(col, 3, 22, g => { g.moveTo(x1, y1); for (let i = 1; i < 7; i++) { const u = i / 7; g.lineTo(E.lerp(x1, x2, u) + (r() - .5) * 60, E.lerp(y1, y2, u) + (r() - .5) * 20); } g.lineTo(x2, y2); }, al * (.6 + r() * .4));
    },
    /** 噪音频谱柱：level 0~1 整体强度 */
    noise(x, y, w, h, t, al = 1, level = 1, col) {
      col = col || th().a; const n = 32, bw = w / n;
      for (let i = 0; i < n; i++) { const v = (.25 + .75 * Math.abs(Math.sin(t * 9 + i * 1.7) * Math.sin(t * 5.3 + i * .6))) * level, bh = Math.max(2, v * h);
        fill(col, 10, g => g.rect(x + i * bw + 2, y - bh, bw - 4, bh), al * (.5 + .5 * v)); }
    },
    /** 按钮：pressed 0~1，按下时外圈涟漪 */
    button(x, y, pressed, al = 1, o = {}) {
      const T = th(), col = o.color || T.p, r = 34;
      line(col, 2.5, 12, g => g.arc(x, y, r + 10, 0, 6.3), al); fill(col, 18, g => g.arc(x, y + pressed * 4, r * (1 - pressed * .12), 0, 6.3), al * (.25 + pressed * .6));
      if (pressed > .05) line(col, 2, 14, g => g.arc(x, y, r + 10 + pressed * 60, 0, 6.3), al * (1 - pressed));
      if (o.label) label(o.label, x, y + r + 40, { alpha: al, size: 22 });
    },
    /** 脑回路节点：nodes [{x,y,label,en,on 0~1,color}]，edges [{a,b,type:'excite'|'inhibit',k 0~1,color}] */
    circuit(nodes, edges, t, al = 1) {
      const T = th();
      for (const e of edges) { const A = nodes[e.a], B = nodes[e.b], k = e.k ?? 1, ex = E.lerp(A.x, B.x, k), ey = E.lerp(A.y, B.y, k), col = e.color || (e.type === 'inhibit' ? T.p : T.a);
        line(col, 2.5, 14, g => { g.moveTo(A.x, A.y); g.lineTo(ex, ey); }, al);
        if (k > .95 && e.type === 'inhibit') { const an = Math.atan2(B.y - A.y, B.x - A.x), px = B.x - Math.cos(an) * 70, py = B.y - Math.sin(an) * 70; line(col, 4, 14, g => { g.moveTo(px - Math.sin(an) * 26, py + Math.cos(an) * 26); g.lineTo(px + Math.sin(an) * 26, py - Math.cos(an) * 26); }, al); }
        if (k > 0 && k < 1) fill('#fff', 16, g => g.arc(ex, ey, 6, 0, 6.3), al); }
      for (const n of nodes) { const col = n.color || T.a, on = n.on ?? 1, pr = 1 + .06 * Math.sin(t * 3 + n.x);
        fill(col, 30, g => g.arc(n.x, n.y, 56 * pr, 0, 6.3), al * (.08 + .3 * on)); line(col, 2.5, 16, g => g.arc(n.x, n.y, 56 * pr, 0, 6.3), al * (.35 + .65 * on));
        if (n.label) E.neon(n.label, n.x, n.y + 100, { size: 28, color: col, weight: 700, alpha: al * (.4 + .6 * on) }, -9, 0);
        if (n.en) label(n.en, n.x, n.y + 140, { font: mono, spacing: 4, alpha: al * (.4 + .6 * on), size: 18 }); }
    },

    // ---------------- 比较 / 社会（相对剥夺感） ----------------
    /** 领奖台：三层（左银 中金 右铜），medals 0~1 奖牌落下进度，o: {labels:[左,中,右]} */
    podium(cx, base, al = 1, o = {}) {
      const T = th(), w = 220, H = [150, 230, 100], X = [cx - w, cx, cx + w], C = ['#d9dde3', '#f3d08a', '#c98b3a'], N = ['2', '1', '3'];
      for (let i = 0; i < 3; i++) {
        line(T.p, 2.5, 12, g => g.rect(X[i] - w / 2 + 6, base - H[i], w - 12, H[i]), al);
        E.neon(N[i], X[i], base - H[i] / 2, { size: 64, color: T.p, font: '"Playfair Display"', weight: 700, alpha: al * .7 }, -9, 0);
        const m = Math.max(0, Math.min(1, (o.medals ?? 1) * 3 - [1, 0, 2][i])), my = base - H[i] - 70 - (1 - E.eOut(m)) * 260;
        if (m > 0) { line(C[i], 3, 18, g => g.arc(X[i], my, 34, 0, 6.3), al * m); line(C[i], 1.5, 8, g => { g.moveTo(X[i] - 20, my - 30); g.lineTo(X[i] - 6, my - 60); g.moveTo(X[i] + 20, my - 30); g.lineTo(X[i] + 6, my - 60); }, al * m); fill(C[i], 20, g => g.arc(X[i], my, 18, 0, 6.3), al * m * .5); }
        if (o.labels) label(o.labels[i], X[i], base + 36, { alpha: al, size: 24, color: C[i] });
      }
      line(T.p, 1.5, 0, g => { g.moveTo(cx - w * 1.9, base); g.lineTo(cx + w * 1.9, base); }, al * .6);
      return { gold: [X[1], base - H[1] - 70], silver: [X[0], base - H[0] - 70], bronze: [X[2], base - H[2] - 70], ground: [X[2] + w * .9, base] };
    },
    /** 手机信息流：圆角机身 + 不断上刷的"高光卡片"。speed 刷动速度，o: {glow 卡片亮度} */
    phone(x, y, w, h, t, al = 1, o = {}) {
      const g = c(), T = th(), sp = o.speed ?? 80, r = 36;
      line(T.p, 3, 14, gg => gg.roundRect(x - w / 2, y - h / 2, w, h, r), al);
      line(T.p, 2, 0, gg => { gg.moveTo(x - 40, y - h / 2 + 22); gg.lineTo(x + 40, y - h / 2 + 22); }, al * .6);
      g.save(); g.beginPath(); g.roundRect(x - w / 2 + 14, y - h / 2 + 44, w - 28, h - 62, 18); g.clip();
      const ch = 230, off = (o.scroll ?? t * sp) % ch;
      for (let i = -1; i < Math.ceil(h / ch) + 1; i++) {
        const cy = y - h / 2 + 50 + i * ch - off, k = (i + Math.floor((o.scroll ?? t * sp) / ch)) % 4, cw = w - 56;
        g.save(); g.globalAlpha *= al * (o.glow ?? 1);
        const gr = g.createLinearGradient(0, cy, 0, cy + 140); gr.addColorStop(0, ['#f3d08a', '#ff9ec7', '#8fd3ff', '#c7a4ff'][(k + 4) % 4] + 'cc'); gr.addColorStop(1, '#00000000');
        g.fillStyle = gr; g.beginPath(); g.roundRect(x - cw / 2, cy, cw, 140, 14); g.fill(); g.restore();
        fill('#fff', 10, gg => gg.arc(x - cw / 2 + 22, cy + 166, 12, 0, 6.3), al * .8);
        line(T.p, 4, 0, gg => { gg.moveTo(x - cw / 2 + 46, cy + 162); gg.lineTo(x + cw / 2 - 40 - (k * 23) % 60, cy + 162); gg.moveTo(x - cw / 2 + 46, cy + 182); gg.lineTo(x + 10, cy + 182); }, al * .45);
        E.neon('♥ ' + (1200 + ((k * 3779) % 9000)), x + cw / 2 - 10, cy + 120, { size: 18, color: '#fff', font: mono, weight: 700, align: 'right', alpha: al * .9 }, -9, 0);
      }
      g.restore();
    },
    /** 尺子：从 (x1,y1) 到 (x2,y2) 的刻度尺，k 0~1 伸出长度，o: {unit 每格代表, every 每几格标数字, label} */
    ruler(x1, y1, x2, y2, k = 1, al = 1, o = {}) {
      const T = th(), col = o.color || T.p, L = Math.hypot(x2 - x1, y2 - y1) * k, an = Math.atan2(y2 - y1, x2 - x1), g = c(), wdt = o.width || 46, step = o.step || 20;
      g.save(); g.translate(x1, y1); g.rotate(an);
      g.save(); g.globalAlpha *= al * .12; g.fillStyle = col; g.fillRect(0, -wdt, L, wdt); g.restore();
      line(col, 2, 12, gg => gg.rect(0, -wdt, L, wdt), al);
      for (let i = 0, d = 0; d <= L; i++, d += step) { const big = i % (o.every || 5) === 0; line(col, big ? 2 : 1, 0, gg => { gg.moveTo(d, 0); gg.lineTo(d, -(big ? 22 : 11)); }, al);
        if (big && o.numbers !== false) E.neon(String(i * (o.unit || 1)), d, -32, { size: 14, color: col, font: mono, weight: 500, alpha: al * .8 }, -9, 0); }
      g.restore(); if (o.label) label(o.label, x1 + Math.cos(an) * L / 2, y1 + Math.sin(an) * L / 2 + 40, { alpha: al, color: col, size: 24 });
    },
    // ---------------- 好与坏 / 威胁（负面偏向） ----------------
    /** 脑电/信号轨迹：几条波形叠画，k 0~1 从左往右扫出。o: {traces:[{amp, color, label, alpha}], peakAt 0~1, mark 要标峰值的序号, markText, axis} */
    erp(x1, x2, y, k, al = 1, o = {}) {
      const T = th(), tr = o.traces || [{ amp: 120 }], pk = o.peakAt ?? .42, G = (u, m, s) => Math.exp(-((u - m) ** 2) / (2 * s * s));
      const f = (u, amp, i) => -(amp * G(u, pk, .065) - amp * .22 * G(u, pk - .17, .03) + amp * .18 * G(u, pk + .22, .08)) + Math.sin(u * 90 + i * 2) * 3 + Math.sin(u * 37 + i) * 4;
      if (o.axis !== false) {
        line(T.p + '55', 1.2, 0, g => { g.moveTo(x1, y); g.lineTo(x2, y); for (let i = 0; i <= 10; i++) { const x = E.lerp(x1, x2, i / 10); g.moveTo(x, y - 5); g.lineTo(x, y + 5); } }, al);
        label('0 ms', x1, y + 34, { font: mono, size: 16, alpha: al }); label('1000 ms', x2, y + 34, { font: mono, size: 16, alpha: al });
      }
      const ke = Math.max(0, Math.min(1, k)); if (ke <= 0) return;
      tr.forEach((s, i) => { const col = s.color || [T.b, T.p, T.a][i % 3];
        line(col, s.width || 2.5, 14, g => { for (let u = 0; u <= ke; u += .004) { const x = E.lerp(x1, x2, u), yy = y + f(u, s.amp, i); u ? g.lineTo(x, yy) : g.moveTo(x, yy); } }, al * (s.alpha ?? 1));
        if (ke < 1) fill('#fff', 12, g => g.arc(E.lerp(x1, x2, ke), y + f(ke, s.amp, i), 4, 0, 6.3), al);
        if (s.label && ke >= 1) label(s.label, x2 + 24, y + f(1, s.amp, i) - 30 * (tr.length - 1 - i), { align: 'left', color: col, size: 24, weight: 700, alpha: al * (s.alpha ?? 1) }); });
      if (o.mark != null && ke >= pk + .05) { const s = tr[o.mark], py = y - s.amp, col = s.color || T.a, mk = Math.min(1, (ke - pk - .05) * 6);
        line(col, 1.5, 6, g => { g.setLineDash([6, 8]); g.moveTo(x1, py); g.lineTo(x2, py); }, al * .7 * mk);
        if (o.markText) label(o.markText, E.lerp(x1, x2, pk) + 70, py - 28, { align: 'left', color: col, font: mono, size: 22, spacing: 3, alpha: al * mk }); }
    },
    /** 一碗东西：kind 'cherry'|'roach'，odd: {kind, drop 0~1} 落进去的"异类"，stain 0~1 异类的颜色从它周围晕染开，dim 内容变暗。返回异类落点 */
    bowl(cx, cy, w, al = 1, o = {}) {
      const T = th(), s = w / 11, kind = o.kind || 'cherry', base = o.color || (kind === 'cherry' ? T.b : T.a), oddCol = o.oddColor || (o.odd && o.odd.kind === 'roach' ? T.a : T.b), r = E.R(o.seed || 11), items = [];
      for (let row = 0; row < 4; row++) { const n = 8 - row * 2, yy = cy - row * s * .62; for (let i = 0; i < n; i++) items.push([cx + (i - (n - 1) / 2) * s * .92 + (r() - .5) * s * .2, yy + (r() - .5) * s * .15, (r() - .5) * 1.4]); }
      const ox = cx, oy = cy - 3.6 * s * .62, st = o.stain || 0, reach = st * w * .8;
      const mixC = (a, b, k) => { const h = q => [1, 3, 5].map(i => parseInt(q.slice(i, i + 2), 16)), A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(E.lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };
      for (const [x, y, ang] of items) { const d = Math.hypot(x - ox, y - oy), m = reach > 0 ? Math.max(0, Math.min(1, (reach - d) / (s * 1.5))) : 0; M._item(kind, x, y, s, m > 0 ? mixC(base, oddCol, m) : base, ang, al * (o.dim ?? 1) * (1 - m * .35)); }
      if (o.odd) { const dk = E.eOut(o.odd.drop ?? 1); if (dk > 0) M._item(o.odd.kind, ox, oy - (1 - dk) * 420, s * 1.15, oddCol, .3, al * Math.min(1, dk * 3)); }
      line(T.p, 3, 14, g => { g.ellipse(cx, cy + s * .5, w / 2, w * .07, 0, 0, 6.3); g.moveTo(cx - w / 2, cy + s * .5); g.bezierCurveTo(cx - w / 2, cy + w * .45, cx + w / 2, cy + w * .45, cx + w / 2, cy + s * .5); g.moveTo(cx - w * .16, cy + w * .36); g.lineTo(cx - w * .2, cy + w * .44); g.lineTo(cx + w * .2, cy + w * .44); g.lineTo(cx + w * .16, cy + w * .36); }, al);
      return [ox, oy];
    },
    /** （bowl 内部用）一颗樱桃 / 一只蟑螂 */
    _item(kind, x, y, s, col, ang = 0, al = 1) {
      if (al <= .01) return; const g = c(); g.save(); g.translate(x, y); g.rotate(ang);
      if (kind === 'roach') {
        fill(col + '55', 0, gg => gg.ellipse(0, 0, s * .46, s * .24, 0, 0, 6.3), al);
        line(col, 2, 10, gg => { gg.ellipse(0, 0, s * .46, s * .24, 0, 0, 6.3); gg.moveTo(s * .64, 0); gg.arc(s * .54, 0, s * .1, 0, 6.3);
          for (const k of [-1, 1]) { for (const lx of [-.2, 0, .2]) { gg.moveTo(lx * s, k * s * .2); gg.lineTo((lx - .12) * s, k * s * .42); gg.lineTo((lx - .22) * s, k * s * .5); }
            gg.moveTo(s * .6, k * s * .05); gg.quadraticCurveTo(s * .9, k * s * .1, s * 1.05, k * s * .42); } }, al);
      } else {
        fill(col + '40', 0, gg => gg.arc(0, 0, s * .4, 0, 6.3), al);
        line(col, 2.2, 12, gg => { gg.arc(0, 0, s * .4, 0, 6.3); gg.moveTo(0, -s * .4); gg.quadraticCurveTo(s * .1, -s * .8, s * .32, -s * .95); }, al);
        fill('#fff', 6, gg => gg.arc(-s * .14, -s * .14, s * .07, 0, 6.3), al * .8);
      }
      g.restore();
    },
    /** 暗处的一双眼睛（威胁、"被盯上"）：open 0~1 睁开程度。o: {gap 两眼间距, size, color} */
    eyes(x, y, open, al = 1, o = {}) {
      const col = o.color || th().a, gap = o.gap ?? 130, sz = o.size || 48, h = sz * .42 * Math.max(.02, open);
      if (al <= .01 || open <= .01) return; const g = c();
      for (const k of [-1, 1]) {
        const ex = x + k * gap / 2;
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= al * .45 * open; const gr = g.createRadialGradient(ex, y, 0, ex, y, sz * 2.2); gr.addColorStop(0, col + '88'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.beginPath(); g.arc(ex, y, sz * 2.2, 0, 6.3); g.fill(); g.restore();
        const sh = gg => { gg.moveTo(ex - sz, y + k * sz * .1); gg.quadraticCurveTo(ex, y - h * 2, ex + sz, y - k * sz * .1); gg.quadraticCurveTo(ex, y + h * 2, ex - sz, y + k * sz * .1); };
        fill(col + '66', 18, sh, al); line(col, 2.5, 18, sh, al);
        fill('#000', 0, gg => gg.ellipse(ex, y, sz * .1, h * .9, 0, 0, 6.3), al);
      }
    },
    /** 草丛：x1~x2 一排随风摆动的草叶。o: {h 高度, color, density 间距, seed} */
    grass(x1, x2, y, t, al = 1, o = {}) {
      const r = E.R(o.seed || 5), hh = o.h || 90, sp = o.density || 9, col = o.color || th().p;
      line(col, 1.6, 6, g => { for (let x = x1; x <= x2; x += sp * (.6 + r() * .8)) { const h = hh * (.4 + r() * .8), sw = Math.sin(t * 1.3 + x * .013) * 12 + (r() - .5) * 14; g.moveTo(x, y); g.quadraticCurveTo(x + sw * .3, y - h * .5, x + sw, y - h); } }, al * .7);
    },
    /** 评论区：手机里一列评论（头像、两行字、点赞）。scroll 滚动像素，o: {bad 差评序号, badText, badAlpha 差评透明度, dim 其他评论变暗 0~1, n 条数, shake 抖动, rowH}；返回差评中心坐标 */
    comments(x, y, w, h, scroll, al = 1, o = {}) {
      const g = c(), T = th(), rh = o.rowH || 104, n = o.n || 40; let badPos = null;
      line(T.p, 3, 14, gg => gg.roundRect(x - w / 2, y - h / 2, w, h, 36), al);
      line(T.p, 2, 0, gg => { gg.moveTo(x - 40, y - h / 2 + 22); gg.lineTo(x + 40, y - h / 2 + 22); }, al * .6);
      g.save(); g.beginPath(); g.roundRect(x - w / 2 + 14, y - h / 2 + 44, w - 28, h - 62, 18); g.clip();
      for (let i = 0; i < n; i++) {
        const isBad = i === o.bad, ry = y - h / 2 + 110 + i * rh - scroll; if (ry < y - h / 2 - rh || ry > y + h / 2 + rh) continue;
        const sx = isBad && o.shake ? Math.sin(scroll * 3 + E.R(i)() * 99) * o.shake * 8 : 0, col = isBad ? T.a : T.p, ba = al * (o.badAlpha ?? 1), a2 = isBad ? ba : al * (1 - (o.dim || 0) * .8), lx = x - w / 2 + 40 + sx;
        if (isBad) { badPos = [x, ry]; E.bubbleBox(x + sx, ry, w - 50, rh - 14, T.a, ba * .9); }
        fill(col, 8, gg => gg.arc(lx + 18, ry - 12, 17, 0, 6.3), a2 * .7);
        line(col, 4, 0, gg => { gg.moveTo(lx + 50, ry - 18); gg.lineTo(lx + 130, ry - 18); }, a2 * .6);
        if (isBad && o.badText) E.neon(o.badText, lx + 50, ry + 16, { size: 26, color: T.a, weight: 700, align: 'left', alpha: ba }, -9, 0);
        else line(col, 5, 0, gg => { gg.moveTo(lx + 50, ry + 14); gg.lineTo(lx + 50 + w * (.3 + ((i * 37) % 30) / 100), ry + 14); }, a2 * .45);
        if (!isBad) { const hx = x + w / 2 - 52, hy = ry - 6;
          fill(T.b, 10, gg => { gg.moveTo(hx, hy + 7); gg.bezierCurveTo(hx - 14, hy - 4, hx - 7, hy - 13, hx, hy - 5); gg.bezierCurveTo(hx + 7, hy - 13, hx + 14, hy - 4, hx, hy + 7); }, a2 * .9);
          E.neon(String(3 + (i * 53) % 400), hx, hy + 26, { size: 14, color: T.b, font: mono, weight: 500, alpha: a2 * .8 }, -9, 0); }
      }
      g.restore(); return badPos;
    },
    // ---------------- 关系动态（依恋理论） ----------------
    /** 追逃轨迹：两颗带拖尾的光点沿一条闭合路线一追一躲。phase 0~1 位置（随时间增长即可），gap 两者间距（路线比例），
     *  o: {rx, ry 路线半径, heart 0~1 路线由椭圆变成心形, ca 追者颜色, cb 躲者颜色, len 拖尾长度, labels:['追','躲']}；返回 [[追者x,y],[躲者x,y]] */
    pursuit(cx, cy, phase, gap, al = 1, o = {}) {
      const T = th(), rx = o.rx || 480, ry = o.ry || 240, hk = o.heart || 0, s = rx / 17;
      const path = v => { const u = ((v % 1) + 1) % 1, a = u * 6.2832, ex = Math.sin(a) * rx, ey = -Math.cos(a) * ry,
        hx = 16 * Math.sin(a) ** 3 * s, hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s - s * 2;
        return [cx + E.lerp(ex, hx, hk), cy + E.lerp(ey, hy, hk)]; };
      const kb = 2 + phase, ka = kb - gap, len = o.len ?? .22;
      M.comet(path, ka, al, { color: o.ca || T.a, len, label: o.labels && o.labels[0] });
      M.comet(path, kb, al * (o.fadeB ?? 1), { color: o.cb || T.b, len, label: o.labels && o.labels[1] });
      return [path(ka), path(kb)];
    },

    // ---------------- 扁平人物 / 读数（参考视频"假装看手机"：灰人群 + 一个橙色主角、竖向紧张条、引线问题标签） ----------------
    /** 药丸小人（扁平填充，不是霓虹线）：(x, y) = 脚底中心，h = 身高。o: {hi 高亮主角(强调色+光晕), color, hold:'phone'|'bottle', fill 瓶中余量, arm 0~1 抬手, belly 0~1 肚子鼓, label, bob 呼吸起伏, t} */
    figure(x, y, h, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), col = o.color || (o.hi ? T.a : '#5b6a86'), hr = h * .14, bw = h * .36 + (o.belly || 0) * h * .14, by = y - (o.bob || 0) * Math.sin((o.t || 0) * 3) * 3;
      g.save(); g.globalAlpha *= al;
      if (o.hi) { const gr = g.createRadialGradient(x, by - h * .55, 0, x, by - h * .55, h * .9); gr.addColorStop(0, col + '40'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(x - h, by - h * 1.5, h * 2, h * 1.6); }
      const body = g.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0); body.addColorStop(0, col); body.addColorStop(1, o.hi ? col + 'cc' : col + '99');
      g.fillStyle = body; g.beginPath(); g.roundRect(x - bw / 2, by - h * .7, bw, h * .7, [bw / 2, bw / 2, bw * .22, bw * .22]); g.fill();
      g.beginPath(); g.arc(x, by - h * .7 - hr * 1.25, hr, 0, 6.3); g.fill();
      let hand = null;
      if (o.arm != null) { const a = o.arm, ex = x + bw * .55 + a * h * .06, ey = by - h * .36 - a * h * .16, hx = x + bw * .25 + a * h * .02, hy = by - h * .44 - a * h * .36;
        g.strokeStyle = col; g.lineWidth = h * .07; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x + bw * .3, by - h * .56); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke(); hand = [hx, hy];
        if (o.hold === 'phone') { g.fillStyle = '#0b1220'; g.strokeStyle = '#cfe6ff'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(hx - h * .05, hy - h * .1, h * .1, h * .17, 4); g.fill(); g.stroke(); } }
      g.restore();
      if (hand && o.hold === 'bottle') M.bottle(hand[0], hand[1] + h * .1, h * .3, o.fill ?? 1, al, { tilt: -(o.arm || 0) * 2.1, bubbles: o.t, color: o.hi ? T.b : T.a });
      if (o.label) label(o.label, x, y + 44, { color: o.hi ? T.a : '#a9b4c8', alpha: al, size: 36, weight: 700 });
      return hand;
    },
    /** 可乐瓶（霓虹轮廓 + 液面）：(x, y) = 瓶底中心，h 瓶高，fill 0~1 剩多少，o: {tilt 弧度, color 液体色, bubbles: t 时有气泡上升} */
    bottle(x, y, h, fill = 1, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), w = h * .34, col = o.color || T.a;
      const shape = gg => { gg.moveTo(-w * .5, 0); gg.lineTo(-w * .5, -h * .55); gg.bezierCurveTo(-w * .5, -h * .72, -w * .18, -h * .74, -w * .16, -h * .86); gg.lineTo(-w * .16, -h); gg.lineTo(w * .16, -h); gg.lineTo(w * .16, -h * .86); gg.bezierCurveTo(w * .18, -h * .74, w * .5, -h * .72, w * .5, -h * .55); gg.lineTo(w * .5, 0); gg.closePath(); };
      g.save(); g.translate(x, y); g.rotate(o.tilt || 0); g.globalAlpha *= al;
      g.save(); g.beginPath(); shape(g); g.clip(); const lv = -h * .86 * fill; g.fillStyle = col + '66'; g.fillRect(-w, lv, w * 2, -lv + 2);
      if (o.bubbles != null && fill > .05) { g.fillStyle = '#ffffff99'; for (let i = 0; i < 9; i++) { const bx = (((i * 37) % 10) / 10 - .5) * w * .8, ph = ((o.bubbles * .6 + i / 9) % 1), byy = -ph * h * .86 * fill; g.beginPath(); g.arc(bx, byy, 2 + (i % 3), 0, 6.3); g.fill(); } }
      g.fillStyle = '#ffffff26'; g.fillRect(-w * .5, -h * .42, w, h * .16); g.restore();
      g.strokeStyle = T.p; g.lineWidth = 3; g.shadowColor = T.p; g.shadowBlur = 12; g.lineJoin = 'round'; g.beginPath(); shape(g); g.stroke();
      g.fillStyle = col; g.shadowColor = col; g.fillRect(-w * .2, -h * 1.04, w * .4, h * .06); g.restore();
    },
    /** 竖向读数条（"紧张""快乐值"）：底部 (x, y)，高 h；val 在 [min, max]，零线以上用 color(默认强调色)，零线以下变红。o: {label, en, text 顶部读数, min -.3, max 1, w, size} */
    vmeter(x, y, h, val, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), mn = o.min ?? -.3, mx = o.max ?? 1, w = o.w || 30, Y = v => y - (E.clamp(v, mn, mx) - mn) / (mx - mn) * h, y0 = Y(0), yv = Y(val), neg = val < 0, col = neg ? '#ff4d5e' : (o.color || T.a);
      g.save(); g.globalAlpha *= al; g.fillStyle = 'rgba(255,255,255,.06)'; g.strokeStyle = T.p + '55'; g.lineWidth = 2; g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, w / 2); g.fill(); g.stroke();
      g.save(); g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, w / 2); g.clip(); const gr = g.createLinearGradient(0, y0, 0, y - h); gr.addColorStop(0, T.b); gr.addColorStop(1, col);
      g.fillStyle = neg ? col : gr; g.shadowColor = col; g.shadowBlur = 18; g.fillRect(x - w / 2, Math.min(y0, yv), w, Math.abs(y0 - yv)); g.restore();
      g.strokeStyle = T.p + 'aa'; g.lineWidth = 1.5; for (let i = 0; i <= 10; i++) { const yy = y - h * i / 10; g.beginPath(); g.moveTo(x + w / 2 + 6, yy); g.lineTo(x + w / 2 + (i % 5 ? 14 : 24), yy); g.stroke(); }
      g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w / 2 - 10, y0); g.lineTo(x + w / 2 + 10, y0); g.stroke(); g.restore();
      fill('#fff', 14, gg => gg.arc(x, yv, w * .32, 0, 6.3), al);
      if (o.text != null) E.neon(o.text, x, y - h - 52, { size: o.size || 54, color: col, font: mono, weight: 700, alpha: al }, -9, 0);
      if (o.label) label(o.label + (o.en ? ' ' + o.en : ''), x, y + 40, { alpha: al, size: 28, weight: 700, color: '#c8d3e6' });
    },
    /** 引线标注：从 (x, y) 拉折线到每个标签。items [[文字, dx, dy, 颜色?], ...]，k 0~1 依次出现。适合"表情自然吗？手该放哪？"或给主体打注释 */
    callouts(x, y, items, k, al = 1, o = {}) {
      const g = c(), T = th(), size = o.size || 32;
      items.forEach(([s, dx, dy, col], i) => { const kk = E.clamp(k * items.length - i), a = al * E.eOut(kk); if (a <= .01) return; col = col || T.p;
        const ex = x + dx, ey = y + dy, mx = x + dx * .55, right = dx >= 0;
        line(col, 1.8, 6, gg => { gg.moveTo(x, y); gg.lineTo(E.lerp(x, mx, E.eOut(kk * 2)), E.lerp(y, ey, E.eOut(kk * 2))); if (kk > .5) gg.lineTo(E.lerp(mx, ex, E.eOut((kk - .5) * 2)), ey); }, a);
        fill(col, 8, gg => gg.arc(x, y, 5, 0, 6.3), a);
        if (kk > .6) { g.save(); g.font = `700 ${size}px "Noto Sans SC"`; const tw = g.measureText(s).width + 40; g.restore(); const bx = right ? ex + tw / 2 : ex - tw / 2, ka = a * E.eOut((kk - .6) / .4);
          g.save(); g.globalAlpha *= ka; g.fillStyle = 'rgba(10,18,34,.85)'; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.roundRect(bx - tw / 2, ey - size * .9, tw, size * 1.8, size * .9); g.fill(); g.stroke(); g.restore();
          E.neon(s, bx, ey + 1, { size, color: col, weight: 700, alpha: ka }, -9, 0); } });
    },

    // ---------------- 内心推理（参考视频"明明还不了解"：红线从事实往上长成一棵"脑补树"） ----------------
    /** 推理树：nodes [{id, text, x, y, from:[父id], t0, size, color, under(给关键词加下划线：text 里用 {红字} 标)}]。
     *  每个节点在 t0 时从父节点顶部长出一条红色曲线（.6 秒），然后文字浮现。越往上越"离谱"——适合把观众心里的脑补过程一步步画出来 */
    tree(nodes, t, al = 1, o = {}) {
      const g = c(), T = th(), byId = {}, col = o.color || T.a; nodes.forEach(n => byId[n.id] = n);
      const width = n => { g.save(); g.font = `${n.weight || 700} ${n.size || 40}px ${n.font || T.font}`; const w = g.measureText(n.text.replace(/[{}]/g, '')).width; g.restore(); return w; };
      for (const n of nodes) for (const pid of n.from || []) { const p = byId[pid]; if (!p) continue; const k = E.eOut(E.prog(t, n.t0 - .6, .6)); if (k <= 0) continue;
        const x0 = p.x + (n.x - p.x) * .15, y0 = p.y - (p.size || 40) * .7, x1 = n.x, y1 = n.y + (n.size || 40) * .75;
        line(col, o.lw || 2.4, T.light ? 0 : 8, gg => { gg.moveTo(x0, y0); const steps = 40; for (let i = 1; i <= steps * k; i++) { const u = i / steps, cx = x0 + (x1 - x0) * (u * u * (3 - 2 * u)), cy = y0 + (y1 - y0) * u; gg.lineTo(cx + Math.sin(u * 9 + n.x) * 4 * (1 - u), cy); } }, al * (n.lineAlpha ?? .85)); }
      for (const n of nodes) { const a = al * E.eOut(E.prog(t, n.t0, .5)) * (n.alpha ?? 1); if (a <= .01) continue; const size = n.size || 40, w = width(n);
        const parts = n.text.split(/([{}])/); let x = n.x - w / 2, red = false;
        g.save(); g.font = `${n.weight || 700} ${size}px ${n.font || T.font}`; g.textBaseline = 'middle'; g.globalAlpha *= a; if (o.shadow) { g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 18; }
        for (const s of parts) { if (s === '{') { red = true; continue; } if (s === '}') { red = false; continue; } if (!s) continue; const sw = g.measureText(s).width;
          g.fillStyle = red ? col : (n.color || T.ink || T.p); g.fillText(s, x, n.y + (1 - E.eOut(E.prog(t, n.t0, .5))) * 10);
          if (red && n.under !== false) { g.fillRect(x, n.y + size * .62, sw, Math.max(2, size * .06)); } x += sw; }
        g.restore(); }
    },
    /** 朋友圈动态卡：(x, y) 中心，w 宽。o: {name, time, caption, likes(数字或 null), img:'sketch'|null, highlight 0~1 点赞数高亮} */
    feedPost(x, y, w, t, al = 1, o = {}) {
      if (al <= .01) return; const sc = w / 560, gg0 = c(); gg0.save(); gg0.translate(x, y); gg0.scale(sc, sc); M._feed(0, 0, 560, t, al, o); gg0.restore();
    },
    _feed(x, y, w, t, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), h = w * 1.15, L = x - w / 2, Tp = y - h / 2, card = T.card || '#151b2b', ln = T.line || '#334', ink = T.ink || T.p;
      g.save(); g.globalAlpha *= al; g.shadowColor = 'rgba(60,30,40,.18)'; g.shadowBlur = 40; g.shadowOffsetY = 12; g.fillStyle = card; g.beginPath(); g.roundRect(L, Tp, w, h, 28); g.fill(); g.restore();
      g.save(); g.globalAlpha *= al; g.strokeStyle = ln; g.lineWidth = 2; g.beginPath(); g.roundRect(L, Tp, w, h, 28); g.stroke();
      g.fillStyle = T.light ? '#c9b8b3' : '#4a5a78'; g.beginPath(); g.roundRect(L + 34, Tp + 34, 70, 70, 14); g.fill();
      g.fillStyle = ink; g.font = `700 32px ${T.font}`; g.textBaseline = 'middle'; g.fillText(o.name || '我', L + 126, Tp + 54);
      g.font = `500 34px ${T.font}`; g.fillText(o.caption || '', L + 126, Tp + 106);
      const ix = L + 126, iy = Tp + 150, iw = w - 160, ih = h - 290;
      g.fillStyle = T.light ? '#efe6e0' : '#1b2638'; g.fillRect(ix, iy, iw, ih);
      if (o.img === 'sketch') { g.strokeStyle = T.light ? '#6d5f63' : '#cfe0f5'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();   // 一张铅笔速写：远山、太阳、小房子
        g.moveTo(ix + 20, iy + ih * .72); g.bezierCurveTo(ix + iw * .25, iy + ih * .45, ix + iw * .4, iy + ih * .6, ix + iw * .55, iy + ih * .5); g.bezierCurveTo(ix + iw * .7, iy + ih * .4, ix + iw * .85, iy + ih * .62, ix + iw - 20, iy + ih * .55);
        g.moveTo(ix + iw * .78 + 34, iy + ih * .25); g.arc(ix + iw * .78, iy + ih * .25, 34, 0, 6.3);
        g.rect(ix + iw * .22, iy + ih * .62, 70, 56); g.moveTo(ix + iw * .22 - 8, iy + ih * .62); g.lineTo(ix + iw * .22 + 35, iy + ih * .5); g.lineTo(ix + iw * .22 + 78, iy + ih * .62); g.stroke();
        for (let i = 0; i < 14; i++) { g.globalAlpha = al * .5; g.beginPath(); g.moveTo(ix + 30 + i * 22, iy + ih * .9); g.lineTo(ix + 44 + i * 22, iy + ih * .84); g.stroke(); } g.globalAlpha = al; }
      g.fillStyle = T.muted || '#888'; g.font = `500 28px ${T.font}`; g.fillText(o.time || '', ix, Tp + h - 70);
      if (o.likes != null) { const hl = o.highlight || 0; g.fillStyle = hl > 0 ? T.a : (T.muted || '#888'); g.font = `700 ${34 + hl * 10}px ${T.font}`; g.textAlign = 'right'; g.fillText('♡ ' + o.likes, L + w - 40, Tp + h - 70); }
      g.restore();
    },
    /** 图层标签：左侧一列药丸（看到的 / 猜的 / 认定的…），[[文字, y, 是否强调], ...] */
    layerTags(x, items, al = 1) {
      const g = c(), T = th();
      items.forEach(([s, y, hot, a2 = 1]) => { const a = al * a2; if (a <= .01) return; g.save(); g.font = `700 30px ${T.font}`; const w = g.measureText(s).width + 44; g.globalAlpha *= a;
        g.fillStyle = hot ? T.a : (T.light ? '#2b2427' : '#ffffff22'); g.beginPath(); g.roundRect(x - w / 2, y - 26, w, 52, 26); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y + 1); g.restore(); });
    },

    // ---------------- 预期 / 落差（预期管理起用） ----------------
    /** 期待线 / 现实线：x1~x2 一段区间里，虚线 = 期待（yExp），实线 = 现实（yReal），中间的落差涂色并标数值。
     *  现实低于期待（yReal > yExp）→ 红色"落差"；高于期待 → 金色"惊喜"。o: {expLabel, realLabel, text 数值文字, up 金色, down 红色, size} */
    expectGap(x1, x2, yExp, yReal, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), down = yReal > yExp, col = down ? (o.down || '#ff3b5c') : (o.up || '#ffc861'), size = o.size || 34;
      g.save(); g.globalAlpha *= al * .22; g.fillStyle = col; g.fillRect(x1, Math.min(yExp, yReal), x2 - x1, Math.abs(yReal - yExp)); g.restore();
      line('#d8dde6', 2.5, 0, gg => { gg.setLineDash([12, 10]); gg.moveTo(x1, yExp); gg.lineTo(x2, yExp); }, al);
      line(T.p, 4, 10, gg => { gg.moveTo(x1, yReal); gg.lineTo(x2, yReal); }, al);
      const mx = x2 - 46; if (Math.abs(yReal - yExp) > 24) line(col, 3, 10, gg => { gg.moveTo(mx, yExp); gg.lineTo(mx, yReal); const d = down ? 1 : -1; gg.moveTo(mx - 10, yReal - 14 * d); gg.lineTo(mx, yReal); gg.lineTo(mx + 10, yReal - 14 * d); }, al);
      const sep = Math.max(0, size * .9 - Math.abs(yReal - yExp)) / 2, sgn = yReal >= yExp ? 1 : -1;   // 两条线太近时把标签上下错开
      label(o.expLabel ?? '期待', x1 - 16, yExp - sep * sgn, { align: 'right', size: size * .85, color: '#c9ced8', alpha: al });
      label(o.realLabel ?? '现实', x1 - 16, yReal + sep * sgn, { align: 'right', size: size * .85, color: T.p, alpha: al });
      if (o.text) E.neon(o.text, mx - 20, Math.abs(yReal - yExp) < size * 1.6 ? Math.min(yExp, yReal) - size * .9 : (yExp + yReal) / 2, { size: size * 1.3, color: col, font: mono, weight: 700, align: 'right', alpha: al }, -9, 0);
    },
    /** 神经放电轨迹：一条横向基线，events [{at 0~1, amp(正=放电峰，负=低于基线的凹陷), label, mark:'灯'|'汁'}]，k 0~1 画到哪。
     *  适合"多巴胺 / 预测误差"这类时间上的反应对比；o: {color, title} */
    spikeTrace(x1, x2, y, k, al = 1, o = {}) {
      if (al <= .01) return; const T = th(), col = o.color || T.a, ev = o.events || [], N = 260, xe = E.lerp(x1, x2, E.clamp(k));
      line('#6c7480', 1.2, 0, gg => { gg.moveTo(x1, y); gg.lineTo(x2, y); }, al * .6);
      line(col, 2.6, 12, gg => { for (let i = 0; i <= N; i++) { const u = i / N, x = E.lerp(x1, x2, u); if (x > xe) break; let v = Math.sin(u * 140) * 3 + Math.sin(u * 61 + 1) * 2;
        for (const e of ev) { const d = (u - e.at) / (e.amp > 0 ? .012 : .035); v += e.amp * Math.exp(-d * d); } i ? gg.lineTo(x, y - v) : gg.moveTo(x, y - v); } }, al);
      for (const e of ev) { const x = E.lerp(x1, x2, e.at); if (x > xe + 4) continue;
        if (e.mark) { const isLight = e.mark === '灯'; E.orb(x, y + 70, isLight ? 9 : 7, isLight ? '#ffe08a' : '#8fd3ff', al, 0); label(e.mark === '灯' ? '灯亮' : '果汁', x, y + 112, { size: 26, color: '#c9ced8', alpha: al }); }
        if (e.label) label(e.label, x, y - (e.amp > 0 ? e.amp + 36 : e.amp - 44), { size: 28, color: e.amp < 0 ? '#ff3b5c' : col, alpha: al, weight: 700 }); }
      if (o.title) label(o.title, x1, y - 90, { align: 'left', size: 30, color: '#c9ced8', alpha: al, weight: 700 });
    },
    // ---------------- 2026-10-19 新增（参考视频 1 焦虑型依恋 / 2 "嗯" / 3 数据山脊） ----------------
    /** 划掉改写：大标题 + 一句被划掉的常见说法 + 一句改写后的说法（参考视频 1 "不是太黏人 → 是太怕被丢下"）。
     *  wrong / right 里用 {…} 标出要划掉 / 要高亮的部分。时序（相对 t0）：标题逐字弹入 0~.9 → wrong .9 → 划线 1.7 → right 2.3。
     *  o: {size 标题字号, sub 副句字号, gap 行距, color 标题色, hot 高亮色, strikeAt / rightAt 自定义时刻} */
    strikeFix(x, y, title, wrong, right, t, t0, al = 1, o = {}) {
      if (al <= .01 || t < t0) return; const g = c(), T = th(), size = o.size || 132, sub = o.sub || 56, gap = o.gap || 96, col = o.color || T.b, hot = o.hot || T.a;
      const chars = [...title], tAt = o.strikeAt ?? 1.7, rAt = o.rightAt ?? 2.3;
      g.save(); g.font = `${T.weight} ${size}px ${T.font}`; const tw = g.measureText(title).width; g.restore();
      let cx = x - tw / 2;
      chars.forEach((ch, i) => { g.save(); g.font = `${T.weight} ${size}px ${T.font}`; const w = g.measureText(ch).width; g.restore();
        const k = E.prog(t, t0 + i * .14, .45), sc = 1 + (1 - E.eOut(k)) * .7;
        if (k > 0) { g.save(); g.translate(cx + w / 2, y); g.scale(sc, sc); E.neon(ch, 0, 0, { size, color: col, glow: col, alpha: al * E.eOut(k) }, -9, 0); g.restore(); }
        cx += w; });
      const seg = (s, yy, sz, t1, mode) => {   // mode: 'strike' | 'hot'
        const a = al * E.eOut(E.prog(t, t0 + t1, .45)); if (a <= .01) return; const parts = s.split(/([{}])/);
        g.save(); g.font = `700 ${sz}px ${T.font}`; const w = g.measureText(s.replace(/[{}]/g, '')).width; let xx = x - w / 2, mark = false;
        g.textBaseline = 'middle'; g.globalAlpha *= a;
        for (const p of parts) { if (p === '{') { mark = true; continue; } if (p === '}') { mark = false; continue; } if (!p) continue; const pw = g.measureText(p).width;
          if (mode === 'strike' && mark) { const ks = E.eOut(E.prog(t, t0 + tAt, .4)); g.fillStyle = ks > 0 ? `rgba(160,160,170,${1 - ks * .45})` : T.p; g.fillText(p, xx, yy);
            if (ks > 0) { g.save(); g.strokeStyle = hot; g.lineWidth = Math.max(3, sz * .07); g.shadowColor = hot; g.shadowBlur = 10; g.beginPath(); g.moveTo(xx - 6, yy + 2); g.lineTo(xx - 6 + (pw + 12) * ks, yy - 2); g.stroke(); g.restore(); } }
          else { g.fillStyle = mode === 'hot' && mark ? hot : T.p; if (mode === 'hot' && mark) { g.shadowColor = hot; g.shadowBlur = 14; } g.fillText(p, xx, yy); g.shadowBlur = 0; }
          xx += pw; }
        g.restore(); };
      if (wrong) seg(wrong, y + gap, sub, .9, 'strike');
      if (right) { const kr = E.prog(t, t0 + rAt, .45), s2 = 1 + (1 - E.eOut(kr)) * .5; g.save(); g.translate(x, y + gap * 1.85); g.scale(s2, s2); g.translate(-x, -(y + gap * 1.85)); seg(right, y + gap * 1.85, sub * 1.15, rAt, 'hot'); g.restore(); }
    },
    /** 一字炸开（参考视频 2 的"嗯"）：一个字放大居中 → 霓虹圈画出来 → 一圈脑补念头沿引线依次长出 → 圈变色、字故障抖动 → 炸成碎片和光点 →（可选）留下一个核心字。
     *  时序相对 t0：字 0~.6，圈 .5~1.2，念头 1.2 起每 o.every 秒一条，炸开在 o.burstAt（默认 1.2 + 念头数×every + .8）。
     *  o: {size 字号, R 圈半径, thoughts:[字符串...], every, burstAt, color 圈色, burstColor 炸开色, core 炸完留下的字, coreColor} → 返回炸开时刻 */
    wordBurst(x, y, ch, t, t0, al = 1, o = {}) {
      const g = c(), T = th(), size = o.size || 300, R = o.R || size * .78, th_ = o.thoughts || [], every = o.every ?? .35;
      const tb = t0 + (o.burstAt ?? (1.2 + th_.length * every + .8)), u = t - t0, col0 = o.color || T.a, col1 = o.burstColor || '#ff4fa3';
      if (al <= .01 || u < 0) return tb;
      const pre = E.clamp((t - (tb - .9)) / .9), post = Math.max(0, t - tb), col = pre > .5 ? col1 : col0;
      // 念头：均匀分布在圈外，引线从圈边长出
      th_.forEach((s, i) => { const ti = t0 + 1.2 + i * every, k = E.eOut(E.prog(t, ti, .4)); if (k <= 0) return;
        const ang = -Math.PI / 2 + (i + .5) / th_.length * Math.PI * 2 + Math.sin(i * 2.3) * .18, r2 = R * (1.45 + (i % 3) * .2) + post * 900;
        const ex = x + Math.cos(ang) * r2, ey = y + Math.sin(ang) * r2 * .78, sx = x + Math.cos(ang) * R, sy = y + Math.sin(ang) * R, a = al * k * (1 - E.clamp(post / .7));
        if (a <= .01) return; line(col, 1.6, 6, gg => { gg.moveTo(sx, sy); gg.lineTo(E.lerp(sx, ex, k), E.lerp(sy, ey, k)); }, a * .8);
        E.neon(s, ex + (Math.cos(ang) >= 0 ? 12 : -12), ey, { size: o.tsize || 36, color: col, weight: 700, align: Math.cos(ang) >= 0 ? 'left' : 'right', alpha: a }, -9, 0); });
      // 霓虹圈
      const kr = E.eOut(E.prog(t, t0 + .5, .7)), rr = R * (1 + pre * .04 * Math.sin(t * 40)) + post * 1400;
      if (kr > 0) line(col, 5, 26, gg => gg.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + kr * 6.2832), al * (1 - E.clamp(post / .5)));
      // 字：进场放大，炸前故障抖动（RGB 错位 + 横向切片），炸后碎成横条飞散
      const ka = E.eOut(E.prog(t, t0, .6)), sc = 1.25 - .25 * ka, gl = pre * pre;
      if (post < .9) { const g2 = g; g2.save(); g2.font = `${T.weight} ${size * sc}px ${T.font}`; g2.textAlign = 'center'; g2.textBaseline = 'middle';
        const strips = 9, h = size * 1.1;
        for (let i = 0; i < strips; i++) { const y0 = y - h / 2 + i * h / strips, dir = i % 2 ? 1 : -1, jit = gl * Math.sin(t * 57 + i * 9) * 26;
          const fx = post > 0 ? dir * (200 + i * 60) * E.eOut(post / .9) : jit, fy = post > 0 ? (i - strips / 2) * 50 * E.eOut(post / .9) : 0, fa = al * ka * (1 - E.clamp(post / .9));
          g2.save(); g2.beginPath(); g2.rect(x - size, y0, size * 2, h / strips + 1); g2.clip(); g2.globalAlpha *= fa;
          if (gl > .05) { g2.globalCompositeOperation = 'lighter'; g2.fillStyle = 'rgba(255,40,120,.75)'; g2.fillText(ch, x + fx - 10 * gl, y + fy); g2.fillStyle = 'rgba(40,220,255,.75)'; g2.fillText(ch, x + fx + 10 * gl, y + fy); g2.globalCompositeOperation = 'source-over'; }
          g2.shadowColor = pre > .5 ? col1 : '#ffffff'; g2.shadowBlur = 18; g2.fillStyle = pre > .6 ? col1 : T.p; g2.fillText(ch, x + fx, y + fy); g2.restore(); }
        g2.restore(); }
      // 炸开的光点
      if (post > 0 && post < 1.6) for (let i = 0; i < 90; i++) { const ang = i * 2.3999, v = 300 + (i * 37 % 100) * 9, d = v * E.eOut(post / 1.6);
        fill(i % 3 ? col1 : '#ffffff', 10, gg => gg.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d * .8, 2 + i % 3, 0, 6.3), al * (1 - post / 1.6)); }
      if (post > 0 && post < .25) { g.save(); g.globalAlpha = al * (1 - post / .25) * .6; g.fillStyle = col1; g.fillRect(-4000, -4000, 8000, 8000); g.restore(); }
      // 核心字
      if (o.core && post > .5) { const kc = E.eOut(E.prog(t, tb + .5, .7)); E.neon(o.core, x, y, { size: size * (1.15 - .15 * kc), color: o.coreColor || col1, glow: o.coreColor || col1, alpha: al * kc }, -9, 0); }
      return tb;
    },
    /** 发光小人（参考视频 1）：白色圆头圆肢、柔光，手里手机发蓝光照脸。pose: 'sit' 坐床边 | 'lie' 躺着举手机 | 'crouch' 抱膝 | 'stand'。
     *  (x, footY) = 脚底/身体落点，h = 身高。o: {phone 0~1 手机光, stress 0~1 头顶焦虑波纹, think 0~1 脑补云（里面转圈）, color, face 0~1 朝向(1 右)} → 返回头部坐标 */
    glowSitter(x, footY, h, pose, t, al = 1, o = {}) {
      if (al <= .01) return [x, footY - h]; const T = th(), col = o.color || '#f2eee6', b = Math.sin(t * 1.6) * h * .006, fdir = o.face ?? 1;
      const P = { // 关节（单位 = 身高，x 右正，y 上正）
        sit: { head: [.12, .97], sh: [.06, .8], hip: [0, .44], knee: [.3, .46], foot: [.32, 0], hand: [.26, .62], elbow: [.2, .6] },
        stand: { head: [0, .92], sh: [0, .76], hip: [0, .45], knee: [.01, .22], foot: [.02, 0], hand: [.16, .56], elbow: [.1, .6] },
        crouch: { head: [.08, .62], sh: [.02, .5], hip: [-.04, .14], knee: [.2, .4], foot: [.22, 0], hand: [.22, .3], elbow: [.16, .38] },
        lie: { head: [-.48, .16], sh: [-.34, .14], hip: [0, .12], knee: [.24, .34], foot: [.46, .06], hand: [-.3, .5], elbow: [-.24, .3] },
      }[pose] || {};
      const J = k => [x + P[k][0] * h * fdir, footY - P[k][1] * h - (k === 'foot' ? 0 : b)];
      const limb = (pts, w) => line(col, w, 22, gg => { pts.forEach((k, i) => { const [px, py] = J(k); i ? gg.lineTo(px, py) : gg.moveTo(px, py); }); }, al);
      limb(['sh', 'hip'], h * .16); limb(['hip', 'knee', 'foot'], h * .1); limb(['sh', 'elbow', 'hand'], h * .07);
      const [hx, hy] = J('head'); fill(col, 26, gg => gg.arc(hx, hy, h * .095, 0, 6.3), al);
      if (o.phone) { const [px, py] = J('hand'); E.orb(px, py, h * .018, '#7cc8ff', al * o.phone, t);
        const gr = E.ctx.createRadialGradient(px, py, 0, px, py, h * .35); gr.addColorStop(0, `rgba(120,200,255,${.35 * o.phone * al})`); gr.addColorStop(1, 'rgba(120,200,255,0)'); E.ctx.save(); E.ctx.globalCompositeOperation = 'lighter'; E.ctx.fillStyle = gr; E.ctx.fillRect(px - h * .35, py - h * .35, h * .7, h * .7); E.ctx.restore(); }
      if (o.stress) for (let i = 0; i < 3; i++) line(col, 3, 8, gg => { const sx = hx - h * .05 + i * h * .05, sy = hy - h * .14; for (let j = 0; j <= 12; j++) { const v = j / 12; gg[j ? 'lineTo' : 'moveTo'](sx + Math.sin(v * 9 + t * 6 + i) * h * .012, sy - v * h * .08); } }, al * o.stress);
      if (o.think) { const k = E.eOut(o.think), cx = hx + h * .5 * fdir, cy = hy - h * .38, r = h * .26 * k;
        [[.25, .2, .03], [.45, .1, .05]].forEach(([u, v, rr]) => line(col, 2, 8, gg => gg.arc(E.lerp(hx, cx, u), E.lerp(hy, cy, u) - v * h * .2, h * rr, 0, 6.3), al * k));
        line(col, 2.5, 10, gg => { for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832, w = r * (1 + .12 * Math.sin(a * 7)); gg[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * w * 1.25, cy + Math.sin(a) * w * .9); } }, al * k);
        for (let i = 0; i < 4; i++) { const a = t * 1.4 + i * 1.57; line(T.b, 1.8, 10, gg => gg.ellipse(cx, cy, r * .75, r * .32, a, 0, 6.3), al * k * .7); } }
      return [hx, hy];
    },
    /** 数据山脊（参考视频 3）：一条发光山脊，dots 颗白点一颗颗落到山顶附近（分布越靠峰越密），可插一面小旗标出孤点。
     *  k 0~1 落了多少；o: {peak 0~1 峰位置, height 峰高, dots 数量, spread 分布宽, flag:{at 0~1, label}, seed, back 远山层数} */
    ridge(x1, x2, base, t, k, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), pk = o.peak ?? .5, hgt = o.height || 420, N = 220, sp = o.spread ?? .16, R = E.R(o.seed || 7);
      const yAt = (u, s = 0) => base - hgt * Math.exp(-(((u - pk) / .26) ** 2)) - 26 * Math.sin(u * 23 + s) - 14 * Math.sin(u * 61 + s * 2);
      for (let l = (o.back ?? 2); l >= 1; l--) { g.save(); g.globalAlpha = al * .25 / l; g.fillStyle = T.b; g.beginPath(); g.moveTo(x1, base); for (let i = 0; i <= N; i++) { const u = i / N; g.lineTo(E.lerp(x1, x2, u), base - (base - yAt((u + l * .23) % 1, l * 3)) * .45); } g.lineTo(x2, base); g.closePath(); g.fill(); g.restore(); }
      g.save(); g.globalAlpha = al; const gr = g.createLinearGradient(0, base - hgt, 0, base); gr.addColorStop(0, T.b + '88'); gr.addColorStop(1, T.b + '10'); g.fillStyle = gr; g.beginPath(); g.moveTo(x1, base);
      for (let i = 0; i <= N; i++) { const u = i / N; g.lineTo(E.lerp(x1, x2, u), yAt(u)); } g.lineTo(x2, base); g.closePath(); g.fill(); g.restore();
      line('#e8f0ff', 2.4, 14, gg => { for (let i = 0; i <= N; i++) { const u = i / N; gg[i ? 'lineTo' : 'moveTo'](E.lerp(x1, x2, u), yAt(u)); } }, al);
      const n = o.dots ?? 120, stack = {};
      for (let i = 0; i < n; i++) { const r1 = R(), r2 = R(), u = E.clamp(pk + (r1 + r2 - 1) * sp * 1.6), kk = E.clamp(k * n - i); if (kk <= 0) continue;
        const bx = Math.round(u * 80), lvl = stack[bx] = (stack[bx] || 0) + 1, xx = E.lerp(x1, x2, u), yy = yAt(u) - 7 - (lvl - 1) * 9, fy = E.lerp(yy - 260, yy, E.eOut(kk));
        fill('#ffffff', 8, gg => gg.arc(xx, fy, 4.2, 0, 6.3), al * E.eOut(kk)); }
      if (o.flag) { const u = o.flag.at, fx = E.lerp(x1, x2, u), fy = yAt(u); E.orb(fx, fy - 8, 6, T.p, al, t);
        line(T.p, 2, 6, gg => { gg.moveTo(fx, fy - 10); gg.lineTo(fx, fy - 90); }, al); fill(T.a, 8, gg => { gg.moveTo(fx, fy - 90); gg.lineTo(fx + 46, fy - 78); gg.lineTo(fx, fy - 66); }, al);
        if (o.flag.label) E.neon(o.flag.label, fx + 58, fy - 80, { size: 34, color: T.p, weight: 700, align: 'left', font: '"Playfair Display"', alpha: al }, -9, 0); }
    },
    // ---------------- 扁平粗线小人 + 墙上的影子（参考视频 1 的画风；傲慢起用："影子 = 自我估计"） ----------------
    /** 扁平粗线小人：奶白圆头、圆头粗四肢，占画面大块面积。pose: 'stand' | 'proud'(挺胸叉腰抬下巴) | 'point'(手指前方) | 'sit' | 'crouch'(抱膝) | 'walk'(o.phase 步态)。
     *  (x, footY) 脚底中心，h 身高。o: {color, face:'smug'|'sad'|'calm'|null, crown 0~1, dir 朝向(1 右 -1 左), phase,
     *  shadow:{k 影子相对身高的倍数, col, crown 0~1, crack 0~1, dx 影子水平偏移, al}} —— 影子先画在身后的墙上（以脚底为基点放大）。返回头部坐标 */
    flatMan(x, footY, h, pose, t, al = 1, o = {}) {
      if (al <= .01) return [x, footY - h * .88]; const g = c(), dir = o.dir ?? 1, ph = o.phase ?? t * 6, br = Math.sin(t * 1.7) * .006;
      const P = {
        stand: { head: [0, .88], sh: [0, .74], hip: [0, .45], hl: [-.055, .44], hr: [.055, .44], fl: [-.06, 0], fr: [.06, 0], kl: [-.06, .22], kr: [.06, .22], al1: [-.1, .72], el: [-.13, .6], hdl: [-.12, .47], ar1: [.1, .72], er: [.13, .6], hdr: [.12, .47] },
        proud: { head: [-.03, .9], sh: [-.01, .75], hip: [.01, .45], hl: [-.05, .44], hr: [.07, .44], fl: [-.12, 0], fr: [.14, 0], kl: [-.09, .22], kr: [.11, .22], al1: [-.11, .73], el: [-.22, .6], hdl: [-.1, .5], ar1: [.09, .73], er: [.21, .6], hdr: [.11, .5] },
        point: { head: [.01, .88], sh: [0, .74], hip: [0, .45], hl: [-.055, .44], hr: [.055, .44], fl: [-.07, 0], fr: [.08, 0], kl: [-.06, .22], kr: [.07, .22], al1: [-.1, .72], el: [-.13, .6], hdl: [-.12, .47], ar1: [.1, .72], er: [.26, .74], hdr: [.42, .76] },
        sit: { head: [.04, .78], sh: [.02, .64], hip: [0, .36], hl: [-.03, .36], hr: [.03, .36], kl: [.24, .37], kr: [.27, .37], fl: [.25, 0], fr: [.3, 0], al1: [-.04, .62], el: [.1, .48], hdl: [.2, .46], ar1: [.06, .62], er: [.16, .5], hdr: [.25, .48] },
        crouch: { head: [.06, .56], sh: [.02, .44], hip: [-.04, .16], hl: [-.04, .16], hr: [-.02, .16], kl: [.16, .36], kr: [.19, .34], fl: [.2, 0], fr: [.24, 0], al1: [0, .42], el: [.12, .3], hdl: [.22, .3], ar1: [.04, .42], er: [.16, .28], hdr: [.25, .28] },
      };
      let J = P[pose] || P.stand;
      if (pose === 'walk') { const s = Math.sin(ph) * .1, s2 = Math.sin(ph + Math.PI) * .1; J = { ...P.stand, fl: [-.03 + s, 0], fr: [.03 + s2, 0], kl: [-.03 + s * .5, .22], kr: [.03 + s2 * .5, .22], hdl: [-.12 - s * .6, .48], hdr: [.12 - s2 * .6, .48], el: [-.13 - s * .3, .6], er: [.13 - s2 * .3, .6] }; }
      const draw = (sx, sy, k, col, alpha, isShadow) => {
        const Q = n => [sx + J[n][0] * h * k * dir, sy - J[n][1] * h * k * (1 + (n === 'head' || n === 'sh' ? br : 0)) - (pose === 'walk' && n !== 'fl' && n !== 'fr' ? Math.abs(Math.sin(ph)) * h * k * .015 : 0)];
        const lw = w => Math.max(2, w * h * k);
        const seg = (pts, w) => { g.save(); g.globalAlpha *= alpha; g.strokeStyle = col; g.lineWidth = lw(w); g.lineCap = g.lineJoin = 'round'; if (!isShadow && !th().light) { g.shadowColor = col; g.shadowBlur = 10; } g.beginPath(); pts.forEach((n, i) => { const [px, py] = Q(n); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); g.restore(); };
        seg(['al1', 'el', 'hdl'], .075); seg(['hl', 'kl', 'fl'], .095); seg(['sh', 'hip'], .2); seg(['hr', 'kr', 'fr'], .095); seg(['ar1', 'er', 'hdr'], .075);
        const [hx, hy] = Q('head'), hr = h * k * .105; g.save(); g.globalAlpha *= alpha; g.fillStyle = col; if (!isShadow) { g.shadowColor = col; g.shadowBlur = 10; } g.beginPath(); g.arc(hx, hy, hr, 0, 6.3); g.fill(); g.restore();
        return [hx, hy, hr];
      };
      const crown = (hx, hy, hr, k, col, alpha) => { if (k <= .01) return; g.save(); g.globalAlpha *= alpha * k; g.fillStyle = col; g.beginPath(); const w = hr * 1.5, y0 = hy - hr * .78, y1 = y0 - hr * 1.0 * k;
        g.moveTo(hx - w / 2, y0); g.lineTo(hx - w / 2, y1 + hr * .25); g.lineTo(hx - w / 4, y1 + hr * .55); g.lineTo(hx, y1); g.lineTo(hx + w / 4, y1 + hr * .55); g.lineTo(hx + w / 2, y1 + hr * .25); g.lineTo(hx + w / 2, y0); g.closePath(); g.fill(); g.restore(); };
      const S = o.shadow;
      if (S && (S.al ?? 1) > .01) { const sc = S.col || 'rgba(18,0,4,.88)', [hx, hy, hr] = draw(x + (S.dx || 0), footY, S.k || 2, sc, al * (S.al ?? 1), true); crown(hx, hy, hr, S.crown || 0, sc, al * (S.al ?? 1));
        if (S.crack) { const r = E.R(5); g.save(); g.globalAlpha *= al * (S.al ?? 1); g.strokeStyle = S.crackCol || '#e0102a'; g.lineWidth = 3.5; g.shadowColor = g.strokeStyle; g.shadowBlur = 14; g.lineCap = 'round';
          for (let b = 0; b < 6; b++) { let px = hx + (r() - .5) * hr, py = hy + hr * (1 + r() * 3), a = r() * 6.28; g.beginPath(); g.moveTo(px, py); for (let i = 0; i < 10 * S.crack; i++) { a += (r() - .5) * 1.1; px += Math.cos(a) * hr * .45; py += Math.sin(a) * hr * .45; g.lineTo(px, py); } g.stroke(); } g.restore(); } }
      const col = o.color || '#efe6d6', [hx, hy, hr] = draw(x, footY, 1, col, al, false);
      crown(hx, hy, hr, o.crown || 0, '#e9b949', al);
      if (o.face) { g.save(); g.globalAlpha *= al; g.strokeStyle = '#2a1012'; g.fillStyle = '#2a1012'; g.lineWidth = Math.max(2, hr * .1); g.lineCap = 'round'; const ex = hr * .38, ey = hy - hr * .1;
        if (o.face === 'smug') { for (const s of [-1, 1]) { g.beginPath(); g.moveTo(hx + s * ex - hr * .16, ey); g.lineTo(hx + s * ex + hr * .16, ey); g.stroke(); } g.beginPath(); g.moveTo(hx - hr * .3, hy + hr * .38); g.quadraticCurveTo(hx + hr * .1, hy + hr * .5, hx + hr * .38, hy + hr * .26); g.stroke(); }
        else if (o.face === 'sad') { for (const s of [-1, 1]) { g.beginPath(); g.arc(hx + s * ex, ey, hr * .07, 0, 6.3); g.fill(); } g.beginPath(); g.arc(hx, hy + hr * .55, hr * .28, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
        else { for (const s of [-1, 1]) { g.beginPath(); g.arc(hx + s * ex, ey, hr * .07, 0, 6.3); g.fill(); } g.beginPath(); g.moveTo(hx - hr * .22, hy + hr * .4); g.lineTo(hx + hr * .22, hy + hr * .4); g.stroke(); }
        g.restore(); }
      return [hx, hy];
    },
    /** 斜打的光束（参考视频 1 那道淡淡的光）：从 (x, y) 往 ang 方向打出一道梯形光，w0 起始宽，w1 末端宽，len 长度 */
    lightBeam(x, y, ang, len, w0, w1, al = 1, col = '255,230,220') {
      if (al <= .01) return; const g = c(), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, ex = x + dx * len, ey = y + dy * len;
      const gr = g.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, `rgba(${col},${.16 * al})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.save(); g.globalCompositeOperation = th().light ? 'source-over' : 'lighter'; g.fillStyle = gr; g.beginPath(); g.moveTo(x + nx * w0 / 2, y + ny * w0 / 2); g.lineTo(ex + nx * w1 / 2, ey + ny * w1 / 2); g.lineTo(ex - nx * w1 / 2, ey - ny * w1 / 2); g.lineTo(x - nx * w0 / 2, y - ny * w0 / 2); g.closePath(); g.fill(); g.restore();
    },
    // ---------------- 真实图片（2026-10-19 起：可以用网上真实案例图片，放在项目 assets/，来源记在 assets/credits.json） ----------------
    /** 注册 / 取一张图片（相对 index.html 的路径，如 'assets/svenson.jpg'）。在 build() 里先调用一次，渲染器会等它加载完 */
    img(src) { const C = M._imgs || (M._imgs = {}); if (!C[src]) { const im = new Image(); im.src = src; C[src] = im; } return C[src]; },
    /** 等所有注册过的图片加载完（render.mjs / gallery.mjs 在 setup 之后调用） */
    ready() { return Promise.all(Object.values(M._imgs || {}).map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve())); },
    /** 预处理过的图片缓存：fx 'duotone'（按配色上双色调：暗部 → 背景色，亮部 → o.light）| 'halftone'（网点）| 'mono'（去色）| null 原图 */
    _fx(src, fx, dark, light) {
      const key = [src, fx, dark, light].join('|'), C = M._fxc || (M._fxc = {}); if (C[key]) return C[key]; const im = M.img(src); if (!im.complete || !im.naturalWidth) return null;
      const w = Math.min(1600, im.naturalWidth), h = Math.round(im.naturalHeight * w / im.naturalWidth), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0, w, h);
      if (fx) { const d = g.getImageData(0, 0, w, h), p = d.data, hx = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), D = hx(dark), Lc = hx(light);
        for (let i = 0; i < p.length; i += 4) { let l = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11) / 255; l = l * l * (3 - 2 * l);
          if (fx === 'mono') { p[i] = p[i + 1] = p[i + 2] = l * 255; } else for (let k = 0; k < 3; k++) p[i + k] = D[k] + (Lc[k] - D[k]) * l; }
        g.putImageData(d, 0, 0);
        if (fx === 'halftone') { const src2 = g.getImageData(0, 0, w, h).data, step = Math.max(6, Math.round(w / 160)); g.fillStyle = dark; g.fillRect(0, 0, w, h); g.fillStyle = light;
          for (let y = 0; y < h; y += step) for (let x = (y / step % 2) * step / 2; x < w; x += step) { const i = (Math.min(h - 1, y) * w + Math.min(w - 1, Math.round(x))) * 4, l = (src2[i] - D[0]) / Math.max(1, Lc[0] - D[0]); const r = step * .55 * Math.sqrt(Math.max(0, Math.min(1, l))); if (r > .4) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); } } } }
      return (C[key] = cv);
    },
    /** 真实照片：(x, y) 中心，w×h 画框，裁切填满。o: {
     *   fx: 'duotone'|'halftone'|'mono'|null, dark, light（双色调两端颜色，默认背景近黑 + 配色主色）,
     *   kb: [起始缩放, 结束缩放], kbT: [t0, t1], fx0/fy0 → fx1/fy1（0~1 焦点，镜头在照片里慢慢推移）,
     *   reveal 0~1 + revealMode: 'develop'（暗房显影：从黑里慢慢浮出来，先出高光）| 'scan'（扫描线自上而下）| 'tear'（从中间撕开）,
     *   frame: 'polaroid'（白边 + 下方手写说明 o.caption）| 'evidence'（档案照：胶带、红色图钉、编号 o.tag）| 'plain' | null, rot 旋转,
     *   redact: [[x0,y0,x1,y1](0~1), ...] 黑条打码, credit 右下角小字来源 } */
    photo(src, x, y, w, h, t, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), cv = M._fx(src, o.fx || null, o.dark || '#0a0204', o.light || T.p); if (!cv) return;
      const [t0, t1] = o.kbT || [0, 10], u = E.clamp((t - t0) / Math.max(.01, t1 - t0)), [z0, z1] = o.kb || [1.02, 1.12], z = E.lerp(z0, z1, u);
      const fx = E.lerp(o.fx0 ?? .5, o.fx1 ?? .5, u), fy = E.lerp(o.fy0 ?? .5, o.fy1 ?? .5, u), s = Math.max(w / cv.width, h / cv.height) * z, sw = w / s, sh = h / s;
      const sx = E.clamp(fx * cv.width - sw / 2, 0, cv.width - sw), sy = E.clamp(fy * cv.height - sh / 2, 0, cv.height - sh);
      g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(o.rot || 0);
      if (o.frame === 'polaroid') { g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.fillStyle = '#f3efe6'; g.fillRect(-w / 2 - 22, -h / 2 - 22, w + 44, h + 120); g.restore(); }
      if (o.frame === 'evidence') { g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 24; g.fillStyle = '#e9e2d4'; g.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24); g.restore(); }
      g.save(); g.beginPath(); const rv = o.reveal ?? 1, mode = o.revealMode || 'develop';
      if (mode === 'scan') g.rect(-w / 2, -h / 2, w, h * rv); else if (mode === 'tear') { const k = rv * w / 2; g.rect(-k, -h / 2, k * 2, h); } else g.rect(-w / 2, -h / 2, w, h);
      g.clip(); g.fillStyle = '#050102'; g.fillRect(-w / 2, -h / 2, w, h);
      if (mode === 'develop') { g.globalAlpha *= E.clamp(rv * 1.3); g.filter = `contrast(${1 + 1.5 * (1 - rv)}) brightness(${.35 + .65 * rv})`; }
      g.drawImage(cv, sx, sy, sw, sh, -w / 2, -h / 2, w, h); g.filter = 'none';
      if (mode === 'scan' && rv < 1) { g.globalAlpha = al; g.fillStyle = T.a; g.shadowColor = T.a; g.shadowBlur = 18; g.fillRect(-w / 2, -h / 2 + h * rv - 2, w, 4); }
      for (const [a0, b0, a1, b1] of o.redact || []) { g.globalAlpha = al; g.fillStyle = '#000'; g.fillRect(-w / 2 + a0 * w, -h / 2 + b0 * h, (a1 - a0) * w, (b1 - b0) * h); }
      g.restore();
      if (mode === 'tear' && rv < 1) { g.strokeStyle = '#f3efe6'; g.lineWidth = 3; for (const sgn of [-1, 1]) { g.beginPath(); for (let i = 0; i <= 20; i++) { const yy = -h / 2 + i * h / 20, xx = sgn * rv * w / 2 + (i % 2 ? 6 : -6); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } }
      if (o.frame === 'polaroid' && o.caption) E.neon(o.caption, 0, h / 2 + 52, { size: 40, color: '#2a2224', font: '"Noto Serif SC"', weight: 900 }, -9, 0);
      if (o.frame === 'evidence') { g.fillStyle = 'rgba(240,230,200,.55)'; g.save(); g.translate(-w / 2 + 10, -h / 2 - 4); g.rotate(-.5); g.fillRect(-50, -14, 100, 28); g.restore(); g.save(); g.translate(w / 2 - 10, -h / 2 - 4); g.rotate(.5); g.fillRect(-50, -14, 100, 28); g.restore();
        g.fillStyle = '#d0142c'; g.shadowColor = '#000'; g.shadowBlur = 8; g.beginPath(); g.arc(0, -h / 2 - 2, 11, 0, 6.3); g.fill(); g.shadowBlur = 0;
        if (o.tag) { g.fillStyle = '#e9e2d4'; g.fillRect(w / 2 - 150, h / 2 - 54, 150, 54); g.fillStyle = '#1a1214'; g.font = '700 26px "JetBrains Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.tag, w / 2 - 75, h / 2 - 27); } }
      if (o.credit) { g.font = '500 18px "JetBrains Mono"'; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(o.credit, w / 2 - 8, h / 2 - 6); }
      g.restore();
    },
    /** 证据墙红线：在几张照片 / 节点之间拉红绳，pts [[x,y],...] 依次连，k 0~1 拉到哪 */
    redString(pts, k, al = 1, col = '#d0142c') {
      if (al <= .01 || pts.length < 2) return; const g = c(), n = pts.length - 1, kk = k * n;
      g.save(); g.globalAlpha *= al; g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 8; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < n; i++) { const f = E.clamp(kk - i); if (f <= 0) break; const [ax, ay] = pts[i], [bx, by] = pts[i + 1], mx = (ax + bx) / 2, my = Math.max(ay, by) + 40; for (let j = 1; j <= 20 * f; j++) { const u = j / 20; g.lineTo((1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by); } }
      g.stroke(); g.restore();
    },
    // ---------------- 清晰度 = 记忆强度（记忆起用）：任何画面先马赛克、再一级级变清楚 ----------------
    /** draw(g, w, h) 在一块 w×h 的画布上画内容（坐标从 0,0 开始）；level 0~1：0 = 大马赛克 + 褪色，1 = 原图。
     *  (x, y) 是中心。o: {steps 量化级数（配合拍子一级一级跳，默认 6）, badge 清晰到 1 时角上标"原图", fade 低清晰度时褪色程度, frame 白边宽, rot} */
    clarity(draw, x, y, w, h, level, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), C = M._clr || (M._clr = {}), key = w + 'x' + h;
      const cv = C[key] || (C[key] = Object.assign(document.createElement('canvas'), { width: w, height: h })), cg = cv.getContext('2d'); cg.clearRect(0, 0, w, h); draw(cg, w, h);
      const st = o.steps ?? 6, lv = st ? Math.round(E.clamp(level) * st) / st : E.clamp(level), blk = Math.max(1, Math.round(E.lerp(Math.max(w, h) / 14, 1, Math.pow(lv, .7))));
      g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(o.rot || 0);
      if (o.frame) { g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 26; g.fillStyle = '#f3efe6'; g.fillRect(-w / 2 - o.frame, -h / 2 - o.frame, w + o.frame * 2, h + o.frame * 2); g.restore(); }
      if (blk > 1) { const sw = Math.max(1, Math.round(w / blk)), sh = Math.max(1, Math.round(h / blk)), sk = 'sm' + sw + 'x' + sh;
        const sm = C[sk] || (C[sk] = Object.assign(document.createElement('canvas'), { width: sw, height: sh })), sg = sm.getContext('2d'); sg.clearRect(0, 0, sw, sh); sg.drawImage(cv, 0, 0, sw, sh);
        g.imageSmoothingEnabled = false; g.filter = `saturate(${E.lerp(1 - (o.fade ?? .8), 1, lv)}) brightness(${E.lerp(.7, 1, lv)})`; g.drawImage(sm, -w / 2, -h / 2, w, h); g.filter = 'none'; g.imageSmoothingEnabled = true; }
      else g.drawImage(cv, -w / 2, -h / 2, w, h);
      if (o.badge && lv >= 1) { g.fillStyle = th().a; g.beginPath(); g.roundRect(w / 2 - 128, -h / 2 + 14, 112, 46, 23); g.fill(); g.fillStyle = '#fff'; g.font = '900 28px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.badge === true ? '原图' : o.badge, w / 2 - 72, -h / 2 + 38); }
      g.restore();
    },
    // ---------------- 参考视频 4（越来越淡）启发：关键词冲出、乱码解码；"如果注定要分别"起：颜色沾染 ----------------
    /** 关键词放大冲出：t0 时这个词从 1.9 倍砸回原大小，四周放射速度线，轻微抖动（全片只给最重的几个词）。o: {size, color, font, rays 线条数, dur} */
    punchWord(s, x, y, t, t0, al = 1, o = {}) {
      if (al <= .01 || t < t0 - .02) return; const g = c(), T = th(), u = (t - t0) / (o.dur || .45), k = E.eOut(E.clamp(u)), size = o.size || 120, col = o.color || T.a;
      if (u < 1.2) { const r = E.R(9), n = o.rays || 36; g.save(); g.globalAlpha *= al * (1 - E.clamp(u / 1.2)); g.strokeStyle = col; g.lineCap = 'round';
        for (let i = 0; i < n; i++) { const a = r() * 6.283, r0 = size * (.7 + r() * .4) + k * size * 1.5, r1 = r0 + size * (.6 + r() * 1.4) * (1 - k * .5); g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .7); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .7); g.stroke(); }
        g.restore(); }
      const sc = 1 + .9 * (1 - k), sh = (1 - k) * size * .06;
      g.save(); g.translate(x + Math.sin(t * 97) * sh * .5, y + Math.cos(t * 83) * sh * .5); g.scale(sc, sc); E.neon(s, 0, 0, { size, color: col, font: o.font, weight: o.weight || 900, alpha: al * E.clamp(u * 4) }, -9, 0); g.restore();
    },
    /** 乱码解码：字从左到右一格格从乱码翻成真字（{} 里的字用强调色）。o: {size, color, hot, font, dur 全部解完的秒数, align} */
    decodeText(s, x, y, t, t0, al = 1, o = {}) {
      if (al <= .01 || t < t0) return; const g = c(), T = th(), size = o.size || 56, dur = o.dur || .9, GL = '▒░█@#%&*+=/<>?§¥$', chars = [];
      let hot = false; for (const ch of s) { if (ch === '{') { hot = true; continue; } if (ch === '}') { hot = false; continue; } chars.push([ch, hot]); }
      g.save(); g.font = `${o.weight || 900} ${size}px ${o.font || T.font}`; g.textBaseline = 'middle'; g.globalAlpha *= al;
      const ws = chars.map(([ch]) => g.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0); let xx = o.align === 'left' ? x : x - tw / 2;
      const step = Math.floor(t * 24);
      chars.forEach(([ch, h], i) => { const done = t >= t0 + dur * (i + 1) / chars.length, near = t >= t0 + dur * i / chars.length - .25;
        if (near) { const shown = done ? ch : GL[(step * 7 + i * 13) % GL.length]; g.fillStyle = done ? (h ? (o.hot || T.a) : (o.color || T.p)) : (h ? (o.hot || T.a) : T.b); if (done && h) { g.shadowColor = o.hot || T.a; g.shadowBlur = 14; } g.fillText(shown, xx, y); g.shadowBlur = 0; }
        xx += ws[i]; });
      g.restore();
    },
    /** 一团水彩颜色（一个人）：边缘不规则、慢慢呼吸。o: {stains: [{col, a 角度, s 大小 0~1}] 身上沾着的别人的颜色, soft 晕开程度} */
    inkBlob(x, y, r, col, t, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), seed = (o.seed || 1) * 1.7;
      const blob = (cx, cy, rr, cc, a, ph) => { g.save(); g.globalAlpha *= a; g.globalCompositeOperation = o.blend || (th().light ? 'source-over' : 'lighter');
        for (let L = 0; L < 4; L++) { const k = 1 - L * .18; g.fillStyle = cc; g.globalAlpha = al * a * (.18 + L * .12); g.beginPath();
          for (let i = 0; i <= 48; i++) { const an = i / 48 * 6.283, w = rr * k * (1 + .08 * Math.sin(an * 3 + t * .8 + ph + L) + .05 * Math.sin(an * 7 - t * 1.1 + ph * 2)); g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(an) * w, cy + Math.sin(an) * w); }
          g.closePath(); g.fill(); }
        g.restore(); };
      const gl = g.createRadialGradient(x, y, 0, x, y, r * 2.2); gl.addColorStop(0, col + '55'); gl.addColorStop(1, col + '00'); g.save(); g.globalAlpha *= al * (o.soft ?? .6); g.globalCompositeOperation = th().light ? 'source-over' : 'lighter'; g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.2, 0, 6.3); g.fill(); g.restore();
      blob(x, y, r, col, 1, seed);
      for (const st of o.stains || []) { const sr = r * (st.s ?? .35), sx = x + Math.cos(st.a) * r * .62, sy = y + Math.sin(st.a) * r * .62; blob(sx, sy, sr, st.col, st.al ?? 1, seed + st.a * 3); }
    },
    /** 两团颜色之间拉出的颜料丝：k 0~1 拉伸程度，≥1 断开（断口留下两滴）。颜色从 a 渐变到 b */
    inkThread(x1, y1, x2, y2, ca, cb, k, al = 1, w = 26) {
      if (al <= .01) return; const g = c(), br = k >= 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 40 * Math.min(1, k);
      const gr = g.createLinearGradient(x1, y1, x2, y2); gr.addColorStop(0, ca); gr.addColorStop(1, cb);
      g.save(); g.globalAlpha *= al; g.strokeStyle = gr; g.lineCap = 'round';
      if (!br) { g.lineWidth = Math.max(2, w * (1 - k * .85)); g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); g.stroke(); }
      else { const d = Math.min(1, (k - 1) * 3); g.lineWidth = Math.max(1.5, w * .15); for (const [sx, sy, ex, ey] of [[x1, y1, E.lerp(x1, mx, .7 - .3 * d), E.lerp(y1, my, .7) + 30 * d], [x2, y2, E.lerp(x2, mx, .7 - .3 * d), E.lerp(y2, my, .7) + 30 * d]]) { g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + ex) / 2, sy + 10, ex, ey); g.stroke(); g.fillStyle = sx === x1 ? ca : cb; g.beginPath(); g.arc(ex, ey + 4, w * .2, 0, 6.3); g.fill(); } }
      g.restore();
    },
    // ---------------- 情绪容纳起用（参考视频"野马效应"：不变的读数、整帧情绪调色、玻璃人、恶性循环箭头） ----------------
    /** 贯穿全片的 HUD 读数（参考"锯子移动距离 0 cm"）：小标签 + 大数字 + 一条刻度条。放在左上角章节角标下面（x≈84, y≈190）。
     *  o: {unit, dec 小数位, frac 0~1 刻度条, color, hot 0~1 数字变成警示色, hotCol, pulse 0~1 变化时闪一下, size, big 0~1 从角落飞到 (o.bx,o.by) 变成大字, bx, by, bsize} */
    hudStat(x, y, label, value, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), T = th(), bk = E.ease(o.big || 0), sz = E.lerp(o.size || 54, o.bsize || 220, bk), xx = E.lerp(x, o.bx ?? 960, bk), yy = E.lerp(y, o.by ?? 470, bk);
      const col = o.hot ? mixHex(o.color || T.p, o.hotCol || '#ff7a3a', o.hot) : (o.color || T.p), s = value.toFixed(o.dec ?? 0) + (o.unit || '');
      g.save(); g.globalAlpha *= al; g.textBaseline = 'alphabetic'; g.textAlign = bk > .5 ? 'center' : 'left';
      g.font = `700 ${E.lerp(24, 34, bk)}px ${mono}`; g.letterSpacing = '3px'; g.fillStyle = T.muted || '#9aa6c8'; g.fillText(label, xx, yy - sz * .95); g.letterSpacing = '0px';
      g.font = `800 ${sz}px ${mono}`; g.shadowColor = col; g.shadowBlur = 8 + 18 * (o.pulse || 0); g.fillStyle = col; g.fillText(s, xx, yy); g.shadowBlur = 0;
      if (o.frac !== undefined && bk < .5) { const w = 260, f = E.clamp(o.frac), by = yy + 18; g.globalAlpha = al * (1 - bk * 2); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(xx, by, w, 6);
        const gr = g.createLinearGradient(xx, 0, xx + w, 0); gr.addColorStop(0, '#7fb4ff'); gr.addColorStop(.5, '#ffb08a'); gr.addColorStop(1, '#ff5a2a'); g.fillStyle = gr; g.fillRect(xx, by, w * f, 6); g.fillStyle = '#fff'; g.fillRect(xx + w * f - 2, by - 5, 4, 16); }
      g.restore();
    },
    /** 整帧情绪调色（参考视频：平静墨绿 → 发怒暗红 → 冷蓝 → 青绿）：在 screen(t) 里调用。col 目标色（#hex），k 强度 0~1；soft-light 改色调 + 一层同色暗角 */
    grade(col, k, o = {}) {
      if (k <= .005) return; const g = c(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'soft-light'; g.globalAlpha = Math.min(1, k * (o.soft ?? .85)); g.fillStyle = col; g.fillRect(0, 0, 1920, 1080);
      g.globalCompositeOperation = 'source-over'; const vg = g.createRadialGradient(960, 540, 300, 960, 540, 1150); vg.addColorStop(0, col + '00'); vg.addColorStop(1, col + '55'); g.globalAlpha = k * (o.edge ?? .7); g.fillStyle = vg; g.fillRect(0, 0, 1920, 1080); g.restore();
    },
    /** 玻璃人（参考视频里半透明的线稿人，身体里透出红色裂痕）：用 flatMan 的姿势画一个半透明身体 + 发光描边；胸口可以亮着一块"吞下去的炭"。
     *  o: {chest 0~1 胸口的光, chestCol, cracks 0~1 从胸口长出去的红色裂纹, color 描边色, glass 身体透明度(默认 .12), dir, phase, face} → 返回胸口坐标 [x, y]（会被 flatMan 的姿势带着走） */
    glassMan(x, footY, h, pose, t, al = 1, o = {}) {
      const cx = x + ({ sit: .02, crouch: .03 }[pose] || 0) * h * (o.dir ?? 1), cy = footY - ({ sit: .55, crouch: .33 }[pose] || .62) * h;
      if (al <= .01) return [cx, cy]; const g = c(), tf = g.getTransform();
      const cv = n => { GL[n] = GL[n] || Object.assign(document.createElement('canvas'), { width: 1920, height: 1080 }); const q = GL[n].getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; q.shadowBlur = 0; q.clearRect(0, 0, 1920, 1080); return q; };
      const S = cv('s'); S.setTransform(tf); const keep = E.ctx; E.ctx = S; M.flatMan(x, footY, h, pose, t, 1, { color: '#ffffff', dir: o.dir, phase: o.phase }); E.ctx = keep;
      const B = cv('b'); B.globalAlpha = o.glass ?? .13; B.drawImage(GL.s, 0, 0); B.globalAlpha = 1; B.globalCompositeOperation = 'source-atop'; B.setTransform(tf);
      const ch = o.chest || 0, col = o.chestCol || '255,110,50';
      if (ch > 0) { const r = h * (.16 + .1 * ch) * (1 + .06 * Math.sin(t * 3)), gr = B.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4); gr.addColorStop(0, `rgba(${col},${.95 * ch})`); gr.addColorStop(.35, `rgba(${col},${.5 * ch})`); gr.addColorStop(1, `rgba(${col},0)`); B.fillStyle = gr; B.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6); }
      if (o.cracks) { const R = E.R(11); B.strokeStyle = `rgba(${col},1)`; B.lineWidth = Math.max(2, h * .008); B.lineCap = 'round'; B.shadowColor = `rgb(${col})`; B.shadowBlur = 10;
        for (let b = 0; b < 9; b++) { let px = cx, py = cy, a = b / 9 * 6.283 + R(); B.beginPath(); B.moveTo(px, py); const n = Math.floor(14 * o.cracks); for (let i = 0; i < n; i++) { a += (R() - .5) * .9; px += Math.cos(a) * h * .03; py += Math.sin(a) * h * .03 + h * .006; B.lineTo(px, py); } B.stroke(); } B.shadowBlur = 0; }
      const O = cv('o'), d = Math.max(2, h * .006); for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d * .7, d * .7], [-d * .7, d * .7], [d * .7, -d * .7], [-d * .7, -d * .7]]) O.drawImage(GL.s, dx, dy);
      O.globalCompositeOperation = 'destination-out'; O.drawImage(GL.s, 0, 0); O.globalCompositeOperation = 'source-in'; O.fillStyle = o.color || '#cfe0ff'; O.fillRect(0, 0, 1920, 1080);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha *= al; g.drawImage(GL.b, 0, 0); g.shadowColor = o.color || '#9fc0ff'; g.shadowBlur = 14; g.globalAlpha = al * .9; g.drawImage(GL.o, 0, 0); g.restore();
      return [cx, cy];
    },
    /** 一双捧起来的手（扁平粗线，参考视频 1 画风）：两只手合成一个碗，(x, y) 是碗心（东西放在这里），w 宽度。
     *  o: {open 0~1 两手分开 / 缩回, flinch 0~1 被烫得往回缩并抖, burn 0~1 手心发红, color 描边, fill 填充, lift 0~1 整体往上托} → 返回碗心坐标 */
    cupHands(x, y, w, t, al = 1, o = {}) {
      if (al <= .01) return [x, y]; const g = c(), u = w / 2, op = o.open || 0, fl = o.flinch || 0, col = o.color || '#efe6d6', fc = o.fill || '#1a2244', lw = Math.max(3, w * .035);
      const sh = fl * Math.sin(t * 40) * u * .03, yy = y - (o.lift || 0) * u * .3;
      for (const s of [-1, 1]) { g.save(); g.globalAlpha *= al; g.translate(x + s * (op * u * .9 + fl * u * .35) + sh, yy + fl * u * .25); g.rotate(s * (op * .5 + fl * .35)); g.scale(s * u, u);
        g.beginPath(); g.moveTo(-.02, .42); g.bezierCurveTo(-.35, .44, -.7, .3, -.86, .02); g.bezierCurveTo(-.95, -.12, -1.04, -.26, -1.0, -.34);   // 手心内沿 → 指尖
        g.bezierCurveTo(-1.12, -.3, -1.16, -.05, -1.08, .14); g.bezierCurveTo(-.98, .42, -.82, .62, -.62, .78); g.lineTo(-.6, 1.25); g.lineTo(-.18, 1.25); g.lineTo(-.16, .74); g.bezierCurveTo(-.1, .62, -.06, .52, -.02, .42); g.closePath();
        g.fillStyle = fc; g.fill(); g.lineWidth = lw / u; g.strokeStyle = col; g.lineJoin = g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 8; g.stroke();
        g.beginPath(); for (const k of [0, 1, 2]) { const yy2 = -.16 + k * .15; g.moveTo(-1.1 + k * .02, yy2); g.quadraticCurveTo(-1.0, yy2 + .05, -.9 + k * .03, yy2 + .02); } g.moveTo(-.5, .2); g.quadraticCurveTo(-.4, .05, -.32, -.02); g.stroke();   // 指缝 + 拇指
        if (o.burn) { g.shadowBlur = 0; const gr = g.createRadialGradient(-.45, .2, 0, -.45, .2, .55); gr.addColorStop(0, `rgba(255,70,40,${.75 * o.burn})`); gr.addColorStop(1, 'rgba(255,70,40,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-1.1, -.4, 1.1, 1.1); }
        g.restore(); }
      return [x + sh, yy];
    },
    /** 一只手（扁平粗线：圆头胶囊拼的前臂 + 手掌 + 一根根手指，奶白描边、深色填充；和 flatMan 同一套画风）。(x, y) 手掌中心，s 手掌长，ang 朝向（0 = 指尖朝右）。
     *  o: {pose:'offer' 掌心朝上递东西 | 'point' 伸食指 | 'flick' 弹指, flip 镜像（从右边伸进来的手用 flip:1, ang 0）, burn 手心发红, color, fill, label, labelCol, labelSize} */
    hand(x, y, s, ang, t, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), col = o.color || '#efe6d6', fc = o.fill || '#1a2244', pose = o.pose || 'offer', lw = .09;
      g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(ang); g.scale(o.flip ? -s : s, s); g.lineCap = 'round'; g.lineJoin = 'round';
      const cap = (pts, w) => { for (const [ww, cc, blur] of [[w + lw * 2, col, 8], [w, fc, 0]]) { g.shadowColor = col; g.shadowBlur = blur; g.strokeStyle = cc; g.lineWidth = ww; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); } g.shadowBlur = 0; };
      const F = { offer: [[[.02, -.2], [.55, -.24], [.82, -.34]], [[.04, -.06], [.62, -.1], [.9, -.2]], [[.04, .07], [.58, .05], [.84, -.04]], [[.02, .19], [.46, .17], [.68, .1]]],
        point: [[[.04, -.2], [.9, -.22]], [[.12, -.02], [.32, .06], [.24, .16]], [[.1, .13], [.28, .2], [.2, .28]], [[.06, .24], [.2, .3], [.12, .36]]],
        flick: [[[.04, -.2], [.34, -.38], [.42, -.6]], [[.06, -.04], [.55, -.1], [.92, -.26]], [[.1, .12], [.3, .2], [.2, .28]], [[.06, .23], [.2, .3], [.12, .36]]] }[pose] || [];
      cap([[-2.0, .02], [-.55, 0]], .5); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(-.95, -.27); g.lineTo(-.95, .29); g.stroke();   // 前臂 + 袖口
      cap([[-.45, 0], [-.02, -.01]], .66);
      for (let i = F.length - 1; i >= 0; i--) cap(F[i], .17);
      cap(pose === 'offer' ? [[-.25, -.24], [.02, -.42], [.2, -.5]] : [[-.3, -.26], [.0, -.3], [.2, -.22]], .19);   // 拇指
      if (o.burn) { const gr = g.createRadialGradient(.2, -.2, 0, .2, -.2, .8); gr.addColorStop(0, `rgba(255,70,40,${.8 * o.burn})`); gr.addColorStop(1, 'rgba(255,70,40,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(-.6, -1, 1.6, 1.6); }
      g.restore();
      if (o.label) E.neon(o.label, x - Math.cos(ang) * s * (o.flip ? -1 : 1) * 1.1, y + s * .95, { size: o.labelSize || 42, color: o.labelCol || col, weight: 900, alpha: al }, -9, 0);
    },
    /** 恶性循环箭头（参考视频"越深越疼越用力"）：几个词绕成一圈，弧形箭头一段段把它们连起来、首尾相接，然后一直转。
     *  items: ['扔回去', '更烫', '更想推开']；k 0~1 画出几段；o: {color, size, spin 转速, rx, ry} */
    loopArrows(cx, cy, items, t, k, al = 1, o = {}) {
      if (al <= .01) return; const n = items.length, rx = o.rx || 300, ry = o.ry || 190, col = o.color || '#ff5a3a', sp = (o.spin ?? .35) * Math.max(0, t), P = i => { const a = -Math.PI / 2 + i / n * 6.283; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a]; };
      for (let i = 0; i < n; i++) { const kk = E.clamp(k * n - i); if (kk <= 0) continue; const a0 = -Math.PI / 2 + i / n * 6.283 + .42, a1 = a0 + (6.283 / n - .84) * E.eOut(kk), wob = 1 + .03 * Math.sin(sp * 4 + i);
        line(col, 6, 14, gg => { for (let j = 0; j <= 30; j++) { const a = a0 + (a1 - a0) * j / 30; gg[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob); } }, al);
        const ex = cx + Math.cos(a1) * rx * wob, ey = cy + Math.sin(a1) * ry * wob, ta = Math.atan2(Math.cos(a1) * ry, -Math.sin(a1) * rx);
        fill(col, 10, gg => { gg.moveTo(ex + Math.cos(ta) * 24, ey + Math.sin(ta) * 24); gg.lineTo(ex + Math.cos(ta + 2.5) * 22, ey + Math.sin(ta + 2.5) * 22); gg.lineTo(ex + Math.cos(ta - 2.5) * 22, ey + Math.sin(ta - 2.5) * 22); }, al * E.clamp(kk * 3)); }
      items.forEach((s, i) => { const [x, y] = P(i); E.neon(s, x, y, { size: o.size || 44, color: i === 0 ? (o.first || col) : col, weight: 900, alpha: al * E.clamp(k * n - i + 1) }, -9, 0); });
    },
    /** 抽字（沉没成本起）：一句话里的某个字被"抽"出来——先发光上浮，再飞走（o.to 给目标点就飞过去缩小，否则往上飘散），剩下的字往中间合拢补上空位。
     *  s 整句（不带标记），ch 要抽走的字或一串字（抽第一次出现的位置，如'来都来了'抽'都来'）；t0 开始抽（之前这个字一直用 hot 色亮着）。
     *  o: {size, font, color 普通字色, hot 被抽字的颜色, to:[x,y] 飞去的点, lift 上浮高度, dur 飞行秒数, glowBefore 抽之前就亮着(默认 true)} */
    pullChar(s, x, y, ch, t, t0, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), size = o.size || 64, font = o.font || '"Noto Serif SC"', col = o.color || '#f6ead8', hot = o.hot || th().a, chars = [...s];
      g.save(); g.font = `900 ${size}px ${font}`; g.textBaseline = 'middle'; g.textAlign = 'center'; const ws = chars.map(cc => g.measureText(cc).width);
      const u = t - t0, lift = E.eOut(E.clamp(u / .4)), fly = E.clamp((u - .4) / (o.dur || .6)), close = E.ease(E.clamp((u - .45) / .55));
      const at0 = s.indexOf(ch), HS = new Set(); if (at0 >= 0) for (let k = 0; k < [...ch].length; k++) HS.add([...s.slice(0, at0)].length + k);   // ch 可以是一串字（抽第一次出现的位置）
      const keepW = chars.reduce((a, cc, i) => a + (HS.has(i) ? ws[i] * (1 - close) : ws[i]), 0); let xx = x - keepW / 2;
      chars.forEach((cc, i) => { const isH = HS.has(i), w = isH ? ws[i] * (1 - close) : ws[i], cx = xx + w / 2; xx += w;
        let px = cx, py = y, sc = 1, a = al, colr = col;
        if (isH) { colr = (o.glowBefore === false && u <= 0) ? col : hot;
          if (u > 0) { py = y - (o.lift ?? size * .9) * lift; sc = 1 + .35 * lift;
            if (o.to && fly > 0) { const e = E.eIn(fly); px = E.lerp(cx, o.to[0], e); py = E.lerp(py, o.to[1], e); sc *= 1 - .7 * e; a = al * (1 - Math.pow(fly, 4)); }
            else if (fly > 0) { py -= fly * size; a = al * (1 - fly); } } }
        if (a <= .01) return; g.save(); g.globalAlpha *= a; g.translate(px, py); g.scale(sc, sc);
        g.fillStyle = 'rgba(0,0,0,.85)'; g.shadowColor = '#000'; g.shadowBlur = size * .45; g.fillText(cc, 0, 0); g.shadowBlur = 16; g.shadowColor = 'rgba(0,0,0,.9)'; g.fillStyle = colr; g.fillText(cc, 0, 0);
        if (isH && colr === hot) { g.shadowColor = hot; g.shadowBlur = 18 + 20 * lift; g.fillText(cc, 0, 0); } g.restore(); });
      g.restore();
    },
    // ---------------- 参考视频"如何像刷短视频一样对学习上瘾"（2026-10-22）学来的手法：果冻掉落、刷屏信息流、+1 飘字、控制中心、取景框暗角 ----------------
    /** 果冻掉落：返回 [dy, sx, sy]，物体从 o.from（默认 -700）落到 0，落地瞬间压扁、回弹两下。用法：g.translate(x, y + dy); g.scale(sx, sy) 再画物体（以底部为锚点更像） */
    jellyDrop(t, t0, o = {}) {
      const u = t - t0, fall = o.dur ?? .42; if (u <= 0) return [o.from ?? -700, 1, 1];
      if (u < fall) { const k = E.eIn(u / fall); return [(o.from ?? -700) * (1 - k), 1 - .12 * k, 1 + .16 * k]; }
      const v = u - fall, w = Math.exp(-v * 6.5) * Math.cos(v * 22), sq = .22 * (o.amp ?? 1);
      return [0, 1 + sq * w, 1 - sq * w];
    },
    /** "+1" 飘字：times 是每个 +1 冒出来的时刻，从 (x, y) 附近往上飘、放大后淡出。o: {text:'+1' 或函数 i => 文本, color, size, spread} */
    plusPops(x, y, t, times, al = 1, o = {}) {
      if (al <= .01) return; const r = E.R(o.seed || 4), sp = o.spread ?? 60;
      times.forEach((t0, i) => { const u = (t - t0) / (o.life || 1.1); const ox = (r() - .5) * sp * 2, oy = (r() - .5) * sp * .6; if (u <= 0 || u >= 1) return;
        const s = typeof o.text === 'function' ? o.text(i) : (o.text || '+1');
        E.neon(s, x + ox + u * 14, y + oy - E.eOut(u) * 90, { size: (o.size || 34) * (.8 + .4 * E.eOut(Math.min(1, u * 3))), color: o.color || th().a, weight: 900, font: '"JetBrains Mono"', alpha: al * (u < .15 ? u / .15 : 1 - Math.pow((u - .15) / .85, 2)) }, -9, 0); });
    },
    /** 竖屏信息流（刷短视频）：手机框里一条条内容往上划走。items[i] = 图片路径字符串（M.img 先注册）或 (g, w, h, i) => 自己画；
     *  k = 当前刷到第几条（小数部分 0~1 为划动进度，用 swipeK() 得到"停一下、唰一下"的节奏）。o: {fx 'duotone'等, dark, light, caption: i => 文本, likes: i => 文本, frame 是否画手机外框(默认 true), radius} */
    feedScreen(x, y, w, h, k, t, items, al = 1, o = {}) {
      if (al <= .01 || !items.length) return; const g = c(), T = th(), rr = o.radius ?? w * .11, n = items.length;
      g.save(); g.globalAlpha *= al;
      if (o.frame !== false) { g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; g.fillStyle = '#111116'; g.beginPath(); g.roundRect(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, rr + 10); g.fill(); g.restore();
        g.strokeStyle = o.rim || T.b; g.lineWidth = 3; g.beginPath(); g.roundRect(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, rr + 10); g.stroke(); }
      g.save(); g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, rr); g.clip(); g.fillStyle = '#000'; g.fillRect(x - w / 2, y - h / 2, w, h);
      const base = Math.floor(k), f = k - base;
      for (const j of [0, 1]) { const i = ((base + j) % n + n) % n, top = y - h / 2 + (j - f) * h, it = items[i];
        if (top > y + h / 2 || top + h < y - h / 2) continue;
        if (typeof it === 'string') { const cv = M._fx(it, o.fx ?? null, o.dark || '#000000', o.light || '#ffffff'); if (cv) { const s = Math.max(w / cv.width, h / cv.height), sw = w / s, sh = h / s; g.drawImage(cv, (cv.width - sw) / 2, (cv.height - sh) / 2, sw, sh, x - w / 2, top, w, h); } }
        else { g.save(); g.translate(x - w / 2, top); it(g, w, h, i); g.restore(); }
        const gr = g.createLinearGradient(0, top + h * .55, 0, top + h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = gr; g.fillRect(x - w / 2, top + h * .55, w, h * .45);
        const cap = o.caption ? o.caption(i) : null; if (cap) { g.font = `900 ${Math.round(w * .075)}px "Noto Sans SC"`; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(cap, x - w / 2 + w * .06, top + h * .86); }
        g.fillStyle = 'rgba(255,255,255,.9)'; for (let b = 0; b < 3; b++) { g.beginPath(); g.arc(x + w * .4, top + h * (.52 + b * .1), w * .045, 0, 6.3); g.fill(); }
        const lk = o.likes ? o.likes(i) : null; if (lk) { g.font = `700 ${Math.round(w * .045)}px "JetBrains Mono"`; g.textAlign = 'center'; g.fillText(lk, x + w * .4, top + h * .52 + w * .08); g.textAlign = 'left'; } }
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - w / 2 + w * .06, y + h / 2 - 10, w * .88, 3); g.fillStyle = '#fff'; g.fillRect(x - w / 2 + w * .06, y + h / 2 - 10, w * .88 * ((t * .35) % 1), 3);
      g.restore(); g.restore();
    },
    /** 刷屏节奏：每条停 hold 秒，然后用 swipe 秒"唰"地划到下一条。返回 feedScreen 用的 k */
    swipeK(t, t0, hold = .55, swipe = .22) { const u = Math.max(0, t - t0), per = hold + swipe, i = Math.floor(u / per), f = u - i * per; return i + (f < hold ? 0 : E.ease((f - hold) / swipe)); },
    /** 控制中心（仿手机下拉面板）：震动 / 静音 / 勿扰 三个开关 + 音量、亮度两根竖滑条。(x, y) 左上角，s 缩放。o: {mute 0/1, dnd 0/1, vol 0~1, bright 0~1, slide 0~1 从上往下滑进来} */
    ctrlCenter(x, y, s, al = 1, o = {}) {
      if (al <= .01) return; const g = c(), sl = E.eOut(o.slide ?? 1); g.save(); g.globalAlpha *= al * sl; g.translate(x, y - (1 - sl) * 300); g.scale(s, s);
      const tile = (tx, ty, tw, tht, r = 34) => { g.fillStyle = 'rgba(40,40,46,.82)'; g.beginPath(); g.roundRect(tx, ty, tw, tht, r); g.fill(); };
      tile(0, 0, 300, 130, 40); for (const [cx, on, col, sym] of [[75, 1, '#e9e9ee', '▮'], [225, o.mute ?? 1, '#ff3b4f', '🔕']]) { g.fillStyle = on ? (col === '#e9e9ee' ? '#e9e9ee' : '#ffffff') : 'rgba(120,120,128,.6)'; g.beginPath(); g.arc(cx, 65, 46, 0, 6.3); g.fill();
        g.fillStyle = col === '#ff3b4f' && on ? col : '#2a2a30'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym === '🔕' ? '✕' : '▯', cx, 66); }
      tile(0, 160, 300, 130, 40); g.fillStyle = o.dnd ? '#5e5ce6' : 'rgba(120,120,128,.6)'; g.beginPath(); g.arc(75, 225, 46, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(75, 225, 24, 0, 6.3); g.fill(); g.fillStyle = o.dnd ? '#5e5ce6' : 'rgba(120,120,128,1)'; g.beginPath(); g.arc(86, 216, 22, 0, 6.3); g.fill();
      g.fillStyle = '#fff'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'left'; g.fillText('勿扰', 140, 228);
      for (const [sx, v, sym] of [[330, o.vol ?? .4, '♪'], [470, o.bright ?? .25, '☀']]) { tile(sx, 0, 120, 290, 40); g.save(); g.beginPath(); g.roundRect(sx, 0, 120, 290, 40); g.clip(); g.fillStyle = '#f2f2f7'; g.fillRect(sx, 290 * (1 - v), 120, 290 * v); g.restore();
        g.fillStyle = v > .2 ? '#ff3b4f' : '#ddd'; g.font = '900 46px "Noto Sans SC"'; g.textAlign = 'center'; g.fillText(sym, sx + 60, 245); }
      g.restore();
    },
    /** 取景框暗角：整屏四周一圈很重的圆形暗角，像透过镜头 / 猫眼看（r 0~1 开口大小，越小越窄） */
    peephole(al = 1, r = .62, cx = 960, cy = 540) {
      if (al <= .01) return; const g = c(); g.save(); g.globalAlpha *= al; const gr = g.createRadialGradient(cx, cy, 1080 * r * .55, cx, cy, 1080 * r * 1.05);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.7, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,.96)'); g.fillStyle = gr; g.fillRect(-400, -300, 2720, 1680); g.restore();
    },
  };
})();
const GL = {};
function mixHex(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, k))).toString(16).padStart(2, '0')).join(''); }
