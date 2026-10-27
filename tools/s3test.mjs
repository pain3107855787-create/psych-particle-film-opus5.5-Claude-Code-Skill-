// 单独测 3D 场景：node tools/s3test.mjs paperwave '[{"t":1,"grow":.2},{"t":2,"grow":1}]' → out/s3/0.jpg …
import fs from 'fs'; import path from 'path'; import { chromium } from 'playwright-core';
const [name, json] = process.argv.slice(2), list = JSON.parse(json), root = process.cwd();
const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file:///' + path.join(root, 'index.html').split(path.sep).join('/'));
await p.evaluate(() => document.fonts.ready);
fs.mkdirSync('out/s3', { recursive: true });
for (const [i, o] of list.entries()) {
  const b64 = await p.evaluate(([name, o]) => { const cv = S3.render(name, o.t, o); return cv.toDataURL('image/jpeg', .85).split(',')[1]; }, [name, o]);
  fs.writeFileSync(`out/s3/${i}.jpg`, Buffer.from(b64, 'base64'));
}
await b.close(); console.log('ok', list.length);
