# 本期拟音（mix.py 会执行本文件）。时间用 T(id)/E(id)/Dn(id)/SC(场景名) 表达，和 film.js 的动画对齐
# 真实采样：smp('组/名', 第几个, 变速) —— 如 smp('ui/click', 2)、smp('key/keypress', 5)、smp('heart/heartbeat_slow')，清单见 skill 的 reference/sfx_library.md
# 合成音效：ding tick heart boom whoosh shimmer pop suck click glitch hiss；add(sfx, 音效, 时刻, 增益)
# 注意：爆散的 boom 不要盖在关键词上（增益 ≤ .35），否则会把配音的字压糊
add(sfx, whoosh(1.6, 200, 2000), .2, .3)
add(sfx, boom(48), T('a2') - .2, .5); add(sfx, shimmer(), T('a2') - .15, .3)
# 可选：配乐强度曲线（秒, 0~1），不写就按场景自动生成
# INTENSITY = [(0, 0), (2, .55), (T('a2'), .8), (E('a2') + 3, 0)]
