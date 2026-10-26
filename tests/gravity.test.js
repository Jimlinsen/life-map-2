/**
 * 引力场与人生轨迹算法测试
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateEventGravity,
  calculateRelationshipGravity,
  calculateGravityField,
  calculateTrajectory,
} from '../src/core/gravity.js'

test('永久事件随时间缓慢衰减', () => {
  const ev = { type: '婚姻', age: 28, intensity: 1 }
  const near = calculateEventGravity(ev, 30)
  const far = calculateEventGravity(ev, 80)
  assert.ok(near > far, '永久事件的引力应随时间减弱')
  assert.ok(far > 0, '永久事件不应归零')
})

test('限时事件在持续期后快速衰减', () => {
  const ev = { type: '事业突破', age: 30, intensity: 1 }
  assert.ok(Math.abs(calculateEventGravity(ev, 35) - 1.5) < 1e-9, '持续期内引力应为满值')
  assert.ok(calculateEventGravity(ev, 60) < calculateEventGravity(ev, 35))
})

test('负极性事件产生负引力', () => {
  assert.ok(calculateEventGravity({ type: '离婚', age: 30, intensity: 1 }, 40) < 0)
  assert.ok(calculateEventGravity({ type: '丧亲', age: 30, intensity: 1 }, 40) < 0)
})

test('未知事件类型返回 0 而非抛错', () => {
  assert.equal(calculateEventGravity({ type: '不存在', age: 20 }, 30), 0)
  assert.equal(calculateRelationshipGravity({ type: '不存在', quality: 1 }, 30), 0)
})

test('引力场净额 = 正向 - 负向', () => {
  const events = [
    { type: '婚姻', age: 28, intensity: 1 },
    { type: '离婚', age: 35, intensity: 0.8 },
    { type: '事业突破', age: 32, intensity: 0.6 },
  ]
  const relationships = [
    { type: '配偶', quality: 0.9, startAge: 25, status: 'active' },
    { type: '贵人', quality: 0.8, startAge: 30, status: 'active' },
  ]
  const field = calculateGravityField(events, relationships, 40)

  assert.equal(field.details.length, 5)
  assert.ok(Number(field.positive) > 0)
  assert.ok(Number(field.negative) > 0)
  assert.ok(
    Math.abs(Number(field.net) - (Number(field.positive) - Number(field.negative))) < 0.02,
    '净额应约等于正向减负向',
  )
})

test('引力场明细按绝对值降序排列', () => {
  const field = calculateGravityField(
    [{ type: '婚姻', age: 20, intensity: 1 }, { type: '搬迁', age: 20, intensity: 0.2 }],
    [],
    30,
  )
  const mags = field.details.map(d => Math.abs(Number(d.gravity)))
  const sorted = [...mags].sort((a, b) => b - a)
  assert.deepEqual(mags, sorted)
})

test('轨迹得分被夹在 20–95 之间，且包含未来标记', () => {
  const trajectory = calculateTrajectory(1990, 2.5, [], [], null)
  assert.ok(trajectory.length > 0)
  for (const point of trajectory) {
    const score = Number(point.totalScore)
    assert.ok(score >= 20 && score <= 95, `得分越界：${score}`)
  }
  assert.ok(trajectory.some(p => p.isFuture), '应包含未来点')
})

test('觉醒层级越高，轨迹得分整体越高', () => {
  const low = calculateTrajectory(1990, 1, [], [], null)
  const high = calculateTrajectory(1990, 5, [], [], null)
  const sum = arr => arr.reduce((s, p) => s + Number(p.totalScore), 0)
  assert.ok(sum(high) > sum(low), '高觉醒层级应带来更高总分')
})

test('加入正向事件会抬升轨迹得分', () => {
  const before = calculateTrajectory(1990, 2.5, [], [], null)
  const after = calculateTrajectory(1990, 2.5, [{ type: '事业突破', age: 32, intensity: 1 }], [], null)
  const sum = arr => arr.reduce((s, p) => s + Number(p.totalScore), 0)
  assert.ok(sum(after) > sum(before), '正向事件应抬升轨迹')
})

test('空输入不崩溃', () => {
  const field = calculateGravityField([], [], 30)
  assert.equal(field.net, '0.00')
  assert.equal(field.details.length, 0)
})
