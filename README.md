# psych-particle-film · 心理学概念短片生成流程（Claude Code Skill）

一套给 [Claude Code](https://claude.com/claude-code) 用的 **Skill**：对 Claude 说"做一期 X 概念"，它会带你走完一条心理学科普短片的全流程——

**选题讨论 → 写稿（逐句画面表）→ 克隆配音 → 分镜代码 → 预览小样 → 配乐卡拍 + 音效 → 高清成片 → 两张封面 → TikTok 发布文案**

成片是 1920×1080 / 30fps 的横屏短片，画面 100% 由代码逐帧绘制（Canvas 2D + Three.js + WebGL Shader），由 Playwright 驱动无头 Chromium 截帧、FFmpeg 编码；音效用 numpy 合成 + CC0 真实采样，配乐按拍点卡画面。

> 作者：**Pain**（TikTok 心理学系列）。整套流程在与 Claude Code（Claude Opus 5.5）一期期合作做片的过程中逐步沉淀出来。

---

## 能做什么

| 能力 | 说明 |
|---|---|
| 粒子叙事引擎 | 粒子在文字 / 图形之间无缝变形、爆散闪切、冲击波、运镜、霓虹字（RGB 错位进场）、章节卡、读数 HUD、底部进度条 |
| 20 套配色 | 星尘 / 暗红数据 / 鎏金黑 / 极光 / 示波器 / 月潮 / 薄冰 / 毒翡翠 / 血色 / 夜霓虹 / 分屏 / 余烬 / 赛博 …（`reference/themes.md`） |
| 元素库 | 约 80 个可复用图形元素（聊天气泡、iOS 界面、手机、玻璃人、天平、计数器、真实照片暗房显影…），见 `reference/elements_gallery.jpg` |
| 3D 场景库 | Three.js + 辉光：星空、屏幕海、舞台、待办海啸、窗灯之城、薄冰湖、画廊、许愿井、节拍器木板… |
| Shader 库 | 16 个手写 WebGL2 着色器：极光、星云、流体、发光内核、体积光、星空穿梭、焦散、合成波网格、墨滴、光斑；后期类 故障 / 冲击波折射 / 热浪 / CRT / 色差 |
| Lottie | 内置 lottie-web 播放器，配套脚本一键下载 Google Noto 动态表情（881 个） |
| 后期栈 | 每帧统一的泛光 / 暗角 / 动态颗粒；震动表 `E.shake`、径向冲刺 `E.zoom`；字幕画在最上层不跟着震 |
| 配音 | IndexTTS-2.5 零样本克隆你自己的声音，每句多版本 + 语音识别自动打分挑选 |
| 配乐 | 用你自己的曲子：自动分析 BPM / 拍点 / 调性，画面动作和音效卡拍；`MUSIC_TONE` 让配乐"变闷蓄力 → 揭晓那一拍打开"，`DUCKS` 重击下压低 |
| 出片 | 一键 `sh build.sh preview`（低清小样）/ `sh build.sh`（高清 + 封面 + srt + 发布文案，响度 −14 LUFS） |

## 目录

```
SKILL.md            Claude 读的流程说明书（入口）
scripts/            new_episode.sh：开新的一期
template/           每期项目的起点：engine.js 粒子引擎、motifs.js 元素库、scenes2d/3d.js、shaders.js、lottie.js、film.js 分镜骨架、sfx.py
tools/              渲染、时间轴、拍点、混音、配音、语音识别质检、字幕、封面、发布文案、图鉴生成
reference/          创意方法、写稿规则、配色、元素清单、踩坑记录、参考视频分析、范例工程
```

## 安装

1. 把本仓库放到 Claude Code 的个人 skill 目录：
   ```bash
   git clone https://github.com/<你的用户名>/psych-particle-film.git ~/.claude/skills/psych-particle-film
   ```
2. 按 **[docs/SETUP.md](docs/SETUP.md)** 装好依赖（Node、FFmpeg、Python 包、Chromium、可选的 IndexTTS 配音）和外部素材（音效库、Lottie 库、你的配乐 / 参考音色）。
3. 在 Claude Code 里说："做一期 XX 概念" / "下一期讲 XX"。

> 现在的脚本默认素材放在 `D:/claude/...`、输出到 `D:/claude/finish/心理学概念系列/`（作者的 Windows 环境）。换路径的方法见 SETUP.md 最后一节。

## 不包含的东西

- 作者的配乐、克隆参考录音、成片 —— 这些是私人素材，请换成你自己的。
- 音效库、Lottie 动画库、字体、IndexTTS 模型 —— 体积大或另有许可，按 SETUP.md 自行下载。

## 许可

代码与文档：[MIT](LICENSE)。第三方组件见 [THIRD_PARTY.md](THIRD_PARTY.md)。
水印默认是 `Pain`，在每期的 `episode.json` 里写 `"watermark": "你的名字"` 即可替换（`""` = 不显示）。
