// 配音时长 → 每句起止时间、场景、章节（含章节卡时段）→ timeline.json
// 章节来自 episode.json 的 chapters：[{scene, title, intro, en, card(默认 true，第一段默认 false)}]
// 有章节卡的段落，会在该段第一句之前插入 CARD 秒的章节卡（画面和旁白都自动顺延）
import fs from 'fs'; import { execSync } from 'child_process';
// 有固定配乐（episode.json 的 music）时，改用卡拍时间轴：每句、每张章节卡都从重拍开始（tools/beatline.py）
if (JSON.parse(fs.readFileSync('episode.json', 'utf8')).music) { process.stdout.write(execSync('python tools/beatline.py', { encoding: 'utf8' })); process.exit(0); }
const EP0 = JSON.parse(fs.readFileSync('episode.json', 'utf8')), PACE = { cps: 8, pad: .6, min: 1.5, card: EP0.noVoice ? 2.0 : 2.6, gap: EP0.noVoice ? .25 : .55, ...(EP0.pace || {}) }, CARD = PACE.card, GAP = PACE.gap;
// episode.json 可写 pace: {cps 字/秒, pad 每句额外停留, min 最短停留, card 章节卡秒数, gap 句间}。用户 2026-10-19：参考视频 1 的节奏 ≈ {cps: 11, pad: .3, min: 1.3, card: 1.2, gap: .15}
const lines = JSON.parse(fs.readFileSync('lines.json', 'utf8')), ep = JSON.parse(fs.readFileSync('episode.json', 'utf8'));
const dur = fs.existsSync('voices/dur.json') ? JSON.parse(fs.readFileSync('voices/dur.json', 'utf8')) : {};
const est = l => l.say.replace(/\[.*?\]/g, '').replace(/[^一-鿿0-9]/g, '').length / 4.3;   // 没配音时按字数估算
// 无配音模式（episode.json noVoice: true）：每句停留 = 阅读时间（约 8 字/秒 + 0.6 秒，最少 1.5 秒），可用 hold 指定秒数。
// 用户 2026-10-18：5.5 字/秒太慢，"不要让观众一直在等"
const read = l => l.hold ?? Math.max(PACE.min, (l.text.replace(/\[.*?\]/g, '').replace(/[^一-鿿0-9A-Za-z]/g, '').length) / PACE.cps + PACE.pad);
const chs = ep.chapters || [], chOf = s => chs.find(c => c.scene === s);
let t = ep.startAt ?? 1.0, prev = null, n = 0; const out = [], chapters = [];
for (const l of lines) {
  if (l.scene !== prev) {
    const c = chOf(l.scene), first = !prev, card = c && (c.card ?? !first);
    const rec = { scene: l.scene, title: c ? c.title : l.scene, intro: c?.intro || '', en: c?.en || '', num: first ? 0 : ++n, a: +t.toFixed(3) };
    // 章节卡停留：小问题在卡片第 .55 秒才浮现，要留够读完它的时间（用户 2026-10-19："标题还没显示出来，画面就跳走了"）
    const introLen = (c?.intro || '').replace(/[^一-鿿0-9A-Za-z]/g, '').length, cd = Math.max(CARD, .55 + introLen / (PACE.cardCps || 8) + (PACE.cardTail ?? .6));   // 2026-10-27 用户嫌换章节停太久：episode.json pace 可写 cardCps / cardTail 缩短（内核稳定用 12 / .5 ≈ 1.8 秒）
    if (card) { rec.card = { a: +t.toFixed(3), b: +(t + cd).toFixed(3) }; t += cd + (EP0.pace ? .15 : .35); }
    chapters.push(rec); prev = l.scene;
  }
  const d = ep.noVoice ? read(l) : (dur[l.id] ?? est(l));
  out.push({ id: l.id, scene: l.scene, text: l.text, ...(l.noSub || (ep.noVoice && !l.sub) ? { noSub: true } : {}), start: +t.toFixed(3), end: +(t + d).toFixed(3) }); t += d + (l.gapAfter ?? GAP);
}
const total = +(out.at(-1).end + 4.2).toFixed(2);
const scenes = chapters.map((c, i) => ({ name: c.scene, a: i ? (c.card ? c.card.a : out.find(l => l.scene === c.scene).start - .7) : 0, b: chapters[i + 1] ? chapters[i + 1].a + .8 : total }));
fs.writeFileSync('timeline.json', JSON.stringify({ total, ...(ep.watermark !== undefined ? { watermark: ep.watermark } : {}), ...(ep.noFadeIn ? { noFadeIn: true } : {}), ...(ep.noVoice ? { noVoice: true } : {}), lines: out, scenes, chapters }, null, 1));
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
console.log('total', total, 's;', chapters.map(c => `${mmss(c.a)} ${c.title}${c.card ? ' [卡]' : ''}`).join(' | '), Object.keys(dur).length ? '' : '(按字数估算)');
