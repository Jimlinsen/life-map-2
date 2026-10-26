/**
 * 紫微斗数排盘回归测试
 *
 * 重点锁住两个曾经静默失效的缺陷：
 *   1. iztro 的宫位名不带「宫」字（命宫除外），直接用「官禄宫」查询会返回 undefined
 *   2. horoscope() 只接受日期字符串 / Date，传数字年份会抛 date.split is not a function
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ZiweiAnalyzer } from '../src/core/ziwei.js'

const analyze = (y = 1990, m = 5, d = 15, h = 3, g = '男') =>
  new ZiweiAnalyzer(y, m, d, h, g).analyze()

test('十二宫完整返回 12 宫，无一缺失', () => {
  const z = analyze()
  assert.ok(z.十二宫, '缺少 十二宫')
  assert.equal(z.十二宫.length, 12)
  assert.equal(new Set(z.十二宫.map(p => p.宫位)).size, 12, '宫位名不应重复')
})

test('每宫都带地支与天干（说明宫位查找成功而非 undefined 兜底）', () => {
  const z = analyze()
  for (const p of z.十二宫) {
    assert.ok(p.地支, `${p.宫位} 缺少地支`)
    assert.ok(p.天干, `${p.宫位} 缺少天干`)
  }
})

test('十二宫地支覆盖子丑寅卯辰巳午未申酉戌亥且不重复', () => {
  const z = analyze()
  const branches = z.十二宫.map(p => p.地支).sort()
  assert.deepEqual(branches, ['丑', '子', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].sort())
})

test('当前大限可算出，且含宫位与岁数区间', () => {
  const z = analyze()
  assert.ok(z.当前大限, '缺少 当前大限')
  assert.ok(z.当前大限.宫位, '大限缺少宫位')
  assert.match(z.当前大限.岁数范围, /^\d+-\d+岁$/, '大限岁数区间格式异常')
})

test('流年分析可算出，含四化与宫位解读', () => {
  const analyzer = new ZiweiAnalyzer(1990, 5, 15, 3, '男')
  const liunian = analyzer.analyzeLiunian(new Date().getFullYear())
  assert.ok(liunian, '缺少 流年分析')
  assert.ok(liunian.流年四化?.天干, '流年四化缺失')
  assert.ok(Object.keys(liunian.宫位分析 || {}).length >= 5, '流年宫位分析过少')
})

test('命宫取到真实主星而非兜底值', () => {
  const z = analyze()
  const mingGong = z.十二宫.find(p => p.宫位 === '命宫')
  assert.ok(mingGong)
  assert.ok(mingGong.主星.length > 0, '命宫应有主星')
})

test('女命同样可用（性别映射正确）', () => {
  const z = analyze(1990, 5, 15, 3, '女')
  assert.equal(z.十二宫.length, 12)
  assert.ok(z.当前大限)
})

test('闰日与极端时辰不崩溃', () => {
  assert.equal(analyze(2024, 2, 29, 6, '男').十二宫.length, 12)
  assert.equal(analyze(1990, 12, 31, 11, '女').十二宫.length, 12)
})
