/**
 * 真太阳时校正 · 晚子时换日 · 钟表时间平移
 * ═══════════════════════════════════════════════════════════════════════════
 * 本模块移植自开源项目 ziwei-doushu（Renhuai123/ziwei-doushu），
 *   原文件：lib/ziwei/true-solar-time.ts、lib/ziwei/clock-adjust.ts
 *   原仓库许可：MIT License
 *   Copyright (c) ziwei-doushu contributors
 *   本仓库依 MIT 要求保留此署名声明。
 *
 * 未引入该仓库 DATASET-LICENSE（CC BY 4.0 数据集）中的任何数据集，
 * 亦未引入其引用来源中受 CC BY-NC-SA 4.0 非商用限制约束的原文内容。
 *
 * ── 口径 ────────────────────────────────────────────────────────────────
 * 地方真太阳时 = 钟表时间 + 经度修正 + 均时差
 *   经度修正 =（出生地经度 − 钟表时区中央经线）× 4 分钟
 *   中央经线 = 时区标准偏移（分钟）÷ 4（东八区 480 → 120°）
 *   均时差采用 NOAA fractional-year 近似式，1900–2026 年范围内足以稳定
 *   判断紫微斗数的两小时时辰边界。
 *
 * 晚子时（23:00–24:00 出生）换日存在流派分歧，本模块以「排盘日」概念
 * 统一处理：next-day（归次日，主流排盘口径）/ current-day（归当日）。
 *
 * 参考：https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */

// ─── 常量 ──────────────────────────────────────────────────────────────────

const MINUTES_PER_DAY = 1440;
const SECONDS_PER_DAY = 86400;

/** 晚子时换日流派 */
export const LATE_ZISHI_RULES = {
  /** 晚子时归次日（主流排盘软件口径，默认） */
  NEXT_DAY: 'next-day',
  /** 晚子时归当日 */
  CURRENT_DAY: 'current-day',
  /** 全归当日（等价 current-day，保留枚举兼容） */
  ALL_CURRENT: 'all-current',
  /** 日柱归当日、时柱归次日 */
  DAY_CUR_TIME_NEXT: 'day-cur-time-next'
};

export const LATE_ZISHI_RULE_OPTIONS = [
  { value: LATE_ZISHI_RULES.NEXT_DAY, label: '次日换日（主流口径）', 说明: '23:00 后出生，日柱与时柱均以次日论' },
  { value: LATE_ZISHI_RULES.CURRENT_DAY, label: '当日不换日', 说明: '23:00 后出生，日柱仍以当日论' },
  { value: LATE_ZISHI_RULES.DAY_CUR_TIME_NEXT, label: '日柱当日 · 时柱次日', 说明: '日柱留在当日，时柱按次日五鼠遁' }
];

/** 晚子时起算时刻（23:00），单位分钟 */
const LATE_ZISHI_START = 1380;
/** 早子时结束时刻（01:00），单位分钟 */
const EARLY_ZISHI_END = 60;

const mod = (value, base) => ((value % base) + base) % base;

// ─── 基础历法工具 ──────────────────────────────────────────────────────────

/** 校验公历日期是否合法 */
export function isValidGregorianDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** 公历日期平移若干天，返回新的 { year, month, day } */
export function shiftGregorianDate(date, dayOffset) {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}

/** 两个公历日期是否同一天 */
export function sameGregorianDate(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function dayOfYear(year, month, day) {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
}

// ─── 均时差 ────────────────────────────────────────────────────────────────

/**
 * NOAA 均时差近似值（分钟）。正值表示真太阳时快于平太阳时。
 * @param {number} year 公历年
 * @param {number} month 公历月
 * @param {number} day 公历日
 * @param {number} clockHour 钟表小时
 * @param {number} clockMinute 钟表分钟
 * @returns {number} 均时差（分钟）
 */
export function equationOfTimeMinutes(year, month, day, clockHour = 12, clockMinute = 0) {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const fractionalHour = clockHour + clockMinute / 60;
  const gamma = (2 * Math.PI / daysInYear) * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

// ─── 时辰索引 ──────────────────────────────────────────────────────────────

/**
 * 由「日内分钟」求时辰地支索引（0=子 … 11=亥）。
 * 23:00–24:00 归子时（索引 0），00:00–01:00 亦归子时。
 * @param {number} normalizedMinutes 日内分钟（0–1439）
 * @returns {number} 时辰索引 0–11
 */
export function branchFromSolarMinutes(normalizedMinutes) {
  if (normalizedMinutes >= LATE_ZISHI_START || normalizedMinutes < EARLY_ZISHI_END) return 0;
  return Math.floor((normalizedMinutes - EARLY_ZISHI_END) / 120) + 1;
}

/** 该时刻是否落在晚子时（23:00–24:00） */
export function isLateZishiMinutes(normalizedMinutes) {
  return normalizedMinutes >= LATE_ZISHI_START;
}

/**
 * 由钟表小时/分钟求时辰索引（不做真太阳时校正）。
 * 23:00–24:00 归子时索引 0；00:00–01:00 亦为 0。
 * @returns {number} 时辰索引 0–11
 */
export function hourIndexFromClock(clockHour, clockMinute = 0) {
  const total = clockHour * 60 + clockMinute;
  return branchFromSolarMinutes(((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY);
}

// ─── 真太阳时 ──────────────────────────────────────────────────────────────

/**
 * 计算真太阳时。
 *
 * @param {object} input
 * @param {number} input.year 公历年
 * @param {number} input.month 公历月
 * @param {number} input.day 公历日
 * @param {number} input.clockHour 出生钟表小时
 * @param {number} input.clockMinute 出生钟表分钟
 * @param {number} [input.longitude] 出生地经度（东经为正）。未提供则不做校正。
 * @param {number} [input.utcOffsetMinutes] 钟表时区标准偏移（分钟，东正西负）。默认 480（东八区）
 * @returns {object} 真太阳时计算结果
 */
export function calculateTrueSolarTime(input) {
  const { year, month, day, clockHour, clockMinute } = input;
  const dateValid = isValidGregorianDate(year, month, day);
  const corrected = input.longitude !== undefined && input.longitude !== null && Number.isFinite(input.longitude);

  // 中央经线 = 时区偏移 / 4（480 分钟 → 120°）
  const meridian = input.utcOffsetMinutes !== undefined && input.utcOffsetMinutes !== null && Number.isFinite(input.utcOffsetMinutes)
    ? input.utcOffsetMinutes / 4
    : 120;

  const longitudeCorrectionMinutes = corrected ? (input.longitude - meridian) * 4 : 0;
  const eot = corrected && dateValid
    ? equationOfTimeMinutes(year, month, day, clockHour, clockMinute)
    : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = clockHour * 60 + clockMinute + totalCorrectionMinutes;

  // 页面输入精度为分钟；显示和时辰边界统一按最近一秒，避免浮点毛刺。
  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
  const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor((secondOfDay % 3600) / 60);
  const second = secondOfDay % 60;
  const normalizedMinutes = secondOfDay / 60;

  return {
    dateValid,
    corrected,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: eot,
    totalCorrectionMinutes,
    rawMinutes,
    normalizedMinutes,
    dayOffset,
    hour,
    minute,
    second,
    branch: branchFromSolarMinutes(normalizedMinutes),
    isLateZishi: isLateZishiMinutes(normalizedMinutes)
  };
}

// ─── 晚子时换日 ────────────────────────────────────────────────────────────

/**
 * 合并真太阳时跨日与晚子时流派规则，求最终「排盘日」相对输入日的偏移。
 *
 * @param {object} solar calculateTrueSolarTime 的返回值
 * @param {string} lateZishiRule LATE_ZISHI_RULES 之一
 * @returns {number} 排盘日偏移（-1 / 0 / 1）
 */
export function resolveDayOffset(solar, lateZishiRule = LATE_ZISHI_RULES.NEXT_DAY) {
  const nextDayRule = lateZishiRule === LATE_ZISHI_RULES.NEXT_DAY;
  const isLateZishi = solar.branch === 0 && solar.isLateZishi;

  // 真太阳时校正后退到前一天，且该时刻落在晚子时
  if (solar.dayOffset < 0 && isLateZishi) {
    return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
  }
  // 真太阳时校正后跨日（非晚子时）：直接跟随
  if (solar.dayOffset !== 0) return solar.dayOffset;
  // 本日落在晚子时
  if (isLateZishi) return nextDayRule ? 1 : 0;
  return 0;
}

/**
 * 一次性求解排盘所需的全部时间信息：真太阳时、时辰索引、排盘日、晚子时标志。
 *
 * @param {object} input
 * @param {number} input.year 公历年
 * @param {number} input.month 公历月
 * @param {number} input.day 公历日
 * @param {number} input.clockHour 出生钟表小时
 * @param {number} input.clockMinute 出生钟表分钟
 * @param {number} [input.longitude] 出生地经度（东经为正）
 * @param {number} [input.utcOffsetMinutes] 时区标准偏移（分钟），默认 480
 * @param {string} [input.lateZishiRule] 晚子时换日流派
 * @returns {object} 排盘时间解
 */
export function resolveBirthTime(input) {
  const lateZishiRule = input.lateZishiRule || LATE_ZISHI_RULES.NEXT_DAY;
  const solar = calculateTrueSolarTime({
    year: input.year,
    month: input.month,
    day: input.day,
    clockHour: input.clockHour,
    clockMinute: input.clockMinute || 0,
    longitude: input.longitude,
    utcOffsetMinutes: input.utcOffsetMinutes
  });

  const dayOffset = resolveDayOffset(solar, lateZishiRule);
  const 排盘日 = shiftGregorianDate({ year: input.year, month: input.month, day: input.day }, dayOffset);
  const isLateZishi = solar.branch === 0 && solar.isLateZishi;

  return {
    真太阳时: solar,
    晚子时规则: lateZishiRule,
    是否晚子时: isLateZishi,
    排盘日偏移: dayOffset,
    排盘日,
    时辰索引: solar.branch,
    /** iztro 专用：12 表示晚子时 */
    iztro时辰索引: isLateZishi ? 12 : solar.branch
  };
}

// ─── 钟表时间平移（夏令时 / 历史时区） ────────────────────────────────────

/**
 * 当年钟表读数 → 标准时间需要平移的分钟数。
 * 换算方向：标准时间 = 钟表读数 −（当年实际偏移 − 标准偏移）。
 * 例：中国大陆 1986–1991 夏令时差 +60 → 减 60。
 *
 * @param {number} actualOffsetMin 当年实际时区偏移（相对 UTC 的分钟，东正西负）
 * @param {number} stdOffsetMin 标准时区偏移
 * @returns {number} 平移分钟数
 */
export function clockToStandardDelta(actualOffsetMin, stdOffsetMin) {
  return stdOffsetMin - actualOffsetMin;
}

/**
 * 钟表时间平移 deltaMin 分钟。
 * 时/分未填、不是整数、或平移后跨日，一律返回 null —— 不替用户改日期
 * （农历月大小、闰月、晚子时换日交织，自动跨日容易改错）。
 *
 * @param {{clockHour:string, clockMinute:string}} t 钟表时间
 * @param {number} deltaMin 平移分钟数
 * @returns {{clockHour:string, clockMinute:string}|null}
 */
export function shiftClock(t, deltaMin) {
  if (!t || t.clockHour === '' || t.clockMinute === '') return null;
  const h = Number(t.clockHour);
  const m = Number(t.clockMinute);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  if (!Number.isInteger(deltaMin) || deltaMin === 0) return null;
  const total = h * 60 + m + deltaMin;
  if (total < 0 || total >= 24 * 60) return null;
  return { clockHour: String(Math.floor(total / 60)), clockMinute: String(total % 60) };
}

/** 「HH:MM」两位补零 */
export function formatClock(t) {
  if (!t) return '';
  return `${String(t.clockHour).padStart(2, '0')}:${String(t.clockMinute).padStart(2, '0')}`;
}

/** 带符号的分钟数，便于在界面上展示校正量 */
export function formatSignedMinutes(value) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}
