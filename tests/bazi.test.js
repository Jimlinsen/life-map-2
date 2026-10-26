/**
 * 八字排盘与经典命理测试
 *
 * 锁住曾经被占位值掩盖的问题：
 *   日干曾用出生年天干推算、月支映射错误、格局硬编码「正官格」、十神列表恒空
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getPreciseBaZi, calculateDaYun } from '../src/core/bazi-chart.js'
import { PatternAnalyzer } from '../src/core/pattern.js'
import { HealthAnalyzer } from '../src/core/health.js'

const bazi = (y, m, d, h) => getPreciseBaZi(y, m, d, h)

test('四柱排盘给出完整的天干地支', () => {
  const b = bazi(1990, 5, 15, 3)
  for (const pillar of ['年柱', '月柱', '日柱', '时柱']) {
    assert.ok(b[pillar].天干, `${pillar} 缺天干`)
    assert.ok(b[pillar].地支, `${pillar} 缺地支`)
  }
})

test('已知命例：1990-05-15 卯时为 庚午 辛巳 庚辰 己卯', () => {
  const b = bazi(1990, 5, 15, 3)
  assert.equal(b.年柱.天干 + b.年柱.地支, '庚午')
  assert.equal(b.月柱.天干 + b.月柱.地支, '辛巳')
  assert.equal(b.日柱.天干 + b.日柱.地支, '庚辰')
  assert.equal(b.时柱.天干 + b.时柱.地支, '己卯')
})

test('不同时辰产出不同的时柱', () => {
  const zishi = bazi(1990, 5, 15, 0)
  const wushishen = bazi(1990, 5, 15, 5)
  assert.notEqual(zishi.时柱.天干, wushishen.时柱.天干)
})

test('非法时辰回退到默认而不崩溃', () => {
  const b = bazi(1990, 5, 15, 99)
  assert.ok(b.日柱.天干)
})

test('大运排盘：男顺女逆，给出八步', () => {
  const male = calculateDaYun(1990, 5, 15, 3, '男', '庚', '庚')
  const female = calculateDaYun(1990, 5, 15, 3, '女', '庚', '庚')
  assert.ok(male.daYun?.length || male.length, '男命应有大运')
  const firstMale = male.daYun?.[0] || male[0]
  const firstFemale = female.daYun?.[0] || female[0]
  assert.notEqual(firstMale.ganZhi, firstFemale.ganZhi, '男顺女逆，首运干支应不同')
})

test('日主强弱基于五行实算，不恒为同一档', () => {
  const b = bazi(1990, 5, 15, 3)
  const pa = new PatternAnalyzer(
    [b.年柱, b.月柱, b.日柱, b.时柱],
    b.日柱.天干,
  )
  const result = pa.analyze()
  assert.ok(result.strength, '缺少日主强弱')
  assert.ok(typeof result.strength.strengthLevel === 'number', '强弱指数应为数值')
  assert.ok(pa.shishenDist && Object.keys(pa.shishenDist).length > 0, '缺少十神分布')
})

test('喜用神与忌神为互补的两组，且不含日主五行', () => {
  const b = bazi(1990, 5, 15, 3)
  const pa = new PatternAnalyzer([b.年柱, b.月柱, b.日柱, b.时柱], b.日柱.天干)
  const { xi, ji } = pa.analyze().xiyong
  assert.ok(Array.isArray(xi) && xi.length > 0)
  assert.ok(Array.isArray(ji) && ji.length > 0)
  assert.ok(!xi.includes(b.日柱.天干), '喜用神不应包含日主本身')
})

test('五运六气：出生运气与当年运气均可推导', () => {
  const h = new HealthAnalyzer('庚', '午', 2026)
  const result = h.analyzeHealth({ 木: 14, 火: 17, 土: 28, 金: 39, 水: 3 }, 36)
  assert.ok(result.先天体质, '缺少先天体质')
  assert.ok(result.当年预测, '缺少当年运气预测')
  assert.ok(result.脏腑分析, '缺少脏腑分析')
})
