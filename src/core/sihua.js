/**
 * 紫微斗数 · 四化体系
 * ═══════════════════════════════════════════════════════════════════════════
 * 覆盖层：
 *   本命四化（生年干）· 大限宫干 · 流年干 · 流月干（五虎遁）· 流日干 · 流时干（五鼠遁）
 *   + 宫干自化检测 + 来因宫追溯 + 多层四化叠加视图
 *
 * 本模块移植自开源项目 ziwei-doushu（Renhuai123/ziwei-doushu），
 *   原文件：lib/ziwei/sihua.ts、lib/ziwei/constants.ts
 *   原仓库许可：MIT License
 *   Copyright (c) ziwei-doushu contributors
 *   本仓库依 MIT 要求保留此署名声明。
 *
 * 未引入该仓库 DATASET-LICENSE（CC BY 4.0）中的数据集，
 * 亦未引入其引用来源中受 CC BY-NC-SA 4.0 非商用限制约束的原文内容。
 *
 * ── 口径 ────────────────────────────────────────────────────────────────
 * 本命四化 = 出生年天干四化（始终显示）
 * 运限四化 = 大限宫干 / 流年干 / 流月干 / 流日干 / 流时干 → 叠层呈现
 * 宫干自化 = 该宫宫干引发的四化，被化星恰在本宫
 * 来因宫   = 对某星某种化，追溯是哪个宫的宫干「飞」过来的
 */

import { TIANGAN, DIZHI } from './constants/wuxing.js';

// ─── 常量 ──────────────────────────────────────────────────────────────────

/** 天干索引 0-9 → [化禄, 化权, 化科, 化忌] 对应星名 */
export const SI_HUA_TABLE = {
  0: ['廉贞', '破军', '武曲', '太阳'], // 甲
  1: ['天机', '天梁', '紫微', '太阴'], // 乙
  2: ['天同', '天机', '文昌', '廉贞'], // 丙
  3: ['太阴', '天同', '天机', '巨门'], // 丁
  4: ['贪狼', '太阴', '右弼', '天机'], // 戊
  5: ['武曲', '贪狼', '天梁', '文曲'], // 己
  6: ['太阳', '武曲', '太阴', '天同'], // 庚
  7: ['巨门', '太阳', '文曲', '文昌'], // 辛
  8: ['天梁', '紫微', '左辅', '武曲'], // 壬
  9: ['破军', '巨门', '太阴', '贪狼']  // 癸
};

/** 四化类型中文名 */
export const SI_HUA_TYPES = ['禄', '权', '科', '忌'];

/** 四化类型的性质与释义（用于解读与着色） */
export const SI_HUA_MEANING = {
  禄: { 性质: '大吉', 作用: '财禄增长、机会增多', 关键词: '顺遂' },
  权: { 性质: '中吉', 作用: '权力提升、掌控力强', 关键词: '主导' },
  科: { 性质: '小吉', 作用: '名声提升、贵人相助', 关键词: '声名' },
  忌: { 性质: '凶', 作用: '阻碍波折、是非缠绕', 关键词: '执着' }
};

/** 禄存表（年干索引 → 禄存地支索引） */
export const LUCUN_TABLE = {
  0: 2,  // 甲：寅
  1: 3,  // 乙：卯
  2: 5,  // 丙：巳
  3: 6,  // 丁：午
  4: 5,  // 戊：巳
  5: 6,  // 己：午
  6: 8,  // 庚：申
  7: 9,  // 辛：酉
  8: 11, // 壬：亥
  9: 0   // 癸：子
};

const normalizeIndex = (value, base) => ((Math.trunc(value) % base) + base) % base;

// ─── 1) 由天干取四化 ──────────────────────────────────────────────────────

/**
 * 天干索引 → { 禄, 权, 科, 忌 } 对应星名
 * @param {number} stemIndex 天干索引 0-9
 * @returns {{禄:string, 权:string, 科:string, 忌:string}}
 */
export function getSiHuaByStem(stemIndex) {
  const arr = SI_HUA_TABLE[normalizeIndex(stemIndex, 10)];
  if (!arr) return { 禄: '', 权: '', 科: '', 忌: '' };
  return { 禄: arr[0], 权: arr[1], 科: arr[2], 忌: arr[3] };
}

/**
 * 星名 → 四化类型（由某天干确定）
 * @param {number} stemIndex 天干索引 0-9
 * @returns {Object<string,string>} { 星名: '禄'|'权'|'科'|'忌' }
 */
export function buildStarSiHuaMap(stemIndex) {
  const arr = SI_HUA_TABLE[normalizeIndex(stemIndex, 10)];
  if (!arr) return {};
  return { [arr[0]]: '禄', [arr[1]]: '权', [arr[2]]: '科', [arr[3]]: '忌' };
}

/** 天干字 → 索引；非法返回 -1 */
export function stemIndexOf(gan) {
  return TIANGAN.indexOf(gan);
}

/** 地支字 → 索引；非法返回 -1 */
export function branchIndexOf(zhi) {
  return DIZHI.indexOf(zhi);
}

// ─── 2) 公历年 → 年柱干支索引 ────────────────────────────────────────────

/** 公历年份 → 年柱天干索引（0=甲 … 9=癸） */
export function getYearStemIndex(year) {
  return normalizeIndex(year - 4, 10);
}

/** 公历年份 → 年柱地支索引（0=子 … 11=亥） */
export function getYearBranchIndex(year) {
  return normalizeIndex(year - 4, 12);
}

// ─── 3) 大限四化（取大限宫的宫干，非本命年干） ───────────────────────────

/**
 * 大限宫干四化
 * @param {Object} chart iztro 命盘
 * @param {number} dxIndex 大限索引
 * @returns {{stemIndex:number, stemName:string, transforms:Object}|null}
 */
export function getDaXianSiHua(chart, dxIndex) {
  if (!chart || !chart.palaces) return null;
  const dx = chart.palaces[dxIndex];
  if (!dx) return null;
  const stemIndex = stemIndexOf(dx.heavenlyStem);
  if (stemIndex < 0) return null;
  return {
    stemIndex,
    stemName: dx.heavenlyStem,
    transforms: getSiHuaByStem(stemIndex)
  };
}

// ─── 4) 流年四化 ──────────────────────────────────────────────────────────

/**
 * 流年干四化
 * @param {number} year 公历年份
 */
export function getLiuNianSiHua(year) {
  const stemIndex = getYearStemIndex(year);
  return {
    stemIndex,
    stemName: TIANGAN[stemIndex],
    transforms: getSiHuaByStem(stemIndex)
  };
}

// ─── 5) 流月四化（五虎遁） ────────────────────────────────────────────────

/**
 * 流月天干（五虎遁：甲己年起丙寅、乙庚年起戊寅、丙辛年起庚寅、丁壬年起壬寅、戊癸年起甲寅）
 * @param {number} yearStem 年干索引
 * @param {number} month 农历月 1-12（正月 = 寅月）
 */
export function getLiuYueStemIndex(yearStem, month) {
  const startStemOfYin = {
    0: 2, 5: 2,  // 甲己 → 丙
    1: 4, 6: 4,  // 乙庚 → 戊
    2: 6, 7: 6,  // 丙辛 → 庚
    3: 8, 8: 8,  // 丁壬 → 壬
    4: 0, 9: 0   // 戊癸 → 甲
  };
  const yinStem = startStemOfYin[normalizeIndex(yearStem, 10)] ?? 0;
  return normalizeIndex(yinStem + (normalizeIndex(month, 12) - 1), 10);
}

/**
 * 流月四化
 * @param {number} yearStem 年干索引
 * @param {number} month 农历月 1-12
 * @param {object} [options]
 * @param {boolean} [options.isLeapMonth] 是否闰月
 * @param {number} [options.liuriDay] 农历日（闰月前后半月取本月/下月口径）
 * @param {number} [options.nextYearStem] 闰十二月后半段跨到次年正月时使用的年干
 */
export function getLiuYueSiHua(yearStem, month, options = {}) {
  const normalizedMonth = Math.max(1, Math.min(12, Math.trunc(month)));
  let effectiveMonth = normalizedMonth;
  if (options.isLeapMonth && (options.liuriDay ?? 1) > 15) {
    effectiveMonth = normalizedMonth >= 12 ? 1 : normalizedMonth + 1;
  }
  const sourceYearStem = options.isLeapMonth && effectiveMonth === 1 && (options.liuriDay ?? 1) > 15
    ? (options.nextYearStem ?? yearStem)
    : yearStem;
  const stemIndex = getLiuYueStemIndex(sourceYearStem, effectiveMonth);
  return {
    stemIndex,
    stemName: TIANGAN[stemIndex],
    transforms: getSiHuaByStem(stemIndex),
    month: effectiveMonth
  };
}

// ─── 6) 流日四化 ──────────────────────────────────────────────────────────

/**
 * 流日天干四化。传入日干索引而非整盘，避免农历换算依赖。
 * @param {number} dayStemIndex 日干索引
 */
export function getLiuRiSiHua(dayStemIndex) {
  const stemIndex = normalizeIndex(dayStemIndex, 10);
  return {
    stemIndex,
    stemName: TIANGAN[stemIndex],
    transforms: getSiHuaByStem(stemIndex)
  };
}

// ─── 7) 流时四化（五鼠遁） ────────────────────────────────────────────────

/**
 * 流时四化（五鼠遁：日干起子时天干）
 * @param {number} dayStemIndex 日干索引
 * @param {number} hourBranch 时支索引 0=子 … 11=亥
 */
export function getLiuShiSiHua(dayStemIndex, hourBranch) {
  // 甲己→甲子，乙庚→丙子，丙辛→戊子，丁壬→庚子，戊癸→壬子
  const ziStemByDayStem = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8
  };
  const branch = normalizeIndex(hourBranch, 12);
  const stemIndex = normalizeIndex((ziStemByDayStem[normalizeIndex(dayStemIndex, 10)] ?? 0) + branch, 10);
  return {
    stemIndex,
    stemName: TIANGAN[stemIndex],
    transforms: getSiHuaByStem(stemIndex)
  };
}

// ─── 8) 宫干自化检测 ──────────────────────────────────────────────────────

/**
 * 自化：该宫宫干引发的四化，被化星恰在本宫。
 * 例：宫干为甲（廉贞禄·破军权·武曲科·太阳忌），本宫主星含「廉贞」→ 该宫自化禄。
 *
 * @param {Object} palace iztro 宫位对象
 * @returns {Array<{siHua:string, starName:string}>}
 */
export function detectSelfSihua(palace) {
  if (!palace) return [];
  const stemIndex = stemIndexOf(palace.heavenlyStem);
  if (stemIndex < 0) return [];
  const transforms = getSiHuaByStem(stemIndex);
  const found = [];

  const starNames = new Set([
    ...(palace.majorStars || []).map(s => s.name),
    ...(palace.minorStars || []).map(s => s.name),
    ...(palace.adjectiveStars || []).map(s => s.name)
  ]);

  SI_HUA_TYPES.forEach(type => {
    const starName = transforms[type];
    if (starName && starNames.has(starName)) {
      found.push({ siHua: type, starName });
    }
  });
  return found;
}

/**
 * 批量计算盘面所有宫位的自化列表
 * @param {Object} chart iztro 命盘
 * @returns {Object<string, Array>} { 宫位名: [{siHua, starName}] }
 */
export function buildAllSelfSihua(chart) {
  const result = {};
  if (!chart || !chart.palaces) return result;
  chart.palaces.forEach(palace => {
    const list = detectSelfSihua(palace);
    if (list.length > 0) result[palace.name] = list;
  });
  return result;
}

// ─── 9) 来因宫追溯 ────────────────────────────────────────────────────────

/**
 * 来因宫：对某颗星某种化，追溯是哪个宫的宫干「飞」过来的。
 * 化忌的来因宫通常指向该问题的根源宫位。
 *
 * @param {Object} chart iztro 命盘
 * @param {string} starName 被化的星名（如「太阴」）
 * @param {string} sihua 四化类型（「禄」/「权」/「科」/「忌」）
 * @returns {Array<{宫位:string, 地支:string, 天干:string}>}
 */
export function findIncomingPalaces(chart, starName, sihua) {
  const result = [];
  if (!chart || !chart.palaces || !starName || !sihua) return result;
  chart.palaces.forEach(palace => {
    const stemIndex = stemIndexOf(palace.heavenlyStem);
    if (stemIndex < 0) return;
    const transforms = getSiHuaByStem(stemIndex);
    if (transforms[sihua] === starName) {
      result.push({
        宫位: palace.name,
        地支: palace.earthlyBranch,
        天干: palace.heavenlyStem
      });
    }
  });
  return result;
}

/**
 * 批量追溯本命盘所有宫干引发的四化来因宫。
 * @param {Object} chart iztro 命盘
 * @returns {Object<string, Array<{宫位:string, 地支:string, 天干:string}>>} { 星名: 来因宫列表 }
 */
export function buildIncomingPalaceMap(chart) {
  const map = {};
  if (!chart || !chart.palaces) return map;
  chart.palaces.forEach(palace => {
    const stemIndex = stemIndexOf(palace.heavenlyStem);
    if (stemIndex < 0) return;
    const transforms = getSiHuaByStem(stemIndex);
    SI_HUA_TYPES.forEach(type => {
      const starName = transforms[type];
      if (!starName) return;
      if (!map[starName]) map[starName] = [];
      map[starName].push({
        宫位: palace.name,
        地支: palace.earthlyBranch,
        天干: palace.heavenlyStem,
        四化: type
      });
    });
  });
  return map;
}

// ─── 10) 多层四化叠加 ─────────────────────────────────────────────────────

/** 叠加层优先级：本命 < 大限 < 流年 < 流月 < 流日 < 流时 */
export const SI_HUA_LAYER_ORDER = ['本命', '大限', '流年', '流月', '流日', '流时'];

/**
 * 生成某颗星的多层四化合成视图。
 * @param {string} starName 星名
 * @param {Object<string,string>} nativeMap 本命星→四化类型
 * @param {Object<string,string>} [daXianMap] 大限
 * @param {Object<string,string>} [liuNianMap] 流年
 * @param {Object<string,string>} [liuYueMap] 流月
 * @param {Object<string,string>} [liuRiMap] 流日
 * @param {Object<string,string>} [liuShiMap] 流时
 * @returns {Object<string,string>} { 层名: 四化类型 }
 */
export function buildOverlayForStar(starName, nativeMap, daXianMap, liuNianMap, liuYueMap, liuRiMap, liuShiMap) {
  return {
    本命: nativeMap?.[starName],
    大限: daXianMap?.[starName],
    流年: liuNianMap?.[starName],
    流月: liuYueMap?.[starName],
    流日: liuRiMap?.[starName],
    流时: liuShiMap?.[starName]
  };
}

/**
 * 构建整盘的四化叠加表：星名 → { 层名: 类型 }
 * @param {Object} chart iztro 命盘
 * @param {Object} layers { 本命, 大限, 流年, 流月, 流日, 流时 } 各层的 transforms 对象
 * @returns {Object<string, Object<string,string>>}
 */
export function buildOverlayTable(chart, layers = {}) {
  const table = {};
  if (!chart || !chart.palaces) return table;

  // 收集盘上全部主星与辅星名
  const starNames = new Set();
  chart.palaces.forEach(palace => {
    (palace.majorStars || []).forEach(s => starNames.add(s.name));
    (palace.minorStars || []).forEach(s => starNames.add(s.name));
    (palace.adjectiveStars || []).forEach(s => starNames.add(s.name));
  });

  starNames.forEach(starName => {
    const overlay = buildOverlayForStar(
      starName,
      layers.本命, layers.大限, layers.流年, layers.流月, layers.流日, layers.流时
    );
    const active = Object.entries(overlay).filter(([, v]) => v);
    if (active.length > 0) table[starName] = overlay;
  });

  return table;
}

/**
 * 把某层的四化映射（星名 → 类型）整理成带释义的条目数组，供 UI 直接渲染。
 * @param {Object<string,string>} map 星名 → 四化类型
 * @returns {Array<{星曜:string, 类型:string, 性质:string, 作用:string}>}
 */
export function toSiHuaEntries(map) {
  if (!map) return [];
  return Object.entries(map).map(([星曜, 类型]) => ({
    星曜,
    类型,
    性质: SI_HUA_MEANING[类型]?.性质 || '',
    作用: SI_HUA_MEANING[类型]?.作用 || ''
  }));
}

/**
 * 把 transforms（{禄,权,科,忌}）转成 星名→类型 的映射。
 * @param {Object<string,string>} transforms
 */
export function transformsToMap(transforms) {
  const map = {};
  if (!transforms) return map;
  SI_HUA_TYPES.forEach(type => {
    const star = transforms[type];
    if (star) map[star] = type;
  });
  return map;
}
