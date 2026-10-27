# 找真实图片：从 Wikimedia Commons 搜自由授权（公有领域 / CC0 / CC BY / CC BY-SA）的图片，下载到项目 assets/，来源记进 assets/credits.json
# 用法（项目根目录）：python tools/fetch_image.py "搜索词（英文更准）" [--n 6] [--name 文件名前缀]
#   先看 assets/_candidates/ 里的候选（同时生成 contact.jpg 联系表），挑中的用 --pick 序号 存成正式文件：
#   python tools/fetch_image.py "Dunning Kruger" --pick 2 --name dk_chart
# 只用于"真实案例 / 历史照片 / 科学家肖像 / 实验装置"这类需要真实感的画面；不抓新闻图片、不抓版权不明的图片。
# 发布文案会自动附上"图片来源"（tools/publish.py 读 credits.json）。CC BY / BY-SA 必须署名。
import sys, os, json, re, urllib.request, urllib.parse, shutil
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OK = re.compile(r'^(public domain|pd|cc0|cc[- ]by(-sa)?([- ]\d\.\d)?)', re.I)
UA = {'User-Agent': 'PainPsychFilm/1.0 (educational video; contact via TikTok @Pain)'}
args = sys.argv[1:]
if not args: print(__doc__ or '用法见文件头'); sys.exit(1)
q = args[0]; opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
n = int(opt('--n', 6)); pick = opt('--pick'); name = opt('--name', re.sub(r'\W+', '_', q.lower())[:30])
cand = os.path.join('assets', '_candidates'); os.makedirs(cand, exist_ok=True)
meta_f = os.path.join(cand, 'meta.json')

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r: return r.read()

if pick is None:
    api = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'filetype:bitmap {q}', 'gsrnamespace': 6, 'gsrlimit': n * 3,
          'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1920})
    pages = json.loads(get(api)).get('query', {}).get('pages', {}); out = []
    for p in sorted(pages.values(), key=lambda p: p.get('index', 0)):
        ii = (p.get('imageinfo') or [{}])[0]; em = ii.get('extmetadata', {}); lic = em.get('LicenseShortName', {}).get('value', '')
        if not OK.match(lic.strip()) or ii.get('width', 0) < 640: continue
        strip = lambda s: re.sub('<[^>]+>', '', s or '').strip()
        out.append({'title': p['title'], 'url': ii.get('thumburl') or ii['url'], 'page': ii.get('descriptionurl'), 'license': lic, 'author': strip(em.get('Artist', {}).get('value'))[:80],
                    'desc': strip(em.get('ImageDescription', {}).get('value'))[:120]})
        if len(out) >= n: break
    for f in os.listdir(cand): os.remove(os.path.join(cand, f))
    for i, m in enumerate(out):
        ext = os.path.splitext(urllib.parse.urlparse(m['url']).path)[1].lower() or '.jpg'; m['file'] = f'{i}{ext}'
        open(os.path.join(cand, m['file']), 'wb').write(get(m['url'])); print(f"[{i}] {m['title']}  ·  {m['license']}  ·  {m['author']}")
    json.dump(out, open(meta_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    try:   # 联系表，方便 Read 看图挑选
        from PIL import Image, ImageDraw
        tiles = [Image.open(os.path.join(cand, m['file'])).convert('RGB') for m in out]; W = 480; sheet = Image.new('RGB', (W * 3, (W * 2 // 3 + 30) * ((len(tiles) + 2) // 3)), (20, 20, 20)); d = ImageDraw.Draw(sheet)
        for i, im in enumerate(tiles): im.thumbnail((W, W * 2 // 3)); x, y = (i % 3) * W, (i // 3) * (W * 2 // 3 + 30); sheet.paste(im, (x, y + 30)); d.text((x + 8, y + 6), f'[{i}] {out[i]["license"]}', fill=(240, 240, 240))
        sheet.save(os.path.join(cand, 'contact.jpg'), quality=85); print('候选联系表 →', os.path.join(cand, 'contact.jpg'))
    except Exception as e: print('（联系表没生成：', e, '）')
    if not out: print('没有找到自由授权的图片，换个英文关键词试试')
else:
    meta = json.load(open(meta_f, encoding='utf-8')); m = meta[int(pick)]; ext = os.path.splitext(m['file'])[1]
    dst = os.path.join('assets', name + ext); shutil.copy(os.path.join(cand, m['file']), dst)
    cf = os.path.join('assets', 'credits.json'); cr = json.load(open(cf, encoding='utf-8')) if os.path.exists(cf) else {}
    cr[os.path.basename(dst)] = {k: m[k] for k in ('title', 'page', 'license', 'author')}; json.dump(cr, open(cf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'saved → {dst}（film.js 里用 M.photo("assets/{os.path.basename(dst)}", ...)，build() 里先 M.img(...) 注册）')
