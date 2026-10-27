# 《客体恒常性》拟音（由 tools/mix.py 执行）
add(sfx, whoosh(1.6, 200, 2000), .2, .3)
add(sfx, ding(1568), T('l1') + 1.9, .25)                      # 消息提示
for i in range(int(Dn('l2') * 4)): add(sfx, tick(), T('l2') + .9 + i * .25, .5)     # 时钟快进
add(sfx, ding(1175, 1.0), E('l2') + .9, .18)                  # 你发出的消息
for i in range(10): add(sfx, whoosh(.25, 1500, 6000), T('l3') + .4 + i * (.5 - i * .03), .12)   # 翻聊天记录
hb0 = T('l4') - .4
for i in range(8): g = .5 + i * .07; add(sfx, heart(), hb0 + i * .62, g); add(sfx, heart(), hb0 + i * .62 + .2, g * .6)   # 心跳加速
add(sfx, boom(48), T('p1') - .25, .55); add(sfx, shimmer(), T('p1') - .2, .3)
add(sfx, whoosh(1.2, 200, 1500), E('p2') - 1.2, .3)           # 毯子落下
add(sfx, whoosh(1.6, 300, 2500), T('p4') + Dn('p4') * .5, .25)
p5a, p5d = T('p5'), Dn('p5')
add(sfx, suck(), p5a + p5d * .5 - .4, .5); add(sfx, pop(), p5a + p5d * .72 + .05, .6); add(sfx, shimmer(1.2), p5a + p5d * .72 + .05, .3)
add(sfx, shimmer(2.0), T('p6') + Dn('p6') * .6 + 1.1, .25)
add(sfx, whoosh(1.5, 200, 2500), T('m1') + .2, .25); add(sfx, shimmer(1.8), T('m1') + 1.6, .2)
m5a, m5d = T('m5'), Dn('m5')
add(sfx, whoosh(.9, 400, 3000), m5a + m5d * .5, .3); add(sfx, boom(44, 2.6), m5a + m5d * .7 + .05, .35); add(sfx, shimmer(1.6), m5a + m5d * .7 + .05, .25)
for i in range(9): add(sfx, ding(1046, .6), T('m6') + 1.9 + i * .18, .05)
add(sfx, whoosh(2.4, 150, 1500), T('r1') + .3, .3); add(sfx, shimmer(2.4), T('r2') + .3, .25)
add(sfx, shimmer(2.6), T('e4') + .3, .3); add(sfx, boom(40, 3.5), E('e5') + .4, .3); add(sfx, shimmer(3.0), E('e5') + .5, .25)

INTENSITY = [(0, 0), (2, .55), (T('l3'), .6), (T('l4'), .35), (E('l4') + .5, .25), (SC('piaget'), .5), (T('p5'), .6), (T('p6'), .7), (SC('love'), .65),
               (T('m3'), .8), (T('m4'), .55), (T('m5'), .6), (E('m5'), .2), (T('m6'), .35), (SC('reveal'), .45), (T('r2'), .85), (SC('moon'), .7), (T('e4'), .9), (TOT - 3, .6), (TOT, 0)]
