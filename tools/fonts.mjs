// 下载字体到 fonts/：Noto Serif SC / Noto Sans SC（只含片中用到的字）+ Playfair Display + JetBrains Mono，写 fonts/fonts.css
import fs from 'fs'; import { fileURLToPath } from 'url'; import path from 'path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = ['film.js', 'engine.js', 'motifs.js', 'scenes3d.js', 'scenes2d.js', 'lines.json', 'episode.json'].filter(f => fs.existsSync(path.join(root, f))).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('');
const chars = [...new Set([...src].filter(c => c.charCodeAt(0) > 127))].join('') + '0123456789%/()=+-−×≈½·—，。？！：；“”…ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz&,.\'';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const css = [];
async function get(family, axis, text) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axis}${text ? '&text=' + encodeURIComponent(text) : ''}&display=block`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error(url + ' ' + r.status);
  let c = await r.text(); let i = 0;
  for (const m of [...c.matchAll(/url\((https:[^)]+)\)/g)]) {
    const f = `${family.replace(/\W/g, '')}_${i++}.woff2`;
    fs.writeFileSync(path.join(root, 'fonts', f), Buffer.from(await (await fetch(m[1])).arrayBuffer())); c = c.replace(m[1], f);
  }
  css.push(c);
}
await get('Noto Serif SC', 'wght@900', chars);
await get('Noto Sans SC', 'wght@500;700;900', chars);
await get('Playfair Display', 'ital,wght@0,500;0,700;1,700');
await get('JetBrains Mono', 'wght@500;700');
fs.writeFileSync(path.join(root, 'fonts', 'fonts.css'), css.join('\n'));
console.log('fonts ok', chars.length, 'chars');
