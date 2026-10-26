/**
 * 觉醒测评测试
 *
 * 覆盖：五维打分、层级映射、命格课题解析与归并、报告生成与对照
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  AWAKENING_DIMENSIONS,
  MAX_SCORE,
  scoreAwakening,
  resolvePatternGuide,
  buildAwakeningReport,
} from '../src/core/awakening.js'

const all = (score) => {
  const a = {}
  for (const d of AWAKENING_DIMENSIONS) {
    const idx = d.statements.findIndex(s => s.score === score)
    a[d.key] = idx >= 0 ? idx : 0
  }
  return a
}

test('五个维度、每维四个选项', () => {
  assert.equal(AWAKENING_DIMENSIONS.length, 5)
  for (const d of AWAKENING_DIMENSIONS) {
    assert.equal(d.statements.length, 4)
    assert.deepEqual(d.statements.map(s => s.score), [0, 1, 2, 3])
  }
  assert.equal(MAX_SCORE, 15)
})

test('全选最高得满分与 L5 超越层', () => {
  const r = scoreAwakening(all(3))
  assert.equal(r.total, 15)
  assert.equal(r.level, 'L5')
  assert.equal(r.levelName, '超越层')
  assert.equal(r.complete, true)
  assert.equal(r.index, 5)
})

test('全选最低得 0 分与 L1 执行层', () => {
  const r = scoreAwakening(all(0))
  assert.equal(r.total, 0)
  assert.equal(r.level, 'L1')
  assert.equal(r.index, 1)
})

test('层级随分数单调上升', () => {
  const levels = [0, 1, 2, 3].map(s => scoreAwakening(all(s)).level)
  assert.deepEqual(levels, ['L1', 'L2', 'L3', 'L5'])
  // L4 需要混合作答才可达（13 分：三维满分 + 两维 2 分）
  const mixed = { 觉察: 3, 边界: 3, 延迟: 3, 承担: 2, 长期: 2 }
  assert.equal(scoreAwakening(mixed).total, 13)
  assert.equal(scoreAwakening(mixed).level, 'L4')
})

test('未答满时标记为未完成', () => {
  const r = scoreAwakening({ 觉察: 2, 边界: 2 })
  assert.equal(r.complete, false)
  assert.equal(r.answeredCount, 2)
  assert.equal(r.dimensionTotal, 5)
})

test('找出最短板与最长板', () => {
  const r = scoreAwakening({ 觉察: 3, 边界: 3, 延迟: 0, 承担: 1, 长期: 2 })
  assert.equal(r.weakest.key, '延迟')
  assert.equal(r.strongest.key, '觉察')
})

test('八个正格精确命中各自课题', () => {
  const 八格 = ['正官格', '七杀格', '正财格', '偏财格', '食神格', '伤官格', '正印格', '偏印格']
  for (const g of 八格) {
    const guide = resolvePatternGuide(g)
    assert.equal(guide.命格, g)
    assert.equal(guide.匹配方式, '精确')
    assert.ok(guide.核心课题.length > 10, `${g} 核心课题过短`)
    assert.ok(guide.盲区.length > 5)
    assert.ok(guide.觉醒标志.length >= 3, `${g} 觉醒标志不足 3 条`)
    assert.ok(guide.注意事项.length >= 3, `${g} 注意事项不足 3 条`)
    assert.ok(guide.关系表现.length > 5)
    assert.ok(guide.日常练习.length >= 2)
    assert.ok(guide.大忌.length > 5)
  }
})

test('特殊格局归并到对应类别', () => {
  assert.equal(resolvePatternGuide('杂气财格').命格, '杂气格')
  assert.equal(resolvePatternGuide('从财格').命格, '从格')
  assert.equal(resolvePatternGuide('曲直').命格, '专旺格')
  assert.equal(resolvePatternGuide('火局').命格, '气局格')
  assert.equal(resolvePatternGuide('建禄格').命格, '建禄格')
})

test('未收录的格局回落到十神兜底而非报错', () => {
  const g = resolvePatternGuide('某某奇格')
  assert.ok(g.核心课题)
  assert.equal(g.匹配方式, '通用兜底')
})

test('报告含命格课题、行动清单与焦点建议', () => {
  const rep = buildAwakeningReport({
    answers: { 觉察: 3, 边界: 3, 延迟: 0, 承担: 1, 长期: 2 },
    patternName: '七杀格',
    derivedLevel: 2.2,
    derivedLevelName: '协调层',
  })
  assert.equal(rep.命格, '七杀格')
  assert.ok(rep.actions.length >= 5, '行动清单应含练习与注意事项')
  assert.ok(rep.actions.some(a => a.类型 === '练习'))
  assert.ok(rep.actions.some(a => a.类型 === '注意'))
  assert.ok(rep.建议聚焦.includes('延迟'), '焦点建议应指出最短板维度')
})

test('自评高于推演与低于推演给出不同判断', () => {
  const high = buildAwakeningReport({
    answers: all(3), patternName: '正官格', derivedLevel: 2.2, derivedLevelName: '协调层',
  })
  const low = buildAwakeningReport({
    answers: all(0), patternName: '正官格', derivedLevel: 4.5, derivedLevelName: '整合层',
  })
  assert.ok(high.对照.差值 > 0)
  assert.ok(low.对照.差值 < 0)
  assert.notEqual(high.对照.判断, low.对照.判断)
})

test('无推演层级时不做对照', () => {
  const rep = buildAwakeningReport({ answers: all(2), patternName: '正官格' })
  assert.equal(rep.对照, null)
})

test('空输入不崩溃', () => {
  const r = scoreAwakening({})
  assert.equal(r.total, 0)
  assert.equal(r.complete, false)
  const rep = buildAwakeningReport({})
  assert.ok(rep.核心课题)
})
