---
name: psych-particle-film
description: 制作 Pain 的心理学概念解说视频（黑底粒子叙事风格：粒子无缝变形、运镜、爆散闪切、霓虹字、章节卡、克隆配音讲故事），从选题、写稿、配音、分镜渲染、预览小样、配乐混音、3:4+4:3 封面到 TikTok 发布文案全流程；也负责从参考视频里提炼新元素扩充元素库。用户说"做一期 X 概念 / 下一期讲 X / 用星尘|暗红数据|鎏金黑|极光 风格做 X / 心理学视频 / 看看 video 里的新视频"时使用。不用于 lemo-opuscar 那种 HD-2D 像素风。
---

# 心理学粒子叙事短片

成片：**横屏** 1920×1080 / 30fps / 约 1:40~2:30，只发 **TikTok**。右上角 **Pain** 水印，字幕烧录 + .srt，章节卡，两张封面（3:4、4:3），发布文案。
输出到 `D:\claude\finish\心理学概念系列\<slug>\`。所有回复用简体中文。

## 文件
- `scripts/new_episode.sh <slug> <theme> <标题>` —— 生成项目骨架到 `D:/claude/finish/心理学概念系列/<slug>/`
- `template/scenes2d.js` **插画场景库**（参考视频 SJ1/SJ2 的扁平插画 + 强光影：`I.bedroom / building / classroom / fortune / archive / circus(t, {zoom,fx,fy,…})`，每个场景自带镜头和状态参数，在 under(t) 里画；**开场和讲故事都优先用它，镜头要一直推、场景状态要一直变**）
- `template/scenes3d.js` **3D 场景库**（Three.js + 辉光，`S3.render(名字, t, 参数)` 返回画布，在 film.js 的 under(t) 里 drawImage 当背景；场景：stars 星空 / screens 屏幕海 / tiles 16 宫格 / stage 舞台聚光灯 / paperwave 待办海啸 / windowcity 窗灯之城 / icelake 薄冰湖 / gallery 画廊墙（墙上一幅画，内容每帧由 film.js 画，画框可以"换框"、把画吃掉、全部掉到地上；S3.picPt 取画上的点）/ phones 两部手机（屏幕内容每帧由 film.js 画，中间一张可翻面的价签；S3.screenPt 取屏幕上的点）/ well 许愿井（金币掉进井底越攒越亮 + 远处一扇会开的门；S3.coin 取硬币坐标）（S3.project 把 2D 人物、标签放进 3D）；`tools/s3test.mjs` 单独出样张；`three.bundle.js` 由 D:/claude/tools3d 用 esbuild 打包；render.mjs 已开 GPU）
- `template/shaders.js` **Shader 着色器库**（2026-10-27，WebGL2 手写、不用下载）：`SH.render(名字, t, {a, b, c, p:[4个参数], scale, src})` 返回画布，drawImage 进画面。背景类 aurora 极光帘 / nebula 星云 / liquid 流体 / core 发光内核（p[3]=不稳定度）/ rays 体积光 / warp 星空穿梭 / caustic 水底焦散 / horizon 合成波网格 / ink 墨滴晕染 / bokeh 漂浮光斑；后期类（传 src 画布）glitch 故障 / ripple 冲击波 / haze 热浪 / crt 老电视 / chroma 色差。参数表在文件头；背景类用 scale:.5 省时间
- `template/lottie.js` + `lottie.min.js` **Lottie 动画**：`LT.draw('名字', t, x, y, 尺寸, {start, loop, speed, alpha})`，逐帧由 t 决定。动画库 `D:/claude/lottie/`（Google Noto 动态表情 649 个 / 24 MB，清单 index.md；`python tools/lottie_fetch.py 名字 | --tag 关键词 | --list 关键词 | --all` 补下载）；用到的期在发布文案署名 "Animated emoji: Google Noto Emoji"。卡通 emoji 风格偏可爱，只在合适的瞬间点缀，别满屏用
- **后期 + 音乐塑形（2026-10-28，学自 reference/ref_repo_ajydxw.md）**：film.js 里 `E.shake(时刻, 强度px, 时长)` 震动表、`E.zoom(时刻, .06~.1, x, y)` 揭晓时的径向冲刺；引擎每帧统一过泛光 / 暗角 / 动态颗粒（`E.post = {bloom, vignette, grain}` 可调，0 关）；**字幕、读数、进度条写在 film 的 `top(t)` 里**（后期之后画，不跟着震、不被模糊）。sfx.py 里 `MUSIC_TONE=[(秒, 0~1)]`：0 = 配乐闷（380Hz 低通）、1 = 原声——开场闷着蓄力，概念揭晓那一拍跳到 1；`DUCKS=[(秒, dB, 时长)]` 重击下压低配乐。每期都要用上
- `tools/fxgallery.mjs`：出 Shader / Lottie 宫格图鉴视频 → `D:/claude/finish/style-board/fx/`
- `template/engine.js` 通用粒子引擎（形状库、运镜、闪切、冲击波、霓虹字、章节卡、4 套配色、字幕、水印）· `template/motifs.js` **元素库**（M.*）· `template/film.js` 本期分镜骨架（文件头是 API 说明）· `template/sfx.py` 本期拟音 · `template/episode.json` 本期配置
- `tools/`：render.mjs（整片 / --preview / --still / --covers）、timeline.mjs、mix.py、**sfxlib.py（真实采样音效库 D:/claude/sfx，647 个 CC0 音效，sfx.py 里 `smp('组/名', i)`；清单见 reference/sfx_library.md）**、tts_index.py（IndexTTS-2.5 配音）、check_voice.py、sheet.py、srt.py、publish.py、fonts.mjs、gallery.mjs
- `tools/fetch_image.py`：从 Wikimedia Commons 找**自由授权的真实图片**进 assets/（来源自动写进 credits.json，发布文案自动署名）
- `reference/`：**creativity.md 创意方法（每期写稿前必看：视觉母题、开头的"等"、反转结尾、新特效池、真实图片规则）** · narrative.md 叙事与写稿 · themes.md 配色 · **elements.md 元素库清单 + elements_gallery.jpg 图鉴** · inspiration.md 已分析的参考视频 · **ref_repo_ajydxw.md 同类作者的源码拆解（音乐变闷/打开、后期栈、震动表、心率小卡、逐拍剧本）** · pitfalls.md 踩坑 · example_film_object_constancy.js 完整范例

## 流程

### 0. 先看有没有新的参考视频
列出 `D:\Claude\video`，和 `reference/inspiration.md` 对照。有没分析过的新视频 → 按 elements.md 末尾的流程分析，提出 2~4 个受启发的新元素，**加进元素库**。参考视频是给元素库的灵感，**不要求用在当前这一期**；只有确实贴合本期故事的元素才用。

### 1. 选配色（reference/themes.md）
星尘 = 严肃科学；暗红数据 = 百搭；鎏金黑 = 讲道理/谬误/决策；极光 = 情感/恋爱；余烬 = 焦灼/倦怠（拖延）；毒翡翠 = 嫉妒/欲望；薄冰 = 过度自信/风险低估。用户没指定就推荐并说明理由。

### 2. 写文案 + 章节 + 发布文案 → 先给用户确认
- **先读 reference/creativity.md**，和文案表格一起交给用户：2~3 个**视觉母题**备选、开头让观众"等"的东西（站队 / 悬置的画面）、是否用反转结尾、本期要做的**一个新特效**（从特效池挑或用组合公式现想）、需要哪些真实图片。
- 按 narrative.md 写 20~25 句，分成 4~6 段（scene）。**表格发给用户：每句旁白 + 对应画面**，并列出要拍板的点。核实研究出处。
- 每段一个**章节卡**：标题（2~6 字）+ 一句小简介（最好是问题）+ 可选英文副标题。**第一段（开场钩子）不放章节卡**，TikTok 前两秒要直接进故事。
- 同时拟好**发布文案**：3 个备选首句、正文 2~4 句（口语、结尾抛问题）、5~8 个话题标签（中英混合 + 系列标签）、置顶评论。
- 用户确认后：`sh <skill>/scripts/new_episode.sh <slug> <theme> <标题>`，写入 `lines.json`（id、scene、text、say、gapAfter）和 `episode.json`（title、en、cover、chapters、publish）。

### 3'. 无配音模式（2026-10-18 起试行，用户说"不配音"时）
episode.json 设 `noVoice: true`：每句按阅读时间停留（约 8 字/秒 + 0.6 秒，用户嫌 5.5 字/秒太慢；lines.json 可用 `hold` 指定秒数），底部不出字幕，文字由 film.js 画在画面里（参考 self-worth 的 caption()）。

### 3. 配音（PowerShell，后台）——2026-10-19 起默认 IndexTTS-2.5（比 CosyVoice2 稳，能用拼音指定多音字）
```powershell
$env:PYTHONIOENCODING='utf-8'; $env:HF_HUB_OFFLINE='1'; Set-Location D:/claude/finish/心理学概念系列/<slug>; & D:/tts-indextts/.venv/Scripts/python.exe tools/tts_index.py lines.json voices --ref D:/claude/voice/_ref/ref24k.wav --takes 3 *> out/tts.log
# 离线跑不了识别打分 → 配完去掉 HF_HUB_OFFLINE 再补：& D:/tts-indextts/.venv/Scripts/python.exe tools/rescore.py lines.json voices *> out/rescore.log
```
- 音色：`D:/claude/voice/_ref/ref24k.wav`（女声，用户认可）。**不能在 Git Bash 里跑。**
- **配音 ≠ 字幕**（参考视频 4）：`text` 是画面上的完整句，`say` 只说口语化的主干；不读、只跳出来的半句写进 `pop`（film.js 在配音结束后的下一拍解码跳出）。
- **断句**：`say` 里 `/` = 逗号停顿，`//` = 句号停顿；**整句一次合成，绝不分段合成再拼**（2026-10-19 用户：情绪接不上、读着累、很机械）。停顿只放在意群之间，**绝不在一个短语中间断**（错例："他留在你身上的 / 那部分"）。情绪向量试过，用户选了不加情绪的整句版。
- **多音字 / 声调**：`say` 里写 `<调|TIAO2>`（拼音 + 声调数字，轻声用 5，如"看看"写 `<看|KAN4><看|KAN5>`；脚本会换成模型认的 `tiao2`）。常见读错：看清、看看、调、还、行、重、长、得——写稿时主动标；**但标注会让模型在被标的字前面停一下**（2026-10-22 用户："还有一道题"读成"还，有一道题"、"都拿不回来"读成"都，拿不回来"）——默认就读对的字（"还有""都"）别标，只标真读错过的；合成后用 `ffmpeg -af silencedetect=n=-35dB:d=0.1` 查句中停顿，停顿只能落在 / 处；轻声字（如"的"被读成 dei）别标 DE5——标了会读成"得/底"，直接改写句子避开这个字；语气词"嗯"要冷淡（不是疑问）：标 EN1/EN4 都会读成上扬的疑问，改写成"// 恩。"（不加标注）才稳定下降；声调用 librosa.pyin 量最后一个有声段的起止音高（tts 的 venv 里有），正数半音 = 上扬；得（dé）这类字同理别标，改写句子（"得到"→"换来"）；**自动选出的最佳一遍可能漏字**（识别分高但少了"嗯"），要对照识别文本手动挑；"TA"写成"他"。
- 合成完逐句对照稿子和识别结果（`out/tts.log`），可疑的用 `--only id --takes 5 --seed 31` 重配；同音字差异不算错。
- 2026-10-27 起只保留 IndexTTS-2.5，CosyVoice2 和情绪模块（qwen0.6bemo4-merge）已删除：用户喜欢不加情绪的纯克隆。**不要传 use_qwen_emo / use_emo_text**（模块已删，会报错）；情绪向量 emo_vector 不依赖该模块，但用户没要求就别加。

### 4. 分镜（film.js）+ 拟音（sfx.py）
- `node tools/timeline.mjs` 得到时间轴（章节卡时段自动插入；没配音时按字数估算）。
- 先翻 `reference/elements_gallery.jpg` 和 elements.md，**优先复用元素库**，但只用真正贴合故事的元素——元素不是越多越好，宁缺毋滥；本期需要的新图形，如果以后还用得上，就写进 motifs.js 并补图鉴，而不是只写在 film.js 里。
- 拟音优先用真实采样 `smp(...)`（界面点击/提示、键盘、翻页、纸、心跳、撞击、嗖声、筹码…），合成的 ding/boom/shimmer 作补充；先翻 reference/sfx_library.md 挑
- 粒子：`key / cam / flash / wave`；叠加层：`M.*`、`E.neon / orb / link`。时间都写成 `T('id') + 偏移`。
- 左上角章节角标由引擎按 chapters 自动画；章节卡的音效由 mix.py 自动加。

### 5. 检查画面
`node tools/render.mjs --still ...`（每 4~5 秒一帧 + 每张章节卡）→ `python tools/sheet.py` → Read 看联系表。查文字重叠、压字幕、时机、光晕大小。

### 6. 预览小样 → 给用户看
`sh build.sh preview` → `preview.mp4`（960 宽、12fps、带配音配乐、左下角"预览小样"，约 1 分钟出）。打开文件夹请用户看节奏和画面，收集修改意见。用户满意（或明确说直接出高清）再进下一步。

### 7. 出片
`sh build.sh` → 高清成片、两张封面、srt、`发布文案.md`（含自动生成的分段时间戳），并删除 preview.mp4。
复查：响度约 −14 LUFS（ebur128）；截一段最满的段落做语音识别；成片抽帧含分段拼接处和章节卡；Read 两张封面。

### 8. 交付
表格列出文件（mp4、两张封面、srt、发布文案.md、build.sh），按章节简述画面，说明文案改动及原因；如实说明语气和配乐要用户亲自听。`explorer.exe` 打开文件夹。

## 硬性要求（用户长期偏好）
- 只做横屏；只发 TikTok
- 不要生成 / 提议 AI 配乐；只用用户 dubbing 文件夹里的曲子（2026-10-19 起）
- 右上角 Pain 水印；封面两张都要；每段有章节卡（开场除外），分段时间戳放在发布文案正文下面
- 霓虹字光晕收紧，字要清楚；**字要大**（字幕 58px 粗体、章节角标 36px，画面内文字 ≥ 34px，标签别用 20px 级小字）
- **开头第 0 帧就要留住人**：大字提问 + 主角已在画面，不要黑场淡入（见 narrative.md 钩子）
- **字幕位置**：开场反问放顶部大字（衬线），讲故事的句子放底部（y≈1000，衬线 48px），跟参考视频一致
- **开场模式（2026-10-18 巴纳姆起）**：高级 3D 动画背景 + 连串**反问句**（"你是不是……？是不是……？"）→ "那么恭喜你，你撞上了……" → 概念名大字 → 再讲故事（参考视频 030609）
- 恋爱题材用"TA"；结尾不说教
- **画面要"做到位"**（2026-10-19 用户："椅子就像是几个简单图形拼出来的"）：按参考视频 1（D:/claude/video/1.mp4）的扁平风格——大块奶白粗线人物（`M.flatMan`）、统一粗描边的道具、深色墙 + 地平线 + 斜光（`M.lightBeam`）；别用粗糙的 3D 占位几何
- **节奏按参考视频 1**：episode.json `pace: {cps: 11, pad: .3, min: 1.3, card: 1.2, gap: .15}`（约 2.2 秒一句）；章节卡会按小问题的字数自动停够时间，别再压短
- **每期都要有新东西**：一个贯穿全片的视觉母题 + 至少一个新特效；不做固定系列主角
- 可以用网上真实图片（只用自由授权，见 creativity.md），统一过双色调 / 去色调到本期配色
- 文案先确认再配音；高清前先给预览小样；**时长按内容深浅走**（先分析 / 和用户讨论概念：简单的 80 多秒，深的 3~4 分钟）
- **有配乐**：用户的固定曲子在 `D:\claude\dubbing`（Pain1 = vibe 知识小曲，F 小调 112 BPM；Pain，F# 大调 92 BPM）。`python tools/beats.py <曲子>` 分析拍点 → episode.json `music`（有配音时 `grid: "beat"`），画面动作卡拍，镜头只在画面切换时顿一下；音效用和配乐同调的乐器（mix.py 的 musicbox / celesta / kalimba / pluck / piano / rpiano）；sfx.py 写 `MUSIC_GAIN=[(秒, 增益)…]` 可让配乐在定格 / 插科打诨时停下或压低
- 元素库持续积累：新元素进 motifs.js + 图鉴；参考视频分析记进 inspiration.md；参考视频不等于本期必须用上，元素要用在合适的地方
