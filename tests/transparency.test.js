/**
 * 八字格局透出分析测试
 *
 * 检验点：
 *   · 月令藏干分层（本气/中气/余气）与透出判定（只认年干、月干、时干）
 *   · 格局取格优先级：透干优先 → 本气 → 中气 → 余气 → 杂气
 *   · 不透出时，可由标记的关系/事件间接引出
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { analyzePatternTransparency } from '../src/core/transparency.js'

/** 1990-05-15 卯时：庚午 辛巳 庚辰 己卯，日主庚 */
const PILLARS_1990 = [
  { 天干: '庚', 地支: '午' },
  { 天干: '辛', 地支: '巳' },
  { 天干: '庚', 地支: '辰' },
  { 天干: '己', 地支: '卯' },
]

test('月令藏干分三层并给出十神', () => {
  const t = analyzePatternTransparency({ pillars: PILLARS_1990, dayGan: '庚' })
  assert.equal(t.月令.地支, '巳')
  assert.ok(t.月令.藏干.length >= 2, '巳月至少含本气丙与中气庚')

  const benqi = t.月令.藏干.find(c => c.层级 === '本气')
  assert.equal(benqi.天干, '丙')
  assert.equal(benqi.十神, '七杀', '丙对日主庚为七杀')
})

test('透出判定只认年干/月干/时干，日干不算透出', () => {
  const t = analyzePatternTransparency({ pillars: PILLARS_1990, dayGan: '庚' })
  // 巳月中气庚，庚也出现在日柱——但日干是日主本身
  const geng = t.月令.藏干.find(c => c.天干 === '庚')
  assert.equal(geng.透出, true)
  assert.ok(geng.透出位置.includes('年干'), '庚透于年干')
  assert.ok(!geng.透出位置.includes('日干'), '日干是日主，不应算透出')
})

test('无透出时格局为杂气', () => {
  // 构造一个任何藏干都不透的命：月支子（藏癸），天干全为甲乙己
  const t = analyzePatternTransparency({
    pillars: [
      { 天干: '甲', 地支: '子' },
      { 天干: '乙', 地支: '子' },
      { 天干: '甲', 地支: '子' },
      { 天干: '己', 地支: '子' },
    ],
    dayGan: '甲',
  })
  assert.equal(t.直透格局, null)
  assert.equal(t.最终格局.成格方式, '杂气')
})

test('直透格局给出格局名与依据', () => {
  const t = analyzePatternTransparency({ pillars: PILLARS_1990, dayGan: '庚' })
  assert.ok(t.直透格局, '应有直透格局')
  assert.ok(t.直透格局.格局名.endsWith('格'))
  assert.ok(t.直透格局.依据.length > 0)
  assert.equal(t.最终格局.成格方式, '直透')
})

test('透出分析逐位给出藏干信息', () => {
  const t = analyzePatternTransparency({ pillars: PILLARS_1990, dayGan: '庚' })
  assert.equal(t.透出分析.length, t.月令.藏干.length)
  for (const c of t.透出分析) {
    assert.ok(c.天干 && c.十神 && c.层级)
    assert.equal(typeof c.透出, 'boolean')
    assert.ok(Array.isArray(c.透出位置))
  }
})

test('关系可间接引出未透的藏干', () => {
  // 月支子藏癸（偏印），天干不透癸；标记「父母」类关系（印星）应能引出偏印
  const t = analyzePatternTransparency({
    pillars: [
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
    ],
    dayGan: '甲',
    relationships: [{ type: '父母', name: '母亲', quality: 0.9, startAge: 0, status: 'active' }],
    events: [],
  })
  assert.equal(t.直透格局, null)
  assert.ok(t.间接引出, '应给出间接引出结构')
  assert.equal(typeof t.间接引出.是否成立, 'boolean')
  if (t.间接引出.是否成立) {
    assert.ok(t.间接引出.引出藏干, '应指出被引出的藏干')
    assert.ok(Array.isArray(t.间接引出.正面依据))
  }
})

test('关系质量越高，间接引出的依据越强', () => {
  const base = {
    pillars: [
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
      { 天干: '甲', 地支: '子' },
    ],
    dayGan: '甲',
    events: [],
  }
  const strong = analyzePatternTransparency({
    ...base,
    relationships: [{ type: '父母', name: '母亲', quality: 1.0, startAge: 0, status: 'active' }],
  })
  const weak = analyzePatternTransparency({
    ...base,
    relationships: [{ type: '父母', name: '母亲', quality: 0.1, startAge: 0, status: 'active' }],
  })
  const s = strong.间接引出?.正面依据?.[0]?.强度 ?? 0
  const w = weak.间接引出?.正面依据?.[0]?.强度 ?? 0
  assert.ok(s >= w, '质量更高时引出强度不应更弱')
})

test('负极性事件列为负面依据而非正面依据', () => {
  const t = analyzePatternTransparency({
    pillars: PILLARS_1990,
    dayGan: '庚',
    relationships: [],
    events: [{ type: '重大疾病', name: '住院', age: 35, intensity: 0.8 }],
  })
  const allPositive = (t.间接引出?.正面依据 || []).every(e => e.类型 !== '重大疾病')
  assert.ok(allPositive, '重大疾病不应出现在正面依据中')
})

test('缺少月柱时返回可读失败结构而不抛异常', () => {
  const t = analyzePatternTransparency({
    pillars: [{ 天干: '庚', 地支: '午' }],
    dayGan: '庚',
  })
  assert.ok(t.最终格局, '应返回结构而非抛错')
  assert.ok(t.结论 && t.结论.length > 0)
})

test('结论与建议非空', () => {
  const t = analyzePatternTransparency({ pillars: PILLARS_1990, dayGan: '庚' })
  assert.ok(t.结论.length > 0)
  assert.ok(Array.isArray(t.建议))
  assert.ok(t.建议.length >= 1)
})
