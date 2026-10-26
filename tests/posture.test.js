/**
 * 影响立场分析测试
 *
 * 核心模型：
 *   对我的影响   = mass × multiplier        (mult = 觉醒层级的「事件影响倍率」)
 *   我对它的影响 = mass × (2 - multiplier)  (L3 时 multiplier=1，两者相等 = 平衡点)
 *   立场差       = outgoing - incoming
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { analyzeInfluencePosture } from '../src/core/posture.js'

const rel = (type, name, extra = {}) => ({
  type, name, quality: 0.8, startAge: 25, status: 'active', ...extra,
})

test('L3 创新层是平衡点：进出一致', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('配偶', '妻子')],
    currentAge: 36,
    awakenLevel: 2.5,
  })
  assert.equal(a.觉醒层级.key, 'L3')
  assert.equal(a.觉醒层级.multiplier, 1.0)
  assert.equal(a.关系明细[0].incoming, a.关系明细[0].outgoing)
  assert.equal(a.关系明细[0].postureGap, 0)
  assert.equal(a.关系明细[0].posture, '相互平衡')
})

test('低觉醒被牵引，高觉醒主导', () => {
  const r = [rel('配偶', '妻子')]
  const low = analyzeInfluencePosture({ relationships: r, currentAge: 36, awakenLevel: 1.1 })
  const high = analyzeInfluencePosture({ relationships: r, currentAge: 36, awakenLevel: 4.8 })

  assert.equal(low.立场, '易受影响')
  assert.ok(low.净立场差 < 0, 'L1 的净立场差应为负')
  assert.ok(low.关系明细[0].incoming > low.关系明细[0].outgoing)

  assert.equal(high.立场, '主导他人')
  assert.ok(high.净立场差 > 0, 'L5 的净立场差应为正')
  assert.ok(high.关系明细[0].outgoing > high.关系明细[0].incoming)
})

test('影响力随觉醒度单调反向', () => {
  const r = [rel('配偶', '妻子')]
  const incoming = [1, 2, 3, 4, 5].map(l =>
    analyzeInfluencePosture({ relationships: r, currentAge: 36, awakenLevel: l }).关系明细[0].incoming)
  for (let i = 1; i < incoming.length; i++) {
    assert.ok(incoming[i] < incoming[i - 1], '对我的影响应随觉醒度递减')
  }
})

test('觉醒对照给出 L1–L5 五档，并标出当前档', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('配偶', '妻子')],
    currentAge: 36,
    awakenLevel: 2.5,
  })
  assert.equal(a.觉醒对照.length, 5)
  assert.deepEqual(a.觉醒对照.map(x => x.key), ['L1', 'L2', 'L3', 'L4', 'L5'])
  const l3 = a.觉醒对照.find(x => x.key === 'L3')
  assert.equal(l3.净立场差, 0, 'L3 的净立场差应为 0')
})

test('按类型聚合：谁对我影响大 / 我对谁影响大', () => {
  const a = analyzeInfluencePosture({
    relationships: [
      rel('配偶', '妻子', { quality: 0.9 }),
      rel('贵人', '张总', { quality: 0.8, startAge: 28 }),
      rel('子女', '长子', { quality: 0.85, startAge: 30 }),
    ],
    currentAge: 36,
    awakenLevel: 2.5,
  })
  assert.ok(a.对我影响最大.length > 0)
  assert.ok(a.我影响最大.length > 0)
  // 配偶质量最高，应排在最前
  assert.equal(a.对我影响最大[0].类型, '配偶')
  assert.ok(a.对我影响最大[0].影响 >= a.对我影响最大[1].影响, '应按影响强度降序')
  assert.ok(a.对我影响最大[0].占比 > 0 && a.对我影响最大[0].占比 <= 100)
})

test('关系质量越高影响越大', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('贵人', '甲', { quality: 0.3 }), rel('贵人', '乙', { quality: 1.0 })],
    currentAge: 36,
    awakenLevel: 2.5,
  })
  const byName = Object.fromEntries(a.关系明细.map(r => [r.名称, r]))
  assert.ok(byName['乙'].incoming > byName['甲'].incoming)
})

test('父母关系随年龄衰减', () => {
  const young = analyzeInfluencePosture({
    relationships: [rel('父母', '父母', { quality: 1, startAge: 0 })], currentAge: 20, awakenLevel: 2.5,
  })
  const old = analyzeInfluencePosture({
    relationships: [rel('父母', '父母', { quality: 1, startAge: 0 })], currentAge: 60, awakenLevel: 2.5,
  })
  assert.ok(old.关系明细[0].mass < young.关系明细[0].mass, '父母关系质量应随年龄衰减')
})

test('仇人产生负向作用', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('仇人', '对手', { quality: 1 })], currentAge: 36, awakenLevel: 2.5,
  })
  assert.ok(a.关系明细[0].mass < 0, '仇人的质量应为负')
  assert.ok(a.关系明细[0].incoming < 0)
})

test('空关系集不崩溃，且仍给出觉醒基线', () => {
  const a = analyzeInfluencePosture({ relationships: [], currentAge: 36, awakenLevel: 2.5 })
  assert.equal(a.关系明细.length, 0)
  assert.equal(a.净立场差, 0)
  assert.equal(a.觉醒对照.length, 5)
  assert.ok(a.结论 && a.结论.length > 0, '空集也应给出结论')
})

test('未知关系类型被安全忽略', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('不存在的类型', '某人')], currentAge: 36, awakenLevel: 2.5,
  })
  assert.ok(Array.isArray(a.关系明细))
})

test('建议为非空数组', () => {
  const a = analyzeInfluencePosture({
    relationships: [rel('配偶', '妻子')], currentAge: 36, awakenLevel: 1.1,
  })
  assert.ok(Array.isArray(a.建议))
  assert.ok(a.建议.length >= 1)
})
