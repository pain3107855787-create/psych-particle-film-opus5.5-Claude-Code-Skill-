# 元素库（template/motifs.js，用法 M.名字(...)）

图鉴：`reference/elements_gallery.jpg`（重新生成：在任一项目根目录 `node <skill>/tools/gallery.mjs <theme> <输出>`）

| 元素 | 用途 | 出处 |
|---|---|---|
| `lovers(x1,x2,y,t,{names,broken,link,aa,ab})` | 两人/两个对象的关系；broken 断开 | 客体恒常性 |
| `chat(x,y,文字,t0,t,{color,status})` | 对话气泡 + 已读/未读 | 客体恒常性 |
| `chatScroll(t,t0,al,box)` | 焦虑地翻聊天记录，越滚越快 | 客体恒常性 |
| `clockHands(cx,cy,起分钟,止分钟,k)` | 时间流逝（表盘用粒子 S.clock） | 客体恒常性 |
| `eye(x,y,al,标签)` | 观察者 / "看不见" | 客体恒常性 |
| `pill(字,x,y)` | 小注释标签 | 客体恒常性 |
| `zzz(x,y,t)` | 睡着 / 不在线 | 客体恒常性 |
| `constellation([[字,x,y,色,号],...],al,t0,t)` | 回忆碎片、关键词连成星座 | 客体恒常性 |
| `coin(x,y,r,面,翻转角)` | 概率、二选一 | 赌徒谬论 |
| `roulette(cx,cy,R,rot,高亮格)` | 赌博、随机 | 赌徒谬论 |
| `chips(x,y,枚数,色,al,散落)` | 下注、损失 | 赌徒谬论 |
| `bars([{label,value,color}],x,底边,k)` | 两组数据对比 | 热手谬论 |
| `scale(cx,cy,倾角,左,右)` | 权衡、"该平衡了"的直觉 | 赌徒谬论 |
| `hoop(x,y)` / `stick(x,y,抬手)` | 运动场景、人物 | 热手谬论 |
| `gauge(cx,cy,r,比例,al,{label,text})` | 百分比、概率 | 新增（参考视频 HUD） |
| `counter(x,y,值,k,al,{label,unit,size})` | 数字滚动读数 | 新增（参考视频"Δx 240,000 km"） |
| `timeline(x1,x2,y,[{year,label}],k)` | 研究史、年代演进 | 新增 |
| `orbits(cx,cy,t,al)` | 主体周围的轨道氛围 | 新增（参考视频光环） |
| `measure(x1,y1,x2,y2,文字)` | 距离 / 差距 | 新增（参考视频） |
| `brackets(x,y,w,h)` | HUD 角框，锁定主体 | 新增（参考视频 2） |
| `spin(x,y,向上?,色)` | 两种相反状态 | 新增（参考视频 1 自旋） |
| `pulse(x1,x2,y,t,al,{amp,bpm})` | 心跳 / 情绪波动 | 新增 |
| `comet(path(u)→[x,y], k, al, {label,color,len})` | 人生轨迹、反复的尝试、命运线 | 新增（参考视频 3） |
| `meter(x,y,w,值0~1,al,{label,en,text,color})` | 一个贯穿全片的指标读数（控制感、惊奇值…） | 新增（参考视频 4） |
| `slotText(前半句,x,y,[候选字],选中序号,k)` | "下一个字是什么"，候选字老虎机滚动后定格 | 新增（参考视频 4） |
| `axisGrid(t,al)` | 实验 / 科学场景的淡透视网格 | 新增（参考视频 3） |
| `door(x,y,w,h,开度)` | 机会、出口、"门开着却不走" | 习得性无助 |
| `shuttleBox(x,y,w,h,墙高,al,{left,right})` | 实验箱、两个区域的对照 | 习得性无助 |
| `bolt(x1,y1,x2,y2,t)` | 电击、刺痛、冲击 | 习得性无助 |
| `noise(x,y,w,h,t,al,强度)` | 噪音、压力、混乱 | 习得性无助 |
| `button(x,y,按下0~1,al,{label})` | 一次"有用"的操作 | 习得性无助 |
| `circuit(nodes,edges,t)` | 脑区 / 因果回路，兴奋与抑制 | 习得性无助 |
| `podium(cx,底边,al,{labels,medals})` → 返回金/银/铜/地面坐标 | 排名、名次、"差一点" | 相对剥夺感 |
| `phone(x,y,w,h,t,al,{speed,scroll,glow})` | 社交媒体、刷屏、别人的高光 | 相对剥夺感 |
| `ruler(x1,y1,x2,y2,k,al,{unit,every,label})` | 衡量标准、"用谁的尺子量" | 相对剥夺感 |
| `erp(x1,x2,y,k,al,{traces:[{amp,color,label}],mark,markText})` | 脑电/信号波形对比，谁的波峰更高 | 负面偏向 |
| `bowl(cx,cy,w,al,{kind:'cherry'|'roach',odd:{kind,drop},stain,dim})` | 一碗东西里混进一个异类、"一颗老鼠屎" | 负面偏向 |
| `eyes(x,y,睁开0~1,al,{gap,size,color})` | 暗处的威胁、被盯上 | 负面偏向 |
| `grass(x1,x2,y,t,al,{h,density,seed})` | 草原/野外，摆动的草丛（可遮住 eyes） | 负面偏向 |
| `comments(x,y,w,h,scroll,al,{bad,badText,badAlpha,dim,shake})` → 返回差评坐标 | 评论区、好评淹没不了的一条差评 | 负面偏向 |
| `pursuit(cx,cy,phase,gap,al,{rx,ry,heart,ca,cb,len,labels,fadeB})` → 返回两点坐标 | 一追一躲的关系动态；heart=1 时路线变心形，可做"纠缠成结" | 依恋理论 |
| `figure(x,脚底y,身高,al,{hi,color,hold:'phone'|'bottle',fill,arm,belly,label,t})` → 返回手的坐标 | 扁平药丸小人；灰人群里一个高亮主角、拿手机/拿瓶子、吃撑了肚子鼓 | 边际效用递减（参考视频"假装看手机"） |
| `bottle(x,底y,高,余量0~1,al,{tilt,color,bubbles})` | 可乐瓶 / 任何"被一点点用掉"的存量 | 边际效用递减 |
| `vmeter(x,底y,高,值,al,{label,en,text,min,max,w,color})` | 竖向读数条（快乐值、紧张度），可跌成负数变红；适合贯穿全片的情绪指标 | 边际效用递减（参考视频"紧张"条） |
| `callouts(x,y,[[文字,dx,dy,色],...],k,al,{size})` | 从主体拉引线的标注气泡，依次弹出（"表情自然吗？手该放哪？"） | 边际效用递减（参考视频） |
| `tree(nodes,t,al)` | 推理树 / 脑补树：从事实往上长出一层层猜测（红线 + 下划线关键词） | 自我价值独立性（参考视频"明明还不了解"） |
| `feedPost(x,y,w,t,al,{name,caption,time,likes,img,highlight})` | 朋友圈 / 社交动态卡片，点赞数可高亮 | 自我价值独立性 |
| `layerTags(x,[[字,y,强调,al],...])` | 左侧图层标签（看到的 / 猜的 / 认定的） | 自我价值独立性 |
| `expectGap(x1,x2,y期待,y现实,al,{text,expLabel,realLabel})` | 期待线（虚）vs 现实线（实），落差红 / 惊喜金 | 预期管理 |
| `spikeTrace(x1,x2,y,k,al,{events:[{at,amp,label,mark}],title})` | 神经放电 / 反应轨迹，峰与凹陷，灯亮 / 果汁标记 | 预期管理 |

| `strikeFix(x,y,标题,'不是{误解}','是{真相}',t,t0,al,{size,sub,color,hot})` | 大标题逐字弹入 → 常见误解被划掉 → 改写后的说法弹出（开场点题、纠正误区） | 参考视频 1 焦虑型依恋 |
| `wordBurst(x,y,字,t,t0,al,{thoughts,every,burstAt,core,size,R})` → 返回炸开时刻 | 一个字被放大 → 霓虹圈 → 一圈脑补念头沿引线长出 → 故障变色炸开 → 可留一个核心字（过度解读、反刍、一句话想一整晚） | 参考视频 2 "嗯" |
| `glowSitter(x,脚底y,身高,'sit'/'lie'/'crouch'/'stand',t,al,{phone,stress,think,face})` → 返回头部坐标 | 白色发光小人，手机蓝光照脸、头顶焦虑波纹、脑补云里转圈（深夜情绪、失眠、等消息） | 参考视频 1 |
| `ridge(x1,x2,底边,t,k,al,{peak,height,dots,spread,flag:{at,label}})` | 发光数据山脊，白点一颗颗落到峰顶，远处孤点插旗（分布、"大多数人 vs 少数"、排名） | 参考视频 3 |
| `chat(..., {style:'ios', incoming, status})` | 实心亮蓝 / 灰色聊天气泡（iMessage 风） | 参考视频 2 |
| `flatMan(x,脚底y,身高,'stand'/'proud'/'point'/'sit'/'crouch'/'walk',t,al,{face:'smug'/'sad'/'calm',crown,dir,phase,shadow:{k,dx,col,crown,crack}})` | 参考视频 1 画风的扁平粗线小人；**shadow = 墙上的影子**，k 倍放大，可戴王冠、可裂开（"影子 = 自我估计"） | 傲慢 |
| `lightBeam(x,y,角度,长度,起宽,末宽,al)` | 斜打的一道淡光（参考视频 1 的房间光） | 傲慢 |
| `img(src)` / `photo(src,x,y,w,h,t,al,{fx:'duotone'/'halftone'/'mono',kb,reveal,revealMode:'develop'/'scan'/'tear',frame:'polaroid'/'evidence',caption,tag,redact,credit,rot})` | **真实照片**：暗房显影、双色调、网点、扫描线、撕开、拍立得、档案照 + 打码 | 2026-10-19 起 |
| `redString([[x,y],...],k,al)` | 证据墙红线，把照片 / 节点串起来 | 2026-10-19 起 |
| `punchWord(字,x,y,t,t0,al,{size,color,rays})` | 最重的那个词从 1.9 倍砸回原大小 + 放射速度线（参考视频 4 的"变"） | 2026-10-19 |
| `decodeText(句子,x,y,t,t0,al,{size,dur,hot})` | 乱码一格格翻成真字，{} 里的字用强调色（"答案，藏在你的大脑里"） | 2026-10-19 |
| `inkBlob(x,y,r,色,t,al,{stains:[{col,a,s}]})` / `inkThread(x1,y1,x2,y2,色A,色B,k,al)` | **颜色沾染**：每个人是一团水彩；分开时拉出颜料丝，断开后身上留着对方的一块颜色 | 如果注定要分别 |
| `clarity(draw,x,y,w,h,level,al,{steps,badge,frame})` | **清晰度 = 记忆强度**：任何画面先马赛克，按拍子一级级变清楚，到顶标"原图" | 忘不掉的那一帧 |

| `hudStat(x,y,标签,值,al,{unit,dec,frac,hot,pulse,big,bx,by,bsize})` | 全片挂在左上角的读数（章节角标下面 y≈230），数字一直变或一直不变都行；结尾 big=1 飞到画面中间变大字 | 情绪容纳（参考视频"野马效应"的"0 cm"） |
| `grade(色,强度)` | 整帧情绪调色（soft-light + 同色暗角），在 screen(t) 里按段落关键帧插值：发火偏红、童年偏冷蓝、被接住偏暖 | 情绪容纳（参考视频"野马效应"） |
| `glassMan(x,脚底y,身高,姿势,t,al,{chest,chestCol,cracks,glass,dir})` → 胸口坐标 | 半透明玻璃人（flatMan 姿势 + 发光描边），胸口能透出一团光 / 红色裂纹：吞下去的情绪、藏起来的伤 | 情绪容纳（参考视频"野马效应"） |
| `cupHands(x,y,宽,t,al,{open,flinch,burn,lift,fill})` → 碗心 | 一双捧起来的手（扁平粗线），可缩手、发抖、手心发红；一双托着一双可以排成一列 | 情绪容纳 |
| `hand(x,y,s,ang,t,al,{pose:'offer'/'point'/'flick',flip,burn,label})` | 胶囊拼的一只手：递东西 / 指点 / 弹开，从右边伸进来用 flip:1 | 情绪容纳 |
| `loopArrows(cx,cy,[词…],t,k,al,{rx,ry,color})` | 恶性循环：几个词绕一圈，弧形箭头一段段首尾相接 | 情绪容纳（参考视频"越深越疼越用力"） |
| `pullChar(句子,x,y,要抽的字/串,t,t0,al,{size,color,hot,to:[x,y],dur,glowBefore})` | 抽字：某个字发光上浮、飞到 to 点（或往上飘散），其余字合拢补位；抽之前那个字一直亮着 | 沉没成本（结尾把"都"抽进井里） |
| `jellyDrop(t,t0,{from,dur,amp})` → [dy,sx,sy] | 果冻掉落：物体从上面掉进画面，落地压扁回弹两下（自己 translate+scale） | 参考视频 1022（手机掉进画面） |
| `feedScreen(x,y,w,h,k,t,items,al,{fx,caption,likes,frame})` + `swipeK(t,t0,hold,swipe)` | 竖屏信息流：真实图片 / 自绘内容一条条往上划走（停一下、唰一下），带标题、点赞、进度条 | 参考视频 1022（刷短视频） |
| `plusPops(x,y,t,times,al,{text,color,size})` | 一串 "+1"（或自定义文字）从某点冒出来往上飘 | 参考视频 1022 |
| `ctrlCenter(x,y,s,al,{mute,dnd,vol,bright,slide})` | 仿手机控制中心：震动 / 静音 / 勿扰 + 音量亮度滑条，可从上面滑进来 | 参考视频 1022 |
| `peephole(al,r)` | 取景框暗角：整屏四周重暗角，像透过镜头 / 猫眼看 | 参考视频 1022 |

**3D 场景（template/scenes3d.js，`S3.render(名, t, o)`）**：`windfire` **风与火**（反脆弱起用）：黑石地上蜡烛 (-3.2,0,0)、篝火 (0,0,0)、石头 (3.2,0,0)，风从左往右吹（风线、尘、顺风的火星）；o: wind 0~3、fire 0~1.6、scatter 0~1 火被吹散、candle 0~1（0 灭并冒烟）、show:{candle,fire,stone}、cam/look；火是三层叠加粒子，亮度已压低（再加粒子会过曝）· `metronomes` **节拍器木板**（自我分化起用）：架在两个罐子上的木板 + 16 个黄铜节拍器 + 一个奶白色的"你"；o.phase 公共相位（film 里按配乐拍点 + 变速积分好传入，摆到尽头正好落在拍子上）、sync 同步程度、shake 木板晃、hi 单独点亮某几个（S3.MET 是坐标）、you:{phase,sync,lift 拿下木板,base 底座加重,glow}、clocks/clockSync 惠更斯的两座摆钟；适合讲同步、从众、家庭系统、被带节奏 · `coal` **烧红的炭**（情绪容纳起用）：深靛蓝空间里 1~3 块岩块炭（发光裂纹 + 火星 + 地面反光），o.coals=[{p,heat 1 白热→.5 暗红→.15 体温,s,smooth 0~1 磨成鹅卵石,warm 0~1 换成温热奶油色石子,a}]、cam/look、embers；`S3.project('coal',x,y,z)` 把 2D 的手 / 玻璃人对到炭上（人物脚底放在 y=-1.25 的地面上，胸口 = 脚底 + .62×身高）· `icelake` **薄冰湖**（过度自信起用）：月夜冰湖 + 远山 + 冰面月光；o: cam/look、man [x,z] 主角位置、ring 脚下发光圈半径、crack 0~1 裂纹沿路蔓延、brk 0~1 中心一片碎成几十块下沉、under 0~1 水下（雾变青、气泡、冰洞光柱；镜头要放在碎冰区外，如 cam [0,-4.5,12]）、knock 0~1 敲冰涟漪；碎冰中心 (0,0,-6) · `windowcity` **窗灯之城**（嫉妒起用）：几百栋楼上万扇窗，街两边是"你"和"TA"两扇主窗；o: cam/look 镜头（数组）、city 亮灯比例、dimCity、you/youGreen/lin 两扇窗亮度、wire+cut 两窗之间的绿色调光线（剪断）、own 每盏灯垂下自己的电线、map 0~1 绿线从你出发一扇扇连过去、goal 终点金窗；点位在 `S3.WIN`（先 `S3.render('windowcity',0,{})` 建场景），2D 里用 `S3.project` 画窗内的人和标签；俯视地图镜头约 cam [0,98,-38] look [1,0,-43] · `paperwave` **待办海啸**（拖延起用）：几千张纸片卷成一道巨浪，o: grow 规模 / clock 定格时传常数 / orbit·dist·lookY·camY·lookZ 镜头 / lit 0~8 标签纸转向镜头发亮 / crash 0~1 砸向镜头 / gather 0~1 收成一页 / dim / heat；`S3.project('paperwave', x,y,z)` 返回 [屏幕x, 屏幕y, 每单位像素]，用来把 2D 小人放进 3D 场景（主角站在 (0,0,4.6)），侧面 orbit≈1.0 时浪形最清楚；单独测：`node tools/s3test.mjs paperwave '[{"t":1,"grow":1,"orbit":1}]'` · `stars` 星空穹顶 + 十二星座（o.hi 高亮）· `screens` 屏幕海，几百块写着同一句话（首次传 text/header/oddText，之后 field/dolly/hero/odd/lookOdd）· `tiles` MBTI 16 宫格（hi/explode/dolly/lookY）· `stage` 舞台聚光灯 + 椅子 + 尘埃（beam/tint 0 暖白 → 1 马戏团金红/dolly）。样张见 D:/claude/tools3d/3D背景样张.jpg

字幕自带**术语小标签**：lines.json 的 text 以 `[术语]` 开头即可（如 `[边际效用]每多一份…`）；`noSub: true` 的句子不出字幕（开场大字标题已在画面上时用）。episode.json 的 `startAt`（首句开始秒数，默认 1.0）和 `noFadeIn`（去掉开头黑场淡入）用于"第 0 帧就留住人"的开场。

另外 engine 自带：`E.orb` 光点、`E.link` 波浪光线、`E.bubbleBox` 圆角框、`E.neon` 霓虹字；粒子形状见 film.js 模板注释（S.heart / S.moon / S.clock / S.text …）。

## 加新元素的流程
1. 用户把喜欢的视频放进 `D:\Claude\video`。对照 `reference/inspiration.md`，只分析没记录过的新视频：
   抽帧（`ffmpeg -vf "fps=3,scale=480:-1,tile=6x4"`）+ 语音转写，总结它的图形语汇、转场、叙事手法。
2. 提出 2~4 个**受启发但不照抄**的新元素（说明适合哪类概念），用户同意后写进 motifs.js：
   统一用 `th()` 配色、霓虹细线、参数里带 al / t；不写死颜色。
3. 补进本表和图鉴，在 inspiration.md 记下视频文件名和提炼出的东西。
