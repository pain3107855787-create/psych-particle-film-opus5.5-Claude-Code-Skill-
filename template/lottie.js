// Lottie 动画（矢量小动画，播放器 lottie.min.js = lottie-web 5.13 canvas 版，MIT）
// 动画库：D:/claude/lottie/<名字>.json（tools/lottie_fetch.py 下载，清单见 D:/claude/lottie/index.md）；项目里 assets/lottie/ 下的同名文件优先
// 用法（film.js 的 over(t) 里）：LT.draw('broken-heart', t, x, y, 尺寸, { start: T('a3'), speed: 1, loop: false, alpha: 1, rot: 0 })
//   start：从这一刻开始播（之前停在第一帧，配合 alpha / vis 控制出现）；loop: true 循环；hold：播完停在最后一帧（默认）
//   LT.dur('名字') → 动画时长（秒）；画面逐帧由 t 决定（goToAndStop），渲染稳定、可复现
const LT = (() => {
  const LIB = 'file:///D:/claude/lottie/', cache = {};
  function load(name) {
    for (const base of ['assets/lottie/', LIB]) {
      try { const x = new XMLHttpRequest(); x.open('GET', base + name + '.json', false); x.send();
        if ((x.status === 200 || x.status === 0) && x.responseText) return JSON.parse(x.responseText); } catch (e) {}
    }
    throw new Error('LT: 找不到动画 ' + name + '（先 python tools/lottie_fetch.py ' + name + '）');
  }
  function get(name, px) {
    const k = name + '|' + px; if (cache[k]) return cache[k];
    const data = load(name), cv = document.createElement('canvas'); cv.width = cv.height = px;
    const ctx = cv.getContext('2d');
    const anim = lottie.loadAnimation({ renderer: 'canvas', loop: false, autoplay: false, animationData: data,
      rendererSettings: { context: ctx, clearCanvas: true, preserveAspectRatio: 'xMidYMid meet' } });
    anim.resize(px, px);
    return cache[k] = { cv, anim, fr: data.fr, frames: data.op - data.ip };
  }
  function dur(name) { const a = get(name, 64); return a.frames / a.fr; }
  function draw(name, t, x, y, size, o = {}) {
    const px = Math.min(1024, Math.ceil(size / 64) * 64), a = get(name, px);
    let f = Math.max(0, (t - (o.start ?? 0)) * (o.speed ?? 1) * a.fr);
    f = o.loop ? f % a.frames : Math.min(f, a.frames - 1);
    a.anim.goToAndStop(f, true);
    const g = (o.ctx || E.ctx); g.save(); g.globalAlpha *= o.alpha ?? 1; g.translate(x, y); if (o.rot) g.rotate(o.rot);
    g.drawImage(a.cv, -size / 2, -size / 2, size, size); g.restore();
  }
  return { draw, dur, get };
})();
