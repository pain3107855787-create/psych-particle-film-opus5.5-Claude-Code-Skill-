// 《客体恒常性》分镜 —— 极光配色。粒子关键帧 + 叠加层（两颗恋人光点、连线、霓虹字）
const FILM = (() => {
  const { T, End, D, S, key, cam, flash, wave, neon, orb, link, bubbleBox, clamp, lerp, ease, eOut, prog, vis } = E;
  let TH, total;
  const YOU = [520, 470], TA = [1400, 470], C = [960, 470];
  // 简单轨道：[[t, v], ...] 之间缓动插值
  const track = pts => t => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i], u = ease((t - t0) / (t1 - t0)); return Array.isArray(v0) ? v0.map((v, k) => lerp(v, v1[k], u)) : lerp(v0, v1, u); } return pts.at(-1)[1]; };
  let youP, youA, taP, taA, linkA, linkK;

  function build(tl) {
    TH = E.TH; total = tl.total;
    const p5a = T('p5'), p5d = D('p5'), m5a = T('m5'), m5d = D('m5');
    // ---------------- 粒子 ----------------
    key(0, S.scatter(1), { alpha: .6 });
    key(T('l1') + .9, S.bubble(1400, 300, 440, 120, false, 2), { d: 1.6 });
    key(T('l2') + 1.0, S.clock(960, 470, 200, 0), { d: 1.0 });
    key(T('l2') + D('l2') * .55, S.clock(960, 470, 200, 0));
    key(End('l2') + .2, S.bubble(520, 300, 400, 116, true, 1), { d: 1.0 });
    key(T('l3') + .8, S.dust(960, 470, 760, 360, 0), { d: 1.0, alpha: .3, type: 'drift' });
    key(T('l4') + .3, S.dust(520, 470, 150, 150, 1), { d: 1.0, alpha: .9, shake: 8 });
    key(End('l4') + .9, S.dust(520, 470, 150, 150, 1), { alpha: .9, shake: 18 });
    // 躲猫猫
    key(T('p1') + 1.0, S.text('1930s', 230, 960, 420, 0, TH.num, 700), { d: 1.3, type: 'burst', cx: 520, cy: 470 });
    key(T('p2') + 1.0, S.dust(960, 300, 330, 46, 0, 9), { d: 1.1 });
    key(End('p2') - .4, S.dome(960, 650, 470, 180, 0), { d: .9 });
    key(T('p4') + D('p4') * .55, S.dust(960, 380, 900, 380, 0, 12), { d: 1.4, alpha: .35, type: 'drift' });
    key(p5a + p5d * .2, S.ring(960, 470, 120, 10, 1), { d: .8 });
    key(p5a + p5d * .38, S.ring(960, 470, 120, 10, 1));
    key(p5a + p5d * .5, S.point(960, 470, 1, 4), { d: .45, type: 'implode', alpha: .2 });
    key(p5a + p5d * .72, S.point(960, 470, 1, 4), { alpha: .2 });
    key(p5a + p5d * .72 + .7, S.ring(960, 470, 170, 16, 1), { d: .7, type: 'burst', cx: 960, cy: 470, spread: .6 });
    key(T('p6') + D('p6') * .6, S.text('客体恒常性', 200, 960, 440, 0), { d: 1.4 });
    key(End('p6') + 1.0, S.text('客体恒常性', 200, 960, 440, 0), { alpha: .5 });
    // 爱情
    key(T('m1') + 1.6, S.heart(960, 480, 13, 1), { d: 1.5 });
    key(T('m2') + 1.6, S.wave(YOU[0] + 30, 470, TA[0] - 30, 470, 30, 3, 1, 5), { d: 1.5 });
    key(T('m3') + 1.3, S.mix([[S.heart(960, 465, 7, 1), .6], [S.wave(YOU[0] + 30, 470, TA[0] - 30, 470, 30, 3, 2, 5), .4]]), { d: 1.2 });
    key(T('m4') + 1.2, S.mix([[S.heart(960, 465, 7, 1), .6], [S.wave(YOU[0] + 30, 470, TA[0] - 30, 470, 30, 3, 2, 5), .4]]), { d: .6, flicker: .9 });
    key(m5a + m5d * .4, S.heart(960, 465, 9, 1), { d: .8, flicker: .2 });
    key(m5a + m5d * .7, S.scatter(4, .55), { d: 1.1, type: 'burst', cx: 960, cy: 465, alpha: .45 });
    key(T('m6') + 1.8, S.dotsRow(9, 960, 600, 92, 1, 9), { d: 1.6, alpha: .9 });
    key(End('m6') + 1.0, S.dotsRow(9, 960, 600, 92, 1, 9), { alpha: .7 });
    // 揭晓：TA 只是睡着了
    const TA2 = [2300, 470];
    key(T('r1') + 1.6, S.ring(TA2[0], 470, 70, 30, 2), { d: 1.4, alpha: .7 });
    key(T('r2') + 2.0, S.mix([[S.wave(YOU[0] + 20, 470, TA2[0] - 20, 470, 40, 5, 1, 5), .5], [S.wave(YOU[0] + 20, 470, TA2[0] - 20, 470, 40, 5, 2, 5), .5]]), { d: 1.8 });
    // 月亮
    key(T('e1') + 2.0, S.dust(960, 470, 300, 180, 0), { d: 2.0, alpha: .55, type: 'drift' });
    key(T('e2') + 1.3, S.mix([[S.text('晚安', 90, 600, 340, 1), 1], [S.text('我在', 90, 1330, 320, 2), 1], [S.text('想你', 90, 760, 610, 2), 1], [S.text('等你回家', 80, 1230, 620, 1), 1.3]]), { d: 1.6 });
    key(End('e2') + .5, S.mix([[S.text('晚安', 90, 600, 340, 1), 1], [S.text('我在', 90, 1330, 320, 2), 1], [S.text('想你', 90, 760, 610, 2), 1], [S.text('等你回家', 80, 1230, 620, 1), 1.3]]), { alpha: .6 });
    key(T('e4') + 1.8, S.moon(960, 430, 210, 0), { d: 1.6 });
    key(T('e5') + 1.0, S.moon(960, 300, 120, 0), { d: 1.2 });
    key(total + 1, S.moon(960, 300, 120, 0));

    // ---------------- 运镜 ----------------
    cam(0, 1.15); cam(T('l1') + .5, 1); cam(T('l2') + 1.2, 1.06); cam(End('l2'), 1); cam(End('l3'), 1.02, 0, 0, .01);
    cam(End('l4') + .8, 1.4, -380, 0, -.01); cam(T('p1') + .6, 1); cam(T('p3') + 1, 1.18, 0, 70); cam(T('p4') + 1.5, 1);
    cam(p5a + p5d * .45, 1.22); cam(p5a + p5d * .8, .94); cam(T('p6') + 1, 1); cam(T('m1') + 1, 1.04);
    cam(T('m4'), 1.04); cam(End('m4'), 1.35, 0, -10); cam(m5a + m5d * .7, .98); cam(T('m6') + 1, 1);
    cam(T('r1') + .2, 1); cam(T('r1') + 2.6, .55, 490, 0); cam(End('r2'), .6, 460, 0); cam(T('e1') + 2.6, 1, 0, 0); cam(T('e4') + 1, 1.04); cam(total, 1.0);

    // ---------------- 闪切 / 冲击波 ----------------
    flash(T('p1') - .25); wave(T('p1') - .2, 520, 470, TH.a);
    flash(p5a + p5d * .72 + .05, .3); wave(p5a + p5d * .72 + .05, 960, 470, TH.a);
    flash(m5a + m5d * .7 + .05, .32); wave(m5a + m5d * .7 + .05, 960, 465, TH.a);
    flash(T('e4') + .2, .18);

    // ---------------- 光点轨道 ----------------
    youP = track([[0, YOU], [total, YOU]]);
    youA = track([[T('l1') - .6, 0], [T('l1') + .2, 1], [T('l2') + .6, 1], [T('l2') + 1.1, .25], [End('l2'), .25], [End('l2') + .4, 1], [T('p1') - .4, 1], [T('p1') - .25, 0],
      [T('m2') - .2, 0], [T('m2') + .6, 1], [T('e1') + .6, 1], [T('e1') + 2.2, 0]]);
    taP = track([[0, TA], [T('l4'), TA], [End('l4') + .3, [1900, 470]], [T('m2') - .3, [1900, 470]], [T('m2') + .8, TA], [m5a + m5d * .5, TA], [m5a + m5d * .5 + .9, [2300, 470]], [total, [2300, 470]]]);
    taA = track([[T('l1') - .6, 0], [T('l1') + .2, 1], [T('l2') + .6, 1], [T('l2') + 1.1, .25], [End('l2'), .25], [End('l2') + .4, 1], [T('l4') + .2, 1], [End('l4'), 0],
      [T('m2') - .2, 0], [T('m2') + .8, 1], [m5a + m5d * .5 + .3, 1], [m5a + m5d * .5 + .9, 0], [T('r1') + .8, 0], [T('r1') + 2.2, .9], [T('e1') + .6, .9], [T('e1') + 2.2, 0]]);
    linkA = track([[T('l1'), 0], [T('l1') + .8, .9], [T('l2') + .6, .9], [T('l2') + 1.1, 0], [End('l2') + .3, 0], [End('l2') + .8, .7], [T('l4') + .4, .7], [T('l4') + 1.2, 0],
      [T('m2') + .4, 0], [T('m2') + 1.4, .55], [m5a + m5d * .5, .55], [m5a + m5d * .5 + .4, 0]]);
  }

  // ---------------- 叠加层（世界坐标，跟随镜头） ----------------
  function overlay(t) {
    const ctx = E.ctx, a = TH.a, b = TH.b;
    const yp = youP(t), tp = taP(t), la = linkA(t);
    // 连线：第 4 句时被拉断
    if (la > .01) {
      const brk = prog(t, T('l4') + .3, .9);
      if (brk > 0 && t < T('p1')) { link(yp[0], yp[1], lerp(yp[0], tp[0], .5 - brk * .3), 470, a, b, t, { alpha: la }); link(lerp(yp[0], tp[0], .5 + brk * .3), 470, tp[0], tp[1], a, b, t, { alpha: la * (1 - brk) }); }
      else link(yp[0], yp[1], tp[0], tp[1], a, b, t, { alpha: la * (t > T('m4') && t < m5End() ? flick(t) : 1) });
    }
    orb(yp[0], yp[1], 7, a, youA(t), t); orb(tp[0], tp[1], 7, b, taA(t), t);
    if (vis(t, T('l1') + .3, T('l3'), .5, .4) > 0) {
      neon('你', yp[0], yp[1] + 56, { size: 24, color: a, weight: 500, alpha: youA(t) * vis(t, T('l1'), T('l3')) }, T('l1'), t);
      neon('TA', tp[0], tp[1] + 56, { size: 24, color: b, weight: 500, font: '"JetBrains Mono"', alpha: taA(t) * vis(t, T('l1'), T('l3')) }, T('l1'), t);
    }
    // l1 对话气泡文字
    const b1 = vis(t, T('l1') + 1.9, T('l2') + .9, .3, .5);
    if (b1 > 0) { neon('我先睡了', 1400, 300, { size: 46, color: b, alpha: b1 }, T('l1') + 1.9, t); neon('23:00', 1400, 205, { size: 22, color: TH.p, font: '"JetBrains Mono"', weight: 500, alpha: b1 * .7 }, T('l1') + 2.1, t); }
    // l2 时钟：23:00 → 12:00
    const ca = vis(t, T('l2') + .8, End('l2') + .3, .4, .4);
    if (ca > 0) {
      const u = ease(prog(t, T('l2') + 1.2, D('l2') * .5)), mins = 23 * 60 + u * 13 * 60, h = (mins / 60) % 12, m = mins % 60;
      ctx.save(); ctx.globalAlpha = ca; ctx.lineCap = 'round'; ctx.shadowBlur = 14;
      for (const [ang, len, w, col] of [[h / 12 * 6.283 - 1.5708, 100, 7, a], [m / 60 * 6.283 - 1.5708, 150, 4, TH.p]]) { ctx.strokeStyle = col; ctx.shadowColor = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(960, 470); ctx.lineTo(960 + Math.cos(ang) * len, 470 + Math.sin(ang) * len); ctx.stroke(); }
      ctx.restore(); const hh = Math.floor(mins / 60) % 24, mm = Math.floor(m);
      neon(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 960, 730, { size: 40, color: TH.p, font: '"JetBrains Mono"', weight: 700, alpha: ca }, T('l2') + .9, t);
    }
    // l2 后半：你的消息，未读
    const b2 = vis(t, End('l2') + .9, T('l3') + .9, .3, .4);
    if (b2 > 0) { neon('醒了吗？', 520, 300, { size: 44, color: a, alpha: b2 }, End('l2') + .9, t); neon('未读', 760, 345, { size: 22, color: '#9b96b8', weight: 500, alpha: b2 }, End('l2') + 1.3, t); }
    // l3 翻聊天记录：气泡越滚越快
    const sa = vis(t, T('l3') + .3, End('l3') + .8, .4, .5);
    if (sa > 0) {
      const u = t - T('l3') - .3, off = u * 120 + u * u * 70;
      ctx.save(); ctx.beginPath(); ctx.rect(400, 140, 1120, 720); ctx.clip();
      for (let i = 0; i < 26; i++) {
        const y = 900 + i * 110 - off; if (y < 80 || y > 920) continue; const left = (i * 7) % 3 !== 0, w = 220 + ((i * 53) % 200), x = left ? 760 - w / 2 + 60 : 1160 + w / 2 - 60 - w + w / 2;
        bubbleBox(left ? 640 + w / 2 - 60 : 1280 - w / 2 + 60, y, w, 66, left ? a : b, sa * .9);
        ctx.save(); ctx.globalAlpha = sa * .5; ctx.fillStyle = left ? a : b; const bx = (left ? 640 + w / 2 - 60 : 1280 - w / 2 + 60) - w / 2 + 34; ctx.fillRect(bx, y - 5, w - 68 - ((i * 31) % 50), 6); ctx.restore();
      }
      ctx.restore();
    }
    // 躲猫猫：字卡
    const pa = vis(t, T('p1') + 1.6, T('p2') + .9, .4, .5);
    if (pa > 0) { neon('1930s', 960, 420, { size: 230, color: TH.p, font: TH.num, weight: 700, alpha: pa }, T('p1') + 1.7, t); neon('JEAN PIAGET · 让·皮亚杰', 960, 590, { size: 30, color: b, weight: 700, spacing: 6, alpha: pa }, T('p1') + 2.1, t); }
    // 玩具小球
    const toyA = vis(t, T('p2') + 1.0, End('p2') + .2, .5, .4); orb(960, 600, 9, b, toyA, t);
    // 婴儿的眼睛
    const eyeA = vis(t, T('p3') + .2, T('p4') + D('p4') * .5, .5, .5);
    if (eyeA > 0) {
      ctx.save(); ctx.globalAlpha = eyeA; ctx.strokeStyle = TH.p; ctx.lineWidth = 3; ctx.shadowColor = TH.glow; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(880, 240); ctx.quadraticCurveTo(960, 180, 1040, 240); ctx.quadraticCurveTo(960, 300, 880, 240); ctx.stroke();
      ctx.fillStyle = TH.p; ctx.beginPath(); ctx.arc(960, 248, 15, 0, 6.3); ctx.fill(); ctx.restore();
      neon('< 8 MONTHS', 960, 150, { size: 22, color: '#9b96b8', font: '"JetBrains Mono"', weight: 500, spacing: 4, alpha: eyeA }, T('p3') + .5, t);
    }
    // 看不见 = 不存在
    const na = vis(t, T('p4') + D('p4') * .6, T('p5') + .5, .4, .5);
    if (na > 0) { neon('看不见', 690, 470, { size: 96, color: TH.p, alpha: na }, T('p4') + D('p4') * .6, t); neon('=', 960, 466, { size: 80, color: '#9b96b8', weight: 500, alpha: na }, T('p4') + D('p4') * .7, t); neon('不存在', 1230, 470, { size: 96, color: a, alpha: na }, T('p4') + D('p4') * .8, t); }
    // 躲猫猫的光点
    const p5a = T('p5'), p5d = D('p5');
    const pk = vis(t, p5a + p5d * .15, p5a + p5d * .5, .4, .2) + vis(t, p5a + p5d * .72 + .6, T('p6') + D('p6') * .5, .1, .5);
    orb(960, 470, 9, a, Math.min(1, pk), t);
    if (pk > 0) { neon('躲', 960 - 260, 470, { size: 40, color: '#9b96b8', weight: 500, alpha: vis(t, p5a + p5d * .45, p5a + p5d * .72, .2, .3) }, p5a + p5d * .45, t); neon('猫猫', 960 + 270, 470, { size: 40, color: '#9b96b8', weight: 500, alpha: vis(t, p5a + p5d * .75, T('p6'), .2, .3) }, p5a + p5d * .75, t); }
    // 客体恒常性
    const ka = vis(t, T('p6') + D('p6') * .6 + 1.2, End('p6') + 1.2, .5, .6);
    if (ka > 0) { neon('客体恒常性', 960, 440, { size: 200, color: TH.p, alpha: ka }, T('p6') + D('p6') * .6 + 1.2, t); neon('OBJECT  PERMANENCE', 960, 590, { size: 28, color: b, font: '"JetBrains Mono"', weight: 700, spacing: 8, alpha: ka }, T('p6') + D('p6') * .6 + 1.6, t); }
    // 马勒字卡
    const ma = vis(t, T('m1') + .6, T('m2') + .6, .4, .5);
    if (ma > 0) { neon('MARGARET MAHLER', 960, 200, { size: 26, color: b, font: '"JetBrains Mono"', weight: 700, spacing: 8, alpha: ma }, T('m1') + .6, t); neon('玛格丽特·马勒', 960, 245, { size: 30, color: TH.p, weight: 700, spacing: 4, alpha: ma }, T('m1') + .9, t); }
    // 不在身边 / 刚吵完架
    const t1 = vis(t, T('m2') + D('m2') * .3, T('m3') + .8, .3, .5), t2 = vis(t, T('m2') + D('m2') * .62, T('m3') + .8, .3, .5);
    if (t1 > 0) tag('不在身边', 960, 330, t1, T('m2') + D('m2') * .3, t);
    if (t2 > 0) tag('刚吵完架', 960, 620, t2, T('m2') + D('m2') * .62, t);
    // 未读 ×9
    const ua = vis(t, T('m6') + 2.2, End('m6') + 1.0, .5, .5);
    if (ua > 0) for (let i = 0; i < 9; i++) neon('未读', 960 + (i - 4) * 92, 650, { size: 18, color: '#9b96b8', weight: 500, alpha: ua }, T('m6') + 2.2 + i * .08, t);
    // TA 在远处睡着
    const za = vis(t, T('r1') + 2.0, T('e1') + 1.6, .6, .6);
    if (za > 0) for (let i = 0; i < 3; i++) { const ph = ((t * .5 + i / 3) % 1); neon('z', 2300 + 40 + ph * 50, 420 - ph * 110, { size: 30 + ph * 20, color: b, weight: 700, font: '"Playfair Display"', alpha: za * Math.sin(ph * Math.PI) }, T('r1') + 2.0, t); }
    if (t > T('r2') && t < T('e1') + 2.2) link(520, 470, 2300, 470, a, b, t, { alpha: vis(t, T('r2') + .3, T('e1') + 2, .4, .8), k: eOut(prog(t, T('r2') + .3, 1.8)), amp: 40, cycles: 5 });
    // 回忆碎片
    const ra = vis(t, T('e2') + 1.6, T('e4') + .8, .5, .6);
    if (ra > 0) {
      ctx.save(); ctx.globalAlpha = ra * .5; ctx.strokeStyle = TH.p; ctx.lineWidth = 1; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(600, 340); ctx.lineTo(1330, 320); ctx.lineTo(1230, 620); ctx.lineTo(760, 610); ctx.closePath(); ctx.stroke(); ctx.restore();
      [['晚安', 600, 340, a, 90], ['我在', 1330, 320, b, 90], ['想你', 760, 610, b, 90], ['等你回家', 1230, 620, a, 80]].forEach(([s, x, y, c, sz], i) => neon(s, x, y, { size: sz, color: c, alpha: ra }, T('e2') + 1.6 + i * .25, t));
    }
    // 尾卡
    const ea = vis(t, T('e5') + .3, total + 2, .6);
    if (ea > 0) { neon('看不见，不代表不在。', 960, 600, { size: 78, color: TH.p, alpha: ea, spacing: 6 }, T('e5') + .3, t); }
    const ea2 = vis(t, End('e5') + .5, total + 2, .6);
    if (ea2 > 0) neon('客体恒常性 · OBJECT CONSTANCY', 960, 700, { size: 24, color: b, weight: 700, spacing: 6, alpha: ea2 }, End('e5') + .5, t);
  }
  const flick = t => (Math.sin(t * 23.1) * Math.sin(t * 7.7 + 1) > .2) ? .25 : 1;
  const m5End = () => T('m5') + D('m5') * .5;
  function tag(s, x, y, a, t0, t) { const ctx = E.ctx; ctx.save(); ctx.globalAlpha = a; ctx.font = '700 30px "Noto Sans SC"'; const w = ctx.measureText(s).width + 56; ctx.restore(); E.bubbleBox(x, y, w, 56, '#9b96b8', a * .8); neon(s, x, y + 1, { size: 30, color: TH.p, weight: 700, alpha: a }, t0, t); }
  function under(t) { E.auroraBoost = .15 + .1 * vis(t, T('e4'), total + 5, 2) + .05 * vis(t, T('m1'), T('m4'), 1.5); }
  function tagFn(t) {
    const sc = [['chat', 'PROLOGUE', '未回复的消息'], ['piaget', 'CHAPTER I', '躲猫猫'], ['love', 'CHAPTER II', '爱的恒常'], ['reveal', 'CHAPTER III', '视线之外'], ['moon', 'EPILOGUE', '白天的月亮']];
    let cur = null; for (const [n, en, zh] of sc) { const s = TLs[n]; if (s && t >= s.a + .3) cur = [en, zh]; } return cur;
  }
  let TLs = {};
  return { build(tl) { for (const s of tl.scenes) TLs[s.name] = s; build(tl); }, overlay, under };
})();
window.setup = (canvas, tl, theme) => { E.setup(canvas, tl, theme || 'aurora'); FILM.build(tl); E.finalize(); };
window.draw = t => E.frame(t, FILM);
