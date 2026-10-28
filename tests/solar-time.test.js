/**
 * 真太阳时 · 晚子时换日 · 时辰索引边界 回归测试
 *
 * 锁住三类曾经静默出错的缺陷：
 *   1. 应用层无法表达 23:00–24:00 出生 → 日柱、时柱、命宫三者全错
 *   2. 日柱在晚子时「进位两次」（排盘日已进位 + lunar-javascript 内部再进位）
 *   3. 真太阳时校正的经度修正方向与均时差符号
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateTrueSolarTime,
  equationOfTimeMinutes,
  branchFromSolarMinutes,
  isLateZishiMinutes,
  hourIndexFromClock,
  resolveDayOffset,
  resolveBirthTime,
  shiftGregorianDate,
  isValidGregorianDate,
  clockToStandardDelta,
  shiftClock,
  formatClock,
  formatSignedMinutes,
  LATE_ZISHI_RULES
} from '../src/core/solar-time.js'
import { getPreciseBaZi, resolveHourIndex } from '../src/core/bazi-chart.js'

// ── 时辰索引边界 ──────────────────────────────────────────────────────────

test('时辰索引：23:30 归子时（0），00:30 亦归子时（0）', () => {
  assert.equal(branchFromSolarMinutes(23 * 60 + 30), 0)
  assert.equal(branchFromSolarMinutes(0 * 60 + 30), 0)
})

test('时辰索引：其余各时辰边界正确', () => {
  assert.equal(branchFromSolarMinutes(1 * 60), 1)   // 01:00 丑
  assert.equal(branchFromSolarMinutes(2 * 60 + 59), 1) // 02:59 丑
  assert.equal(branchFromSolarMinutes(3 * 60), 2)   // 03:00 寅
  assert.equal(branchFromSolarMinutes(11 * 60 + 59), 6) // 11:59 午
  assert.equal(branchFromSolarMinutes(12 * 60), 6)  // 12:00 午
  assert.equal(branchFromSolarMinutes(13 * 60), 7)  // 13:00 未
  assert.equal(branchFromSolarMinutes(22 * 60 + 59), 11) // 22:59 亥
})

test('时辰索引：hourIndexFromClock 与 23 点边界一致', () => {
  assert.equal(hourIndexFromClock(23, 30), 0)
  assert.equal(hourIndexFromClock(0, 30), 0)
  assert.equal(hourIndexFromClock(12, 0), 6)
  assert.equal(hourIndexFromClock(22, 0), 11)
})

test('resolveHourIndex：23 点后返回 12（晚子时），其余 0-11', () => {
  assert.equal(resolveHourIndex(23, 0), 12)
  assert.equal(resolveHourIndex(23, 59), 12)
  assert.equal(resolveHourIndex(22, 59), 11)
  assert.equal(resolveHourIndex(0, 0), 0)
})

test('isLateZishiMinutes：仅 23:00-23:59 为晚子时', () => {
  assert.equal(isLateZishiMinutes(1380), true)
  assert.equal(isLateZishiMinutes(1439), true)
  assert.equal(isLateZishiMinutes(1379), false)
  assert.equal(isLateZishiMinutes(30), false)
})

// ── 均时差 ────────────────────────────────────────────────────────────────

test('均时差：二月初（约 -14 分钟）、十一月初（约 +16 分钟）符号相反', () => {
  const feb = equationOfTimeMinutes(2024, 2, 11, 12, 0)
  const nov = equationOfTimeMinutes(2024, 11, 3, 12, 0)
  assert.ok(feb < 0, `二月初均时差应约为负，实际 ${feb}`)
  assert.ok(nov > 0, `十一月初均时差应约为正，实际 ${nov}`)
})

test('均时差：四季节点绝对值均在 20 分钟以内', () => {
  for (const [m, d] of [[2, 11], [5, 14], [7, 26], [11, 3]]) {
    const eot = Math.abs(equationOfTimeMinutes(2024, m, d, 12, 0))
    assert.ok(eot < 20, `${m}/${d} 均时差 ${eot} 超出合理范围`)
  }
})

test('均时差：非法日期返回 0', () => {
  assert.equal(equationOfTimeMinutes(2024, 2, 30, 12, 0), 0)
  assert.equal(equationOfTimeMinutes(2024, 13, 1, 12, 0), 0)
})

// ── 真太阳时 ──────────────────────────────────────────────────────────────

test('真太阳时：无经度时不校正，时刻原样保留', () => {
  const r = calculateTrueSolarTime({ year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0 })
  assert.equal(r.corrected, false)
  assert.equal(r.totalCorrectionMinutes, 0)
  assert.equal(r.hour, 12)
  assert.equal(r.minute, 0)
})

test('真太阳时：东经 120°（东八区中央经线）校正量为纯均时差', () => {
  const r = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0, longitude: 120
  })
  assert.equal(r.corrected, true)
  assert.equal(r.longitudeCorrectionMinutes, 0)
  assert.ok(Math.abs(r.equationOfTimeMinutes - r.totalCorrectionMinutes) < 1e-9)
})

test('真太阳时：经度修正方向正确（东经每偏离中央经线 1° = 4 分钟）', () => {
  const east = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0, longitude: 130
  })
  const west = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0, longitude: 110
  })
  assert.equal(east.longitudeCorrectionMinutes, 40)  // (130-120)*4
  assert.equal(west.longitudeCorrectionMinutes, -40) // (110-120)*4
})

test('真太阳时：时区中央经线随 utcOffsetMinutes 变化', () => {
  // UTC-5 → 中央经线 -75°
  const r = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0,
    longitude: -75, utcOffsetMinutes: -300
  })
  assert.equal(r.longitudeCorrectionMinutes, 0)
})

test('真太阳时：校正后跨日会给出 dayOffset', () => {
  const r = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 23, clockMinute: 30,
    longitude: 100 // (100-120)*4 = -80 分钟 → 22:10，不跨日
  })
  assert.equal(r.dayOffset, 0)

  const r2 = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 0, clockMinute: 30,
    longitude: 100 // -80 分钟 → 前一日 23:10
  })
  assert.equal(r2.dayOffset, -1)
})

// ── 晚子时换日 ────────────────────────────────────────────────────────────

test('晚子时换日：next-day 使排盘日进位一天', () => {
  const s = resolveBirthTime({
    year: 1990, month: 5, day: 15, clockHour: 23, clockMinute: 30,
    lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY
  })
  assert.equal(s.是否晚子时, true)
  assert.equal(s.排盘日.day, 16)
  assert.equal(s.排盘日偏移, 1)
})

test('晚子时换日：current-day 保持当日', () => {
  const s = resolveBirthTime({
    year: 1990, month: 5, day: 15, clockHour: 23, clockMinute: 30,
    lateZishiRule: LATE_ZISHI_RULES.CURRENT_DAY
  })
  assert.equal(s.是否晚子时, true)
  assert.equal(s.排盘日.day, 15)
  assert.equal(s.排盘日偏移, 0)
})

test('晚子时换日：非晚子时排盘日不变', () => {
  const s = resolveBirthTime({
    year: 1990, month: 5, day: 15, clockHour: 12, clockMinute: 0
  })
  assert.equal(s.是否晚子时, false)
  assert.equal(s.排盘日.day, 15)
  assert.equal(s.排盘日偏移, 0)
})

test('晚子时换日：跨月的排盘日正确进位', () => {
  const s = resolveBirthTime({
    year: 1990, month: 5, day: 31, clockHour: 23, clockMinute: 30,
    lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY
  })
  assert.equal(s.排盘日.month, 6)
  assert.equal(s.排盘日.day, 1)
})

test('resolveDayOffset：真太阳时退到前日且落在晚子时，next-day 抵消为 0', () => {
  const solar = { dayOffset: -1, normalizedMinutes: 23 * 60 + 10, branch: 0, isLateZishi: true }
  assert.equal(resolveDayOffset(solar, LATE_ZISHI_RULES.NEXT_DAY), 0)
  assert.equal(resolveDayOffset(solar, LATE_ZISHI_RULES.CURRENT_DAY), -1)
})

// ── 八字：晚子时日柱与时柱 ────────────────────────────────────────────────

test('八字晚子时：次日换日口径 → 日柱进位、时柱为子时', () => {
  // 1990-05-15 23:30 晚子时，次日换日应为 庚午 辛巳 辛巳 戊子
  const r = getPreciseBaZi(1990, 5, 15, 12, { lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY })
  assert.equal(r.年柱.天干 + r.年柱.地支, '庚午')
  assert.equal(r.月柱.天干 + r.月柱.地支, '辛巳')
  assert.equal(r.日柱.天干 + r.日柱.地支, '辛巳')
  assert.equal(r.时柱.天干 + r.时柱.地支, '戊子')
  assert.equal(r.是否晚子时, true)
  assert.equal(r.排盘日.day, 16)
})

test('八字晚子时：当日不换日口径 → 日柱留在当日', () => {
  const r = getPreciseBaZi(1990, 5, 15, 12, { lateZishiRule: LATE_ZISHI_RULES.CURRENT_DAY })
  assert.equal(r.日柱.天干 + r.日柱.地支, '庚辰')
  assert.equal(r.排盘日.day, 15)
})

test('八字晚子时：日柱不发生二次进位', () => {
  // 1990-05-16 23:30 次日换日 → 05-17 的日柱应为壬午，而非再进位一次
  const r = getPreciseBaZi(1990, 5, 16, 12, { lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY })
  assert.equal(r.日柱.天干 + r.日柱.地支, '壬午')
  assert.equal(r.排盘日.day, 17)
})

test('八字晚子时：精确钟表时刻与时辰索引结果一致', () => {
  const byIndex = getPreciseBaZi(1990, 5, 15, 12, { lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY })
  const byClock = getPreciseBaZi(1990, 5, 15, 12, {
    clockHour: 23, clockMinute: 30, lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY
  })
  assert.equal(byClock.日柱.天干 + byClock.日柱.地支, byIndex.日柱.天干 + byIndex.日柱.地支)
  assert.equal(byClock.时柱.天干 + byClock.时柱.地支, byIndex.时柱.天干 + byIndex.时柱.地支)
})

test('八字：普通时辰不受晚子时改动影响（回归保护）', () => {
  const r = getPreciseBaZi(1990, 5, 15, 3) // 卯时
  assert.equal(r.年柱.天干 + r.年柱.地支, '庚午')
  assert.equal(r.月柱.天干 + r.月柱.地支, '辛巳')
  assert.equal(r.日柱.天干 + r.日柱.地支, '庚辰')
  assert.equal(r.时柱.天干 + r.时柱.地支, '己卯')
  assert.equal(r.是否晚子时, false)
})

test('八字：早子时与次日子时的日柱不同', () => {
  const a = getPreciseBaZi(1990, 5, 15, 0, { clockHour: 0, clockMinute: 30 })
  const b = getPreciseBaZi(1990, 5, 16, 0)
  assert.equal(a.日柱.天干 + a.日柱.地支, '庚辰')
  assert.equal(b.日柱.天干 + b.日柱.地支, '辛巳')
})

test('八字：真太阳时校正使时辰跨界时改变时柱', () => {
  // 1990-05-15 00:30 东经 100° → 真太阳时 -80 分钟 → 前一日 23:10 → 晚子时
  const r = getPreciseBaZi(1990, 5, 15, 0, {
    clockHour: 0, clockMinute: 30, longitude: 100,
    lateZishiRule: LATE_ZISHI_RULES.NEXT_DAY
  })
  assert.equal(r.是否晚子时, true)
  assert.equal(r.时柱.地支, '子')
})

// ── 日期工具 ──────────────────────────────────────────────────────────────

test('日期工具：合法性校验与跨月跨年平移', () => {
  assert.equal(isValidGregorianDate(1990, 5, 15), true)
  assert.equal(isValidGregorianDate(1990, 2, 30), false)
  assert.equal(isValidGregorianDate(1990, 13, 1), false)

  assert.deepEqual(shiftGregorianDate({ year: 1990, month: 5, day: 31 }, 1), { year: 1990, month: 6, day: 1 })
  assert.deepEqual(shiftGregorianDate({ year: 1990, month: 1, day: 1 }, -1), { year: 1989, month: 12, day: 31 })
})

// ── 钟表时间平移（夏令时） ────────────────────────────────────────────────

test('夏令时平移：中国大陆 1986-1991 夏令时（+60）→ 标准时间减 60', () => {
  assert.equal(clockToStandardDelta(540, 480), -60)
  const shifted = shiftClock({ clockHour: '12', clockMinute: '30' }, -60)
  assert.equal(shifted.clockHour, '11')
  assert.equal(shifted.clockMinute, '30')
})

test('夏令时平移：跨日一律返回 null，不替用户改日期', () => {
  assert.equal(shiftClock({ clockHour: '00', clockMinute: '30' }, -60), null)
  assert.equal(shiftClock({ clockHour: '23', clockMinute: '30' }, 60), null)
})

test('夏令时平移：非法输入与零位移返回 null', () => {
  assert.equal(shiftClock({ clockHour: '', clockMinute: '30' }, -60), null)
  assert.equal(shiftClock({ clockHour: 'ab', clockMinute: '30' }, -60), null)
  assert.equal(shiftClock({ clockHour: '12', clockMinute: '30' }, 0), null)
})

test('格式化：HH:MM 补零与带符号分钟', () => {
  assert.equal(formatClock({ clockHour: '8', clockMinute: '5' }), '08:05')
  assert.equal(formatSignedMinutes(40), '+40')
  assert.equal(formatSignedMinutes(-40), '-40')
  assert.equal(formatSignedMinutes(0), '0')
})
