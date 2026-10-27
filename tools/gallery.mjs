// 元素库图鉴：把 motifs.js 里每个元素画进一张图 → elements_gallery_<theme>.jpg
// 用法（在任意已有项目根目录，或 skill 目录）：node tools/gallery.mjs [theme] [输出路径]
import fs from 'fs'; import { fileURLToPath } from 'url'; import path from 'path'; import { chromium } from 'playwright-core';
const theme = process.argv[2] || 'crimson', out = process.argv[3] || `elements_gallery_${theme}.jpg`;
const here = path.dirname(fileURLToPath(import.meta.url)), tpl = path.join(here, '..', 'template');
const proj = fs.existsSync('fonts/fonts.css') ? process.cwd() : null;
const html = `<!doctype html><meta charset=utf-8>${proj ? `<link rel=stylesheet href="file:///${path.join(proj, 'fonts/fonts.css').split(path.sep).join('/')}">` : ''}<canvas id=c width=1920 height=1080></canvas>
<script>${fs.readFileSync(path.join(tpl, 'engine.js'), 'utf8')}</script><script>${fs.readFileSync(path.join(tpl, 'motifs.js'), 'utf8')}</script>`;
fs.writeFileSync(path.join(here, '_gallery.html'), html);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }), p = await b.newPage();
await p.goto('file:///' + path.join(here, '_gallery.html').split(path.sep).join('/'));
const b64 = await p.evaluate(async th => {
  await document.fonts.ready; for (const f of ['700 40px "Noto Sans SC"', '500 40px "Noto Sans SC"', '900 40px "Noto Sans SC"', '700 40px "JetBrains Mono"', '700 40px "Playfair Display"']) try { await document.fonts.load(f, '正反你A1'); } catch (e) {}
  E.setup(document.getElementById('c'), { lines: [], total: 10, scenes: [], chapters: [] }, th);
  const T = E.TH, items = [
    ['jellyDrop + feedScreen + plusPops 刷屏', () => { const [dy, sx, sy] = M.jellyDrop(1.0, .2); const g = E.ctx; g.save(); g.translate(760, 820 + dy); g.scale(sx, sy); g.translate(-760, -820);
      M.feedScreen(760, 470, 330, 640, 1.35, 0, [(gg, w, h, i) => { gg.fillStyle = ['#e0b040', '#5a8ad0', '#d06a8a'][i]; gg.fillRect(0, 0, w, h); gg.fillStyle = '#fff'; gg.font = '900 90px "Noto Sans SC"'; gg.textAlign = 'center'; gg.fillText(['甜', '虐', '笑'][i], w / 2, h / 2); }, (gg, w, h) => { gg.fillStyle = '#5a8ad0'; gg.fillRect(0, 0, w, h); }, (gg, w, h) => { gg.fillStyle = '#d06a8a'; gg.fillRect(0, 0, w, h); }], 1, { caption: i => ['他等了她五年', '她追了他五年', '同一张照片'][i], likes: i => '12w' }); g.restore();
      M.plusPops(1000, 400, 1.0, [.2, .45, .7, .9], 1, { text: i => ['甜 +1', '+1', '卑微 +1', '+1'][i] }); M.ctrlCenter(1180, 250, .9, 1, { dnd: 1, vol: .45 }); }],
    ['peephole 取景框暗角', () => { E.neon('透过镜头看', 960, 470, { size: 80, color: E.TH.a, weight: 900 }, -9, 0); M.peephole(1, .5); }],
    ['lovers 恋人光点+连线', () => M.lovers(560, 1360, 470, 1, { names: ['你', 'TA'] })],
    ['lovers broken 断开', () => M.lovers(560, 1360, 470, 1, { broken: .7 })],
    ['chat 对话气泡', () => M.chat(960, 470, '我先睡了', -9, 0, { color: T.b, status: '未读' })],
    ['chatScroll 聊天滚动', () => M.chatScroll(2.2, 0, 1, [460, 200, 1000, 560])],
    ['clockHands 时钟', () => { M.clockHands(960, 400, 23 * 60, 36 * 60, .6, 1); E.ctx.save(); E.ctx.strokeStyle = T.p; E.ctx.lineWidth = 4; E.ctx.beginPath(); E.ctx.arc(960, 400, 200, 0, 6.3); E.ctx.stroke(); E.ctx.restore(); }],
    ['eye 观察者', () => M.eye(960, 470, 1, '< 8 MONTHS')],
    ['pill 小注释', () => { M.pill('不在身边', 760, 470); M.pill('刚吵完架', 1160, 470); }],
    ['zzz 睡着', () => { E.orb(900, 520, 8, T.b, 1, 0); M.zzz(900, 520, 1.3); }],
    ['constellation 词语星座', () => M.constellation([['晚安', 640, 350, T.a, 80], ['我在', 1300, 330, T.b, 80], ['等你', 1220, 620, T.a, 80], ['想你', 760, 610, T.b, 80]], 1, -9, 0)],
    ['coin 硬币', () => { M.coin(760, 470, 130, '正', 0); M.coin(1160, 470, 130, '反', .9, T.b); }],
    ['roulette 轮盘', () => M.roulette(960, 470, 330, .3, 8)],
    ['chips 筹码', () => M.chips(960, 640, 12)],
    ['bars 柱状对比', () => M.bars([{ label: '刚进球后', value: 51 }, { label: '刚失手后', value: 54 }], 960, 760, 1)],
    ['scale 天平', () => M.scale(960, 300, .14, '黑 ×26', '红？')],
    ['hoop + stick 篮框/小人', () => { M.hoop(1300, 330); M.stick(600, 800, .6); }],
    ['gauge 环形进度', () => M.gauge(960, 470, 220, .5, 1, { label: 'P(红)' })],
    ['counter 计数读数', () => M.counter(960, 520, 67108864, 1, 1, { label: 'ODDS 1 IN', size: 130 })],
    ['timeline 年代轴', () => M.timeline(260, 1660, 500, [{ year: 1937, label: '皮亚杰' }, { year: 1975, label: '马勒' }, { year: 2018, label: '米勒' }], 1)],
    ['orbits 轨道环', () => { M.orbits(960, 470, 1, .9); E.orb(960, 470, 9, T.a, 1, 0); }],
    ['measure 尺寸读数', () => { E.orb(560, 600, 7, T.a, 1, 0); E.orb(1360, 340, 7, T.b, 1, 0); M.measure(560, 600, 1360, 340, 'Δx 240,000 km'); }],
    ['brackets HUD 角框', () => { M.brackets(660, 270, 600, 400); E.neon('目标', 960, 470, { size: 80 }, -9, 0); }],
    ['spin 自旋箭头', () => { M.spin(800, 470, true); M.spin(1120, 470, false, T.b); }],
    ['pulse 心跳线', () => M.pulse(300, 1620, 470, .4, 1, { amp: 120 })],
    ['comet 彗星轨迹', () => { M.comet(u => [300 + u * 1300, 700 - u * 380], .85, 1, { label: '你', len: .6 }); M.comet(u => [500 + u * 1100, 250 + u * 300], .7, 1, { color: T.a, label: 'TA', len: .5 }); }],
    ['meter 读数滑条', () => { M.meter(560, 420, 800, .72, 1, { label: '控制感', en: 'CONTROL', text: '72%' }); M.meter(560, 600, 800, .05, 1, { label: '控制感', en: 'CONTROL', text: '≈ 0', color: T.a }); }],
    ['slotText 候选字滚动', () => M.slotText('都在告诉你：别', 1080, 470, ['怕', '急', '试了', '走'], 2, .93, 1, { size: 80 })],
    ['axisGrid 坐标网格', () => { M.axisGrid(1, 1); E.orb(960, 470, 8, T.a, 1, 0); }],
    ['door 门', () => { M.door(620, 250, 260, 460, 0); M.door(1060, 250, 260, 460, .5); }],
    ['shuttleBox 穿梭箱', () => M.shuttleBox(460, 300, 1000, 360, .3, 1, { left: '电击区', right: '安全区' })],
    ['bolt 闪电', () => { M.bolt(760, 150, 820, 700, 1.1); M.bolt(1160, 150, 1100, 700, 2.3); }],
    ['noise 噪音频谱', () => M.noise(460, 640, 1000, 360, .7)],
    ['button 按钮', () => { M.button(760, 470, 0, 1, { label: '未按' }); M.button(1160, 470, .45, 1, { label: '按下' }); }],
    ['circuit 脑回路', () => M.circuit([{ x: 1250, y: 420, label: '默认：放弃', en: 'DRN' }, { x: 670, y: 420, label: '控制感', en: 'mPFC', color: T.p }], [{ a: 1, b: 0, type: 'inhibit', k: 1 }], 1)],
    ['podium 领奖台', () => M.podium(960, 760, 1, { labels: ['银', '金', '铜'] })],
    ['phone 手机信息流', () => M.phone(960, 470, 380, 700, 1.3, 1)],
    ['ruler 尺子', () => M.ruler(460, 560, 1460, 560, 1, 1, { label: '那把尺子' })],
    ['erp 脑电波形', () => M.erp(400, 1400, 640, 1, 1, { traces: [{ amp: 70, label: '美好' }, { amp: 38, label: '平淡' }, { amp: 190, label: '可怕', width: 3.5 }], mark: 2, markText: 'PEAK ↑' })],
    ['bowl 碗与异类', () => { M.bowl(640, 560, 520, 1, { kind: 'cherry', odd: { kind: 'roach', drop: 1 }, stain: .6 }); M.bowl(1300, 560, 520, 1, { kind: 'roach', dim: .75, odd: { kind: 'cherry', drop: 1 } }); }],
    ['eyes + grass 暗处的眼睛', () => { M.grass(200, 1720, 700, 1, 1, { h: 90 }); M.eyes(1100, 600, 1, 1); M.grass(800, 1500, 700, 1, 1, { h: 150, seed: 9, density: 6 }); }],
    ['comments 评论区', () => M.comments(960, 470, 440, 760, 400, 1, { bad: 7, badText: '无聊，取关了。', dim: .5 })],
    ['figure 药丸小人（灰人群+主角）', () => { for (let i = 0; i < 5; i++) M.figure(420 + i * 120, 760, 300 - (i % 2) * 30, .8); M.figure(1350, 760, 360, 1, { hi: true, arm: .4, hold: 'phone', label: '你' }); }],
    ['bottle 可乐瓶', () => { [1, .6, .25, 0].forEach((f, i) => M.bottle(600 + i * 240, 760, 420, f, 1, { bubbles: 1 })); }],
    ['vmeter 竖向读数', () => { M.vmeter(760, 780, 520, .9, 1, { label: '快乐值', text: '+90' }); M.vmeter(1160, 780, 520, -.2, 1, { label: '快乐值', text: '-20' }); }],
    ['callouts 引线标注', () => { M.figure(760, 800, 380, 1, { hi: true }); M.callouts(800, 380, [['表情自然吗？', 260, -120], ['手该放哪？', 300, 20], ['站姿奇怪吗？', 260, 160]], 1); }],
    ['expectGap 期待线/现实线', () => { M.expectGap(400, 900, 400, 520, 1, { text: '−5' }); M.expectGap(1150, 1650, 620, 380, 1, { text: '+25' }); }],
    ['spikeTrace 神经放电', () => { M.spikeTrace(400, 1600, 300, 1, 1, { events: [{ at: .6, amp: 120, label: '放电', mark: '汁' }] }); M.spikeTrace(400, 1600, 700, 1, 1, { events: [{ at: .3, amp: 120, mark: '灯' }, { at: .6, amp: -60, label: '低于平时', mark: '汁' }] }); }],
    ['strikeFix 划掉改写', () => M.strikeFix(960, 330, '焦虑型依恋', '不是{太黏人}', '是{太怕被丢下}', 9, 0)],
    ['wordBurst 一字放大（念头）', () => M.wordBurst(960, 470, '嗯', 3.4, 0, 1, { size: 220, thoughts: ['冷淡？', '敷衍？', 'TA 生气了', '是不是我说错了', '为什么不是嗯嗯'] })],
    ['wordBurst 炸开 + 核心字', () => M.wordBurst(960, 470, '嗯', 4.55, 0, 1, { size: 220, thoughts: ['冷淡？', '敷衍？', 'TA 生气了'], core: '心' })],
    ['glowSitter 发光小人 坐/躺/蹲', () => { M.glowSitter(420, 760, 420, 'sit', 1, 1, { phone: 1, stress: 1 }); M.glowSitter(1000, 760, 420, 'lie', 1, 1, { phone: 1 }); M.glowSitter(1500, 760, 420, 'crouch', 1, 1, { think: 1 }); }],
    ['ridge 数据山脊 + 小旗', () => M.ridge(200, 1720, 800, 1, 1, 1, { peak: .42, height: 480, dots: 140, flag: { at: .86, label: 'Mistral' } })],
    ['chat ios 蓝/灰气泡', () => { M.chat(1240, 360, '你生气了吗', 0, 9, { style: 'ios' }); M.chat(680, 520, '嗯', 0, 9, { style: 'ios', incoming: 1 }); M.chat(1180, 680, '你的"嗯"听着有点生气', 0, 9, { style: 'ios', status: '已送达' }); }],
    ['flatMan 扁平小人 + 墙上影子', () => { M.lightBeam(300, -40, 1.05, 1300, 120, 700, 1); E.ctx.fillStyle = '#efe6d6'; E.ctx.fillRect(100, 880, 1720, 4); M.flatMan(620, 880, 330, 'proud', 1, 1, { face: 'smug', shadow: { k: 2.3, crown: 1, dx: 60 } }); M.flatMan(1100, 880, 300, 'walk', 1, 1, { face: 'calm' }); M.flatMan(1500, 880, 300, 'crouch', 1, 1, { face: 'sad', shadow: { k: 1, dx: 30 } }); }],
    ['punchWord 关键词冲出', () => M.punchWord('变', 960, 470, .12, 0, 1, { size: 220 })],
    ['decodeText 乱码解码', () => { M.decodeText('答案，藏在你的{大脑}里', 960, 400, .5, 0, 1, { size: 72, dur: .9 }); M.decodeText('答案，藏在你的{大脑}里', 960, 560, 2, 0, 1, { size: 72 }); }],
    ['inkBlob + inkThread 颜色沾染', () => { M.inkThread(700, 470, 1220, 470, '#69d8ff', '#ff8fbd', .6, 1); M.inkBlob(700, 470, 150, '#69d8ff', 1, 1, { stains: [{ col: '#ff8fbd', a: .2, s: .35 }] }); M.inkBlob(1220, 470, 150, '#ff8fbd', 1, 1, { seed: 3, stains: [{ col: '#69d8ff', a: 3.3, s: .3 }] }); }],
    ['pursuit 追逃轨迹', () => { M.pursuit(620, 470, .3, .18, 1, { rx: 300, ry: 160, labels: ['追', '躲'] }); M.pursuit(1340, 470, .55, .1, 1, { rx: 300, heart: 1 }); }],
  ];
  const cols = 4, cw = 480, ch = 300, rows = Math.ceil(items.length / cols), G = document.createElement('canvas'); G.width = cols * cw; G.height = rows * ch + 90; const g = G.getContext('2d');
  const tmp = document.getElementById('c'), tg = tmp.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(0, 0, G.width, G.height); g.fillStyle = '#fff'; g.font = '700 40px "Noto Sans SC"'; g.textBaseline = 'middle'; g.fillText(`元素库图鉴 · ${th}`, 30, 46);
  items.forEach(([name, fn], i) => {
    tg.setTransform(1, 0, 0, 1, 0, 0); E.TH.bg(1); E.ctx = tg; fn();
    const x = (i % cols) * cw, y = 90 + Math.floor(i / cols) * ch; g.drawImage(tmp, x + 4, y + 4, cw - 8, ch - 8 - 30 + 30 * 0);
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + 4, y + ch - 40, cw - 8, 36); g.fillStyle = '#eee'; g.font = '500 20px "Noto Sans SC"'; g.fillText(name, x + 14, y + ch - 22);
  });
  return G.toDataURL('image/jpeg', .9).split(',')[1];
}, theme);
fs.writeFileSync(out, Buffer.from(b64, 'base64')); fs.unlinkSync(path.join(here, '_gallery.html')); await b.close(); console.log('gallery →', out);
