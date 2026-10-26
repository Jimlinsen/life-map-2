/**
 * 双引擎一致性测试
 *
 * 项目里并存两套命理实现：
 *   · life_map_5.js          —— 独立引擎（generateLifeMap5），龙穴砂水 + 经典命理
 *   · src/core/**            —— 应用引擎（React 应用实际使用）
 *
 * 用户选择「两套都保留，补一致性测试锁定差异」，因此本文件既断言
 * 「必须一致的公共口径」，也显式记录「已知且有意保留的差异」。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  LIFE_EVENT_SYSTEM,
  AWAKENING_LEVELS as LIB_AWAKENING,
  generateLifeMap5,
} from '../life_map_5.js'
import { EVENT_TYPES, RELATIONSHIP_TYPES } from '../src/core/constants/events.js'
import { AWAKENING_LEVELS as APP_AWAKENING } from '../src/core/constants/influence.js'
import {
  calculateEventGravity,
  calculateRelationshipGravity,
} from '../src/core/gravity.js'

/* ── 1. 事件质量表：共有类型必须逐字一致 ───────────────────────────────── */

test('事件质量表：两套引擎共有类型完全一致', () => {
  const shared = Object.keys(EVENT_TYPES).filter(t => LIFE_EVENT_SYSTEM.eventTypes[t])
  assert.ok(shared.length >= 15, `共有事件类型过少：${shared.length}`)

  for (const type of shared) {
    const app = EVENT_TYPES[type]
    const lib = LIFE_EVENT_SYSTEM.eventTypes[type]
    assert.equal(app.baseMass, lib.baseMass, `${type} baseMass 不一致`)
    assert.equal(app.duration, lib.duration, `${type} duration 不一致`)
    assert.equal(app.polarity, lib.polarity, `${type} polarity 不一致`)
  }
})

test('事件质量表：lib 独有的两个事件类型在应用中缺席（已知差异）', () => {
  const libOnly = Object.keys(LIFE_EVENT_SYSTEM.eventTypes).filter(t => !EVENT_TYPES[t])
  assert.deepEqual(libOnly.sort(), ['重大决定', '重大背叛'])
})

/* ── 2. 关系类型表 ──────────────────────────────────────────────────────── */

test('关系类型表：质量、衰减参数两套一致', () => {
  for (const type of Object.keys(RELATIONSHIP_TYPES)) {
    const app = RELATIONSHIP_TYPES[type]
    const lib = LIFE_EVENT_SYSTEM.relationshipTypes[type]
    assert.ok(lib, `lib 缺少关系类型 ${type}`)
    assert.equal(app.maxMass, lib.maxMass, `${type} maxMass 不一致`)
    assert.equal(app.decayStart ?? null, lib.decayStart ?? null, `${type} decayStart 不一致`)
    assert.equal(app.decayRate ?? 0, lib.decayRate ?? 0, `${type} decayRate 不一致`)
  }
})

/* ── 3. 事件引力公式 ────────────────────────────────────────────────────── */

test('事件引力：两套引擎对同一事件给出相同数值', () => {
  const events = [
    { type: '婚姻', age: 28, intensity: 1 },
    { type: '事业突破', age: 32, intensity: 0.8 },
    { type: '离婚', age: 35, intensity: 0.6 },
    { type: '重大疾病', age: 40, intensity: 1 },
    { type: '丧亲', age: 20, intensity: 0.5 },
  ]
  const ages = [30, 40, 55, 70]

  for (const ev of events) {
    for (const age of ages) {
      const lib = LIFE_EVENT_SYSTEM.calculateEventGravity(ev, age)
      const app = calculateEventGravity(ev, age)
      assert.equal(
        Number(app.toFixed(6)),
        Number(lib.toFixed(6)),
        `事件 ${ev.type} @${age} 引力不一致：lib=${lib} app=${app}`,
      )
    }
  }
})

test('事件引力：未来事件（age > currentAge）不产生引力', () => {
  assert.equal(calculateEventGravity({ type: '婚姻', age: 50 }, 30), 0)
  assert.equal(LIFE_EVENT_SYSTEM.calculateEventGravity({ type: '婚姻', age: 50 }, 30), 0)
})

/* ── 4. 关系引力公式（含衰减） ──────────────────────────────────────────── */

test('关系引力：两套引擎对同一关系给出相同数值', () => {
  const rels = [
    { type: '父母', quality: 0.9, startAge: 0, status: 'active' },
    { type: '配偶', quality: 0.95, startAge: 25, status: 'active' },
    { type: '子女', quality: 0.8, startAge: 30, status: 'active' },
    { type: '贵人', quality: 0.7, startAge: 28, status: 'active' },
    { type: '仇人', quality: 0.6, startAge: 20, status: 'active' },
    { type: '挚友', quality: 0.5, startAge: 18, status: 'ended' },
  ]
  const ages = [20, 30, 45, 60, 75]

  for (const rel of rels) {
    for (const age of ages) {
      const lib = LIFE_EVENT_SYSTEM.calculateRelationshipGravity(rel, age)
      const app = calculateRelationshipGravity(rel, age)
      assert.equal(
        Number(app.toFixed(6)),
        Number(lib.toFixed(6)),
        `关系 ${rel.type} @${age} 引力不一致：lib=${lib} app=${app}`,
      )
    }
  }
})

test('关系引力：父母关系随年龄衰减，子女关系随年龄增长', () => {
  const parent = { type: '父母', quality: 1, startAge: 0, status: 'active' }
  const child = { type: '子女', quality: 1, startAge: 30, status: 'active' }

  assert.ok(
    calculateRelationshipGravity(parent, 50) < calculateRelationshipGravity(parent, 20),
    '父母关系应随年龄减弱',
  )
  assert.ok(
    calculateRelationshipGravity(child, 60) > calculateRelationshipGravity(child, 35),
    '子女关系应随年龄增强',
  )
})

test('关系引力：仇人产生负引力，ended 关系衰减到 0.3 倍', () => {
  const foe = { type: '仇人', quality: 1, startAge: 20, status: 'active' }
  assert.ok(calculateRelationshipGravity(foe, 30) < 0)

  const active = { type: '配偶', quality: 1, startAge: 25, status: 'active' }
  const ended = { ...active, status: 'ended' }
  const ratio = calculateRelationshipGravity(ended, 30) / calculateRelationshipGravity(active, 30)
  assert.ok(Math.abs(ratio - 0.3) < 1e-6, `ended 系数应为 0.3，实际 ${ratio}`)
})

/* ── 5. 觉醒层级：已知差异显式锁定 ─────────────────────────────────────── */

test('觉醒层级倍率：两套引擎数值不同 —— 记录为已知差异', () => {
  // lib 用 eventMassMultiplier，应用用 multiplier，档位与数值均有差异。
  // 这不是回归，而是被显式锁定的口径差异（应用侧为唯一展示来源）。
  const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5']
  const libMultipliers = LEVELS.map(k => LIB_AWAKENING[k].eventMassMultiplier)
  const appMultipliers = LEVELS.map(k => APP_AWAKENING[k].multiplier)

  assert.equal(libMultipliers.length, 5)
  assert.equal(appMultipliers.length, 5)
  assert.notDeepEqual(libMultipliers, appMultipliers, '若两表已一致，请同步更新此断言与文档')
})

/* ── 6. 引擎可运行且结构完整 ───────────────────────────────────────────── */

test('独立引擎：generateLifeMap5 返回完整结构', () => {
  const map = generateLifeMap5('1990-05-15', 3, '男')
  for (const key of ['meta', 'awakening', 'fengshui', 'lifeInfluence', 'trajectory', 'markers', 'insights']) {
    assert.ok(map[key], `缺少 ${key}`)
  }
  for (const key of ['龙', '穴', '砂', '水']) {
    assert.ok(map.fengshui[key], `缺少 龙穴砂水.${key}`)
  }
})

test('独立引擎：经典命理不再使用占位值', () => {
  const map = generateLifeMap5('1990-05-15', 3, '男')
  const c = map.classicalAnalysis
  assert.equal(c.dayMasterNature.dayGan, '庚', '日干应来自精确排盘')
  assert.notEqual(c.pattern.name, '正官格', '格局不应是硬编码占位')
  assert.ok(c.dayMasterStrength.totalStrength, '日主强弱应有实算结果')
})
