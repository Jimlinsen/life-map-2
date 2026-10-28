#!/usr/bin/env node
/**
 * 命理大师的取数引擎 —— 把人生地图 5.0 的核心算法跑成一份完整的命理档案。
 *
 * 用法：
 *   node scripts/analyze.mjs --date 1990-05-15 --hour 3 --gender 男
 *   node scripts/analyze.mjs --date 1990-05-15 --hour 3 --gender 男 \
 *        --events events.json --relationships relationships.json
 *
 * 参数：
 *   --date          公历出生日期 YYYY-MM-DD（必填）
 *   --hour          时辰索引 0=子时 … 11=亥时，12=晚子时（必填）
 *   --gender        男 / 女（必填）
 *   --clock         精确钟表时间 HH:MM（可选，给了则时辰由时刻推导）
 *   --longitude     出生地经度，东经为正（可选，给了则做真太阳时校正）
 *   --late-zishi    晚子时换日口径 next-day | current-day | day-cur-time-next
 *                   （默认 next-day，主流排盘口径）
 *   --events        事件标记 JSON 文件（可选）
 *   --relationships 关系标记 JSON 文件（可选）
 *   --today         今日日期 YYYY-MM-DD（默认今天，本地时区）
 *
 * 输出：一整份 JSON 档案，含八字、紫微、五运六气、格局透出、大运流年、
 *       影响力分布、觉醒推演与命格课题、每日运势、（若有标记）影响立场。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CORE = resolve(__dirname, '../src/core')

const { getPreciseBaZi, calculateDaYun, analyzeDaYunShishen, analyzeLiuNian, resolveHourIndex } = await import(`${CORE}/bazi-chart.js`)
const { LATE_ZISHI_RULES } = await import(`${CORE}/solar-time.js`)
const { PatternAnalyzer } = await import(`${CORE}/pattern.js`)
const { ZiweiAnalyzer } = await import(`${CORE}/ziwei.js`)
const { HealthAnalyzer } = await import(`${CORE}/health.js`)
const { analyzePatternTransparency } = await import(`${CORE}/transparency.js`)
const { analyzeInfluencePosture } = await import(`${CORE}/posture.js`)
const { resolvePatternGuide } = await import(`${CORE}/awakening.js`)
const { calculateDailyInfo } = await import(`${CORE}/daily.js`)
const { LifeInfluenceAnalyzer, AwakeningAnalyzer } = await import(`${CORE}/influence.js`)
const { LIFE_INFLUENCE_SYSTEM, AWAKENING_LEVELS, PILLAR_NODES } = await import(`${CORE}/constants/influence.js`)
const { EVENT_TYPES, RELATIONSHIP_TYPES } = await import(`${CORE}/constants/events.js`)
const { Solar } = await import('lunar-javascript')

/* ── 参数 ────────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const out = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { out[key] = next; i++ }
      else out[key] = true
    }
  }
  return out
}

const args = parseArgs(process.argv)

if (!args.date || args.hour === undefined || !args.gender) {
  console.error('用法: node scripts/analyze.mjs --date YYYY-MM-DD --hour <0-12> --gender 男|女 [--clock HH:MM] [--longitude 经度] [--late-zishi next-day|current-day|day-cur-time-next] [--events f.json] [--relationships f.json]')
  process.exit(1)
}

const [Y, M, D] = String(args.date).split('-').map(Number)
const gender = String(args.gender)
const today = args.today || (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

/* ── 排盘时间解算 ──────────────────────────────────────────────────────────
 * 精确时刻优先：给了 --clock 则时辰由时刻推导（23:00–24:00 → 晚子时 12），
 * 配合 --longitude 做真太阳时校正，--late-zishi 决定晚子时是否进位到次日。
 */
const lateZishiRule = args['late-zishi'] || LATE_ZISHI_RULES.NEXT_DAY
const preciseOptions = {}
let hour = Number(args.hour)

if (args.clock) {
  const [ch, cm] = String(args.clock).split(':').map(Number)
  if (Number.isFinite(ch)) {
    preciseOptions.clockHour = ch
    preciseOptions.clockMinute = Number.isFinite(cm) ? cm : 0
    const derived = resolveHourIndex(ch, preciseOptions.clockMinute)
    if (derived >= 0) hour = derived
  }
}
if (args.longitude !== undefined && args.longitude !== '') {
  const lon = Number(args.longitude)
  if (Number.isFinite(lon)) preciseOptions.longitude = lon
}
preciseOptions.lateZishiRule = lateZishiRule

const hasPrecise = Object.keys(preciseOptions).length > 0
const chartOptions = hasPrecise ? preciseOptions : {}

const readJson = (p) => {
  if (!p) return []
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return [] }
}
const events = readJson(args.events)
const relationships = readJson(args.relationships)

const currentYear = Number(today.slice(0, 4))
const currentAge = currentYear - Y

/* ── 排盘 ────────────────────────────────────────────────────────────────── */

const bazi = getPreciseBaZi(Y, M, D, hour, chartOptions)
const pillars = [bazi.年柱, bazi.月柱, bazi.日柱, bazi.时柱]
const dayGan = bazi.日柱.天干

const pa = new PatternAnalyzer(pillars, dayGan)
const pattern = pa.analyze()
const transparency = analyzePatternTransparency({ pillars, dayGan, relationships, events })
const guide = resolvePatternGuide(transparency.最终格局?.名称 || pattern.patternName)

const ziweiAnalyzer = new ZiweiAnalyzer(Y, M, D, hour, gender, chartOptions)
const ziwei = ziweiAnalyzer.analyze()

const health = new HealthAnalyzer(bazi.年柱.天干, bazi.年柱.地支, currentYear)
const wuyun = health.analyzeHealth(pa.wuxing, currentAge)

const dayun = calculateDaYun(Y, M, D, hour, gender, bazi.年柱.天干, dayGan)
const dayunList = dayun.daYun || dayun
const currentDayun = dayunList.find(d => currentAge >= d.startAge && currentAge <= d.endAge) || null

const influenceAnalyzer = new LifeInfluenceAnalyzer(pillars, dayGan, currentAge)
const influenceNodes = influenceAnalyzer.nodes
const totalMass = influenceNodes.reduce((s, n) => s + parseFloat(n.最终质量 || 0), 0)

const awakeningRaw = new AwakeningAnalyzer(pattern, pa.shishenDist, pa.wuxing).analyze()
const awakenLevel = parseFloat(awakeningRaw.最终层级)

const daily = calculateDailyInfo(dayGan, today)

const posture = relationships.length
  ? analyzeInfluencePosture({ relationships, currentAge, awakenLevel })
  : null

/* ── 组装档案 ────────────────────────────────────────────────────────────── */

const archive = {
  meta: {
    来源: '人生地图 5.2 引擎（src/core）',
    生成日期: today,
    出生: {
      公历: `${Y}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`,
      时辰索引: hour,
      性别: gender,
      是否晚子时: bazi.是否晚子时,
      排盘日: bazi.排盘日 ? `${bazi.排盘日.year}-${String(bazi.排盘日.month).padStart(2, '0')}-${String(bazi.排盘日.day).padStart(2, '0')}` : null,
      晚子时规则: bazi.晚子时规则,
      钟表时刻: preciseOptions.clockHour !== undefined
        ? `${String(preciseOptions.clockHour).padStart(2, '0')}:${String(preciseOptions.clockMinute).padStart(2, '0')}`
        : null,
      出生地经度: preciseOptions.longitude ?? null,
    },
    当前年龄: currentAge,
  },

  基本盘: {
    四柱: {
      年柱: `${bazi.年柱.天干}${bazi.年柱.地支}`,
      月柱: `${bazi.月柱.天干}${bazi.月柱.地支}`,
      日柱: `${bazi.日柱.天干}${bazi.日柱.地支}`,
      时柱: `${bazi.时柱.天干}${bazi.时柱.地支}`,
    },
    日主: dayGan,
    日主阴阳五行: `${bazi.日柱.天干}${pa.wuxing ? '' : ''}`,
    生肖: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][(Y - 4) % 12],
    五行分布: pa.wuxing,
    十神分布: pa.shishenDist,
    格局应用层: { 名称: pattern.patternName, 层次: pattern.patternLevel, 详情: pattern.详细解读 },
    日主强弱: pattern.strength,
    清浊: pattern.qingzhuoStatus,
    喜用神: pattern.xiyong,
  },

  格局透出: {
    月令: transparency.月令,
    直透格局: transparency.直透格局,
    间接引出: transparency.间接引出,
    最终格局: transparency.最终格局,
    透出分析: transparency.透出分析,
    结论: transparency.结论,
    建议: transparency.建议,
  },

  命格觉醒课题: {
    命格: guide.命格,
    匹配方式: guide.匹配方式,
    核心课题: guide.核心课题,
    盲区: guide.盲区,
    觉醒标志: guide.觉醒标志,
    注意事项: guide.注意事项,
    关系表现: guide.关系表现,
    日常练习: guide.日常练习,
    大忌: guide.大忌,
  },

  紫微斗数: {
    十二宫: ziwei.十二宫?.map(p => ({
      宫位: p.宫位, 地支: p.地支, 天干: p.天干,
      主星: p.主星, 辅星: p.辅星,
      吉凶: p.吉凶, 解读: p.解读,
    })),
    命宫分析: ziwei.命宫分析,
    当前大限: ziwei.当前大限,
    四化: ziwei.四化,
    四化体系: ziwei.四化体系,
    十二神: ziwei.十二神,
    排盘信息: ziwei.排盘信息,
    整体格局: ziwei.整体格局,
    综合评价: ziwei.综合评价,
  },

  五运六气: {
    先天体质: wuyun.先天体质,
    当年预测: wuyun.当年预测,
    脏腑分析: wuyun.脏腑分析,
    年龄阶段: wuyun.年龄阶段,
    综合建议: wuyun.综合建议,
  },

  大运流年: {
    当前大运: currentDayun && {
      干支: currentDayun.ganZhi,
      年龄段: `${currentDayun.startAge}-${currentDayun.endAge}岁`,
      公历年: currentDayun.startYear,
      干神: currentDayun.运干十神,
      支神: currentDayun.运支十神,
      吉凶: currentDayun.综合评价,
      事业: currentDayun.分析?.事业 || null,
      财运: currentDayun.分析?.财运 || null,
      感情: currentDayun.分析?.感情 || null,
      流年: (currentDayun.流年 || []).filter(l => l.year >= currentYear - 2).slice(0, 6).map(l => ({
        年份: l.year, 年龄: l.age, 干支: l.流年干支,
        干神: l.干神, 支神: l.支神, 关系: l.运年关系,
      })),
    },
    全部大运: dayunList.map(d => ({
      干支: d.ganZhi, 年龄段: `${d.startAge}-${d.endAge}岁`, 公历年: d.startYear,
      干神: d.运干十神, 支神: d.运支十神, 吉凶: d.综合评价,
    })),
  },

  人生影响力场: {
    四柱节点: influenceNodes.map(n => ({
      柱位: n.柱位, 关系: n.关系, 天干: n.天干, 地支: n.地支,
      主十神: n.主十神, 基础权重: n.基础权重, 十神质量: n.十神质量,
      时间衰减: n.时间衰减, 最终质量: n.最终质量,
      占比: totalMass > 0 ? ((parseFloat(n.最终质量) / totalMass) * 100).toFixed(1) : '0.0',
      影响描述: n.影响描述, 峰值年龄: n.峰值年龄,
      色: PILLAR_NODES[n.柱位]?.color,
    })),
    总质量: totalMass.toFixed(2),
  },

  觉醒推演: {
    基础层级: awakeningRaw.基础层级,
    调整因子: awakeningRaw.调整因子,
    最终层级: awakeningRaw.最终层级,
    层级名称: awakeningRaw.层级名称,
    层级描述: awakeningRaw.层级描述,
    特征: awakeningRaw.特征,
    生命模式: awakeningRaw.生命模式,
    提升建议: awakeningRaw.提升建议,
    事件影响倍率: AWAKENING_LEVELS[`L${Math.min(5, Math.max(1, Math.round(awakenLevel)))}`]?.multiplier,
  },

  每日运势: daily && {
    日期: today, 干支: daily.ganZhi,
    十神: daily.shiShenGan, 评分: daily.score, 宜: daily.yi, 忌: daily.ji,
    建议: daily.advice, 幸运色: daily.luckyColor, 财神位: daily.luckyPosition, 五行: daily.wuxing,
  },

  标记与立场: (events.length || relationships.length) ? {
    事件: events.map(e => ({ 类型: e.type, 名称: e.name, 年龄: e.age, 强度: e.intensity, 极性: EVENT_TYPES[e.type]?.polarity, 基础质量: EVENT_TYPES[e.type]?.baseMass })),
    关系: relationships.map(r => ({ 类型: r.type, 名称: r.name, 起始年龄: r.startAge, 质量: r.quality, 状态: r.status, 最大质量: RELATIONSHIP_TYPES[r.type]?.maxMass, 衰减起点: RELATIONSHIP_TYPES[r.type]?.decayStart, 年衰减率: RELATIONSHIP_TYPES[r.type]?.decayRate })),
    影响立场: posture,
  } : null,
}

console.log(JSON.stringify(archive, null, 2))
