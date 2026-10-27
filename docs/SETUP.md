# 安装与环境

作者环境：Windows 11 + Git Bash / PowerShell、NVIDIA 8GB 显卡。macOS / Linux 理论上可用（脚本是 sh + Node + Python），但未测试。

## 1. 基础工具

| 工具 | 用途 | 安装 |
|---|---|---|
| Node.js 18+ | 渲染、时间轴 | https://nodejs.org |
| FFmpeg | 编码、混音、响度 | `winget install Gyan.FFmpeg` |
| Python 3.10+ | 混音、拍点、字幕 | https://python.org |
| Chromium（Playwright） | 无头逐帧渲染 | `npx playwright install chromium` |

Python 包：

```bash
pip install numpy scipy soundfile librosa pillow
```

每期项目由 `scripts/new_episode.sh` 生成，会自动 `npm install`（只依赖 `playwright-core`）。

## 2. 配音（可选，不配音可以用 episode.json 的 `noVoice: true`）

1. 安装 [IndexTTS](https://github.com/index-tts/index-tts)（按官方 README 用 `uv sync`），下载 **IndexTTS-2.5** 模型到 `checkpoints/`。约 5.5 GB，8 GB 显存可跑（BF16，每句约 6 秒）。
   注意：IndexTTS 模型使用 bilibili 模型许可，商用需联系官方。
2. 在 IndexTTS 的环境里再装：`pip install faster-whisper soxr`（自动识别打分）。
3. 准备你自己的参考录音：24 kHz 单声道 WAV（10~20 秒，干净人声）放到 `D:/claude/voice/_ref/ref24k.wav`。**只克隆你本人或已获授权的声音。**
4. 配音命令见 SKILL.md 第 3 步（PowerShell 里跑；`HF_HUB_OFFLINE=1` 避免启动时联网卡住）。

## 3. 外部素材

| 素材 | 默认位置 | 怎么得到 |
|---|---|---|
| 音效库（CC0） | `D:/claude/sfx/` | 下载以下包并解压到同名文件夹：Kenney [UI Audio](https://kenney.nl/assets/ui-audio) → `kenney_ui-audio`、[Interface Sounds](https://kenney.nl/assets/interface-sounds) → `kenney_interface-sounds`、[Digital Audio](https://kenney.nl/assets/digital-audio) → `kenney_digital-audio`、[Impact Sounds](https://kenney.nl/assets/impact-sounds) → `kenney_impact-sounds`、[Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) → `kenney_sci-fi-sounds`、[Casino Audio](https://kenney.nl/assets/casino-audio) → `kenney_casino-audio`；OpenGameArt 上的 CC0 包（swishes、whoosh、keyboard、pages、heartbeat、"100 CC0 SFX"）→ `oga_swishes` / `oga_whoosh` / `oga_keyboard` / `oga_pages` / `oga_heartbeat` / `oga_cc0_100`。然后 `python tools/sfxlib.py` 生成清单 |
| Lottie 动画库 | `D:/claude/lottie/` | `python tools/lottie_fetch.py --all`（Google Noto 动态表情，约 32 MB；用到时在发布文案署名） |
| 配乐 | `D:/claude/dubbing/` | 你自己有授权的曲子；`python tools/beats.py 曲子.mp3` 生成拍点文件，episode.json 的 `music` 指向它 |
| 字体 | 每期 `fonts/` | `node tools/fonts.mjs` 自动从 Google Fonts 下载 Noto Sans/Serif SC 子集（只含片中用到的字） |
| 真实图片 | 每期 `assets/` | `python tools/fetch_image.py "关键词"`，只取 Wikimedia Commons 自由授权图片并自动记录署名 |

## 4. 换成你自己的路径

以下文件写了 `D:/...` 的默认路径，按需搜索替换：

```
scripts/new_episode.sh   输出目录 D:/claude/finish/心理学概念系列
template/build.sh        配音命令注释
template/lottie.js       Lottie 库位置
template/scenes3d.js     3D 打包工具位置（注释）
tools/sfxlib.py          音效库（也可设环境变量 SFX_ROOT）
tools/lottie_fetch.py    Lottie 库
tools/tts_index.py / rescore.py   IndexTTS 安装位置、参考录音
tools/mix.py / beats.py / beatline.py   配乐目录
tools/fxgallery.mjs      图鉴输出目录
SKILL.md / reference/*   说明文字里的路径
```

## 5. 试跑

```bash
sh scripts/new_episode.sh test-episode aurora 测试
cd D:/claude/finish/心理学概念系列/test-episode
sh build.sh preview      # 用模板里的示例句子出一段小样
```
