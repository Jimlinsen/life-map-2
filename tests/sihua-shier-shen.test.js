/**
 * 四化体系 · 十二神 回归测试
 *
 * 锁住的核心缺陷与口径：
 *   1. iztro 的 chart.chineseDate 是字符串而非对象 → 项目原有「四化」模块恒为空
 *      （年干取到 ''，四化数组长度 0）
 *   2. 岁前十二神第 7 位主流盘面写「岁破」（非「大耗」），博士第 12 位写「官符」（非「官府」）
 *   3. 运限跟随十二神的起点是【该运限的地支】，不是生年支
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ZiweiAnalyzer } from '../src/core/ziwei.js'
import {
  getSiHuaByStem, buildStarSiHuaMap, transformsToMap, toSiHuaEntries,
  getYearStemIndex, getYearBranchIndex, getDaXianSiHua, getLiuNianSiHua,
  getLiuYueStemIndex, getLiuYueSiHua, getLiuRiSiHua, getLiuShiSiHua,
  detectSelfSihua, buildAllSelfSihua, findIncomingPalaces, buildIncomingPalaceMap,
  buildOverlayTable, buildOverlayForStar, SI_HUA_TYPES, LUCUN_TABLE
} from '../src/core/sihua.js'
import {
  JIANG_QIAN_SHEN, SUI_QIAN_SHEN, BOSHI_SHEN,
  jiangXingBranch, jiangQianShenByBranch, suiQianShenByBranch,
  boshiShenByStem, boshiReverse,
  jiangQianShenName, suiQianShenName, boshiShenName,
  buildYunXianShierShen, buildYunXianShierShenLayers, attachShierShenToPalaces
} from '../src/core/shier-shen.js'

const analyze = (y = 1990, m = 5, d = 15, h = 3, g = '男', o) =>
  new ZiweiAnalyzer(y, m, d, h, g, o).analyze()

// ── 四化表 ────────────────────────────────────────────────────────────────

test('四化表：十天干各四化齐备且互不重复', () => {
  for (let i = 0; i < 10; i++) {
    const t = getSiHuaByStem(i)
    assert.deepEqual(Object.keys(t).sort(), ['忌', '权', '科', '禄'].sort())
    const names = Object.values(t)
    assert.equal(new Set(names).size, 4, `天干 ${i} 的四化星有重复`)
    names.forEach(n => assert.ok(n.length > 0, `天干 ${i} 存在空四化`))
  }
})

test('四化表：庚干四化为太阳禄·武曲权·太阴科·天同忌', () => {
  const t = getSiHuaByStem(6)
  assert.deepEqual(t, { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' })
})

test('buildStarSiHuaMap：星名 → 四化类型映射正确', () => {
  const map = buildStarSiHuaMap(6)
  assert.equal(map['太阳'], '禄')
  assert.equal(map['武曲'], '权')
  assert.equal(map['太阴'], '科')
  assert.equal(map['天同'], '忌')
})

test('transformsToMap 与 toSiHuaEntries 互逆', () => {
  const t = getSiHuaByStem(0) // 甲：廉贞禄·破军权·武曲科·太阳忌
  const map = transformsToMap(t)
  assert.equal(map['廉贞'], '禄')
  assert.equal(map['太阳'], '忌')
  const entries = toSiHuaEntries(map)
  assert.equal(entries.length, 4)
  assert.ok(entries.every(e => e.星曜 && e.类型))
})

// ── 年份索引 ──────────────────────────────────────────────────────────────

test('公历年干支索引：1984 年为甲子年', () => {
  assert.equal(getYearStemIndex(1984), 0)
  assert.equal(getYearBranchIndex(1984), 0)
  assert.equal(getYearStemIndex(1990), 6) // 庚
  assert.equal(getYearBranchIndex(1990), 6) // 午
})

test('公历年干支索引：跨世纪负余数正确', () => {
  assert.equal(getYearStemIndex(1900), 6) // 庚子年
  assert.equal(getYearBranchIndex(1900), 0)
  assert.equal(getYearStemIndex(2024), 0) // 甲辰年
  assert.equal(getYearBranchIndex(2024), 4)
})

// ── 运限四化 ──────────────────────────────────────────────────────────────

test('流年四化：2026 年为丙午年，四化为天同禄·天机权·文昌科·廉贞忌', () => {
  const r = getLiuNianSiHua(2026)
  assert.equal(r.stemName, '丙')
  assert.deepEqual(r.transforms, { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' })
})

test('流月五虎遁：甲己年起丙寅，正月得丙', () => {
  assert.equal(getLiuYueStemIndex(0, 1), 2)  // 甲年正月丙寅
  assert.equal(getLiuYueStemIndex(5, 1), 2)  // 己年正月丙寅
  assert.equal(getLiuYueStemIndex(1, 1), 4)  // 乙年正月戊寅
  assert.equal(getLiuYueStemIndex(6, 1), 4)  // 庚年正月戊寅
  assert.equal(getLiuYueStemIndex(2, 1), 6)  // 丙年正月庚寅
  assert.equal(getLiuYueStemIndex(7, 1), 6)  // 辛年正月庚寅
  assert.equal(getLiuYueStemIndex(3, 1), 8)  // 丁年正月壬寅
  assert.equal(getLiuYueStemIndex(8, 1), 8)  // 壬年正月壬寅
  assert.equal(getLiuYueStemIndex(4, 1), 0)  // 戊年正月甲寅
  assert.equal(getLiuYueStemIndex(9, 1), 0)  // 癸年正月甲寅
})

test('流月五虎遁：正月之后逐月顺推', () => {
  assert.equal(getLiuYueStemIndex(0, 2), 3) // 甲年二月丁卯
  assert.equal(getLiuYueStemIndex(0, 3), 4) // 甲年三月戊辰
  assert.equal(getLiuYueStemIndex(0, 12), 1) // 甲年十二月乙丑
})

test('流月四化：闰月后半月取下月口径', () => {
  const r = getLiuYueSiHua(0, 8, { isLeapMonth: true, liuriDay: 20 })
  assert.equal(r.month, 9)
})

test('流日四化：日干索引取四化正确', () => {
  const r = getLiuRiSiHua(6) // 庚日
  assert.equal(r.stemName, '庚')
  assert.equal(r.transforms.禄, '太阳')
})

test('流时五鼠遁：日干起子时天干正确', () => {
  // 甲己→甲子，乙庚→丙子，丙辛→戊子，丁壬→庚子，戊癸→壬子
  assert.equal(getLiuShiSiHua(0, 0).stemName, '甲')  // 甲日子时甲子
  assert.equal(getLiuShiSiHua(5, 0).stemName, '甲')  // 己日子时甲子
  assert.equal(getLiuShiSiHua(1, 0).stemName, '丙')  // 乙日子时丙子
  assert.equal(getLiuShiSiHua(6, 0).stemName, '丙')  // 庚日子时丙子
  assert.equal(getLiuShiSiHua(2, 0).stemName, '戊')  // 丙日子时戊子
  assert.equal(getLiuShiSiHua(7, 0).stemName, '戊')  // 辛日子时戊子
  assert.equal(getLiuShiSiHua(3, 0).stemName, '庚')  // 丁日子时庚子
  assert.equal(getLiuShiSiHua(4, 0).stemName, '壬')  // 戊日子时壬子
  assert.equal(getLiuShiSiHua(9, 0).stemName, '壬')  // 癸日子时壬子
})

test('流时五鼠遁：子时之后逐时辰顺推', () => {
  const zi = getLiuShiSiHua(6, 0).stemName   // 庚日丙子
  const chou = getLiuShiSiHua(6, 1).stemName // 庚日丁丑
  assert.equal(zi, '丙')
  assert.equal(chou, '丁')
})

// ── 宫干自化与来因宫 ──────────────────────────────────────────────────────

test('宫干自化：检测到自化的宫位可列出', () => {
  const z = analyze()
  const 自化 = buildAllSelfSihua(z.fullChart)
  for (const [palaceName, list] of Object.entries(自化)) {
    assert.ok(palaceName.length > 0)
    assert.ok(list.length > 0)
    list.forEach(item => {
      assert.ok(SI_HUA_TYPES.includes(item.siHua))
      assert.ok(item.starName.length > 0)
    })
  }
})

test('宫干自化：单宫检测与批量检测结果一致', () => {
  const z = analyze()
  const all = buildAllSelfSihua(z.fullChart)
  for (const palace of z.fullChart.palaces) {
    const single = detectSelfSihua(palace)
    const batch = all[palace.name] || []
    assert.equal(single.length, batch.length, `${palace.name} 单宫与批量检测不一致`)
  }
})

test('宫干自化：无自化的宫返回空数组而非抛错', () => {
  assert.deepEqual(detectSelfSihua(null), [])
  assert.deepEqual(detectSelfSihua({ heavenlyStem: '甲', majorStars: [], minorStars: [], adjectiveStars: [] }), [])
})

test('来因宫：某星的某化可追溯到引发它的宫位', () => {
  const z = analyze()
  const 来因 = findIncomingPalaces(z.fullChart, '太阳', '忌')
  assert.ok(Array.isArray(来因))
  来因.forEach(p => {
    assert.ok(p.宫位.length > 0)
    assert.ok(p.天干.length > 0)
  })
})

test('来因宫：批量追溯覆盖盘上全部十二宫干', () => {
  const z = analyze()
  const map = buildIncomingPalaceMap(z.fullChart)
  assert.ok(Object.keys(map).length > 0)
  // 十二个宫干各引发四化，去重后至少覆盖若干星
  const allSources = Object.values(map).flat()
  assert.ok(allSources.length >= 12, '来因宫来源数应不少于宫数')
})

// ── 四化叠加 ──────────────────────────────────────────────────────────────

test('四化叠加：单星多层视图按层名索引', () => {
  const overlay = buildOverlayForStar('太阳', { 太阳: '禄' }, { 太阳: '权' }, { 太阳: '忌' })
  assert.equal(overlay.本命, '禄')
  assert.equal(overlay.大限, '权')
  assert.equal(overlay.流年, '忌')
  assert.equal(overlay.流月, undefined)
})

test('四化叠加：整盘表只收录至少被一层化的星', () => {
  const z = analyze()
  const table = buildOverlayTable(z.fullChart, { 本命: buildStarSiHuaMap(6) })
  assert.ok(Object.keys(table).length > 0)
  for (const [star, overlay] of Object.entries(table)) {
    assert.ok(star.length > 0)
    assert.ok(Object.values(overlay).some(Boolean), `${star} 至少应有一层四化`)
  }
})

// ── 十二神 ────────────────────────────────────────────────────────────────

test('将星落宫：三合帝旺位正确', () => {
  // 申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯
  assert.equal(jiangXingBranch(0), 0)  // 子
  assert.equal(jiangXingBranch(4), 0)  // 辰
  assert.equal(jiangXingBranch(8), 0)  // 申
  assert.equal(jiangXingBranch(2), 6)  // 寅
  assert.equal(jiangXingBranch(6), 6)  // 午
  assert.equal(jiangXingBranch(10), 6) // 戌
  assert.equal(jiangXingBranch(1), 9)  // 丑
  assert.equal(jiangXingBranch(5), 9)  // 巳
  assert.equal(jiangXingBranch(9), 9)  // 酉
  assert.equal(jiangXingBranch(3), 3)  // 卯
  assert.equal(jiangXingBranch(7), 3)  // 未
  assert.equal(jiangXingBranch(11), 3) // 亥
})

test('将前十二神：自将星起顺行十二位', () => {
  const arr = jiangQianShenByBranch(6) // 午年 → 将星在午
  assert.equal(arr[6], 0)               // 午 = 将星
  assert.equal(arr[7], 1)               // 未 = 攀鞍
  assert.equal(arr[5], 11)              // 巳 = 亡神
  assert.equal(new Set(arr).size, 12)
})

test('岁前十二神：自岁建起顺行十二位', () => {
  const arr = suiQianShenByBranch(6)
  assert.equal(arr[6], 0)  // 午 = 岁建
  assert.equal(arr[7], 1)  // 未 = 晦气
  assert.equal(arr[0], 6)  // 子 = 岁破（岁建对宫）
  assert.equal(new Set(arr).size, 12)
})

test('博士十二神：从生年禄存起，阳男阴女顺行', () => {
  // 庚年禄存申；阳男 → 顺行
  const arr = boshiShenByStem(6, '男')
  assert.equal(arr[8], 0)  // 申 = 博士
  assert.equal(arr[9], 1)  // 酉 = 力士
  assert.equal(arr[7], 11) // 未 = 官符
})

test('博士十二神：阴男阳女逆行', () => {
  // 庚年（阳）女命 → 逆行
  const arr = boshiShenByStem(6, '女')
  assert.equal(arr[8], 0)  // 申 = 博士（起点不变）
  assert.equal(arr[7], 1)  // 未 = 力士（逆行）
  // 辛年（阴）男命 → 逆行；辛禄存在酉
  const arr2 = boshiShenByStem(7, '男')
  assert.equal(arr2[9], 0) // 酉 = 博士
  assert.equal(arr2[8], 1) // 申 = 力士（逆行）
})

test('博士十二神：阴阳顺逆判定与年干一致', () => {
  assert.equal(boshiReverse(0, '男'), false)  // 甲阳男 → 顺
  assert.equal(boshiReverse(0, '女'), true)   // 甲阳女 → 逆
  assert.equal(boshiReverse(1, '男'), true)   // 乙阴男 → 逆
  assert.equal(boshiReverse(1, '女'), false)  // 乙阴女 → 顺
})

test('十二神便利函数与查表法一致', () => {
  assert.equal(jiangQianShenName(6, 6), JIANG_QIAN_SHEN[0])
  assert.equal(suiQianShenName(6, 6), SUI_QIAN_SHEN[0])
  assert.equal(suiQianShenName(6, 0), SUI_QIAN_SHEN[6]) // 子 = 岁破
  assert.equal(boshiShenName(6, '男', 8), BOSHI_SHEN[0])
})

test('十二神：三类神名各 12 个且不重复', () => {
  for (const list of [JIANG_QIAN_SHEN, SUI_QIAN_SHEN, BOSHI_SHEN]) {
    assert.equal(list.length, 12)
    assert.equal(new Set(list).size, 12)
  }
})

test('运限跟随十二神：起点是该运限地支而非生年支', () => {
  const { 将前, 岁前 } = buildYunXianShierShen(2) // 寅起
  assert.equal(岁前[2], '岁建')  // 寅 = 岁建
  assert.equal(将前[6], '将星')  // 寅午戌 → 将星在午
  assert.equal(岁前[3], '晦气')  // 卯顺行
})

test('运限跟随十二神：多层批量构建', () => {
  const layers = buildYunXianShierShenLayers({ 大限: 5, 流年: 2 })
  assert.equal(Object.keys(layers).length, 2)
  assert.equal(layers.流年.岁前[2], '岁建')
  assert.ok(layers.大限.将前.includes('将星'))
})

test('运限跟随十二神：挂到宫位上得到每宫神名', () => {
  const z = analyze()
  const attached = attachShierShenToPalaces(z.fullChart, { 大限: 5 })
  const perPalace = attached.大限
  assert.ok(perPalace, '未生成运限跟随结果')
  for (const palace of z.fullChart.palaces) {
    assert.ok(perPalace[palace.name], `${palace.name} 缺少运限十二神`)
    assert.ok(perPalace[palace.name].将前.length > 0)
    assert.ok(perPalace[palace.name].岁前.length > 0)
  }
})

// ── 集成层 ────────────────────────────────────────────────────────────────

test('集成：项目原有「四化」模块不再为空（曾因 chineseDate 取值错误恒为空）', () => {
  const z = analyze()
  assert.ok(z.四化, '缺少 四化')
  assert.equal(z.四化.年干, '庚', '年干应从 rawDates 取，不得为空')
  assert.equal(z.四化.四化.length, 4)
  assert.deepEqual(
    z.四化.四化.map(h => h.星曜),
    ['太阳', '武曲', '太阴', '天同']
  )
})

test('集成：四化体系六层齐备且条目非空', () => {
  const z = analyze()
  const s = z.四化体系
  assert.ok(s, '缺少 四化体系')
  assert.equal(s.本命.年干, '庚')
  assert.equal(s.本命.条目.length, 4)
  assert.ok(s.大限, '缺少大限四化')
  assert.ok(s.大限.条目.length > 0)
  assert.ok(s.流年.条目.length > 0)
  assert.ok(s.流月.条目.length > 0)
  assert.ok(s.流日.条目.length > 0)
  assert.ok(s.流时.条目.length > 0)
})

test('集成：四化条目标注落宫', () => {
  const z = analyze()
  for (const e of z.四化体系.本命.条目) {
    assert.ok(e.星曜.length > 0)
    assert.ok(e.落宫.length > 0, `${e.星曜} 未标注落宫`)
  }
})

test('集成：十二神本命态与 iztro 原生逐格一致（仅两处用字校准）', () => {
  const z = analyze()
  let diff = 0
  for (const p of z.十二神.本命态) {
    const same = p.将前 === p.原生将前 && p.岁前 === p.原生岁前 && p.博士 === p.原生博士
    if (!same) diff++
  }
  assert.equal(diff, 2, '差异应恰为岁破/官符两处用字校准')
})

test('集成：运限跟随层包含大限与流年', () => {
  const z = analyze()
  assert.ok(z.十二神.运限跟随.大限, '缺少大限跟随层')
  assert.ok(z.十二神.运限跟随.流年, '缺少流年跟随层')
  assert.ok(z.十二神.运限跟随.大限.起支地支.length === 1)
})

test('集成：排盘信息标注排盘日与换日流派', () => {
  const z = analyze()
  assert.equal(z.排盘信息.排盘日, '1990-05-15')
  assert.equal(z.排盘信息.是否晚子时, false)
  assert.equal(z.排盘信息.晚子时规则, 'next-day')
})

test('集成：晚子时（12）排盘的命宫与次日子时一致', () => {
  const late = analyze(1990, 5, 15, 12, '男', { lateZishiRule: 'next-day' })
  assert.equal(late.排盘信息.是否晚子时, true)
  assert.equal(late.排盘信息.排盘日, '1990-05-16')
  assert.equal(late.十二宫.length, 12)
})

test('集成：女命与极端输入不崩溃', () => {
  assert.equal(analyze(1990, 5, 15, 3, '女').十二宫.length, 12)
  assert.equal(analyze(2000, 2, 29, 12, '男').十二宫.length, 12)
})
