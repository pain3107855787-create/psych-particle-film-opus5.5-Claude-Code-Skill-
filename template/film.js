// 本期分镜（模板）。只写"什么时候粒子变成什么、镜头怎么走、叠加层画什么"，通用能力都在 engine.js
// 时间一律用配音时间轴表达：T('id') 句子开始、End('id') 句子结束、D('id') 句长 —— 改文案重配音后画面自动对齐
//
// 粒子：key(时刻, 形状, {d: 过渡秒数, type: 'swirl'|'burst'|'implode'|'drift', cx, cy, alpha, shake, flicker, spread})
//   过渡发生在 [时刻 - d, 时刻]；没有 d 表示"保持"。burst = 从 (cx,cy) 向外炸开再重组；implode = 吸进 (cx,cy)
//   形状（S.*，都返回 N 个点，颜色 0=主色 p，1=强调 a，2=第二强调 b）：
//     scatter(seed, spread) dust(cx,cy,rx,ry,col) point(cx,cy,col) ring(cx,cy,r,厚度,col) text(字,字号,cx,cy,col[,font,weight])
//     heart(cx,cy,s,col) heartOutline bubble(x,y,w,h,尾巴在左,col) clock(cx,cy,r,col) moon(cx,cy,r,col) dome(cx,cy,w,h,col)
//     wave(x1,y1,x2,y2,振幅,周期,col,厚度) dotsRow(个数,cx,cy,间距,col,半径) path(g => {画任意路径并 fill/stroke}, col)
//     mix([[形状, 权重], ...]) 按比例合并
// 镜头：cam(时刻, 缩放, x偏移, y偏移, 旋转)，相邻关键帧之间缓动。推近 1.2~1.4，拉远看全局 0.55~0.7
// 转场：flash(时刻, 强度≈.3) 白光闪切；wave(时刻, x, y, 颜色) 冲击波。爆散 / 重大揭示时配合使用，全片 3~5 次即可
// 叠加层（overlay，世界坐标、跟随镜头）：
//   neon(字, x, y, {size, color, font, weight, spacing, alpha}, 进场时刻, t)  —— 霓虹字，带 RGB 错位进场；光晕已收紧，别再加大
//   orb(x, y, 半径, 颜色, 透明度, t) 发光光点；link(x1,y1,x2,y2,色1,色2,t,{alpha,k,amp,cycles}) 两点间波浪光线
//   bubbleBox(x, y, w, h, 颜色, 透明度) 圆角框；vis(t, 开始, 结束, 淡入, 淡出) 可见度；prog(t, 开始, 时长) 进度
// 画面中心约 (960, 470)；y > 900 留给字幕；左上角章节标签、右上角 Pain 水印由引擎画
const FILM = (() => {
  const { T, End, D, S, key, cam, flash, wave, neon, orb, link, bubbleBox, clamp, lerp, ease, eOut, prog, vis } = E;
  let TH, total, TLs = {};

  function build(tl) {
    TH = E.TH; total = tl.total;
    // ---- 粒子 ----
    key(0, S.scatter(1), { alpha: .6 });
    key(T('a1') + 1.2, S.ring(960, 470, 200, 10, 0), { d: 1.4 });
    key(T('a2') + .4, S.text('示例', 200, 960, 450, 1), { d: 1.2, type: 'burst', cx: 960, cy: 470 });
    key(total + 1, S.text('示例', 200, 960, 450, 1));
    // ---- 镜头 ----
    cam(0, 1.15); cam(T('a1') + .5, 1); cam(End('a2'), 1.08); cam(total, 1);
    // ---- 转场 ----
    flash(T('a2') - .2); wave(T('a2') - .2, 960, 470, TH.a);
  }
  function overlay(t) {
    neon('示例', 960, 450, { size: 200, color: TH.p, alpha: vis(t, T('a2') + 1.6, total + 5, .5) }, T('a2') + 1.6, t);
  }
  // 可选：under(t) 在背景之后、粒子之前画（例如调 E.auroraBoost 让极光变亮）；screen(t) 画不跟镜头走的东西
  function under(t) { }
  // 左上角章节标签：按场景名给 [英文, 中文]
  const TAGS = { intro: ['PROLOGUE', '序'], main: ['CHAPTER I', '第一章'] };
  function tag(t) { let cur = null; for (const n in TAGS) { const s = TLs[n]; if (s && t >= s.a + .3) cur = TAGS[n]; } return cur; }
  return { build(tl) { for (const s of tl.scenes) TLs[s.name] = s; build(tl); }, overlay, under, tag };
})();
window.setup = (canvas, tl, theme) => { E.setup(canvas, tl, theme); FILM.build(tl); E.finalize(); };
window.draw = t => E.frame(t, FILM);
