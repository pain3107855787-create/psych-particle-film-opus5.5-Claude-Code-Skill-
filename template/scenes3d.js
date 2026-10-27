// ============================================================================
// 3D 场景库（Three.js + 辉光后期）：给片子做"高级动画背景"（参考视频：有空间感、有光影的场景）
// 用法（film.js）：under(t) 里  const cv = S3.render('stars', t, {...});  E.ctx.drawImage(cv, 0, 0);
//   S3.render(名字, t, 参数) → 返回 1920×1080 的 canvas；同一个名字的场景只建一次，参数每帧可变（镜头、亮度、高亮…）
// screens 额外：首次调用传 oddText（一块不一样的屏幕的文字），之后用 odd（0~1 显示）+ lookOdd（0~1 镜头转过去）
// 场景：stars 星空穹顶 + 十二星座连线 · screens 成百上千块发光屏幕（每块写着同一句话）· tiles 悬浮的 16 宫格玻璃方块（MBTI）
//      · stage 舞台聚光灯 + 一把椅子（算命 / 读心）· 新场景加在 SCENES 里，并补进图鉴
// 依赖 three.bundle.js（D:/claude/tools3d 用 esbuild 打包：three + EffectComposer/RenderPass/UnrealBloomPass/OutputPass）
// ============================================================================
const S3 = (() => {
  const W = 1920, H = 1080; let R, comp, bloom, built = {};
  function init() {
    if (R) return; const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true, alpha: false }); R.setSize(W, H, false); R.setPixelRatio(1);
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
  }
  const rnd = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  let _dot; function dotTex() { if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _dot = new THREE.CanvasTexture(c); return _dot; }
  function nebulaTex(seed, rgb) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = rnd(seed);
    for (let i = 0; i < 40; i++) { const x = 128 + (r() - .5) * 160, y = 128 + (r() - .5) * 160, rad = 30 + r() * 80, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${.05 + r() * .08})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
    g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(128, 128, 0, 128, 128, 128); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(.6, 'rgba(0,0,0,.6)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c); }
  function textTex(lines, o = {}) {
    const c = document.createElement('canvas'); c.width = o.w || 512; c.height = o.h || 900; const g = c.getContext('2d');
    g.fillStyle = o.bg || '#0b0f1a'; g.fillRect(0, 0, c.width, c.height);
    if (o.header) { g.fillStyle = '#1a2235'; g.fillRect(0, 0, c.width, 110); g.fillStyle = '#9fb2cc'; g.font = '700 40px "Noto Sans SC"'; g.fillText(o.header, 36, 70); }
    g.fillStyle = o.color || '#e8eefc'; g.font = `700 ${o.size || 44}px "Noto Sans SC"`; let y = o.header ? 200 : 110;
    for (const l of lines) { g.fillText(l, 36, y); y += (o.size || 44) * 1.55; }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const SCENES = {
    /** 星空穹顶：几千颗星 + 十二星座连线慢慢转；o: {spin 转速, hi 高亮第几个星座(0~11, -1 无), glow 连线亮度, camZ} */
    stars(scene, cam) {
      scene.fog = new THREE.FogExp2(0x050814, .018); scene.background = new THREE.Color(0x02030a);
      const r = rnd(7), N = 6000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const u = r() * 2 - 1, th = r() * 6.283, rad = 60 + r() * 40, s = Math.sqrt(1 - u * u); pos.set([rad * s * Math.cos(th), rad * u, rad * s * Math.sin(th)], i * 3); const w = .6 + r() * .4; col.set([w, w * (.9 + r() * .1), 1], i * 3); }
      const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gm.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(gm, new THREE.PointsMaterial({ size: .7, map: dotTex(), vertexColors: true, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts);
      for (const [seed, rgb, x, y, z, sc] of [[1, '120,90,255', 30, 10, -40, 70], [3, '255,90,170', 10, 25, 45, 60], [4, '90,200,255', -20, 18, -50, 60]]) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTex(seed, rgb), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .4 })); sp.position.set(x, y, z); sp.scale.set(sc, sc, 1); scene.add(sp); }
      const grp = new THREE.Group(); scene.add(grp); const cons = [];
      for (let k = 0; k < 12; k++) {   // 12 个"星座"：每个 5~7 颗亮星连成折线，分布在一圈上
        const a0 = k / 12 * 6.283, cx = Math.cos(a0) * 38, cz = Math.sin(a0) * 38, cy = (r() - .5) * 16, n = 5 + Math.floor(r() * 3), P = [];
        for (let j = 0; j < n; j++) P.push(new THREE.Vector3(cx + (r() - .5) * 12, cy + (r() - .5) * 9, cz + (r() - .5) * 12));
        const lm = new THREE.LineBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: .5 }), ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(P), lm); grp.add(ln);
        const sg = new THREE.BufferGeometry().setFromPoints(P), sm = new THREE.PointsMaterial({ size: 1.6, map: dotTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); grp.add(new THREE.Points(sg, sm)); cons.push({ lm, sm });
      }
      cam.position.set(0, 2, 0.01);
      return (t, o) => { grp.rotation.y = t * (o.spin ?? .03); pts.rotation.y = t * (o.spin ?? .03) * .4; const gl = o.glow ?? 1;
        cons.forEach((c, i) => { const h = i === o.hi; c.lm.opacity = (h ? 1 : .45) * gl; c.lm.color.setHex(h ? 0xffb35c : 0x8fb8ff); c.sm.size = h ? 2.6 : 1.6; });
        cam.position.set(0, 2 + (o.camY || 0), o.camZ ?? .01); cam.lookAt(Math.cos(t * .05) * 30, 4, Math.sin(t * .05) * 30); };
    },
    /** 屏幕海：几百块发光手机屏一直排到雾里，每块写着同一段话；o: {text:[行…], header, dolly 推进量, flicker 0~1, hi 高亮的那块亮度} */
    screens(scene, cam, o0) {
      scene.background = new THREE.Color(0x020308); scene.fog = new THREE.Fog(0x020308, 8, 70);
      const tex = textTex(o0.text || ['你外表开朗，', '内心却常常', '感到孤独。'], { header: o0.header || '今日运势', size: 46 });
      const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x9aa4b8 }), geo = new THREE.PlaneGeometry(1.6, 2.8), r = rnd(3), group = new THREE.Group(); scene.add(group); const ms = [];
      for (let i = 0; i < 420; i++) { const m = new THREE.Mesh(geo, mat); const row = Math.floor(i / 21), colx = i % 21; m.position.set((colx - 10) * 2.4 + (r() - .5) * .6, (r() - .5) * 2.2 + (row % 3 - 1) * 3.6, -row * 3.2 - r() * 1.5); m.rotation.y = (r() - .5) * .5; group.add(m); ms.push(m); }
      const hero = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: 0xdfe6f2 })); hero.position.set(0, 0, 4.2); scene.add(hero);
      let odd = null; if (o0.oddText) { odd = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: textTex(o0.oddText, { header: o0.oddHeader || o0.header, size: 46, color: '#ffd7a0' }), color: 0xffffff, transparent: true })); odd.position.set(2.8, .45, 1.0); odd.rotation.y = -.12; scene.add(odd); }
      cam.position.set(0, 0, 8);
      return (t, o) => { const d = o.dolly || 0, lo = o.lookOdd || 0, l2 = lo * lo * (3 - 2 * lo); cam.position.set(Math.sin(t * .2) * .3 * (1 - l2) + l2 * 2.3, Math.cos(t * .17) * .2 * (1 - l2) + l2 * .5, 8 - d - l2 * 2.6); cam.lookAt(l2 * 2.8, l2 * .45, -20 + l2 * 21);
        if (odd) { odd.material.opacity = o.odd ?? 0; odd.visible = (o.odd ?? 0) > .01; }
        hero.visible = (o.hero ?? 1) > .01; hero.material.opacity = o.hero ?? 1; hero.material.transparent = true; hero.position.z = 4.2 - (o.heroBack || 0) * 30;
        group.children.forEach((m, i) => m.position.y += Math.sin(t * .8 + i) * .0015); mat.color.setScalar(.25 + .4 * (o.field ?? 1)); };
    },
    /** 16 宫格：4×4 悬浮玻璃方块（每块一个 MBTI 四字母），镜头环绕；o: {hi 高亮第几块(-1 无), spin, explode 0~1 散开} */
    tiles(scene, cam) {
      scene.background = new THREE.Color(0x03040a); scene.fog = new THREE.FogExp2(0x03040a, .045);
      scene.add(new THREE.AmbientLight(0x404a66, 1.2)); const pl = new THREE.PointLight(0xffb35c, 60, 30); pl.position.set(0, 4, 6); scene.add(pl); const pl2 = new THREE.PointLight(0x7cc4ff, 40, 30); pl2.position.set(-6, -3, 4); scene.add(pl2);
      const TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'], tiles = [];
      TYPES.forEach((s, i) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#0d1424'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#7cc4ff'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 240);
        g.fillStyle = '#e8f1ff'; g.font = '700 64px "JetBrains Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 128, 128); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, .25), [new THREE.MeshStandardMaterial({ color: 0x1a2438, metalness: .6, roughness: .3 }), new THREE.MeshStandardMaterial({ color: 0x1a2438, metalness: .6, roughness: .3 }), new THREE.MeshStandardMaterial({ color: 0x1a2438 }), new THREE.MeshStandardMaterial({ color: 0x1a2438 }), new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: .55 }), new THREE.MeshStandardMaterial({ color: 0x1a2438 })]);
        const bx = (i % 4 - 1.5) * 2.1, by = (1.5 - Math.floor(i / 4)) * 2.1; m.userData = { bx, by, ph: i * .7 }; scene.add(m); tiles.push(m); });
      cam.position.set(0, 0, 11);
      return (t, o) => { const ex = o.explode || 0; tiles.forEach((m, i) => { const u = m.userData; m.position.set(u.bx * (1 + ex * 1.5), u.by * (1 + ex * 1.5) + Math.sin(t * .9 + u.ph) * .12, Math.sin(t * .6 + u.ph) * .3 - ex * i * .4);
          m.rotation.set(Math.sin(t * .5 + u.ph) * .15, Math.sin(t * .4 + u.ph) * .25 + (o.spin || 0) * t, 0); m.material[4].emissiveIntensity = i === o.hi ? 1.6 : (o.hi >= 0 ? .25 : .55); });
        cam.position.set(Math.sin(t * .15) * 2.5, Math.cos(t * .12) * 1, 11 - (o.dolly || 0)); cam.lookAt(0, o.lookY ?? .9, 0); };   // lookY>0 让方块整体偏下，给顶部文字留位置
    },
    /** 舞台：暗场 + 一束体积感聚光 + 一把椅子 + 飘浮尘埃；o: {beam 光束亮度, sway} */
    stage(scene, cam) {
      scene.background = new THREE.Color(0x020203); scene.fog = new THREE.FogExp2(0x020203, .05);
      scene.add(new THREE.AmbientLight(0x202530, .6));
      const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: .6, metalness: .2 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const sp = new THREE.SpotLight(0xffe2b8, 300, 40, .32, .5, 1.2); sp.position.set(0, 14, 0); sp.target.position.set(0, 0, 0); scene.add(sp, sp.target);
      const coneMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { op: { value: .11 }, col: { value: new THREE.Color(1, .89, .72) } },
        vertexShader: 'varying float vy; varying vec3 vN; varying vec3 vV; void main(){ vy = position.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform float op; uniform vec3 col; varying float vy; varying vec3 vN; varying vec3 vV; void main(){ float h = clamp((vy+7.0)/14.0,0.0,1.0); float edge = pow(1.0-abs(dot(vN,vV)),1.5); gl_FragColor = vec4(col, op*(0.55+0.45*h)*(0.35+0.65*(1.0-edge))); }' });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 14, 64, 1, true), coneMat); cone.position.y = 7; scene.add(cone);
      const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: .5 }), chair = new THREE.Group();
      const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); chair.add(m); };
      box(1.6, .15, 1.6, 0, 1.2, 0); box(1.6, 1.9, .15, 0, 2.1, -.75); for (const [x, z] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) box(.12, 1.2, .12, x, .6, z); scene.add(chair); chair.rotation.y = .5;
      const r = rnd(9), N = 900, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) pos.set([(r() - .5) * 9, r() * 13, (r() - .5) * 9], i * 3);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: .09, map: dotTex(), color: 0xfff0d0, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(dust);
      cam.position.set(0, 4, 14);
      return (t, o) => { const b = o.beam ?? 1; sp.intensity = 300 * b; coneMat.uniforms.op.value = .11 * b; const tn = o.tint || 0; coneMat.uniforms.col.value.setRGB(1, .89 - .45 * tn, .72 - .5 * tn); sp.color.setRGB(1, .89 - .4 * tn, .72 - .45 * tn); dust.rotation.y = t * .03; dust.position.y = -((t * .15) % 1);
        cam.position.set(Math.sin(t * .1) * 3, 4 + Math.sin(t * .13) * .4, 14 - (o.dolly || 0)); cam.lookAt(0, 2.2, 0); };
    },
    /** 待办海啸（拖延起用）：几千张纸片堆成一道卷起的巨浪，悬在主角身后/头顶，随剧情长大 → 定格 → 砸下来 → 收拢成一页。
     *  首次传 o0.labels（纸上写的待办，8 个左右）；每帧 o: {grow 0~1 规模, clock 飘动用的时钟（定格时传常数）, orbit 镜头绕浪的角度(弧度), dist 镜头距离(默认 13), camY, lookY, lookZ,
     *  crash 0~1 浪砸向镜头, gather 0~1 全部飞向 gatherTo([x,y,z]) 收成一页, lit 0~8 亮起几张"标签纸", dim 0~1 压暗, heat 0~1 底部火光}
     *  主角在 (0,0,6) 附近，用 S3.project('paperwave', x,y,z) 把 3D 点换成 [屏幕x, 屏幕y, 每单位像素]，在 2D 里画人 */
    paperwave(scene, cam, o0) {
      const BG = 0x090403; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .018);
      const r = rnd(21), N = 5600, labels = o0.labels || ['周报', '回消息', '体检', '给妈打电话', '健身', '论文', '退货', '那封邮件'];
      const paper = (txt, o = {}) => { const c = document.createElement('canvas'), w = o.w || 128, h = Math.round(w * 1.32); c.width = w; c.height = h; const g = c.getContext('2d'), k = w / 128;
        g.fillStyle = o.bg || '#f1e4cc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(150,110,70,.35)'; g.lineWidth = 2 * k; for (let y = 30 * k; y < h - 10 * k; y += 16 * k) { g.beginPath(); g.moveTo(10 * k, y); g.lineTo(w - 10 * k, y); g.stroke(); }
        g.fillStyle = 'rgba(200,60,30,.5)'; g.fillRect(18 * k, 0, 2 * k, h);
        if (txt) { g.fillStyle = '#2a1608'; g.font = `900 ${Math.min(34, 112 / [...txt].length) * k}px "Noto Sans SC"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2 + 4 * k, h * .38);
          g.strokeStyle = '#2a1608'; g.lineWidth = 3 * k; g.strokeRect(14 * k, h * .62, 18 * k, 18 * k); g.fillStyle = 'rgba(42,22,8,.45)'; g.fillRect(40 * k, h * .62 + 7 * k, 70 * k, 4 * k); }
        if (o.stamp) { g.save(); g.translate(w * .55, h * .62); g.rotate(-.35); g.strokeStyle = '#c8281e'; g.fillStyle = '#c8281e'; g.lineWidth = 5 * k; g.beginPath(); g.arc(0, 0, 34 * k, 0, 6.3); g.stroke(); g.font = `900 ${24 * k}px "Noto Sans SC"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.stamp, 0, 1); g.restore(); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
      const texs = [paper(''), paper(''), paper('', { stamp: '明天' }), ...labels.map(s => paper(s))];
      const geo = new THREE.PlaneGeometry(.62, .82), groups = texs.map(() => []);
      for (let i = 0; i < N; i++) { const v = r() < .5 ? (r() < .5 ? 0 : 1) : (r() < .2 ? 2 : 3 + Math.floor(r() * labels.length)); const s = Math.pow(r(), .85), x = (r() - .5) * 2;
        groups[v].push({ v, s, x, j: [(r() - .5), (r() - .5), (r() - .5)], rot: [r() * 6.28, r() * 6.28, r() * 6.28], ph: r() * 6.28, order: Math.min(.999, s * .55 + r() * .45), d: r(), spin: (r() - .5) * 2 }); }
      const meshes = groups.map((gs, v) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: texs[v], side: THREE.DoubleSide }), gs.length); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); return m; });
      // 8 张"标签纸"：在浪的正面，定格时一张张转向镜头、放大发亮
      const hero = labels.map((s, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.98), new THREE.MeshBasicMaterial({ map: paper(s, { w: 256 }), side: THREE.DoubleSide })); scene.add(m);
        return { m, x: ((i + .5) / labels.length - .5) * 1.1, s: .86 + (i % 3) * .05, rot: (r() - .5) * .6 }; });
      // 地面火光 + 浪背后的热雾 + 上飘的火星
      const gcv = document.createElement('canvas'); gcv.width = gcv.height = 256; { const g = gcv.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,120,40,.55)'); gr.addColorStop(.4, 'rgba(140,40,8,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x140705 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
      const floorM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gcv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), floorM); floor.rotation.x = -Math.PI / 2; floor.position.set(0, .02, -2); scene.add(floor);
      const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTex(5, '255,110,30'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5 })); haze.position.set(0, 6, -18); scene.add(haze);
      const EN = 700, epos = new Float32Array(EN * 3), eb = []; for (let i = 0; i < EN; i++) eb.push([(r() - .5) * 60, r() * 20, -24 + r() * 32, .3 + r() * 1.2]);
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(epos, 3)); const embers = new THREE.Points(eg, new THREE.PointsMaterial({ size: .16, map: dotTex(), color: 0xff8a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(embers);
      const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3(), C = new THREE.Color(), TG = new THREE.Vector3();
      const sm = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), cl = u => Math.max(0, Math.min(1, u));
      // 浪的截面：s 0~.62 是背坡（从后面地上升到浪顶），.62~1 是往前卷下来的浪舌
      const prof = (s, Hh) => { const zb = -6 - Hh * .45, zc = -2.5, rr = .3 * Hh; if (s < .62) { const u = s / .62; return [Hh * sm(u), zb + (zc - zb) * u]; } const th = (s - .62) / .38 * 2.9; return [Hh - rr + rr * Math.cos(th), zc + rr * Math.sin(th)]; };
      const tmp = [0, 0, 0];
      const place = (p, o, clock) => {   // 每张纸在浪上的位置（不含 crash / gather），写进 tmp，返回这一段浪高
        const grow = o.grow ?? 1, H = 2 + 19 * grow, L = 8 + 30 * grow, xx = p.x * L / 2, Hh = H * (.86 + .14 * Math.cos(p.x * 2.2 + .6)) * (1 - .25 * Math.pow(Math.abs(p.x), 4));
        const s = Math.min(1, p.s + .012 * Math.sin(clock * .6 + p.x * 4)), [y, z] = prof(s, Hh), th = .45 + Hh * .035;
        tmp[0] = xx + p.j[0] * th * 1.6; tmp[1] = Math.max(.05, y + p.j[1] * th + Math.sin(clock * .9 + p.ph) * .12); tmp[2] = z + p.j[2] * th * 1.4 + (s > .9 ? (s - .9) * 6 * Math.abs(p.j[2]) : 0); return Hh; };
      cam.position.set(0, 2, 13);
      const upd = (t, o) => {
        const clock = o.clock ?? t, grow = o.grow ?? 1, crash = o.crash || 0, gather = o.gather || 0, dim = 1 - (o.dim || 0) * .85, heat = o.heat ?? .6, gto = o.gatherTo || [.5, 1.4, 6];
        meshes.forEach((m, v) => { const gs = groups[v];
          gs.forEach((p, i) => {
            const vis = (grow * 1.02 - p.order) / .02;
            if (vis <= 0) { M4.makeScale(0, 0, 0); m.setMatrixAt(i, M4); return; }
            const Hh = place(p, o, clock); let x = tmp[0], y = tmp[1], z = tmp[2], sc = 1, rx = p.rot[0] + Math.sin(clock * 1.3 + p.ph) * .3, ry = p.rot[1], rz = p.rot[2] + Math.sin(clock * 1.1 + p.ph) * .3;
            if (vis < 1) { const k = sm(cl(vis)); x = .3 + (x - .3) * k; z = 6 + (z - 6) * k; y = 1.2 + (y - 1.2) * k + Math.sin(k * Math.PI) * 4; rx += (1 - k) * 6; }   // 新加的纸从书桌飞上浪
            if (crash > 0) { const dl = (1 - p.s) * .45 + p.d * .15, k = cl((crash - dl) / (1 - dl * .9)), k2 = k * k;
              z += k2 * (30 + p.d * 26); y = y * (1 - k * .55) + Math.sin(k * Math.PI) * (2 + p.d * 4) - k2 * 2; x += p.j[0] * k2 * 22 + p.x * k * 6; rx += k * p.spin * 9; ry += k * p.spin * 5; }
            if (gather > 0) { const k = sm(cl((gather - p.d * .5) / .5)); x += (gto[0] - x) * k; y += (gto[1] - y) * k; z += (gto[2] - z) * k; sc = 1 - k * .9; rx += k * 4 * p.spin; }
            V.set(x, y, z); EU.set(rx, ry, rz); Q.setFromEuler(EU); SC.set(sc, sc, sc); M4.compose(V, Q, SC); m.setMatrixAt(i, M4);
            const lo = 1 - cl(y / Math.max(4, Hh)), under = p.s > .78 && crash < .3 ? .45 : 1, sh = (.1 + .14 * Math.abs(Math.cos(rx)) + .55 * lo * lo * heat + .08 * (1 - lo)) * dim * under * (o.bright ?? 1); C.setRGB(sh * 1.15, sh * (.78 - .2 * lo), sh * (.6 - .3 * lo)); m.setColorAt(i, C); });
          m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
        const a = o.orbit || 0, R0 = o.dist ?? 13; TG.set(0, o.lookY ?? 2.6, o.lookZ ?? 0);
        cam.position.set(TG.x + Math.sin(a) * R0 + Math.sin(t * .23) * .15, (o.camY ?? 2) + Math.sin(t * .31) * .1, TG.z + Math.cos(a) * R0); cam.lookAt(TG); cam.updateMatrixWorld();
        const lit = o.lit || 0;
        hero.forEach((h, i) => { const on = sm(cl(lit - i)); place({ s: h.s, x: h.x, j: [0, 0, .9], ph: i }, o, clock);
          h.m.visible = grow > .45 && gather < .95 && crash < .5; h.m.position.set(tmp[0], tmp[1], tmp[2] + .5 + on * 1.5);
          const face = Math.atan2(cam.position.x - tmp[0], cam.position.z - tmp[2]); h.m.rotation.set(Math.sin(clock + i) * .15 * (1 - on), h.rot * (1 - on) + face * on, h.rot * .5 * (1 - on));
          h.m.scale.setScalar((.5 + on * 1.1) * (1 - crash * 2)); const b = (.3 + on * 1.25) * dim; h.m.material.color.setRGB(b * 1.05, b * .92, b * .8); });
        floorM.opacity = Math.min(1, (.5 + heat * .7) * dim * (1 - gather * .6)); haze.material.opacity = (.25 + .45 * grow) * heat * dim; haze.scale.set(70 * (.4 + grow), 30 * (.4 + grow), 1);
        eb.forEach((e, i) => { epos[i * 3] = e[0] + Math.sin(t * .7 + i) * .6; epos[i * 3 + 1] = (e[1] + t * e[3]) % 20; epos[i * 3 + 2] = e[2]; }); eg.attributes.position.needsUpdate = true; embers.material.opacity = .9 * heat * dim;
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };   // [屏幕 x, 屏幕 y, 每单位多少像素]
      return upd;
    },
    /** 窗灯之城（嫉妒起用）：夜里几百栋楼、上万扇窗；街两边是"你"和"TA"的两扇主窗。
     *  每帧 o: {cam:[x,y,z], look:[x,y,z] 镜头, city 0~1 城里亮灯比例, you 0~1 你的窗亮度, youGreen 0~1 你窗里的绿光, lin 0~1 TA 的窗亮度,
     *  wire 0~1 两扇窗之间的"调光线", cut 0~1 线从中间断开, own 0~1 每盏灯往地面垂下自己的电线, map 0~1 地图绿线一段段连过去, goal 0~1 终点那扇窗（金色描边）}
     *  点位：S3.WIN.you / S3.WIN.lin / S3.WIN.map[i] / S3.WIN.goal（世界坐标），配合 S3.project('windowcity', x,y,z) 在 2D 里画人和标签 */
    windowcity(scene, cam) {
      const BG = 0x020a07; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .012);
      const r = rnd(41), blockM = new THREE.MeshBasicMaterial({ color: 0x07140f }), edgeM = new THREE.LineBasicMaterial({ color: 0x1d4a36, transparent: true, opacity: .55 });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x030c08 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
      const wins = [];   // [x, y, z, 朝向 0=+z 1=+x, 亮灯阈值, 冷暖]
      const block = (x, z, w, d, h, hero) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), blockM); m.position.set(x, h / 2, z); scene.add(m);
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeM); e.position.copy(m.position); scene.add(e);
        if (hero) return; for (let yy = 1.6; yy < h - .6; yy += 1.5) { for (let xx = -w / 2 + .8; xx < w / 2 - .5; xx += 1.25) wins.push([x + xx, yy, z + d / 2 + .02, 0, r(), r()]); for (let zz = -d / 2 + .8; zz < d / 2 - .5; zz += 1.25) wins.push([x + w / 2 + .02, yy, z + zz, 1, r(), r()]); } };
      for (let gx = -12; gx <= 12; gx++) for (let gz = 0; gz < 16; gz++) { const x = gx * 9 + (r() - .5) * 2, z = 2 - gz * 10 + (r() - .5) * 2; if (Math.abs(x) < 12 && z > -12) continue; if (r() < .15) continue;
        block(x, z, 5 + r() * 3, 5 + r() * 3, 6 + Math.pow(r(), 1.6) * (gz > 3 ? 34 : 18), false); }
      // 两栋主楼：左前是你，右后是 TA
      block(-6.5, 1.5, 6, 6, 13, true); block(6.5, -3.5, 6, 6, 15, true);
      const WIN = { you: [-4.5, 6.4, 4.52], lin: [5, 7.6, -.48], map: [], goal: [6, 13.5, -78] };
      for (const [hx, hz, hh, hw] of [[-6.5, 1.5, 13, 6], [6.5, -3.5, 15, 6]]) for (let yy = 1.6; yy < hh - .6; yy += 1.5) for (let xx = -hw / 2 + .8; xx < hw / 2 - .5; xx += 1.25) {
        const p = [hx + xx, yy, hz + 3.02]; if (Math.hypot(p[0] - WIN.you[0], p[1] - WIN.you[1]) < 1.2 || Math.hypot(p[0] - WIN.lin[0], p[1] - WIN.lin[1]) < 1.2) continue; wins.push([...p, 0, .55 + r() * .45, r()]); }
      const geo = new THREE.PlaneGeometry(.62, .85), wm = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), wins.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), C = new THREE.Color();
      wins.forEach((w, i) => { Q.setFromEuler(new THREE.Euler(0, w[3] ? Math.PI / 2 : 0, 0)); V.set(w[0], w[1], w[2]); M4.compose(V, Q, S1); wm.setMatrixAt(i, M4); }); scene.add(wm);
      // 地图：从你出发，一扇扇窗连过去，最后指向远处一扇黑着的窗
      const cand = wins.filter(w => w[3] === 0 && w[2] < -8 && w[2] > -72 && Math.abs(w[0]) < 40 && w[1] < 14);
      for (let k = 0; k < 7; k++) { const tz = -12 - k * 9.5, tx = Math.sin(k * 1.3) * 16 + k * .9; let best = null, bd = 1e9; for (const w of cand) { const d = Math.hypot(w[0] - tx, (w[2] - tz) * 1.5); if (d < bd) { bd = d; best = w; } } best[4] = -1; WIN.map.push([best[0], best[1], best[2] + .05]); }
      const tube = (pts, rad, col, top) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), g = new THREE.TubeGeometry(cv, Math.max(20, pts.length * 24), rad, 6, false), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, toneMapped: false, depthTest: !top })); if (top) m.renderOrder = 5; scene.add(m); return m; };
      const arc = (a, b, lift, n = 12) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * lift, a[2] + (b[2] - a[2]) * u]); } return out; };
      const sag = (a, b, d, n = 16) => { const out = []; for (let i = 0; i <= n; i++) { const u = i / n; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * d, a[2] + (b[2] - a[2]) * u]); } return out; };
      const yo = [WIN.you[0], WIN.you[1], WIN.you[2] + .1], li = [WIN.lin[0], WIN.lin[1], WIN.lin[2] + .1], mid = sag(yo, li, 2.2, 32);
      const wireA = tube(mid.slice(0, 17), .06, 0x6dff6a), wireB = tube(mid.slice(16).reverse(), .06, 0x6dff6a);
      const route = [yo, ...WIN.map, WIN.goal], legs = []; for (let k = 0; k < route.length - 1; k++) legs.push(tube(arc(route[k], route[k + 1], 2.5, 20), .6 + k * .05, k === route.length - 2 ? 0xffd27a : 0x7dff6a, true));
      // 每盏灯自己的电线：垂到地面的细线
      const ownPos = []; wins.forEach((w, i) => { if (i % 6 === 0 && w[2] > -70) ownPos.push(w[0], w[1] - .45, w[2] + .03, w[0], 0, w[2] + .03); });
      const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(ownPos, 3)); const own = new THREE.LineSegments(og, new THREE.LineBasicMaterial({ color: 0xffc86b, transparent: true, opacity: 0, toneMapped: false })); own.material.color.setRGB(2.4, 1.7, .7); scene.add(own);
      // 两扇主窗 + 终点窗的金色描边
      const bigWin = col => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); scene.add(m); return m; };
      const marks = [...WIN.map, WIN.goal].map((p, k, arr) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: k === arr.length - 1 ? 0xffd27a : 0x8dff7a, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.position.set(...p); sp.renderOrder = 6; scene.add(sp); return sp; });
      const youW = bigWin(0x000000), linW = bigWin(0x000000); youW.position.set(...WIN.you); linW.position.set(...WIN.lin);
      const goalF = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.2, 2.8)), new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, toneMapped: false })); goalF.position.set(...WIN.goal); scene.add(goalF);
      const goalW = bigWin(0x0a1410); goalW.position.set(WIN.goal[0], WIN.goal[1], WIN.goal[2] - .01); goalW.scale.set(1.2, 1.2, 1);
      // 漂浮的绿色微光
      const PN = 900, pp = new Float32Array(PN * 3), pb = []; for (let i = 0; i < PN; i++) pb.push([(r() - .5) * 120, r() * 30, 10 - r() * 120, .2 + r() * .5]);
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: .18, map: dotTex(), color: 0x7dff9a, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(motes);
      S3.WIN = WIN; cam.position.set(-3, 6.5, 16); const LK = new THREE.Vector3();
      const upd = (t, o) => {
        const city = o.city ?? .5, mapK = o.map || 0, dimC = 1 - (o.dimCity || 0) * .75;
        wins.forEach((w, i) => { let k = w[4] >= 0 && w[4] < city ? 1 : 0; if (w[4] < 0) k = mapK > 0 ? .9 : (city > .3 ? 1 : 0);
          const warm = w[5] > .22, fl = 1 + .05 * Math.sin(t * (1 + w[5] * 3) + i);
          if (k) { if (w[4] < 0 && mapK > 0) C.setRGB(.6, 2.2, .7); else if (warm) C.setRGB(.8 * fl * dimC, .5 * fl * dimC, .22 * fl * dimC); else C.setRGB(.3 * dimC, .48 * dimC, .62 * dimC); } else C.setRGB(.03, .06, .05); wm.setColorAt(i, C); });
        wm.instanceColor.needsUpdate = true;
        const y = o.you ?? 0, yg = o.youGreen || 0, l = o.lin ?? 0;
        youW.material.color.setRGB(.04 + y * 1.3 * (1 - yg * .6) + yg * .25, .06 + y * .9 + yg * 1.4, .05 + y * .45 + yg * .4);
        linW.material.color.setRGB(.04 + l * 1.6, .06 + l * 1.1, .05 + l * .5);
        const wv = o.wire || 0, cu = o.cut || 0;
        for (const [m, s] of [[wireA, 1], [wireB, 1]]) { m.visible = wv > .01; m.material.opacity = wv * (1 - cu * .7); const n = m.geometry.index.count; m.geometry.setDrawRange(0, Math.floor(n * Math.min(1, wv * 1.5) * (1 - cu * .45) / 3) * 3); m.position.y = -cu * cu * 2.5; }
        own.material.opacity = (o.own || 0) * .9;
        const segs = legs.length; legs.forEach((m, k) => { const u = Math.max(0, Math.min(1, mapK * segs - k)); m.visible = u > 0; const n = m.geometry.index.count; m.geometry.setDrawRange(0, Math.floor(n * u / 3) * 3); m.material.opacity = .95; });
        marks.forEach((m, k) => { const last = k === marks.length - 1, u = Math.max(0, Math.min(1, mapK * segs - k)); m.visible = u > 0; const sc = (last ? 16 : 10) * u * (1 + .15 * Math.sin(t * 5 + k)); m.scale.set(sc, sc, 1); });
        const gk = o.goal || 0; goalF.material.opacity = gk * (.7 + .3 * Math.sin(t * 4)); goalF.visible = gk > .01; goalW.material.color.setRGB(.04 + gk * .25 * (o.goalLit || 0) * 4, .08 + gk * .2 * (o.goalLit || 0) * 3, .06 + (o.goalLit || 0) * .3);
        pb.forEach((b, i) => { pp[i * 3] = b[0] + Math.sin(t * .4 + i) * .8; pp[i * 3 + 1] = (b[1] + t * b[3]) % 30; pp[i * 3 + 2] = b[2]; }); pg.attributes.position.needsUpdate = true;
        const cp = o.cam || [-3, 6.5, 16], lk = o.look || [1, 6.5, 0]; cam.position.set(cp[0] + Math.sin(t * .2) * .08, cp[1] + Math.sin(t * .27) * .06, cp[2]); LK.set(...lk); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      return upd;
    },
    /** 薄冰湖（过度自信起用）：月夜下一整片冰封的湖，远山、星空、冰面上的月光倒影。
     *  每帧 o: {cam:[x,y,z], look:[x,y,z], man:[x,z] 主角站的位置, ring 把握圈半径(0 不显示), crack 0~1 裂纹蔓延, brk 0~1 冰面碎开下沉, under 0~1 水下（镜头放到 y<0 时配合）, knock 0~1 敲冰的涟漪}
     *  冰面中心（会碎开的那片）在 (0, 0, -6)；用 S3.project('icelake', x,y,z) 在 2D 里画人 */
    icelake(scene, cam) {
      const SKY = 0x030814; scene.background = new THREE.Color(SKY); scene.fog = new THREE.FogExp2(0x061020, .006);
      const r = rnd(57), C0 = [0, -6];
      // 天空：渐变穹顶 + 星星 + 月亮
      const skyC = document.createElement('canvas'); skyC.width = 8; skyC.height = 256; { const g = skyC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#01030a'); gr.addColorStop(.62, '#0a1a33'); gr.addColorStop(.72, '#1d3557'); gr.addColorStop(1, '#0a1424'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); }
      const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace; const sky = new THREE.Mesh(new THREE.SphereGeometry(285, 32, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false })); scene.add(sky);
      const SN = 2500, sp = new Float32Array(SN * 3); for (let i = 0; i < SN; i++) { const u = .15 + r() * .85, th = r() * 6.283, rad = 270; sp.set([rad * Math.sqrt(1 - u * u) * Math.cos(th), rad * u, rad * Math.sqrt(1 - u * u) * Math.sin(th)], i * 3); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const starM = new THREE.PointsMaterial({ size: 1.6, map: dotTex(), color: 0xcfe6ff, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }); scene.add(new THREE.Points(sg, starM));
      const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xf2f8ff, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false })); moon.position.set(-45, 70, -220); moon.scale.set(34, 34, 1); scene.add(moon);
      const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0x6fa8ff, transparent: true, opacity: .35, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); moonHalo.position.copy(moon.position); moonHalo.scale.set(170, 170, 1); scene.add(moonHalo);
      // 远山剪影
      const mtn = (z, h, col, seed) => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'), rr = rnd(seed); g.fillStyle = col; g.beginPath(); g.moveTo(0, 256); let y = 160; for (let x = 0; x <= 1024; x += 16) { y = Math.max(30, Math.min(220, y + (rr() - .5) * 60)); g.lineTo(x, y); } g.lineTo(1024, 256); g.fill();
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(760, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false })); m.position.set(0, h / 2 - 2, z); scene.add(m); };
      mtn(-240, 55, '#08142a', 3); mtn(-190, 34, '#050c1a', 8);
      // 冰面贴图：深蓝 + 冰纹
      const iceC = document.createElement('canvas'); iceC.width = iceC.height = 1024; { const g = iceC.getContext('2d'); g.fillStyle = '#0d2238'; g.fillRect(0, 0, 1024, 1024); const rr = rnd(5);
        for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${150 + rr() * 80},${200 + rr() * 55},255,${rr() * .05})`; g.fillRect(rr() * 1024, rr() * 1024, 2 + rr() * 60, 1 + rr() * 2); }
        g.strokeStyle = 'rgba(190,230,255,.08)'; g.lineWidth = 1.5; for (let i = 0; i < 160; i++) { let x = rr() * 1024, y = rr() * 1024; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rr() - .5) * 90; y += (rr() - .5) * 90; g.lineTo(x, y); } g.stroke(); } }
      const iceT = new THREE.CanvasTexture(iceC); iceT.colorSpace = THREE.SRGBColorSpace; iceT.wrapS = iceT.wrapT = THREE.RepeatWrapping; iceT.repeat.set(30, 30);
      const iceM = new THREE.MeshBasicMaterial({ map: iceT, side: THREE.DoubleSide, color: 0xa8c8e8 });
      const R0 = 11, ring = new THREE.Mesh(new THREE.RingGeometry(R0, 420, 96, 1), iceM); ring.rotation.x = -Math.PI / 2; ring.position.set(C0[0], 0, C0[1]); scene.add(ring);
      // 中间会碎开的一片：扇形 × 环 切成小块（挤出成有厚度的冰板）
      const pieces = [], shardM = new THREE.MeshBasicMaterial({ map: iceT, color: 0xb8d8f4, side: THREE.DoubleSide }), edgeM = new THREE.LineBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0, toneMapped: false });
      edgeM.color.setRGB(1.6, 2.2, 2.6);
      const rings = [0, 3.2, 6.6, R0]; for (let ri = 0; ri < 3; ri++) { const n = [5, 9, 13][ri]; for (let k = 0; k < n; k++) { const a0 = k / n * 6.283 + ri * .3 + (r() - .5) * .1, a1 = (k + 1) / n * 6.283 + ri * .3, r0 = rings[ri], r1 = rings[ri + 1];
        const sh = new THREE.Shape(); sh.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); for (let s = 0; s <= 6; s++) { const a = a0 + (a1 - a0) * s / 6; sh.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); } for (let s = 6; s >= 0; s--) { const a = a0 + (a1 - a0) * s / 6; sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
        const geo = new THREE.ExtrudeGeometry(sh, { depth: .45, bevelEnabled: false }); geo.rotateX(Math.PI / 2); geo.translate(0, .001, 0);
        const m = new THREE.Mesh(geo, shardM), e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeM), grp = new THREE.Group(); grp.add(m, e); grp.position.set(C0[0], 0, C0[1]); scene.add(grp);
        const am = (a0 + a1) / 2, rm = (r0 + r1) / 2; pieces.push({ grp, cx: Math.cos(am) * rm, cz: Math.sin(am) * rm, d: r(), sx: (r() - .5) * 2, sz: (r() - .5) * 2, delay: (1 - rm / R0) * .25 + r() * .2 }); } }
      // 裂纹：从主角走过的路上长出来（发光细线），按距离排序，crack 控制长到哪
      const segs = []; for (let s = 0; s < 22; s++) { const zz = 9 - s * .72 + (r() - .5), xx = (r() - .5) * 2.4; for (let b = 0; b < 2; b++) { let x = xx, z = zz, a = r() * 6.283; const n = 5 + Math.floor(r() * 9); for (let k = 0; k < n; k++) { const nx = x + Math.cos(a) * (.5 + r() * 1.2), nz = z + Math.sin(a) * (.5 + r() * 1.2); segs.push([x, z, nx, nz, s / 26 * .7 + k / n * .3]); x = nx; z = nz; a += (r() - .5) * 1.4; } } }
      segs.sort((p, q) => p[4] - q[4]); const cp = new Float32Array(segs.length * 6); segs.forEach((g2, i) => cp.set([g2[0], .03, g2[1], g2[2], .03, g2[3]], i * 6));
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); const crackM = new THREE.LineBasicMaterial({ color: 0x9fe4ff, transparent: true, toneMapped: false }); crackM.color.setRGB(.9, 1.6, 2.1); const cracks = new THREE.LineSegments(cg, crackM); scene.add(cracks);
      // 把握圈 + 敲冰涟漪 + 冰面月光倒影
      const ringGeo = r1 => new THREE.RingGeometry(r1 - .07, r1, 96), confM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }); confM.color.setRGB(1.6, 2.2, 2.8);
      const conf = new THREE.Mesh(ringGeo(1), confM); conf.rotation.x = -Math.PI / 2; scene.add(conf);
      const ripM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }); ripM.color.setRGB(1.8, 2.3, 2.8); const rip = new THREE.Mesh(ringGeo(1), ripM); rip.rotation.x = -Math.PI / 2; scene.add(rip);
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), new THREE.MeshBasicMaterial({ map: dotTex(), color: 0x6f9fd8, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending })); glint.rotation.x = -Math.PI / 2; glint.position.set(-12, .02, -90); glint.rotation.z = .2; scene.add(glint);
      // 水下：气泡 + 从冰洞透下来的月光
      const BN = 600, bp = new Float32Array(BN * 3), bb = []; for (let i = 0; i < BN; i++) bb.push([(r() - .5) * 16, -r() * 14, -6 + (r() - .5) * 16, .4 + r() * 1.2]);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); const bubM = new THREE.PointsMaterial({ size: .16, map: dotTex(), color: 0xcfeeff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); scene.add(new THREE.Points(bg, bubM));
      const rayC = document.createElement('canvas'); rayC.width = 64; rayC.height = 256; { const g = rayC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(160,215,255,.9)'); gr.addColorStop(1, 'rgba(160,215,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const g2 = g.createLinearGradient(0, 0, 64, 0); g.globalCompositeOperation = 'destination-in'; g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.5, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.fillRect(0, 0, 64, 256); }
      const rayT = new THREE.CanvasTexture(rayC), rays = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + r() * 2, 16), new THREE.MeshBasicMaterial({ map: rayT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.position.set(C0[0] + (r() - .5) * 12, -8, C0[1] + (r() - .5) * 12); m.rotation.set(0, r() * 3, (r() - .5) * .3); scene.add(m); rays.push(m); }
      const surf = new THREE.Mesh(new THREE.CircleGeometry(R0, 48), new THREE.MeshBasicMaterial({ color: 0x3f7fb8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false })); surf.rotation.x = -Math.PI / 2; surf.position.set(C0[0], -.3, C0[1]); scene.add(surf);
      const fogA = new THREE.Color(0x061020), fogB = new THREE.Color(0x04263f), LK = new THREE.Vector3(), V = new THREE.Vector3();
      cam.position.set(0, 2, 16);
      const upd = (t, o) => {
        const man = o.man || [0, 9], rr2 = o.ring || 0, cr = o.crack || 0, brk = o.brk || 0, und = o.under || 0, kn = o.knock || 0;
        conf.visible = rr2 > .05 && brk < .2; conf.scale.set(rr2, rr2, 1); conf.position.set(man[0], .04, man[1]); confM.opacity = .85 * (1 - brk * 5);
        rip.visible = kn > 0 && kn < 1; rip.scale.set(.3 + kn * 7, .3 + kn * 7, 1); rip.position.set(man[0] + .4, .05, man[1] - .3); ripM.opacity = (1 - kn) * .9;
        cg.setDrawRange(0, Math.floor(segs.length * cr) * 2); crackM.opacity = .75 * (1 - brk * .8);
        pieces.forEach(p => { const k = Math.max(0, Math.min(1, (brk - p.delay) / (1 - p.delay))), k2 = k * k; p.grp.position.set(C0[0] + p.cx * k * .15, -k2 * (5 + p.d * 7), C0[1] + p.cz * k * .15); p.grp.rotation.set(p.sx * k * 1.1, p.d * k, p.sz * k * 1.1); });
        edgeM.opacity = Math.min(1, brk * 4) * .9;
        scene.fog.color.copy(fogA).lerp(fogB, und); scene.fog.density = .006 + und * .07; scene.background.set(SKY).lerp(fogB, und);
        bubM.opacity = und * .85; rays.forEach((m, i) => { m.material.opacity = und * (.12 + .06 * Math.sin(t * 1.3 + i)); }); surf.material.opacity = und * .55; starM.opacity = 1 - und * .9; sky.material.color.setRGB(1 - und * .7, 1 - und * .4, 1 - und * .2); bb.forEach((b, i) => { bp[i * 3] = b[0] + Math.sin(t * 2 + i) * .1; bp[i * 3 + 1] = -14 + ((b[1] + 14 + t * b[3]) % 14); bp[i * 3 + 2] = b[2]; }); bg.attributes.position.needsUpdate = true;
        const c = o.cam || [0, 2, 16], l = o.look || [0, 1, 0]; cam.position.set(c[0] + Math.sin(t * .21) * .05, c[1] + Math.sin(t * .29) * .04, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      return upd;
    },
    /** 烧红的炭（情绪容纳起用）：深靛蓝的空间里，1~3 块炭（粗糙岩块 + 发光裂纹 + 往上飘的火星 + 地面反光），能冷却成一颗温热的鹅卵石。
     *  每帧 o: {cam:[x,y,z], look:[x,y,z], coals:[{p:[x,y,z], heat 0~1（1 白热 · .5 暗红 · .12 体温的淡粉 · 0 黑）, s 大小, smooth 0~1 变成鹅卵石, warm 0~1 换成温热的奶油色石子（配 smooth 1、heat ≈ .15）, spin, rot, tilt, a 0~1 显示}], embers 火星倍数, floor 0~1 地面亮度}
     *  用 S3.project('coal', x,y,z) 把 2D 的手 / 人放到炭旁边（炭半径 ≈ s 个单位） */
    coal(scene, cam) {
      const BG = 0x03050f; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .04);
      const r = rnd(21), V = new THREE.Vector3(), LK = new THREE.Vector3();
      scene.add(new THREE.AmbientLight(0x2a3566, .55)); const rim = new THREE.DirectionalLight(0x9fb4ff, .7); rim.position.set(-3, 5, 6); scene.add(rim);
      const floorM = new THREE.MeshStandardMaterial({ color: 0x070a18, roughness: .55, metalness: .25 }), floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), floorM); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.25; scene.add(floor);
      // 贴图：岩石底色 + 发光裂纹（emissiveMap）
      const rockC = document.createElement('canvas'); rockC.width = 1024; rockC.height = 512; { const g = rockC.getContext('2d'); g.fillStyle = '#141416'; g.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 5000; i++) { const v = 8 + r() * 30; g.fillStyle = `rgba(${v},${v},${v + 3},${.3 + r() * .5})`; g.fillRect(r() * 1024, r() * 512, 2 + r() * 14, 2 + r() * 8); } }
      const crackC = document.createElement('canvas'); crackC.width = 1024; crackC.height = 512; { const g = crackC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 26; i++) { const x = r() * 1024, y = 60 + r() * 392, rad = 30 + r() * 80, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
        g.lineCap = g.lineJoin = 'round'; g.shadowColor = '#fff';
        for (let i = 0; i < 90; i++) { let x = r() * 1024, y = 40 + r() * 432, a = r() * 6.283; g.lineWidth = 1.5 + r() * 5.5; g.strokeStyle = `rgba(255,255,255,${.55 + r() * .45})`; g.shadowBlur = 6 + r() * 10; g.beginPath(); g.moveTo(x, y);
          for (let k = 0, n = 8 + Math.floor(r() * 18); k < n; k++) { a += (r() - .5) * 1.3; x += Math.cos(a) * (6 + r() * 16); y += Math.sin(a) * (6 + r() * 14); g.lineTo(x, y); } g.stroke(); } }
      const rockT = new THREE.CanvasTexture(rockC), crackT = new THREE.CanvasTexture(crackC); rockT.colorSpace = crackT.colorSpace = THREE.SRGBColorSpace; rockT.wrapS = crackT.wrapS = THREE.RepeatWrapping;
      // 几何：粗糙岩块（位置噪声位移）→ morph 到光滑的鹅卵石
      const base = new THREE.IcosahedronGeometry(1, 5), P = base.attributes.position, N = P.count, rough = new Float32Array(N * 3), peb = new Float32Array(N * 3);
      const nz = (x, y, z) => .2 * Math.sin(3.1 * x + 1.7) * Math.sin(2.7 * y + .4) * Math.sin(3.3 * z + 2.1) + .11 * Math.sin(7.9 * x + 2 * y) * Math.cos(6.1 * z - 1.3 * y) + .05 * Math.sin(15 * x + 11 * y + 13 * z) - .12 * Math.abs(Math.sin(4.3 * x - 3.7 * z + 1.1 * y));
      for (let i = 0; i < N; i++) { V.fromBufferAttribute(P, i).normalize(); const d = 1 + nz(V.x, V.y, V.z); rough.set([V.x * d * 1.25, V.y * d * .82, V.z * d], i * 3); peb.set([V.x * 1.15, V.y * .7, V.z * .95], i * 3); }
      const mkGeo = () => { const g = base.clone(); g.setAttribute('position', new THREE.BufferAttribute(rough.slice(), 3)); g.computeVertexNormals();
        const pg = base.clone(); pg.setAttribute('position', new THREE.BufferAttribute(peb.slice(), 3)); const pn = new Float32Array(N * 3); for (let i = 0; i < N; i++) { V.set(peb[i * 3] / 1.3225, peb[i * 3 + 1] / .49, peb[i * 3 + 2] / .9025).normalize(); pn.set([V.x, V.y, V.z], i * 3); } pg.setAttribute('normal', new THREE.BufferAttribute(pn, 3));
        g.morphAttributes.position = [pg.attributes.position]; g.morphAttributes.normal = [pg.attributes.normal]; return g; };
      const STOPS = [[0, [0, 0, 0]], [.12, [.62, .34, .3]], [.3, [1.1, .24, .06]], [.6, [2.2, .55, .1]], [1, [2.5, .95, .24]]];
      const heatCol = (h, out) => { h = Math.max(0, Math.min(1, h)); let k = 1; while (k < STOPS.length - 1 && STOPS[k][0] < h) k++; const [h0, c0] = STOPS[k - 1], [h1, c1] = STOPS[k], u = (h - h0) / Math.max(1e-6, h1 - h0); return out.setRGB(c0[0] + (c1[0] - c0[0]) * u, c0[1] + (c1[1] - c0[1]) * u, c0[2] + (c1[2] - c0[2]) * u); };
      const coals = []; for (let i = 0; i < 3; i++) {
        const mat = new THREE.MeshStandardMaterial({ map: rockT, roughness: .88, metalness: 0, emissive: 0xffffff, emissiveMap: crackT, emissiveIntensity: 1 }), m = new THREE.Mesh(mkGeo(), mat); m.morphTargetInfluences = [0]; scene.add(m);
        const pmat = new THREE.MeshStandardMaterial({ color: 0xf0c6a6, roughness: .5, metalness: 0, emissive: 0xffa27a, emissiveIntensity: .3, transparent: true, opacity: 0 }), pm = new THREE.Mesh(m.geometry, pmat); pm.morphTargetInfluences = [1]; scene.add(pm);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xff7a2a, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); scene.add(glow);
        const light = new THREE.PointLight(0xff7a2a, 0, 9, 1.6); scene.add(light);
        const EN = 160, ep = new Float32Array(EN * 3), eb = []; for (let k = 0; k < EN; k++) eb.push([(r() - .5) * 1.6, r(), (r() - .5) * 1.6, .5 + r() * 1.2, r() * 6.28]);
        const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); const em = new THREE.PointsMaterial({ size: .07, map: dotTex(), color: 0xffa050, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); em.color.setRGB(2.6, 1.2, .4);
        const emb = new THREE.Points(eg, em); scene.add(emb); coals.push({ m, mat, pm, pmat, glow, light, emb, em, ep, eb, eg }); }
      // 背景里慢慢漂的蓝色微尘
      const DN = 700, dp = new Float32Array(DN * 3), db = []; for (let i = 0; i < DN; i++) db.push([(r() - .5) * 60, -1 + r() * 18, -40 + r() * 36, .05 + r() * .15]);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: .09, map: dotTex(), color: 0x7f9cff, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })));
      const C = new THREE.Color(); cam.position.set(0, 1.2, 7);
      const upd = (t, o) => {
        const list = o.coals || [], emK = o.embers ?? 1, fk = o.floor ?? 1; floorM.color.setRGB(.027 * fk, .04 * fk, .094 * fk);
        coals.forEach((c, i) => { const q = list[i], a = q ? (q.a ?? 1) : 0, vis = a > .01; c.m.visible = c.glow.visible = c.emb.visible = vis; c.pm.visible = vis && (q.warm || 0) > .01; c.light.intensity = 0; if (!vis) return;
          const p = q.p || [0, 0, 0], s = q.s ?? 1, h = Math.max(0, q.heat ?? 1) * a, sm = q.smooth || 0, fl = 1 + .1 * Math.sin(t * 3.1 + i * 2) + .05 * Math.sin(t * 7.3 + i);
          c.m.position.set(...p); c.m.scale.setScalar(s); c.m.rotation.set(.35 + (q.tilt || 0), t * .12 * (q.spin ?? 1) + i * 2.1 + (q.rot || 0), .1); c.m.morphTargetInfluences[0] = sm;
          heatCol(h * fl, C); c.mat.emissive.copy(C).multiplyScalar(1 - sm * .45); c.mat.color.setRGB(1 + sm * .9 * (1 - h), 1 + sm * .55 * (1 - h), 1 + sm * .45 * (1 - h)); c.mat.roughness = .88 - sm * .5;
          const wm = q.warm || 0; c.mat.opacity = a * (1 - wm); c.mat.transparent = c.mat.opacity < .99; c.pm.position.copy(c.m.position); c.pm.rotation.copy(c.m.rotation); c.pm.scale.copy(c.m.scale); c.pm.morphTargetInfluences[0] = sm; c.pmat.opacity = a * wm; c.pmat.emissiveIntensity = .22 + .08 * Math.sin(t * 1.6);
          heatCol(Math.min(1, h * 1.1), C); c.glow.material.color.copy(C).multiplyScalar(.16); c.glow.position.set(p[0], p[1], p[2]); const gs = s * (1.8 + h * 2.2) * fl; c.glow.scale.set(gs, gs, 1); c.glow.material.opacity = Math.min(1, h * 1.4) * a;
          heatCol(Math.max(h, .15), C); c.light.color.copy(C).multiplyScalar(.5); c.light.intensity = (h * 26 + (sm > .5 ? 3 : 0)) * a * s; c.light.position.set(p[0], p[1] + s * .2, p[2] + s * .3);
          const ek = Math.max(0, h - .18) * emK; c.em.opacity = Math.min(1, ek * 1.3) * a;
          c.eb.forEach((b, k) => { const life = (t * b[3] * .45 + b[1]) % 1; c.ep[k * 3] = p[0] + b[0] * s * (1 + life * .6) + Math.sin(t * 2 + b[4]) * .08 * life; c.ep[k * 3 + 1] = p[1] + s * .4 + life * s * 2.3; c.ep[k * 3 + 2] = p[2] + b[2] * s * (1 + life * .6); });
          c.eg.attributes.position.needsUpdate = true; });
        db.forEach((b, i) => { dp[i * 3] = b[0] + Math.sin(t * .2 + i) * .5; dp[i * 3 + 1] = -1 + ((b[1] + 1 + t * b[3]) % 18); dp[i * 3 + 2] = b[2]; }); dg.attributes.position.needsUpdate = true;
        const cp = o.cam || [0, 1.2, 7], lk = o.look || [0, 0, 0]; cam.position.set(cp[0] + Math.sin(t * .23) * .04, cp[1] + Math.sin(t * .31) * .03, cp[2]); LK.set(...lk); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      return upd;
    },
    /** 节拍器木板（自我分化起用）：一块架在两个罐子上的木板，上面一排排黄铜节拍器；木板会被摆动带着左右晃，节拍器慢慢同步（真实物理现象）。
     *  另有惠更斯的两座摆钟挂在一根横梁上（o.clocks 显示）。摆动相位由 film 积分好传进来，避免变速时跳相：
     *  o: {cam, look, phase 公共相位(弧度), sync 0~1 其他节拍器同步程度, amp 摆幅(弧度), shake 0~1 木板晃动, board 0~1 木板+节拍器显示,
     *      hi: [{i 第几个, col [r,g,b], k 亮度, amp 摆幅倍数}] 单独点亮某几个（S3.MET 是它们在木板上的坐标）, you: {phase 你的相位, sync 0~1 你被带跑的程度, lift 0~1 拿下木板放到右边远处, base 0~1 底座加重（重心）, glow 0~1}, dim 0~1 其他节拍器变暗,
     *      clocks 0~1 两座摆钟显示, clockSync 0~1, clockPhase} → S3.project('metronomes', x,y,z) 拿到屏幕坐标；"你"的节拍器默认在 (0, .15, 1.6)，拿走后在 (7, -.6, 2) */
    metronomes(scene, cam) {
      const BG = 0x050403; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .045);
      const r = rnd(33), V = new THREE.Vector3(), LK = new THREE.Vector3();
      scene.add(new THREE.AmbientLight(0x3a2c1c, .9)); const key = new THREE.SpotLight(0xffd9a0, 70, 40, .6, .7, 1.2); key.position.set(-3, 11, 6); key.target.position.set(0, 0, 0); scene.add(key, key.target);
      const rim = new THREE.DirectionalLight(0xffb060, 1.1); rim.position.set(5, 3, -6); scene.add(rim);
      const cTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
      const woodT = cTex(1024, 256, (g, w, h) => { g.fillStyle = '#5a3a20'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const y = r() * h; g.strokeStyle = `rgba(${30 + r() * 40},${15 + r() * 20},5,${.25 + r() * .4})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * .01 + i) * 4 + (r() - .5) * 2); g.stroke(); } });
      const faceT = cTex(128, 256, (g, w, h) => { g.fillStyle = '#efe2c4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b4a24'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { const y = 30 + i * 15; g.beginPath(); g.moveTo(w * .5 - (i % 2 ? 16 : 26), y); g.lineTo(w * .5 + (i % 2 ? 16 : 26), y); g.stroke(); } });
      const brass = new THREE.MeshStandardMaterial({ color: 0xc89a48, metalness: .85, roughness: .32 }), woodM = new THREE.MeshStandardMaterial({ map: woodT, roughness: .7 }), bodyM = new THREE.MeshStandardMaterial({ color: 0x2b170b, roughness: .45, metalness: .1 });
      // 木板 + 两个罐子
      const boardG = new THREE.Group(); scene.add(boardG);
      const board = new THREE.Mesh(new THREE.BoxGeometry(13, .22, 5.2), woodM); board.position.y = -.11; boardG.add(board);
      const cans = []; for (const x of [-4.5, 4.5]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 32), new THREE.MeshStandardMaterial({ color: 0xb8b8c0, metalness: .9, roughness: .25 })); c.rotation.x = Math.PI / 2; c.position.set(x, -.65, 0); scene.add(c); cans.push(c); }
      const table = new THREE.Mesh(new THREE.BoxGeometry(40, .4, 14), new THREE.MeshStandardMaterial({ color: 0x0d0805, roughness: .8, metalness: .1 })); table.position.y = -1.65; scene.add(table);
      // 节拍器
      const mkMet = (col) => { const g = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(.24, .5, 1.5, 4, 1), col ? new THREE.MeshStandardMaterial({ color: col, roughness: .4, metalness: .2 }) : bodyM.clone()); body.rotation.y = Math.PI / 4; body.scale.z = .75; body.position.y = .75; g.add(body);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(.36, 1.0), new THREE.MeshStandardMaterial({ map: faceT, color: 0x8a7a62, roughness: .8 })); face.position.set(0, .82, .29); face.rotation.x = -.18; g.add(face);
        const base = new THREE.Mesh(new THREE.BoxGeometry(.82, .12, .64), brass); base.position.y = .06; g.add(base);
        const piv = new THREE.Group(); piv.position.set(0, .3, .36); g.add(piv); const rod = new THREE.Mesh(new THREE.BoxGeometry(.035, 1.35, .025), brass); rod.position.y = .67; piv.add(rod);
        const wt = new THREE.Mesh(new THREE.BoxGeometry(.17, .13, .07), brass); wt.position.y = .95; piv.add(wt); return { g, piv, body, base }; };
      const mets = []; const COLS = 6, ROWS = 3; for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { if (j === ROWS - 1 && (i === 2 || i === 3)) continue; const m = mkMet(); m.g.position.set((i - (COLS - 1) / 2) * 1.85 + (r() - .5) * .2, 0, -1.8 + j * 1.45 - (j === ROWS - 1 ? 0 : 0)); boardG.add(m.g); m.ph = r() * 6.283; m.w = .6 + r() * .9; m.c = r() * 6.283; mets.push(m); }
      S3.MET = mets.map(m => m.g.position.toArray()); const you = mkMet(0xd8c49a); you.g.position.set(0, 0, 1.6); scene.add(you.g); you.body.material.emissive = new THREE.Color(0xffc060); you.body.material.emissiveIntensity = 0;
      const youHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xffc060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(youHalo);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1, .8), brass); you.g.add(plinth);
      // 惠更斯的两座摆钟：挂在一根横梁上
      const clockG = new THREE.Group(); clockG.position.set(0, 0, -4); scene.add(clockG); const cl = new THREE.PointLight(0xffd29a, 40, 14, 1.5); cl.position.set(0, 4.5, 2.5); clockG.add(cl);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(7, .35, .5), woodM); beam.position.y = 5.2; clockG.add(beam);
      const clocks = [-1.6, 1.6].map(x => { const g = new THREE.Group(); g.position.set(x, 5.0, .2); clockG.add(g);
        const caseM = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.4, .5), bodyM); caseM.position.y = -1.8; g.add(caseM);
        const dial = new THREE.Mesh(new THREE.CircleGeometry(.48, 48), new THREE.MeshStandardMaterial({ color: 0x8a7a62, roughness: .8 })); dial.position.set(0, -.75, .27); g.add(dial);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: .2, metalness: .5 })); win.position.set(0, -2.35, .26); g.add(win);
        const piv = new THREE.Group(); piv.position.set(0, -1.35, .3); g.add(piv); const rod = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.6, .02), brass); rod.position.y = -.8; piv.add(rod);
        const bob = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .05, 32), brass); bob.rotation.x = Math.PI / 2; bob.position.y = -1.6; piv.add(bob); return { g, piv }; });
      // 漂浮的金色尘埃
      const DN = 600, dp = new Float32Array(DN * 3), db = []; for (let i = 0; i < DN; i++) db.push([(r() - .5) * 40, -1 + r() * 14, -20 + r() * 26, .03 + r() * .1]);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: .06, map: dotTex(), color: 0xffcf80, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })));
      cam.position.set(0, 3, 10);
      const upd = (t, o) => {
        const ph = o.phase ?? t * 6, sy = o.sync ?? 0, A = o.amp ?? .42, bd = o.board ?? 1, dim = o.dim || 0;
        boardG.visible = bd > .01; cans.forEach(c => c.visible = bd > .01); table.visible = bd > .01;
        const sw = (o.shake || 0) * .16 * Math.sin(ph) * sy; boardG.position.x = sw; cans.forEach(c => c.rotation.y = 0);
        mets.forEach((m, i) => { const wander = m.ph + 2.6 * Math.sin(t * .23 * m.w + m.c), h = (o.hi || []).find(q => q.i === i); m.piv.rotation.z = A * (h && h.amp ? h.amp : 1) * Math.sin(ph + (1 - sy) * wander); });
        const HI = {}; (o.hi || []).forEach(h => HI[h.i] = h); mets.forEach((m, i) => { const h = HI[i], d = 1 - dim * .6 * (h ? 0 : 1); m.body.material.color.setRGB(.17 * d, .09 * d, .045 * d); m.body.material.emissive.setRGB(...(h ? h.col.map(v => v * h.k) : [0, 0, 0])); }); brass.color.setRGB(.78 * (1 - dim * .5), .6 * (1 - dim * .5), .28 * (1 - dim * .5));
        const Y = o.you || {}, lift = Y.lift || 0, l2 = lift * lift * (3 - 2 * lift), bs = Y.base || 0;
        you.g.visible = (Y.a ?? 1) > .01 && (bd > .01 || lift > .01); you.g.position.set(l2 * 7 + (1 - l2) * sw, -l2 * .6 + Math.sin(lift * Math.PI) * .6 + bs * .35, 1.6 + l2 * .4);
        plinth.visible = bs > .01; plinth.scale.set(1, Math.max(.01, bs * .35), 1); plinth.position.y = -bs * .175;
        const yPh = (Y.phase ?? ph) * (1 - (Y.sync ?? 1)) + ph * (Y.sync ?? 1); you.piv.rotation.z = A * Math.sin(Y.sync >= .999 ? ph : yPh) * (Y.amp ?? 1);
        const gl = Y.glow || 0; you.body.material.emissiveIntensity = gl * .35; youHalo.position.set(you.g.position.x, you.g.position.y + 1, you.g.position.z); youHalo.scale.set(1.8 * Math.min(gl, .9) + .01, 1.8 * Math.min(gl, .9) + .01, 1); youHalo.material.opacity = Math.min(gl, .9) * .22;
        const ck = o.clocks || 0; clockG.visible = ck > .01; const cs = o.clockSync || 0, cp = o.clockPhase ?? t * 3.6;
        clocks[0].piv.rotation.z = .3 * Math.sin(cp); clocks[1].piv.rotation.z = .3 * Math.sin(cp * (1 - cs) * 1.13 + 1.7 * (1 - cs) + cs * (cp + Math.PI));
        beam.position.x = .05 * cs * Math.sin(cp);
        db.forEach((b, i) => { dp[i * 3] = b[0] + Math.sin(t * .2 + i) * .4; dp[i * 3 + 1] = -1 + ((b[1] + 1 + t * b[3]) % 14); dp[i * 3 + 2] = b[2]; }); dg.attributes.position.needsUpdate = true;
        const c = o.cam || [0, 3, 10], l = o.look || [0, .6, 0]; cam.position.set(c[0] + Math.sin(t * .21) * .05, c[1] + Math.sin(t * .29) * .04, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      return upd;
    },
    /** 风与火（反脆弱起用）：黑色石地上三样东西——左边一根蜡烛 (-3.2,0,0)、中间一堆篝火 (0,0,0)、右边一块石头 (3.2,0,0)；风从左往右吹（风线 + 尘 + 火星顺风飞）。
     *  o: {cam, look, wind 0~3 风力, fire 0~1.6 火的大小（风太大时配 scatter）, scatter 0~1 火被吹散, candle 0~1 烛火（0 灭，冒烟）, show:{candle, fire, stone} 0~1 显示, logs 0~1 柴堆的余火}
     *  S3.project('windfire', x,y,z) 把 2D 标签放到三样东西上 */
    windfire(scene, cam) {
      const BG = 0x070302; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .05);
      const r = rnd(41), V = new THREE.Vector3(), LK = new THREE.Vector3(), C = new THREE.Color();
      scene.add(new THREE.AmbientLight(0x2a1a12, .7)); const moon = new THREE.DirectionalLight(0x6f7fa8, .35); moon.position.set(-6, 8, 4); scene.add(moon);
      const gC = document.createElement('canvas'); gC.width = gC.height = 512; { const g = gC.getContext('2d'); g.fillStyle = '#1a120d'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { const v = 10 + r() * 30; g.fillStyle = `rgba(${v + 8},${v},${v - 4},${.4 + r() * .4})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 10, 2 + r() * 6); } }
      const gT = new THREE.CanvasTexture(gC); gT.wrapS = gT.wrapT = THREE.RepeatWrapping; gT.repeat.set(12, 12); gT.colorSpace = THREE.SRGBColorSpace;
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: gT, roughness: .95 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
      // 火：三层粒子（核心 / 火焰 / 外焰），寿命循环；风让火往右倒
      const layer = (n, size, col) => { const p = new Float32Array(n * 3), c = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([r(), r() * 6.283, r(), .6 + r() * .8]);
        const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(p, 3)); gm.setAttribute('color', new THREE.BufferAttribute(c, 3));
        const m = new THREE.Points(gm, new THREE.PointsMaterial({ size, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(m); return { p, c, seed, gm, m, col, n }; };
      const FL = [layer(900, .32, [2.4, 1.5, .55]), layer(1100, .5, [2.2, .7, .12]), layer(700, .8, [1.0, .18, .03])];
      const fireLight = new THREE.PointLight(0xff8a3a, 18, 16, 1.6); fireLight.position.set(0, 1, 0); scene.add(fireLight);
      const logs = new THREE.Group(); scene.add(logs); const logM = new THREE.MeshStandardMaterial({ color: 0x2a1708, roughness: .9, emissive: 0xff4a10, emissiveIntensity: 0 });
      for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, 1.6, 10), logM); l.rotation.z = Math.PI / 2 - .35; l.rotation.y = i / 4 * Math.PI; l.position.y = .2; logs.add(l); }
      // 火星：顺风飞
      const SP = layer(260, .09, [3, 1.4, .4]);
      // 蜡烛
      const candleG = new THREE.Group(); candleG.position.set(-3.2, 0, 0); scene.add(candleG);
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(.16, .17, .9, 24), new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: .6, emissive: 0xffb070, emissiveIntensity: 0 })); wax.position.y = .45; candleG.add(wax);
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .1, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); wick.position.y = .95; candleG.add(wick);
      const CF = layer(260, .16, [2.6, 1.5, .5]); const SM = (() => { const L2 = layer(160, .35, [.35, .33, .32]); L2.m.material.blending = THREE.NormalBlending; L2.m.material.opacity = .28; return L2; })();
      const candleLight = new THREE.PointLight(0xffb070, 4, 5, 1.6); candleLight.position.set(-3.2, 1.2, .2); scene.add(candleLight);
      // 石头
      const sg = new THREE.IcosahedronGeometry(.75, 3), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { V.fromBufferAttribute(sp, i); const d = 1 + .18 * Math.sin(V.x * 5 + 1) * Math.sin(V.y * 4) + .1 * Math.sin(V.z * 7 + V.x * 3); V.multiplyScalar(d); sp.setXYZ(i, V.x * 1.2, V.y * .8, V.z); } sg.computeVertexNormals();
      const stone = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: .85, flatShading: true })); stone.position.set(3.2, .55, 0); scene.add(stone);
      // 风线 + 尘
      const WN = 260, wp = new Float32Array(WN * 6), wb = []; for (let i = 0; i < WN; i++) wb.push([r() * 40 - 20, .1 + r() * 4.5, -6 + r() * 10, .6 + r() * 1.2, r()]);
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); const wm = new THREE.LineBasicMaterial({ color: 0xd8c8b8, transparent: true, opacity: 0, depthWrite: false }); scene.add(new THREE.LineSegments(wg, wm));
      const DU = layer(400, .07, [.5, .45, .4]);
      const setFlame = (L, f) => { for (let i = 0; i < L.n; i++) { const [x, y, z, s] = f(i, L.seed[i]); L.p.set([x, y, z], i * 3); L.c.set([L.col[0] * s, L.col[1] * s, L.col[2] * s], i * 3); } L.gm.attributes.position.needsUpdate = true; L.gm.attributes.color.needsUpdate = true; };
      cam.position.set(0, 2, 9);
      const upd = (t, o) => {
        const w = o.wind || 0, sh = o.show || {}, F = (o.fire ?? 1) * (sh.fire ?? 1), scat = o.scatter || 0, cd = (o.candle ?? 1) * (sh.candle ?? 1), lean = w * .32, gust = 1 + .25 * Math.sin(t * 2.3) * Math.min(1, w);
        // 篝火
        FL.forEach((L, li) => setFlame(L, (i, [a, ph, b, sp]) => { const u = (t * (.9 + .5 * sp) * (1 + w * .25) + a) % 1, H = (1.6 + li * .4) * F * gust, rad = (.55 - li * .08 + li * .1) * Math.sqrt(F) * (1 - u * .75);
          const x = Math.cos(ph) * rad * b + lean * u * u * H * .9 + Math.sin(t * 7 + ph * 3) * .08 * u + scat * (u * 6 + b * 3) * Math.cos(ph * .5) * .5 + scat * u * 4, y = .25 + u * H * (1 - scat * .7), z = Math.sin(ph) * rad * b + scat * Math.sin(ph) * u * 2;
          const fade = Math.sin(u * Math.PI) * (1 - u * .4) * (F > .02 ? 1 : 0) * (1 - scat * .55); return [x, y, z, fade * [.13, .085, .04][li]]; }));
        fireLight.intensity = 18 * F * (1 - scat * .5) * (1 + .15 * Math.sin(t * 13) + .1 * Math.sin(t * 7.7)); fireLight.position.x = lean * .6;
        logs.visible = (sh.fire ?? 1) > .01; logM.emissiveIntensity = Math.min(.7, .15 + F * .35) * (sh.fire ?? 1) + (o.logs || 0) * .3;
        setFlame(SP, (i, [a, ph, b, sp]) => { const u = (t * (.35 + sp * .3) + a) % 1; return [Math.cos(ph) * .4 + u * (1 + w * 4) * (.5 + b) + Math.sin(t * 3 + ph) * .3, .3 + u * (2.5 + F * 2) * (.5 + b * .5), Math.sin(ph) * .5 + Math.sin(t + ph) * .3 * u, (1 - u) * Math.min(1, F) * (F > .02 ? 1 : 0)]; });
        // 蜡烛
        candleG.visible = (sh.candle ?? 1) > .01; const cl = Math.max(0, cd);
        setFlame(CF, (i, [a, ph, b, sp]) => { const u = (t * 2.2 * sp + a) % 1, rr = .06 * (1 - u); return [-3.2 + Math.cos(ph) * rr + w * .25 * u * cl, 1.0 + u * .42 * cl, Math.sin(ph) * rr, Math.sin(u * Math.PI) * cl * .35 * (candleG.visible ? 1 : 0)]; });
        candleLight.intensity = 4 * cl * (1 + .1 * Math.sin(t * 17)) * (candleG.visible ? 1 : 0); wax.material.emissiveIntensity = .12 * cl;
        const smk = (sh.candle ?? 1) * (1 - cl) * (o.smoke ?? 1);
        setFlame(SM, (i, [a, ph, b, sp]) => { const u = (t * .25 * sp + a) % 1; return [-3.2 + Math.sin(u * 6 + ph) * .15 * u + u * w * .8, 1.0 + u * 2.6, Math.cos(ph) * .1 * u, (1 - u) * smk]; });
        stone.visible = (sh.stone ?? 1) > .01;
        // 风
        wm.opacity = Math.min(.28, w * .1); wb.forEach((b, i) => { const x = ((b[0] + t * (6 + w * 8) * b[3] + 20) % 40) - 20, len = .4 + w * .9 * b[3]; wp.set([x, b[1] + Math.sin(t * 2 + i) * .05, b[2], x + len, b[1] + Math.sin(t * 2 + i) * .05, b[2]], i * 6); }); wg.attributes.position.needsUpdate = true;
        setFlame(DU, (i, [a, ph, b, sp]) => { const u = (t * (.08 + w * .12) * sp + a) % 1; return [-20 + u * 40, .05 + b * 3 + Math.sin(t + ph) * .3, -6 + ((ph * 1.6) % 10), Math.min(1, w) * .6]; });
        const c = o.cam || [0, 2, 9], l = o.look || [0, .9, 0]; cam.position.set(c[0] + Math.sin(t * .21) * .05, c[1] + Math.sin(t * .29) * .04, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      return upd;
    },
    /** 许愿井（沉没成本起）：石井 + 深井筒 + 井底水面，金币一枚枚掉进去、溅起涟漪、沉到井底发光，越攒越亮；井边不远处有一扇门（一开始只有门缝一线光），o.door 打开后暖光洒出来。
     *  o: {cam, look, drops:[{t 开始下落时刻, x, z 出手点相对井心}], deep 井深倍数(默认 1), door 0~1, glow 井口金光强度倍数, dust 金尘}
     *  S3.coin('well', i, t, o) → 第 i 枚硬币的世界坐标（贴标签用）；水面高度 = -4.5 * deep */
    well(scene, cam) {
      const BG = 0x050302; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .045);
      const r = rnd(73), V = new THREE.Vector3(), LK = new THREE.Vector3();
      scene.add(new THREE.AmbientLight(0x3a2c20, 1.1)); scene.add(new THREE.HemisphereLight(0x6a6a88, 0x1a1008, .5)); const moon = new THREE.DirectionalLight(0x9aa0c0, .5); moon.position.set(-5, 9, 6); scene.add(moon);
      const key = new THREE.SpotLight(0xffd9a8, 60, 30, .45, .6, 1.2); key.position.set(-4, 8, 3); key.target.position.set(0, 0, 0); scene.add(key); scene.add(key.target);
      // 石板地面
      const tex = (fn, rep) => { const c = document.createElement('canvas'); c.width = c.height = 512; fn(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; return t; };
      const stones = (g, base, rows, cols, jitter) => { g.fillStyle = '#0c0907'; g.fillRect(0, 0, 512, 512); const rh = 512 / rows;
        for (let y = 0; y < rows; y++) { const off = (y % 2) * .5; for (let x = -1; x < cols + 1; x++) { const w = 512 / cols, v = base + (r() - .5) * jitter; g.fillStyle = `rgb(${v + 6},${v + 2},${v - 3})`; g.fillRect((x + off) * w + 3, y * rh + 3, w - 6, rh - 6);
          for (let k = 0; k < 30; k++) { const s = v + (r() - .5) * 14; g.fillStyle = `rgba(${s},${s - 3},${s - 6},.5)`; g.fillRect((x + off) * w + 3 + r() * (w - 10), y * rh + 3 + r() * (rh - 10), 2 + r() * 6, 2 + r() * 4); } } } };
      const gs = new THREE.Shape(); gs.moveTo(-40, -40); gs.lineTo(40, -40); gs.lineTo(40, 40); gs.lineTo(-40, 40); gs.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, 1.45, 0, Math.PI * 2, true); gs.holes.push(hole);   // 地面在井口挖洞
      const ground = new THREE.Mesh(new THREE.ShapeGeometry(gs, 48), new THREE.MeshStandardMaterial({ map: tex(g => stones(g, 34, 6, 6, 16), [.2, .2]), roughness: .95 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
      // 井：外墙 + 井沿 + 井筒（内壁往下延伸）
      const RO = 1.5, RI = 1.2, HT = .85, wallT = tex(g => stones(g, 52, 4, 8, 22), [3, 1]), shaftT = tex(g => stones(g, 40, 8, 8, 18), [3, 4]);
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(RO, RO * 1.04, HT, 48, 1, true), new THREE.MeshStandardMaterial({ map: wallT, roughness: .9 })); outer.position.y = HT / 2; scene.add(outer);
      const rim = new THREE.Mesh(new THREE.RingGeometry(RI - .02, RO + .08, 48), new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: .8, side: THREE.DoubleSide })); rim.rotation.x = -Math.PI / 2; rim.position.y = HT; scene.add(rim);
      const shaftM = new THREE.MeshStandardMaterial({ map: shaftT, roughness: .95, side: THREE.BackSide }), shaft = new THREE.Mesh(new THREE.CylinderGeometry(RI, RI, 1, 40, 1, true), shaftM); scene.add(shaft);
      // 井架：两根木柱 + 横梁 + 绳
      const wood = new THREE.MeshStandardMaterial({ color: 0x3a2516, roughness: .85 });
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.16, 2.5, .16), wood); p.position.set(s * (RO + .05), 1.25, 0); scene.add(p); }
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, RO * 2 + .5, 12), wood); beam.rotation.z = Math.PI / 2; beam.position.y = 2.35; scene.add(beam);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1 })); rope.position.set(.15, 1.55, 0); scene.add(rope);
      // 水面 + 井底
      const water = new THREE.Mesh(new THREE.CircleGeometry(RI - .01, 48), new THREE.MeshStandardMaterial({ color: 0x0a1a1c, roughness: .15, metalness: .6, transparent: true, opacity: .62, emissive: 0x0a0c0a })); water.rotation.x = -Math.PI / 2; scene.add(water);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(RI, 40), new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 1 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const deepLight = new THREE.PointLight(0xffb84a, 0, 14, 1.1); scene.add(deepLight); const mouthLight = new THREE.PointLight(0xffc060, 0, 6, 1.5); scene.add(mouthLight);
      const bgTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,190,80,1)'); gr.addColorStop(.5, 'rgba(255,160,40,.45)'); gr.addColorStop(1, 'rgba(255,140,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
      const bottomGlow = new THREE.Mesh(new THREE.CircleGeometry(RI, 40), new THREE.MeshBasicMaterial({ map: bgTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false })); bottomGlow.rotation.x = -Math.PI / 2; scene.add(bottomGlow);
      // 硬币（+ 每枚一圈涟漪）
      const coinG = new THREE.CylinderGeometry(.16, .16, .03, 28), coins = [];
      const ringTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 58, 0, 6.3); g.stroke(); return new THREE.CanvasTexture(c); })();
      const mkCoin = () => { const m = new THREE.Mesh(coinG, new THREE.MeshStandardMaterial({ color: 0xffc85a, metalness: .55, roughness: .28, emissive: 0xffa21a, emissiveIntensity: .35 })); scene.add(m);
        const rg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd890 })); rg.rotation.x = -Math.PI / 2; scene.add(rg);
        const rest = [(r() - .5) * 1.5, (r() - .5) * 1.5]; if (Math.hypot(...rest) > .95) { rest[0] *= .6; rest[1] *= .6; } return { m, rg, rest, spin: [r() * 6, r() * 6, 2 + r() * 4], tilt: r() * 6.28 }; };
      // 门：石门框 + 门板（铰链在左）+ 门里的暖光 + 门缝一线光 + 地上的光斑 + 光束
      const DOOR = new THREE.Group(); DOOR.position.set(8.2, 0, -3.4); DOOR.rotation.y = -.6; scene.add(DOOR);
      const frameM = new THREE.MeshStandardMaterial({ color: 0x5a4c40, roughness: .85 });
      for (const [w, h, x, y] of [[.3, 3.1, -.95, 1.55], [.3, 3.1, .95, 1.55], [2.2, .3, 0, 3.15]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .4), frameM); b.position.set(x, y, 0); DOOR.add(b); }
      const glowM = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), glowP = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), glowM); glowP.position.set(0, 1.5, -.12); DOOR.add(glowP);
      const hinge = new THREE.Group(); hinge.position.set(-.8, 0, 0); DOOR.add(hinge); const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, .08), new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: .8 })); leaf.position.set(.8, 1.5, 0); hinge.add(leaf);
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .05), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false, transparent: true })); slit.rotation.x = -Math.PI / 2; slit.position.set(0, .02, .3); DOOR.add(slit);
      const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 7), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, .02, 3.2); DOOR.add(pool);
      const beamTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,225,170,.9)'); gr.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const g2 = g.createLinearGradient(0, 0, 64, 0); g.globalCompositeOperation = 'destination-in'; g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.5, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
      const rays = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + r() * .8, 7), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, side: THREE.DoubleSide })); m.position.set(-.5 + i * .25, 1.4, 3.2); m.rotation.x = -1.25; m.rotation.y = (r() - .5) * .3; DOOR.add(m); rays.push(m); }
      const doorLight = new THREE.PointLight(0xffd9a0, 0, 14, 1.3); doorLight.position.set(0, 1.6, 1.2); DOOR.add(doorLight);
      // 金尘
      const DN = 500, dp = new Float32Array(DN * 3), dc = new Float32Array(DN * 3), ds = []; for (let i = 0; i < DN; i++) ds.push([r() * 16 - 8, r() * 5, r() * 12 - 7, r(), r() * 6.28]);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
      scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: .05, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
      const GRAV = 6.5, Y0 = 2.0, VY = 1.2, lerpA = (a, b, k) => a + (b - a) * k;
      // 第 i 枚硬币在 t 时刻的状态：先抛物线落到水面，再慢慢沉到井底的落点
      const st = (d, i, t, WY) => { const c = coins[i], dt = t - d.t, x0 = d.x ?? .35, z0 = d.z ?? .5;
        const tHit = (VY + Math.sqrt(VY * VY + 2 * GRAV * (Y0 - WY))) / GRAV;
        if (dt < tHit) { const k = dt / tHit; return { p: [x0 * (1 - k * .6), Y0 + VY * dt - .5 * GRAV * dt * dt, z0 * (1 - k * .6)], phase: 0, tHit }; }
        const s = Math.min(1, (dt - tHit) / 1.6), e = 1 - Math.pow(1 - s, 3), sx = x0 * .4, sz = z0 * .4;
        return { p: [sx + (c.rest[0] - sx) * e + Math.sin(dt * 5 + i) * .05 * (1 - s), WY - .02 - e * .55, sz + (c.rest[1] - sz) * e], phase: 1 + s, tHit }; };
      const upd = (t, o) => {
        const deep = o.deep ?? 1, WY = -4.5 * deep, drops = o.drops || [], door = o.door || 0;
        shaft.scale.y = -WY + .6 + HT; shaft.position.y = (HT + WY - .6) / 2; water.position.y = WY; floor.position.y = WY - .6;
        while (coins.length < drops.length) coins.push(mkCoin());
        let landed = 0, splash = 0;
        drops.forEach((d, i) => { const c = coins[i]; if (t < d.t) { c.m.visible = false; c.rg.visible = false; return; } const s = st(d, i, t, WY), dt = t - d.t; c.m.visible = true; c.m.position.set(...s.p);
          if (s.phase === 0) c.m.rotation.set(c.spin[0] + dt * c.spin[2], c.spin[1] + dt * c.spin[2] * .7, 0); else { const e = Math.min(1, s.phase - 1); c.m.rotation.set(lerpA(c.spin[0] + s.tHit * c.spin[2], c.tilt * .1, e), c.tilt, 0); }
          c.m.material.emissiveIntensity = s.phase >= 1 ? .35 + .4 * Math.min(1, s.phase - 1) : .35; if (s.phase >= 2) landed++;
          const rk = dt - s.tHit; c.rg.visible = rk > 0 && rk < 1.4; if (c.rg.visible) { const sc = .2 + rk * 1.3; c.rg.scale.set(sc, sc, 1); c.rg.position.set((d.x ?? .35) * .4, WY + .01, (d.z ?? .5) * .4); c.rg.material.opacity = (1 - rk / 1.4) * .8; if (rk < .5) splash = Math.max(splash, 1 - rk / .5); } });
        const gl = (o.glow ?? 1) * Math.min(1.4, .15 + landed * .14);
        deepLight.position.set(0, WY + .2, 0); deepLight.intensity = 30 * gl + 30 * splash; bottomGlow.position.y = WY - .5; bottomGlow.material.opacity = Math.min(1, gl * .8 + splash * .5); mouthLight.position.set(0, HT - .6, 0); mouthLight.intensity = 2.2 * gl;
        water.material.emissive.setRGB(.04 + .12 * gl + .2 * splash, .03 + .08 * gl + .12 * splash, .01);
        DOOR.visible = (o.showDoor ?? 1) > .5; hinge.rotation.y = -door * 1.35; glowM.color.setRGB(.8 * door + .03, .62 * door + .02, .4 * door + .01); slit.material.opacity = .35 + .5 * (1 - door); doorLight.intensity = 30 * door; pool.material.opacity = .26 * door; rays.forEach((m, i) => m.material.opacity = door * (.12 + .05 * Math.sin(t * .7 + i)));
        const du = o.dust ?? 1; ds.forEach(([x, y, z, sp, ph], i) => { const yy = (y + t * (.05 + sp * .08)) % 5; dp.set([x + Math.sin(t * .3 + ph) * .3, yy, z + Math.cos(t * .25 + ph) * .3], i * 3); const b = Math.sin(yy / 5 * Math.PI) * du * (.25 + sp * .5); dc.set([b * 1.0, b * .75, b * .35], i * 3); });
        dg.attributes.position.needsUpdate = true; dg.attributes.color.needsUpdate = true;
        const c = o.cam || [0, 3.2, 7], l = o.look || [0, .2, 0]; cam.position.set(c[0] + Math.sin(t * .21) * .04, c[1] + Math.sin(t * .29) * .03, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      upd.coin = (i, t, o) => { const d = (o.drops || [])[i]; if (!d || t < d.t || !coins[i]) return null; return st(d, i, t, -4.5 * (o.deep ?? 1)).p; };
      return upd;
    },
    /** 两部手机（机会成本起）：黑色空间里悬浮两部手机（左冷蓝 / 右霓虹粉），屏幕内容由 film.js 每帧画（o.drawL / o.drawR(g, w, h, t)，画布 540×1170）；
     *  中间一张可以翻面的价签（o.drawTag(g, face 0 正 / 1 背, w, h, t)，画布 1000×600，透明底）。散景光斑 + 地面倒影。
     *  o: {cam, look, L:{x,y,z,ry,rx,s,glow}, R:{…}, tag:{x,y,z,flip 0~1,s,al,ry}, bokeh}  upd.screenRect('L'|'R') → 屏幕四角的屏幕坐标（叠 2D 用） */
    phones(scene, cam) {
      const BG = 0x04040a; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .035);
      const r = rnd(91), V = new THREE.Vector3(), LK = new THREE.Vector3();
      scene.add(new THREE.AmbientLight(0x30304a, .8));
      const lb = new THREE.PointLight(0x3c82ff, 30, 14, 1.4); lb.position.set(-3.5, 1.5, 2.5); scene.add(lb);
      const lp = new THREE.PointLight(0xff3ca0, 30, 14, 1.4); lp.position.set(3.5, 1.5, 2.5); scene.add(lp);
      const rim = new THREE.DirectionalLight(0xbfc8ff, .6); rim.position.set(0, 5, -4); scene.add(rim);
      // 地面：很暗的反光面
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x07070d, roughness: .25, metalness: .7 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; scene.add(floor);
      // 手机
      const PW = 1.5, PH = 3.15, rr = .22;
      const shape = new THREE.Shape(); shape.moveTo(-PW / 2 + rr, -PH / 2); shape.lineTo(PW / 2 - rr, -PH / 2); shape.quadraticCurveTo(PW / 2, -PH / 2, PW / 2, -PH / 2 + rr); shape.lineTo(PW / 2, PH / 2 - rr); shape.quadraticCurveTo(PW / 2, PH / 2, PW / 2 - rr, PH / 2); shape.lineTo(-PW / 2 + rr, PH / 2); shape.quadraticCurveTo(-PW / 2, PH / 2, -PW / 2, PH / 2 - rr); shape.lineTo(-PW / 2, -PH / 2 + rr); shape.quadraticCurveTo(-PW / 2, -PH / 2, -PW / 2 + rr, -PH / 2);
      const bodyG = new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 4, curveSegments: 12 }); bodyG.translate(0, 0, -.08);
      const mkPhone = (col) => { const g = new THREE.Group(); scene.add(g);
        g.add(new THREE.Mesh(bodyG, new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: .3, metalness: .85 })));
        const cv = document.createElement('canvas'); cv.width = 540; cv.height = 1170; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(PW - .1, PH - .1), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false, color: 0xc4c4c4 })); scr.position.z = .081; g.add(scr);
        const glow = new THREE.PointLight(col, 6, 5, 1.6); glow.position.set(0, 0, 1.2); g.add(glow);
        return { g, cv, tx, scr, glow }; };
      const PL = mkPhone(0x6fb6ff), PR = mkPhone(0xff4fa3);
      // 价签：两面（正 / 背），一根细绳
      const mkFace = () => { const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 600; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return { cv, tx }; };
      const TF = mkFace(), TB = mkFace(), TAG = new THREE.Group(); scene.add(TAG);
      const tagM = f => new THREE.MeshBasicMaterial({ map: f.tx, transparent: true, toneMapped: false, side: THREE.FrontSide, color: 0xa8a8a8 });
      const fF = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), tagM(TF)); TAG.add(fF); const fB = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), tagM(TB)); fB.rotation.y = Math.PI; TAG.add(fB);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 3, 6), new THREE.MeshBasicMaterial({ color: 0xd8d0ff, transparent: true, opacity: .5 })); str.position.set(-1.05, 1.6, 0); TAG.add(str);
      // 散景光斑
      const BN = 220, bp = new Float32Array(BN * 3), bc = new Float32Array(BN * 3), bs = []; for (let i = 0; i < BN; i++) bs.push([r() * 30 - 15, r() * 10 - 3, -6 - r() * 14, r(), r() * 6.28, r() < .5]);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('color', new THREE.BufferAttribute(bc, 3));
      scene.add(new THREE.Points(bg, new THREE.PointsMaterial({ size: .45, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
      const place = (P, q, def) => { const o = { ...def, ...(q || {}) }; P.g.position.set(o.x, o.y + Math.sin(_t * .9 + o.x) * .04, o.z); P.g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0); P.g.scale.setScalar(o.s ?? 1); P.g.visible = (o.al ?? 1) > .01; P.glow.intensity = 6 * (o.glow ?? 1); };
      let _t = 0;
      const upd = (t, o) => { _t = t;
        place(PL, o.L, { x: -1.7, y: .2, z: 0, ry: .18 }); place(PR, o.R, { x: 1.7, y: .2, z: 0, ry: -.18 });
        for (const [P, fn] of [[PL, o.drawL], [PR, o.drawR]]) if (fn && P.g.visible) { const g = P.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 540, 1170); fn(g, 540, 1170, t); P.tx.needsUpdate = true; }
        const tg = { x: 0, y: .3, z: .6, flip: 0, s: 1, al: 0, ry: 0, ...(o.tag || {}) }; TAG.visible = tg.al > .01;
        if (TAG.visible) { TAG.position.set(tg.x, tg.y + Math.sin(t * 1.1) * .05, tg.z); TAG.rotation.set(Math.sin(t * .8) * .04, tg.ry + Math.PI * tg.flip, Math.sin(t * .6) * .05); TAG.scale.setScalar(tg.s);
          for (const [F, face] of [[TF, 0], [TB, 1]]) { const g = F.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1000, 600); if (o.drawTag) o.drawTag(g, face, 1000, 600, t); F.tx.needsUpdate = true; }
          fF.material.opacity = fB.material.opacity = tg.al; str.material.opacity = .5 * tg.al; }
        lb.intensity = 30 * (o.L?.light ?? 1); lp.intensity = 30 * (o.R?.light ?? 1);
        const bk = o.bokeh ?? 1; bs.forEach(([x, y, z, sp, ph, blue], i) => { bp.set([x + Math.sin(t * .1 * sp + ph) * .8, y + Math.sin(t * .2 + ph) * .3, z], i * 3); const b = bk * (.25 + .35 * sp) * (.6 + .4 * Math.sin(t * .7 + ph)); bc.set(blue ? [b * .35, b * .6, b * 1.2] : [b * 1.2, b * .3, b * .7], i * 3); });
        bg.attributes.position.needsUpdate = true; bg.attributes.color.needsUpdate = true;
        const c = o.cam || [0, .4, 7.2], l = o.look || [0, .2, 0]; cam.position.set(c[0] + Math.sin(t * .23) * .03, c[1] + Math.sin(t * .31) * .025, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      upd.screenPt = (side, u, v) => { const P = side === 'L' ? PL : PR; V.set((u - .5) * (PW - .1), (.5 - v) * (PH - .1), .09); P.g.localToWorld(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
      return upd;
    },
    /** 画廊墙（框架效应起）：暗色墙面 + 一盏顶光打在一幅画上，画的内容由 film.js 每帧画（o.drawPic(g, w, h, t)，画布 1200×800）。
     *  画框有几种样式，可以"换框"：旧框掉下去、新框从上面落下来带回弹。0 金色雕花框 / 1 细黑框 / 2 拍立得白边 / 3 冷钢框 / 4 无框。
     *  o: {cam, look, fA, fB, k 换框进度 0~1, choke 0~1 框越来越宽把画吃掉, drop 0~1 所有框掉到地上, warm 0~1 顶光冷暖, smoke}  upd.picRect() → 画四角屏幕坐标 */
    gallery(scene, cam) {
      const BG = 0x060606; scene.background = new THREE.Color(BG); scene.fog = new THREE.FogExp2(BG, .05);
      const r = rnd(57), V = new THREE.Vector3(), LK = new THREE.Vector3();
      scene.add(new THREE.AmbientLight(0x404044, .55));
      const tex = (fn, rep, sz = 512) => { const c = document.createElement('canvas'); c.width = c.height = sz; fn(c.getContext('2d'), sz); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; return t; };
      const wallT = tex((g, s) => { g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, s, s); for (let i = 0; i < 9000; i++) { const v = 20 + r() * 18; g.fillStyle = `rgba(${v},${v},${v + 2},.5)`; g.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3); } }, [6, 3]);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshStandardMaterial({ map: wallT, roughness: .95 })); wall.position.set(0, 5, -.06); scene.add(wall);
      const floorT = tex((g, s) => { g.fillStyle = '#121010'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 32) { g.fillStyle = `rgba(0,0,0,.6)`; g.fillRect(0, y, s, 2); for (let i = 0; i < 40; i++) { const v = 22 + r() * 14; g.fillStyle = `rgba(${v + 6},${v + 2},${v},.35)`; g.fillRect(r() * s, y + 3 + r() * 26, 30 + r() * 120, 1); } } }, [10, 10]);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: floorT, roughness: .35, metalness: .4 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -1.2, 10); scene.add(floor);
      // 画
      const PW = 2.4, PH = 1.6, PY = 1.5, cv = document.createElement('canvas'); cv.width = 1200; cv.height = 800; const pt = new THREE.CanvasTexture(cv); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: pt, roughness: .8, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: .05 })); pic.position.set(0, PY, 0); scene.add(pic);
      // 画框
      const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: .9, roughness: .32 }), black = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: .3, roughness: .25 }), steel = new THREE.MeshStandardMaterial({ color: 0x7f93a8, metalness: .95, roughness: .38 }), white = new THREE.MeshStandardMaterial({ color: 0x7a766f, roughness: .9 });
      const bars = (th, d, mat, extra) => { const G = new THREE.Group(); const add = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, d / 2); m.userData.base = [w, h, x, y]; G.add(m); };
        add(PW + th * 2, th, 0, PH / 2 + th / 2); add(PW + th * 2, th, 0, -PH / 2 - th / 2); add(th, PH, -PW / 2 - th / 2, 0); add(th, PH, PW / 2 + th / 2, 0); if (extra) extra(G); scene.add(G); return G; };
      const FR = [
        bars(.22, .14, gold, G => { const lip = new THREE.Mesh(new THREE.TorusGeometry(.01, .01, 4, 4), gold); lip.visible = false; G.add(lip); for (const s of [-1, 1]) for (const t of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), gold); k.position.set(s * (PW / 2 + .11), t * (PH / 2 + .11), .17); G.add(k); } }),
        bars(.06, .08, black),
        (() => { const G = new THREE.Group(); const b = new THREE.Mesh(new THREE.PlaneGeometry(PW + .24, PH + .62), white); b.position.set(0, -.19, -.01); G.add(b); scene.add(G); return G; })(),
        bars(.12, .1, steel),
        (() => { const G = new THREE.Group(); scene.add(G); return G; })(),
      ];
      // 顶光 + 光锥 + 烟
      const spot = new THREE.SpotLight(0xffffff, 90, 14, .42, .55, 1.3); spot.position.set(0, 5.6, 3.2); spot.target = pic; scene.add(spot);
      const coneTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.6, 32, 1, true), new THREE.MeshBasicMaterial({ map: coneTex, transparent: true, opacity: .045, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); cone.position.set(0, 3.5, 1.7); cone.rotation.x = -.6; scene.add(cone);
      const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 128 + (r() - .5) * 120, y = 128 + (r() - .5) * 120, rad = 30 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } return new THREE.CanvasTexture(c); })();
      const puffs = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), new THREE.MeshBasicMaterial({ map: smokeTex, transparent: true, opacity: .05, depthWrite: false })); const sx = (r() < .5 ? -1 : 1) * (2.2 + r() * 5); m.position.set(sx, r() * 4 - .3, .1 + r() * .8); m.userData.s = [r(), r() * 6.28]; scene.add(m); puffs.push(m); }
      const upd = (t, o) => {
        if (o.drawPic) { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1200, 800); o.drawPic(g, 1200, 800, t); pt.needsUpdate = true; }
        const fA = o.fA ?? 0, fB = o.fB ?? fA, k = o.k ?? 1, drop = o.drop || 0, choke = o.choke || 0;
        FR.forEach((G, i) => { G.visible = false; G.rotation.set(0, 0, 0); });
        const place = (i, dy, rz, sc = 1) => { const G = FR[i]; G.visible = true; G.position.set(0, PY + dy, 0); G.rotation.z = rz; G.scale.setScalar(sc);
          if (i === 0 || i === 1 || i === 3) G.children.forEach(m => { const b = m.userData.base; if (!b) return; const grow = 1 + choke * 5; if (b[0] > b[1]) { m.scale.y = grow; m.position.y = Math.sign(b[3]) * (PH / 2 + b[1] * grow / 2 - choke * PH * .0); } else { m.scale.x = grow; m.position.x = Math.sign(b[2]) * (PW / 2 + b[0] * grow / 2); } }); };
        if (fA !== fB && k < 1) { const e = k * k; place(fA, -e * 3.2 - drop * 3, e * .5); const bk = Math.min(1, k * 1.15), bounce = bk < 1 ? (1 - bk) * (1 - bk) * 3 : 0; place(fB, bounce + Math.sin(Math.max(0, k - .87) * 60) * .04 * (k > .87 ? (1 - k) * 8 : 0) - drop * 3, 0); }
        else place(fB, -drop * drop * 3.0, drop * .7);
        // 吃掉画面：框向内长（用画上的黑边模拟，比较稳）
        pic.material.emissiveIntensity = .05 * (1 - choke * .6);
        const w = o.warm ?? .5; spot.color.setRGB(1, .86 + .14 * (1 - w) * 0 + .1 * w - .1, .7 + .3 * (1 - w)); spot.intensity = 42 * (o.light ?? 1); R.toneMappingExposure = o.exposure ?? .8;
        puffs.forEach(m => { const [s, ph] = m.userData.s; m.position.x += Math.sin(t * .1 + ph) * .002; m.material.opacity = (o.smoke ?? 1) * (.025 + .015 * Math.sin(t * .3 + ph)); });
        const c = o.cam || [0, 1.5, 5.2], l = o.look || [0, 1.5, 0]; cam.position.set(c[0] + Math.sin(t * .21) * .02, c[1] + Math.sin(t * .29) * .015, c[2]); LK.set(...l); cam.lookAt(LK); cam.updateMatrixWorld();
      };
      upd.project = (x, y, z) => { V.set(x, y, z); const d = cam.position.distanceTo(V); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H, H / (2 * Math.tan(cam.fov * Math.PI / 360) * d)]; };
      upd.picPt = (u, v) => { V.set((u - .5) * PW, PY + (.5 - v) * PH, .01); V.project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
      return upd;
    },
  };
  function get(name, o) {
    if (!built[name]) { init(); const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, .1, 300), upd = SCENES[name](scene, cam, o || {});
      const c = new T3X.EffectComposer(R); c.addPass(new T3X.RenderPass(scene, cam)); const bl = new T3X.UnrealBloomPass(new THREE.Vector2(W, H), .9, .6, .15); c.addPass(bl); c.addPass(new T3X.OutputPass());
      built[name] = { scene, cam, upd, comp: c, bloom: bl }; }
    return built[name];
  }
  function render(name, t, o = {}) { const s = get(name, o); R.toneMappingExposure = 1.0; s.upd(t, o); s.bloom.strength = o.bloom ?? ({ screens: .45, stars: .6, stage: .7, paperwave: .35, windowcity: .5, icelake: .55, coal: .6, metronomes: .3, windfire: .45, well: .6, phones: .28, gallery: .18 }[name] ?? .9); s.comp.render(); return R.domElement; }
  function project(name, x, y, z) { const s = built[name]; return s && s.upd.project ? s.upd.project(x, y, z) : [960, 540, 100]; }
  function picPt(name, u, v) { const s = built[name]; return s && s.upd.picPt ? s.upd.picPt(u, v) : [960, 540]; }
  function screenPt(name, side, u, v) { const s = built[name]; return s && s.upd.screenPt ? s.upd.screenPt(side, u, v) : [960, 540]; }
  function coin(name, i, t, o) { const s = built[name]; return s && s.upd.coin ? s.upd.coin(i, t, o) : null; }
  return { render, SCENES, textTex, project, coin, screenPt, picPt };
})();
