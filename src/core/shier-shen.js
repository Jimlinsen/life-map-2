/**
 * 紫微斗数 · 十二神
 * ═══════════════════════════════════════════════════════════════════════════
 * 三组：
 *   将前十二神 —— 将星起顺行
 *   岁前十二神 —— 岁建起顺行
 *   博士十二神 —— 生年禄存起，阳男阴女顺、阴男阳女逆（不跟随运限）
 *
 * 本模块移植自开源项目 ziwei-doushu（Renhuai123/ziwei-doushu），
 *   原文件：lib/ziwei/shier-shen.ts
 *   原仓库许可：MIT License
 *   Copyright (c) ziwei-doushu contributors
 *   本仓库依 MIT 要求保留此署名声明。
 *
 * 未引入该仓库 DATASET-LICENSE（CC BY 4.0）中的数据集，
 * 亦未引入其引用来源中受 CC BY-NC-SA 4.0 非商用限制约束的原文内容。
 *
 * ── 与 iztro 原生的关系 ─────────────────────────────────────────────────
 * iztro 原生已提供本命态的十二神（palace.boshi12 / jiangqian12 / suiqian12），
 * 经 120 宫逐格比对，算法与本模块完全一致（仅两处用字差异见下）。
 * 本模块的增量在于【运限跟随】：
 *   主流排盘每个运限（大限 / 流年 / 流月 / 流日 / 流时）都各自起一组
 *   岁前 / 将前十二神 —— 起点是该运限的地支，而非生年支。
 *   iztro 原生只给本命态，运限跟随层需自行推算。
 *
 * ── 用字校准 ────────────────────────────────────────────────────────────
 *  岁前十二神第 7 位主流盘面写「岁破」（岁建对宫），不是「大耗」——
 *  顶栏年支大耗是另一颗星。
 *  博士十二神第 12 位写「官符」（iztro 原生作「官府」，同义异写）。
 */

import { LUCUN_TABLE } from './sihua.js';

/** 将前十二神，自将星起顺行。索引 0-11 = 神序。 */
export const JIANG_QIAN_SHEN = [
  '将星', '攀鞍', '岁驿', '息神', '华盖', '劫煞',
  '灾煞', '天煞', '指背', '咸池', '月煞', '亡神'
];

/** 岁前十二神，自岁建起顺行。索引 0-11 = 神序。 */
export const SUI_QIAN_SHEN = [
  '岁建', '晦气', '丧门', '贯索', '官符', '小耗',
  '岁破', '龙德', '白虎', '天德', '吊客', '病符'
];

/** 博士十二神，从生年禄存起。索引 0-11 = 神序。 */
export const BOSHI_SHEN = [
  '博士', '力士', '青龙', '小耗', '将军', '奏书',
  '飞廉', '喜神', '病符', '大耗', '伏兵', '官符'
];

/** 十二神类别（用于 UI 分组） */
export const SHIER_SHEN_CATEGORIES = {
  将前: JIANG_QIAN_SHEN,
  岁前: SUI_QIAN_SHEN,
  博士: BOSHI_SHEN
};

const normalizeIndex = (value, base) => ((Math.trunc(value) % base) + base) % base;

// ─── 将星落宫 ──────────────────────────────────────────────────────────────

/**
 * 将星落宫（0-11 地支索引）—— 三合局的帝旺位。
 * 申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯，即同三合组共用一个将星宫。
 *
 * @param {number} anchorBranch 该运限的地支（本命态传生年支）
 */
export function jiangXingBranch(anchorBranch) {
  const b = normalizeIndex(anchorBranch, 12);
  // 子(0)/辰(4)/申(8) → 子(0)；丑(1)/巳(5)/酉(9) → 酉(9)；
  // 寅(2)/午(6)/戌(10) → 午(6)；卯(3)/未(7)/亥(11) → 卯(3)
  return [0, 9, 6, 3][b % 4];
}

/**
 * 将前十二神：返回长度 12 的数组，下标 = 宫地支（0-11），值 = 神序（0-11，0=将星）。
 * 将星起于三合帝旺位，其后十一神顺行。
 */
export function jiangQianShenByBranch(anchorBranch) {
  const start = jiangXingBranch(anchorBranch);
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) out[(start + shen) % 12] = shen;
  return out;
}

/**
 * 岁前十二神：返回长度 12 的数组，下标 = 宫地支（0-11），值 = 神序（0-11，0=岁建）。
 * 岁建落在 anchorBranch 宫，其后十一神顺行。
 */
export function suiQianShenByBranch(anchorBranch) {
  const a = normalizeIndex(anchorBranch, 12);
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) out[(a + shen) % 12] = shen;
  return out;
}

// ─── 博士十二神 ────────────────────────────────────────────────────────────

/**
 * 阳男阴女顺，阴男阳女逆。与八字大运顺逆同一把尺子（年干阴阳）。
 * @param {number} yearStem 年干索引 0-9
 * @param {string} gender '男' | '女'
 */
export function boshiReverse(yearStem, gender) {
  const yangStem = normalizeIndex(yearStem, 10) % 2 === 0;
  return yangStem !== (gender === '男');
}

/**
 * 博士十二神：返回长度 12 的数组，下标 = 宫地支（0-11），值 = 神序（0-11，0=博士）。
 * 起点 = 生年禄存。
 */
export function boshiShenByStem(yearStem, gender) {
  const start = LUCUN_TABLE[normalizeIndex(yearStem, 10)];
  const reverse = boshiReverse(yearStem, gender);
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) {
    const branch = reverse ? (start - shen + 12) % 12 : (start + shen) % 12;
    out[branch] = shen;
  }
  return out;
}

// ─── 便利函数 ──────────────────────────────────────────────────────────────

/** 某一宫的将前十二神名 */
export function jiangQianShenName(anchorBranch, palaceBranch) {
  return JIANG_QIAN_SHEN[jiangQianShenByBranch(anchorBranch)[normalizeIndex(palaceBranch, 12)]];
}

/** 某一宫的岁前十二神名 */
export function suiQianShenName(anchorBranch, palaceBranch) {
  return SUI_QIAN_SHEN[suiQianShenByBranch(anchorBranch)[normalizeIndex(palaceBranch, 12)]];
}

/** 某一宫的博士十二神名 */
export function boshiShenName(yearStem, gender, palaceBranch) {
  return BOSHI_SHEN[boshiShenByStem(yearStem, gender)[normalizeIndex(palaceBranch, 12)]];
}

// ─── 运限跟随 ──────────────────────────────────────────────────────────────

/**
 * 构建一组「运限跟随」的十二神。
 *
 * @param {number} anchorBranch 该运限的地支索引（0-11）
 * @returns {{将前:string[], 岁前:string[]}}
 *   数组下标 = 宫地支（0-11），值为神名
 */
export function buildYunXianShierShen(anchorBranch) {
  const jq = jiangQianShenByBranch(anchorBranch);
  const sq = suiQianShenByBranch(anchorBranch);
  const 将前 = new Array(12);
  const 岁前 = new Array(12);
  for (let b = 0; b < 12; b++) {
    将前[b] = JIANG_QIAN_SHEN[jq[b]];
    岁前[b] = SUI_QIAN_SHEN[sq[b]];
  }
  return { 将前, 岁前 };
}

/**
 * 为一组运限（各带自己的地支）批量构建十二神跟随层。
 *
 * @param {Object<string, number>} layers { 层名: 地支索引 }，如 { 大限: 5, 流年: 2 }
 * @returns {Object<string, {将前:string[], 岁前:string[]}>}
 */
export function buildYunXianShierShenLayers(layers) {
  const out = {};
  Object.entries(layers || {}).forEach(([name, branch]) => {
    if (typeof branch !== 'number' || !Number.isFinite(branch)) return;
    out[name] = buildYunXianShierShen(branch);
  });
  return out;
}

/**
 * 把某一层的十二神映射到 iztro 宫位对象上（供 UI 直接取用）。
 *
 * @param {Object} chart iztro 命盘
 * @param {Object<string, number>} layers { 层名: 地支索引 }
 * @param {string[]} [branchOrder] 宫位地支顺序表，默认 子丑寅…亥
 * @returns {Object<string, Object<string, {将前:string, 岁前:string}>>} { 层名: { 宫位名: {将前, 岁前} } }
 */
export function attachShierShenToPalaces(chart, layers, branchOrder) {
  const result = {};
  if (!chart || !chart.palaces) return result;
  const order = branchOrder || chart.palaces.map(p => p.earthlyBranch);

  Object.entries(layers || {}).forEach(([layerName, branch]) => {
    if (typeof branch !== 'number' || !Number.isFinite(branch)) return;
    const { 将前, 岁前 } = buildYunXianShierShen(branch);
    const perPalace = {};
    chart.palaces.forEach(palace => {
      const b = order.indexOf(palace.earthlyBranch);
      if (b < 0) return;
      perPalace[palace.name] = { 将前: 将前[b], 岁前: 岁前[b] };
    });
    result[layerName] = perPalace;
  });

  return result;
}

/**
 * 十二神的中文含义速查，供解读层引用（不改变神名本身）。
 */
export const SHIER_SHEN_MEANING = {
  将星: '主事、掌权，居要职、得重用',
  攀鞍: '利进、宜升迁',
  岁驿: '驿动、主远行、外出',
  息神: '主静、稳、也主耗散消极',
  华盖: '主孤高、艺术宗教、玄学缘',
  劫煞: '主劫夺、破财、意外',
  灾煞: '主灾病、意外之险',
  天煞: '主克父、上级压制',
  指背: '背后议论、遭人指摘',
  咸池: '主桃花、情欲',
  月煞: '主疾病、兄弟朋友连带',
  亡神: '主失落、耗损、失落之财',

  岁建: '太岁所在，主争执、岁运并临',
  晦气: '主暗中不顺、损财',
  丧门: '主丧事、哭泣、忧疑',
  贯索: '主纠缠、束缚、公门之事',
  官符: '主官非、诉讼、文书',
  小耗: '主小额损失、破小财',
  岁破: '岁建对冲，主冲破、破财',
  龙德: '主吉庆、逢凶化吉',
  白虎: '主血光、疾病、凶险',
  天德: '主福德庇佑、逢凶化吉',
  吊客: '主吊丧、忧事',
  病符: '主疾病、灾厄',

  博士: '主聪明好学、文书功名',
  力士: '主权势、掌权',
  青龙: '主喜庆、财喜',
  将军: '主威猛、掌兵权',
  奏书: '主文书奏章、公门之喜',
  飞廉: '主口舌、官非、火灾',
  喜神: '主喜庆、婚喜',
  伏兵: '主埋伏、盗贼、暗事',
  官符: '主官非、诉讼'
};
