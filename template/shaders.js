// Shader 着色器库（WebGL2，全部手写，不用下载）。和 S3 一样返回一张 1920×1080 画布，在 film.js 里 drawImage 即可
// 用法：const cv = SH.render('aurora', t, { a: TH.a, b: TH.b, p: [..], alpha: 1, scale: .5 });  E.ctx.drawImage(cv, 0, 0, 1920, 1080);
//   a / b / c：颜色（'#rrggbb'），不传就用本期配色 E.TH.p / a / b
//   p：4 个参数（各 shader 含义见下表），speed：时间倍率，scale：渲染分辨率（.5 = 960×540 再放大，省时间，背景类够用）
//   后期类（glitch / ripple / haze / crt / chroma）要传 src: 画布（比如 E.ctx.canvas 的拷贝），对它做扭曲后返回
// 背景类
//   aurora  极光帘          p = [高度 0~1, 帘子密度, 亮度, -]
//   nebula  星云烟雾        p = [扭曲, 亮度, 星星密度, -]
//   liquid  流体大理石      p = [流速, 纹理密度, 对比, -]
//   core    发光内核球      p = [中心x(px), 中心y(px), 半径(px), 不稳定度 0~1]   不稳定度越高越闪、越抖
//   rays    体积光束        p = [光源x(px), 光源y(px), 光束数, 亮度]
//   warp    星空穿梭        p = [速度, 星星数量, 拖尾长度, -]
//   caustic 水底焦散光      p = [缩放, 亮度, -, -]
//   horizon 合成波网格+落日 p = [地平线高度 0~1, 网格速度, 太阳大小, -]
//   ink     墨滴晕染        p = [中心x(px), 中心y(px), 进度 0~1, 毛边]
//   bokeh   漂浮光斑        p = [光斑数量, 大小, 亮度, -]
// 后期类（需要 src）
//   glitch  故障块+RGB 错位 p = [强度 0~1, 块大小, -, -]
//   ripple  冲击波折射      p = [中心x(px), 中心y(px), 进度 0~1, 强度]
//   haze    热浪扭曲        p = [强度, -, -, -]
//   crt     老电视扫描线    p = [扫描线强度, 暗角, 弯曲, -]
//   chroma  色差拉丝        p = [强度(px), -, -, -]
const SH = (() => {
  const W = 1920, H = 1080;
  let cv, gl, buf, tex, progs = {};
  const HEAD = `#version 300 es
precision highp float;
uniform vec2 R; uniform float T, AL; uniform vec3 A, B, C; uniform vec4 P; uniform sampler2D S;
out vec4 o;
float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h2(vec2 p){ float n = h1(p); return vec2(n, h1(p + n)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + 1.), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 6; i++) { s += a * vn(p); p = m * p; a *= .5; } return s; }
vec2 px(){ return vec2(gl_FragCoord.x, R.y - gl_FragCoord.y) * (${W}. / R.x); }   // 1920×1080 坐标，y 向下，和 2D 画布一致
vec2 uv(){ return px() / vec2(${W}., ${H}.); }
vec4 src(vec2 q){ return texture(S, q); }   // 画布上传后第 0 行就是顶部，q 已是 y 向下
`;
  const FS = {
    aurora: `void main(){ vec2 q = uv(); float x = q.x * (2. + P.y * 3.);
      float c = 0.;
      for (int i = 0; i < 3; i++) { float fi = float(i);
        float band = fbm(vec2(x * .8 + fi * 3.1, T * .08 + fi)) ;
        float top = .15 + (1. - P.x) * .25 + band * .25 + fi * .06;
        float d = q.y - top; float curtain = smoothstep(0., .02, d) * exp(-d * (5. + fi * 2.));
        float stripes = .55 + .45 * sin(x * 40. + fbm(vec2(x * 3., T * .2 + fi)) * 12.);
        c += curtain * stripes * (1. - fi * .25); }
      vec3 col = mix(A, B, smoothstep(.1, .7, q.y + .15 * sin(T * .2 + q.x * 3.)));
      vec3 bg = vec3(.01, .015, .04) + C * .04 * (1. - q.y);
      o = vec4(bg + col * c * (.6 + P.z), AL); }`,
    nebula: `void main(){ vec2 q = uv() * vec2(1.78, 1.) * 2.2; float t = T * .04;
      vec2 w = vec2(fbm(q + t), fbm(q + vec2(5.2, 1.3) - t));
      float n = fbm(q + (1. + P.x * 3.) * w);
      vec3 col = mix(vec3(.01, .01, .03), A, smoothstep(.35, .8, n));
      col = mix(col, B, smoothstep(.55, 1., n * w.x * 1.6));
      col *= .5 + P.y;
      vec2 g = floor(px() / 3.); float st = step(1. - .0015 * (1. + P.z * 4.), h1(g)) * (.6 + .4 * sin(T * 3. + h1(g + 7.) * 20.));
      o = vec4(col + st, AL); }`,
    liquid: `void main(){ vec2 q = uv() * vec2(1.78, 1.) * (1.5 + P.y * 2.); float t = T * (.08 + P.x * .2);
      vec2 w = q; for (int i = 1; i < 6; i++) { float fi = float(i); w += vec2(.6 / fi * sin(fi * w.y + t + .3 * fi), .6 / fi * cos(fi * w.x + t * 1.3 + .5 * fi)); }
      float m = .5 + .5 * sin(w.x * 1.5 + w.y);
      m = pow(m, 1. + P.z * 3.);
      vec3 col = mix(vec3(.02, .015, .03), A, m); col = mix(col, B, pow(1. - m, 6.) * .9);
      o = vec4(col, AL); }`,
    core: `void main(){ vec2 p = px(); vec2 c = P.xy; float r = P.z, un = P.w;
      float jit = un * (vn(vec2(T * 9., 1.)) - .5) * 2.;
      float flick = 1. - un * .7 * step(.6, vn(vec2(T * 14., 3.)));
      vec2 d = (p - c) / r; float l = length(d);
      float ang = atan(d.y, d.x);
      float surf = fbm(vec2(ang * 2. + T * .3, l * 3. - T * (.6 + un * 2.)));
      float rr = 1. + jit * .08 + (surf - .5) * un * .35;
      float inside = smoothstep(rr, rr - .04, l);
      float plasma = fbm(d * 3. + vec2(T * .4, -T * .3) + fbm(d * 2. - T * .2));
      vec3 hot = mix(A, vec3(1.), smoothstep(.55, .95, plasma * (1. - l * .6)));
      vec3 col = hot * inside * (.6 + plasma) * flick;
      float glow = exp(-max(l - rr, 0.) * (3. + un * 2.)) * .55 * flick;
      col += B * glow * (1. - inside);
      float shell = exp(-abs(l - 1.32) * 60.) * .35;
      col += C * shell;
      o = vec4(col, AL * clamp(max(max(col.r, col.g), col.b) * 1.4, 0., 1.)); }`,
    rays: `void main(){ vec2 p = px(); vec2 d = p - P.xy; float a = atan(d.y, d.x), l = length(d);
      float n = fbm(vec2(a * P.z * .5 + 3., T * .15)); float beams = pow(n, 3.) * 3.;
      float fall = 1. / (1. + l * .004);
      vec3 col = mix(A, B, n) * beams * fall * (.4 + P.w);
      col += A * exp(-l * .012) * (.6 + P.w);
      o = vec4(col, AL * clamp(length(col), 0., 1.)); }`,
    warp: `void main(){ vec2 p = (px() - vec2(960., 540.)) / 540.; float a = atan(p.y, p.x), l = length(p);
      float n = 60. + P.y * 140.; float id = floor(a / 6.2832 * n);
      float rnd = h1(vec2(id, 7.)); float z = fract(rnd + T * (.15 + P.x * .5));
      float pos = pow(z, 2.) * 1.8; float len = .02 + P.z * .25 * z;
      float s = smoothstep(len, 0., abs(l - pos)) * step(abs(fract(a / 6.2832 * n) - .5), .06) * z;
      vec3 col = mix(B, A, rnd) * s * 2.;
      col += vec3(.01, .01, .03);
      o = vec4(col, AL); }`,
    caustic: `void main(){ vec2 q = uv() * vec2(1.78, 1.) * (1.5 + P.x * 2.); float t = T * .5 + 23.;
      vec2 p = mod(q * 6.28318, 6.28318) - 250.; vec2 i = p; float c = 1., inten = .005;
      for (int n = 0; n < 5; n++) { float tt = t * (1. - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1. / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten))); }
      c /= 5.; c = 1.17 - pow(c, 1.4); float v = clamp(pow(abs(c), 8.), 0., 1.);
      vec3 col = mix(vec3(.0, .02, .05), A * .5, uv().y * .6) + mix(B, vec3(1.), .4) * v * (.4 + P.y);
      o = vec4(col, AL); }`,
    horizon: `void main(){ vec2 q = uv(); float hy = .45 + (1. - P.x) * .2;
      vec3 col = mix(vec3(.02, .0, .06), C * .25, smoothstep(0., hy, q.y));
      vec2 sc = vec2(.5, hy - .12); float sr = .12 + P.z * .1; float sd = length((q - sc) * vec2(1.78, 1.));
      float sun = smoothstep(sr, sr - .005, sd) * step(.5, fract((q.y - sc.y) * 40. * smoothstep(sc.y - sr, sc.y + sr, q.y) + .5) + .5 * (1. - smoothstep(sc.y - .02, sc.y + sr, q.y)));
      col += mix(B, A, (q.y - sc.y + sr) / (2. * sr)) * sun + A * exp(-sd * 8.) * .3;
      if (q.y > hy) { float z = 1. / (q.y - hy + .001); vec2 g = vec2((q.x - .5) * z * 1.2, z + T * (1. + P.y * 3.));
        vec2 f = abs(fract(g) - .5); float line = smoothstep(.06 * z * .02 + .02, 0., min(f.x, f.y) / (z * .03));
        col = mix(vec3(.02, 0., .05), col * .2, .5) + B * line * smoothstep(0., .4, q.y - hy) + A * exp(-(q.y - hy) * 30.) * .6; }
      o = vec4(col, AL); }`,
    ink: `void main(){ vec2 p = px(); float d = length(p - P.xy) / 1100.;
      float edge = fbm(p * .006 + T * .05) * (.15 + P.w * .3);
      float r = P.z * 1.2 + edge - .1;
      float m = smoothstep(r, r - .05, d);
      float tone = fbm(p * .003 - T * .02);
      vec3 col = mix(A * .25, A, tone) * m + B * smoothstep(.02, 0., abs(d - r + .02)) * .5;
      o = vec4(col, AL * m); }`,
    bokeh: `void main(){ vec2 p = px(); vec3 col = vec3(0.); float a = 0.;
      for (int i = 0; i < 40; i++) { float fi = float(i); if (fi > 8. + P.x * 32.) break;
        vec2 r = h2(vec2(fi, 3.1)); vec2 c = vec2(r.x * 1920., mod(r.y * 1300. - T * (10. + 30. * h1(vec2(fi, 9.))), 1300.) - 110.);
        c.x += sin(T * .3 + fi) * 40.; float s = (40. + 120. * h1(vec2(fi, 5.))) * (.6 + P.y);
        float d = length(p - c); float disk = smoothstep(s, s * .93, d) * (.25 + .75 * smoothstep(s * .5, s, d));
        vec3 k = mix(A, B, h1(vec2(fi, 11.))); col += k * disk * .35 * (.5 + P.z); a += disk * .35; }
      o = vec4(col, AL * clamp(a, 0., 1.)); }`,
    glitch: `void main(){ vec2 q = uv(); float s = P.x; float bs = 20. + P.y * 60.;
      float row = floor(px().y / bs); float tk = floor(T * 12.);
      float on = step(1. - s * .6, h1(vec2(row, tk)));
      float off = (h1(vec2(row, tk + 1.)) - .5) * .12 * s * on;
      float rgb = .006 * s + on * .01 * s;
      vec4 base = src(q + vec2(off, 0.));
      float r = src(q + vec2(off + rgb, 0.)).r, b = src(q + vec2(off - rgb, 0.)).b;
      vec3 col = vec3(r, base.g, b);
      col += step(.985, h1(vec2(floor(px().y / 2.), tk))) * s * .25;
      o = vec4(col, AL); }`,
    ripple: `void main(){ vec2 p = px(); vec2 d = p - P.xy; float l = length(d); float rr = P.z * 1400.;
      float band = exp(-pow((l - rr) / 60., 2.)) * (1. - P.z);
      vec2 q = uv() - normalize(d + .0001) * band * .03 * (.5 + P.w);
      vec4 c = src(q); c.rgb += band * .15;
      o = vec4(c.rgb, AL); }`,
    haze: `void main(){ vec2 q = uv(); float n = fbm(vec2(q.x * 8., q.y * 6. + T * 2.));
      vec2 off = vec2(n - .5, fbm(vec2(q.x * 7. + 3., q.y * 5. - T * 1.7)) - .5) * .015 * (.3 + P.x);
      o = vec4(src(q + off).rgb, AL); }`,
    crt: `void main(){ vec2 q = uv(); vec2 cc = q - .5; q = .5 + cc * (1. + dot(cc, cc) * P.z * .25);
      vec3 col = src(q).rgb; col *= 1. - P.x * .35 * (.5 + .5 * sin(px().y * 3.14159));
      col *= 1. - P.y * dot(cc, cc) * 2.2;
      if (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1.) col = vec3(0.);
      o = vec4(col, AL); }`,
    chroma: `void main(){ vec2 q = uv(); vec2 d = (q - .5); float s = P.x / 1920.;
      float r = src(q + d * s * 2.).r, g = src(q).g, b = src(q - d * s * 2.).b;
      o = vec4(r, g, b, AL); }`,
  };
  const POST = ['glitch', 'ripple', 'haze', 'crt', 'chroma'];

  function init() {
    cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    gl = cv.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: true });
    if (!gl) throw new Error('SH: 需要 WebGL2（render.mjs 已开 GPU）');
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  }
  function compile(name) {
    const sh = (type, s) => { const x = gl.createShader(type); gl.shaderSource(x, s); gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error('SH ' + name + ': ' + gl.getShaderInfoLog(x)); return x; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 v; void main(){ gl_Position = vec4(v, 0, 1); }'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, HEAD + FS[name])); gl.bindAttribLocation(pr, 0, 'v'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('SH ' + name + ': ' + gl.getProgramInfoLog(pr));
    const u = {}; for (const k of ['R', 'T', 'AL', 'A', 'B', 'C', 'P', 'S']) u[k] = gl.getUniformLocation(pr, k);
    return progs[name] = { pr, u };
  }
  const rgb = (c, d) => { c = c || d || '#ffffff'; if (c[0] !== '#') return [1, 1, 1]; if (c.length === 4) c = '#' + [...c.slice(1)].map(x => x + x).join('');
    return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255); };

  function render(name, t, o = {}) {
    if (!FS[name]) throw new Error('SH: 没有 ' + name + '，可用：' + Object.keys(FS).join(' / '));
    if (!gl) init();
    const sc = o.scale || 1, w = Math.round(W * sc), h = Math.round(H * sc);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const pg = progs[name] || compile(name), th = (typeof E !== 'undefined' && E.TH) || {};
    gl.viewport(0, 0, w, h); gl.useProgram(pg.pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(pg.u.R, w, h); gl.uniform1f(pg.u.T, t * (o.speed ?? 1)); gl.uniform1f(pg.u.AL, o.alpha ?? 1);
    gl.uniform3fv(pg.u.A, rgb(o.a, th.a)); gl.uniform3fv(pg.u.B, rgb(o.b, th.b)); gl.uniform3fv(pg.u.C, rgb(o.c, th.p));
    const p = o.p || []; gl.uniform4f(pg.u.P, p[0] ?? .5, p[1] ?? .5, p[2] ?? .5, p[3] ?? .5);
    if (POST.includes(name)) {
      if (!o.src) throw new Error('SH: ' + name + ' 是后期类，要传 src 画布');
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.src); gl.uniform1i(pg.u.S, 0);
    }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    return cv;
  }
  return { render, list: Object.keys(FS), post: POST };
})();
