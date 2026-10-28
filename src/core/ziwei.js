import { astro } from 'iztro';
import { WUXING_TERRAIN_SYSTEM, SHISHEN_FORCE_FIELD } from './constants/language.js';
import { ZIWEI_PALACE_SYSTEM, ZIWEI_STAR_TRAITS, SIHUA_SYSTEM, STAR_CHARACTER_SYSTEM, ZIWEI_PATTERN_SYSTEM, STAR_COMBINATION_SYSTEM, ZIWEI_INTERPRETATION_MAP } from './constants/ziwei.js';
import {
  getSiHuaByStem, buildStarSiHuaMap, transformsToMap, toSiHuaEntries,
  getYearStemIndex, getYearBranchIndex, getDaXianSiHua, getLiuNianSiHua,
  getLiuYueSiHua, getLiuRiSiHua, getLiuShiSiHua,
  buildAllSelfSihua, buildIncomingPalaceMap, buildOverlayTable, SI_HUA_TYPES
} from './sihua.js';
import {
  boshiShenByStem, JIANG_QIAN_SHEN, SUI_QIAN_SHEN, BOSHI_SHEN,
  buildYunXianShierShenLayers, attachShierShenToPalaces, SHIER_SHEN_MEANING
} from './shier-shen.js';
import { LATE_ZISHI_RULES, resolveBirthTime } from './solar-time.js';

/** 地支索引归一化到 0-11 */
const normalizeBranch = (value) => ((Math.trunc(value) % 12) + 12) % 12;

export class ZiweiAnalyzer {  /**
   * @param {number} birthYear 出生年
   * @param {number} birthMonth 出生月
   * @param {number} birthDay 出生日
   * @param {number} birthHour 时辰索引 0-11，12 表示晚子时（23:00-24:00）
   * @param {string} gender '男' | '女'
   * @param {object} [options]
   * @param {number} [options.clockHour] 精确钟表小时（0-23）
   * @param {number} [options.clockMinute] 精确钟表分钟
   * @param {number} [options.longitude] 出生地经度（东经为正），提供则做真太阳时校正
   * @param {number} [options.utcOffsetMinutes] 时区标准偏移（分钟），默认 480
   * @param {string} [options.lateZishiRule] 晚子时换日流派，见 LATE_ZISHI_RULES
   */
  constructor(birthYear, birthMonth, birthDay, birthHour, gender, options = {}) {
    this.birthYear = birthYear;
    this.birthMonth = birthMonth;
    this.birthDay = birthDay;
    this.birthHour = birthHour;
    this.gender = gender;
    this.options = options;
    this.chart = null;
    this.排盘日 = { year: birthYear, month: birthMonth, day: birthDay };
    this.是否晚子时 = false;
    this.时辰索引 = birthHour;
    this.真太阳时信息 = null;
    this.晚子时规则 = options.lateZishiRule || LATE_ZISHI_RULES.NEXT_DAY;
    this.initChart();
  }

  initChart() {
    try {
      // ── 时间解算 ─────────────────────────────────────────────────────
      // 有精确钟表时刻时走真太阳时校正 + 晚子时换日；
      // 只有时辰索引时，晚子时（12）按流派决定排盘日。
      const lateZishiRule = this.晚子时规则;
      const hasExactTime = Number.isFinite(this.options.clockHour);

      let iztroHourIndex = this.birthHour;
      let solarDateStr = `${this.birthYear}-${String(this.birthMonth).padStart(2, '0')}-${String(this.birthDay).padStart(2, '0')}`;

      if (hasExactTime || this.birthHour === 12) {
        const solved = resolveBirthTime({
          year: this.birthYear,
          month: this.birthMonth,
          day: this.birthDay,
          clockHour: hasExactTime ? this.options.clockHour : 23,
          clockMinute: hasExactTime ? (this.options.clockMinute || 0) : 0,
          longitude: this.options.longitude,
          utcOffsetMinutes: this.options.utcOffsetMinutes,
          lateZishiRule
        });
        this.排盘日 = solved.排盘日;
        this.是否晚子时 = solved.是否晚子时;
        this.时辰索引 = solved.时辰索引;
        this.真太阳时信息 = solved.真太阳时;

        if (this.是否晚子时) {
          // iztro 的 timeIndex=12 即「晚子时」，由 iztro 内部按 dayDivide 规则处理换日
          iztroHourIndex = 12;
        } else {
          iztroHourIndex = solved.时辰索引;
          solarDateStr = `${solved.排盘日.year}-${String(solved.排盘日.month).padStart(2, '0')}-${String(solved.排盘日.day).padStart(2, '0')}`;
        }
      }

      // iztro 的 dayDivide 决定晚子时是否进位到次日：
      //   forward（默认）= 次日换日（主流排盘口径）
      //   current          = 当日不换日
      if (this.是否晚子时) {
        const dayDivide = lateZishiRule === LATE_ZISHI_RULES.NEXT_DAY ? 'forward' : 'current';
        this.chart = astro.withOptions({
          type: 'solar',
          dateStr: solarDateStr,
          timeIndex: iztroHourIndex,
          gender: this.gender === '男' ? 'male' : 'female',
          config: { dayDivide }
        });
      } else {
        this.chart = astro.bySolar(
          solarDateStr,
          iztroHourIndex,
          this.gender === '男' ? 'male' : 'female'
        );
      }
    } catch (error) {
      console.error('紫微命盘生成失败:', error);
      this.chart = null;
    }
  }

  // iztro 的宫名不带「宫」字（财帛/官禄/夫妻/疾厄…），只有「命宫」保留后缀。
  // 本项目内部统一使用「X宫」命名，因此在这里做一次边界归一化，
  // 否则 chart.palace('官禄宫') 会返回 undefined，导致十二宫/关键星曜/联动分析全部失效。
  getPalaceByName(palaceName, chart) {
    const target = chart || this.chart;
    if (!target || !palaceName) return undefined;
    const direct = target.palace(palaceName);
    if (direct) return direct;
    const short = palaceName.replace(/宫$/, '');
    return short !== palaceName ? target.palace(short) : undefined;
  }

  // ── 辅助方法（供四化体系与十二神使用）──────────────────────────────────

  /** 取当前日期的运限盘（horoscope） */
  getHoroscope(dateStr) {
    if (!this.chart) return null;
    try {
      if (dateStr) return this.chart.horoscope(dateStr);
      if (this._horoscope) return this._horoscope;
      const today = new Date();
      const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      this._horoscope = this.chart.horoscope(ds);
      return this._horoscope;
    } catch (error) {
      console.error('获取运限盘失败:', error);
      return null;
    }
  }

  /** 地支字 → 索引（0=子 … 11=亥）；非法返回 -1 */
  getBranchIndex(zhi) {
    return ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].indexOf(zhi);
  }

  /**
   * 某宫地支索引处的将前神序（0=将星）。
   * 将星落于【生年支】的三合帝旺位，其后十一神顺行 ——
   * 注意起点是生年支，不是该宫自身地支。
   * @param {number} branchIndex 该宫地支索引
   * @param {number} yearBranchIndex 生年支索引
   */
  getJiangQianIndex(branchIndex, yearBranchIndex) {
    if (branchIndex < 0) return 0;
    // 将星落宫 = 三合帝旺位（申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯）
    const start = [0, 9, 6, 3][normalizeBranch(yearBranchIndex) % 4];
    return (branchIndex - start + 12) % 12;
  }

  /**
   * 某宫地支索引处的岁前神序（0=岁建）。
   * 岁建落于【生年支】宫，其后十一神顺行。
   * @param {number} branchIndex 该宫地支索引
   * @param {number} yearBranchIndex 生年支索引
   */
  getSuiQianIndex(branchIndex, yearBranchIndex) {
    if (branchIndex < 0) return 0;
    return (branchIndex - normalizeBranch(yearBranchIndex) + 12) % 12;
  }

  /** 某颗星落在哪个宫（返回宫名，未找到返回空串） */
  findStarPalace(starName) {
    if (!starName || !this.chart?.palaces) return '';
    for (const palace of this.chart.palaces) {
      const names = [
        ...(palace.majorStars || []).map(s => s.name),
        ...(palace.minorStars || []).map(s => s.name),
        ...(palace.adjectiveStars || []).map(s => s.name)
      ];
      if (names.includes(starName)) return palace.name;
    }
    return '';
  }

  /** 按大限索引取大限宫干四化（附带宫位与地支） */
  getDaXianSiHuaByIndex(dxIndex) {
    const raw = getDaXianSiHua(this.chart, dxIndex);
    if (!raw) return null;
    const palace = this.chart.palaces[dxIndex];
    return {
      ...raw,
      宫位: palace?.name || '',
      地支: palace?.earthlyBranch || ''
    };
  }

  /** 取农历月（1-12），用于流月五虎遁 */
  getLunarMonth() {
    try {
      const lunar = this.chart?.lunarDate;
      if (typeof lunar === 'string') {
        const m = lunar.match(/月/);
        if (m) {
          const idx = lunar.indexOf('月');
          const prefix = lunar.slice(0, idx);
          const cn = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
          const pos = cn.findIndex(c => prefix.endsWith(c) || prefix.includes(c + '月'));
          if (pos >= 0) return pos + 1;
        }
      }
    } catch (e) { /* ignore */ }
    return 1;
  }

  /** 取日干索引（0-9），无法确定返回 -1 */
  getDayStemIndex() {
    const daily = this.chart?.rawDates?.chineseDate?.daily;
    if (Array.isArray(daily) && daily[0]) {
      return ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(daily[0]);
    }
    return -1;
  }

  analyze() {
    try {
      if (!this.chart) {
        return {
          error: '命盘生成失败',
          十二宫: [],
          四化: null,
          命宫分析: {},
          当前大限: null,
          关键星曜: [],
          整体格局: { 吉格: [], 凶格: [] },
          综合评价: '命盘生成失败'
        };
      }

      const palaces = this.getPalaceAnalysis() || [];
      const sihua = this.getSihuaAnalysis() || {};
      const mingGong = this.getMingGongAnalysis() || {};
      const daxian = this.getDaxianAnalysis() || {};
      const keyStars = this.getKeyStars() || [];

      return {
        命盘: this.chart,
        fullChart: this.chart,
        十二宫: palaces,
        四化: sihua,
        命宫分析: mingGong,
        当前大限: daxian,
        关键星曜: keyStars,
        整体格局: this.analyzePatterns() || { 吉格: [], 凶格: [] },
        综合评价: this.generateSummary(mingGong, palaces) || '分析完成',
        // ── 新增：多层四化体系与十二神 ──────────────────────────────────
        四化体系: this.getSihuaSystem() || null,
        十二神: this.getShierShen() || null,
        排盘信息: this.getChartMeta() || null
      };
    } catch (e) {
      console.error('ZiweiAnalyzer.analyze crash:', e);
      return { error: e.message, 十二宫: [], 整体格局: { 吉格: [], 凶格: [] } };
    }
  }

  /**
   * 排盘元信息：排盘日、是否晚子时、所用换日流派、真太阳时校正量。
   */
  getChartMeta() {
    const tst = this.真太阳时信息;
    return {
      排盘日: `${this.排盘日.year}-${String(this.排盘日.month).padStart(2, '0')}-${String(this.排盘日.day).padStart(2, '0')}`,
      是否晚子时: this.是否晚子时,
      晚子时规则: this.晚子时规则,
      时辰索引: this.时辰索引,
      真太阳时: tst ? {
        已校正: tst.corrected,
        经度修正分钟: Math.round(tst.longitudeCorrectionMinutes),
        均时差分钟: Math.round(tst.equationOfTimeMinutes),
        总校正分钟: Math.round(tst.totalCorrectionMinutes),
        校正后时刻: `${String(tst.hour).padStart(2, '0')}:${String(tst.minute).padStart(2, '0')}`
      } : null
    };
  }

  /**
   * 多层四化体系。
   * 本命（生年干）· 大限宫干 · 流年干 · 流月干（五虎遁）· 流日干 · 流时干（五鼠遁）
   * + 宫干自化 + 来因宫 + 星曜四化叠加表。
   */
  getSihuaSystem() {
    if (!this.chart) return null;

    try {
      const yearGan = this.getYearGan();
      const yearStemIndex = getYearStemIndex(this.排盘日.year);
      const yearBranchIndex = getYearBranchIndex(this.排盘日.year);

      // ── 本命四化（生年干）──────────────────────────────────────────
      const benming = getSiHuaByStem(yearStemIndex);
      const benmingMap = buildStarSiHuaMap(yearStemIndex);
      const 本命条目 = SI_HUA_TYPES.map(type => ({
        类型: type,
        星曜: benming[type],
        落宫: this.findStarPalace(benming[type]),
        性质: SIHUA_SYSTEM.types[`化${type}`]?.性质 || '',
        作用: SIHUA_SYSTEM.types[`化${type}`]?.作用 || ''
      }));

      // ── 大限宫干四化 ───────────────────────────────────────────────
      const horoscope = this.getHoroscope();
      const decadal = horoscope?.decadal;
      const 大限宫干 = decadal ? this.getDaXianSiHuaByIndex(decadal.index) : null;
      const 大限条目 = 大限宫干
        ? SI_HUA_TYPES.map(type => ({
          类型: type,
          星曜: 大限宫干.transforms[type],
          落宫: this.findStarPalace(大限宫干.transforms[type]),
          性质: SIHUA_SYSTEM.types[`化${type}`]?.性质 || '',
          作用: SIHUA_SYSTEM.types[`化${type}`]?.作用 || ''
        })).filter(e => e.星曜)
        : [];

      // ── 流年 / 流月 / 流日 / 流时四化 ───────────────────────────────
      const 流年 = getLiuNianSiHua(this.排盘日.year);
      const 流月 = getLiuYueSiHua(yearStemIndex, this.getLunarMonth());
      const 日干索引 = this.getDayStemIndex();
      const 流日 = 日干索引 >= 0 ? getLiuRiSiHua(日干索引) : null;
      const 流时 = 日干索引 >= 0 ? getLiuShiSiHua(日干索引, this.时辰索引) : null;

      const toEntries = (transforms) => SI_HUA_TYPES.map(type => ({
        类型: type,
        星曜: transforms?.[type] || '',
        落宫: this.findStarPalace(transforms?.[type]),
        性质: SIHUA_SYSTEM.types[`化${type}`]?.性质 || '',
        作用: SIHUA_SYSTEM.types[`化${type}`]?.作用 || ''
      })).filter(e => e.星曜);

      // ── 宫干自化 + 来因宫 ──────────────────────────────────────────
      const 自化 = buildAllSelfSihua(this.chart);
      const 来因宫 = buildIncomingPalaceMap(this.chart);

      // ── 星曜四化叠加表 ─────────────────────────────────────────────
      const 叠加表 = buildOverlayTable(this.chart, {
        本命: benmingMap,
        大限: 大限宫干 ? transformsToMap(大限宫干.transforms) : undefined,
        流年: transformsToMap(流年.transforms),
        流月: transformsToMap(流月.transforms),
        流日: 流日 ? transformsToMap(流日.transforms) : undefined,
        流时: 流时 ? transformsToMap(流时.transforms) : undefined
      });

      return {
        本命: { 年干: yearGan, 天干索引: yearStemIndex, 条目: 本命条目 },
        大限: 大限宫干 ? { 宫干: 大限宫干.stemName, 宫位: 大限宫干.宫位, 地支: 大限宫干.地支, 条目: 大限条目 } : null,
        流年: { 天干: 流年.stemName, 条目: toEntries(流年.transforms) },
        流月: { 天干: 流月.stemName, 农历月: 流月.month, 条目: toEntries(流月.transforms) },
        流日: 流日 ? { 天干: 流日.stemName, 条目: toEntries(流日.transforms) } : null,
        流时: 流时 ? { 天干: 流时.stemName, 条目: toEntries(流时.transforms) } : null,
        宫干自化: 自化,
        来因宫,
        叠加表,
        年支索引: yearBranchIndex
      };
    } catch (error) {
      console.error('获取四化体系失败:', error);
      return null;
    }
  }

  /**
   * 十二神体系：本命态（将前 / 岁前 / 博士）+ 运限跟随层。
   * iztro 原生只给本命态；大限 / 流年 / 流月 / 流日 / 流时各自起一组，
   * 起点是该运限的地支 —— 这是主流排盘的完整口径。
   */
  getShierShen() {
    if (!this.chart) return null;

    try {
      const yearGan = this.getYearGan();
      const yearStemIndex = getYearStemIndex(this.排盘日.year);
      const yearBranchIndex = getYearBranchIndex(this.排盘日.year);

      // 本命态：iztro 原生已提供，但其岁前第 7 位写「大耗」、博士第 12 位写「官府」，
      // 主流盘面用「岁破」「官符」，此处统一按主流用字重算。
      const 博士序 = boshiShenByStem(yearStemIndex, this.gender);
      const 本命态 = this.chart.palaces.map(palace => {
        const b = this.getBranchIndex(palace.earthlyBranch);
        return {
          宫位: palace.name,
          地支: palace.earthlyBranch,
          将前: JIANG_QIAN_SHEN[this.getJiangQianIndex(b, yearBranchIndex)],
          岁前: SUI_QIAN_SHEN[this.getSuiQianIndex(b, yearBranchIndex)],
          博士: BOSHI_SHEN[博士序[b]],
          原生将前: palace.jiangqian12,
          原生岁前: palace.suiqian12,
          原生博士: palace.boshi12
        };
      });

      // 运限跟随层
      const horoscope = this.getHoroscope();
      const layerBranches = {};
      if (horoscope?.decadal) layerBranches.大限 = this.getBranchIndex(horoscope.decadal.earthlyBranch);
      if (horoscope?.yearly) layerBranches.流年 = this.getBranchIndex(horoscope.yearly.earthlyBranch);
      if (horoscope?.monthly) layerBranches.流月 = this.getBranchIndex(horoscope.monthly.earthlyBranch);
      if (horoscope?.daily) layerBranches.流日 = this.getBranchIndex(horoscope.daily.earthlyBranch);
      if (horoscope?.hourly) layerBranches.流时 = this.getBranchIndex(horoscope.hourly.earthlyBranch);

      const layers = buildYunXianShierShenLayers(layerBranches);
      const perPalace = attachShierShenToPalaces(this.chart, layerBranches);

      return {
        年干: yearGan,
        年支: this.getYearZhi(),
        本命态,
        运限跟随: Object.fromEntries(
          Object.entries(perPalace).map(([layer, map]) => [
            layer,
            {
              起支地支: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][layerBranches[layer]],
              宫位: map
            }
          ])
        ),
        含义: SHIER_SHEN_MEANING
      };
    } catch (error) {
      console.error('获取十二神失败:', error);
      return null;
    }
  }

  getPalaceAnalysis() {
    if (!this.chart) return [];

    const palaces = [];
    const palaceOrder = ZIWEI_PALACE_SYSTEM.palaceOrder;

    try {
      // 尝试获取各宫位信息
      palaceOrder.forEach((palaceName, index) => {
        try {
          const palace = this.getPalaceByName(palaceName);
          if (palace) {
            const mainStars = palace.majorStars?.map(s => s.name) || [];
            const minorStars = palace.minorStars?.map(s => s.name) || [];
            const adjStars = palace.adjectiveStars?.map(s => s.name) || [];

            // 评估宫位吉凶
            const jixing = this.evaluatePalaceStars(mainStars.concat(minorStars, adjStars));

            palaces.push({
              宫位: palaceName,
              主星: mainStars,
              辅星: minorStars.concat(adjStars),
              地支: palace.earthlyBranch || '',
              天干: palace.heavenlyStem || '',
              吉凶: jixing,
              解读: this.interpretPalace(palaceName, mainStars, jixing),
              ...ZIWEI_PALACE_SYSTEM.palaces[palaceName]
            });
          }
        } catch (e) {
          // 单个宫位获取失败，跳过
          palaces.push({
            宫位: palaceName,
            主星: [],
            辅星: [],
            吉凶: '平',
            解读: '信息获取中...',
            ...ZIWEI_PALACE_SYSTEM.palaces[palaceName]
          });
        }
      });
    } catch (error) {
      console.error('获取宫位分析失败:', error);
    }

    return palaces;
  }

  evaluatePalaceStars(stars) {
    let score = 0;
    stars.forEach(star => {
      const mainStar = ZIWEI_STAR_TRAITS.mainStars[star];
      const supportStar = ZIWEI_STAR_TRAITS.supportStars[star];

      if (supportStar) {
        score += supportStar.类型 === '吉星' ? 1 : -1;
      }
      if (mainStar) {
        // 主星默认中性，根据性质调整
        if (['帝星', '财星', '福星', '库星', '贵星'].includes(mainStar.性质)) {
          score += 0.5;
        } else if (['囚星', '暗星', '耗星'].includes(mainStar.性质)) {
          score -= 0.3;
        }
      }
    });

    if (score >= 2) return '大吉';
    if (score >= 1) return '吉';
    if (score <= -2) return '凶';
    if (score <= -1) return '小凶';
    return '平';
  }

  interpretPalace(palaceName, mainStars, jixing) {
    if (mainStars.length === 0) {
      if (palaceName === '命宫') return '命宫无主星，为借星安宫，性格受对宫（迁移宫）影响较大。命运可塑性强，随环境而变。';
      return `此宫无主星坐守，运势受对宫影响较大，${jixing === '凶' ? '需特别注意借力' : '可借对宫吉气'}`;
    }

    const starNames = mainStars.join('、');

    // 使用新的上下文解读引擎
    try {
      if (ZIWEI_INTERPRETATION_MAP && ZIWEI_INTERPRETATION_MAP.keywords) {
        // 双星情况
        if (mainStars.length > 1) {
          const s1 = mainStars[0];
          const s2 = mainStars[1];
          const kw1 = ZIWEI_INTERPRETATION_MAP.keywords[s1]?.[palaceName] || '';
          const kw2 = ZIWEI_INTERPRETATION_MAP.keywords[s2]?.[palaceName] || '';

          if (kw1 && kw2) {
            return `多星汇聚，情况复杂。既有${s1}的${kw1.split('，')[0]}特质，也兼具${s2}的${kw2.split('，')[0]}影响。需平衡两者能量。`;
          }
        }

        // 单星情况
        const star = mainStars[0];
        const keyword = ZIWEI_INTERPRETATION_MAP.keywords[star]?.[palaceName];
        if (keyword) {
          return `${starNames}坐${palaceName}，主${keyword}`;
        }
      }
    } catch (e) {
      console.warn('解读生成失败，回退到基础模式', e);
    }

    // 回退到基础模式
    const palaceInfo = ZIWEI_PALACE_SYSTEM.palaces[palaceName];
    const jixingDesc = {
      '大吉': '运势极佳，诸事顺遂',
      '吉': '运势良好，多有助力',
      '平': '运势平稳，按部就班',
      '小凶': '运势略差，需注意防范',
      '凶': '运势欠佳，宜谨慎行事'
    };

    return `${starNames}坐${palaceName}，${palaceInfo?.主题}方面${jixingDesc[jixing] || '平稳'}`;
  }

  /**
   * 取生年天干。
   * 注意：iztro 的 chart.chineseDate 是**字符串**（如 "庚午 辛巳 庚辰 己卯"），
   * 不是对象 —— 直接取 chineseDate.heavenlyStem 恒为 undefined。
   * 可靠来源是 rawDates.chineseDate.yearly（[天干, 地支]）。
   */
  getYearGan() {
    const yearly = this.chart?.rawDates?.chineseDate?.yearly;
    if (Array.isArray(yearly) && yearly[0]) return yearly[0];
    // 兜底：从 chineseDate 字符串首段解析
    const str = typeof this.chart?.chineseDate === 'string' ? this.chart.chineseDate : '';
    const first = str.split(/[\s-]+/)[0] || '';
    return first.length === 1 ? first : '';
  }

  /** 取生年地支 */
  getYearZhi() {
    const yearly = this.chart?.rawDates?.chineseDate?.yearly;
    if (Array.isArray(yearly) && yearly[1]) return yearly[1];
    const str = typeof this.chart?.chineseDate === 'string' ? this.chart.chineseDate : '';
    const first = str.split(/[\s-]+/)[0] || '';
    return first.length === 2 ? first[1] : '';
  }

  /**
   * 四化分析：本命 + 大限宫干 + 流年 + 流月 + 流日 + 流时 多层叠合，
   * 另含宫干自化与来因宫追溯。
   */
  getSihuaAnalysis() {
    if (!this.chart) return null;

    try {
      const yearGan = this.getYearGan();
      const sihuaConfig = SIHUA_SYSTEM.tianganSihua[yearGan];

      if (!sihuaConfig) return { 年干: yearGan, 四化: [] };

      const sihuaList = [
        { 类型: '化禄', 星曜: sihuaConfig.化禄, ...SIHUA_SYSTEM.types['化禄'] },
        { 类型: '化权', 星曜: sihuaConfig.化权, ...SIHUA_SYSTEM.types['化权'] },
        { 类型: '化科', 星曜: sihuaConfig.化科, ...SIHUA_SYSTEM.types['化科'] },
        { 类型: '化忌', 星曜: sihuaConfig.化忌, ...SIHUA_SYSTEM.types['化忌'] }
      ];

      return {
        年干: yearGan,
        四化: sihuaList
      };
    } catch (error) {
      console.error('获取四化分析失败:', error);
      return null;
    }
  }

  getMingGongAnalysis() {
    if (!this.chart) return null;

    try {
      const mingGong = this.getPalaceByName('命宫');
      if (!mingGong) return null;

      const mainStars = mingGong.majorStars?.map(s => ({
        名称: s.name,
        ...ZIWEI_STAR_TRAITS.mainStars[s.name]
      })) || [];

      // 获取命宫特质
      const traits = [];
      const careers = [];

      mainStars.forEach(star => {
        if (star.特质) traits.push(...star.特质);
        if (star.事业) careers.push(star.事业);
      });

      return {
        主星: mainStars,
        特质: [...new Set(traits)],
        事业方向: [...new Set(careers)],
        命格评价: this.evaluateMingGong(mainStars?.map(s => s.名称)),
        // 新增详细分析字段
        详细分析: this.getDetailedMingGongAnalysis(mainStars?.map(s => s.名称))
      };
    } catch (error) {
      console.error('获取命宫分析失败:', error);
      return null;
    }
  }

  // 获取详细的命宫分析对象
  getDetailedMingGongAnalysis(starNames) {    if (!starNames || starNames.length === 0) {
      return {
        核心性格: '你的命宫无主星（命无正曜）。这就像一张白纸，你的性格可塑性极强，很容易受到环境和周围人的影响。你擅长观察和适应，但也可能缺乏坚定的主见。',
        阴影面: '容易随波逐流，或者过度在意他人的看法而迷失自己。',
        人生主题: '适应与借力'
      };
    }

    const s1 = starNames[0];
    const s2 = starNames[1]; // 可能 undefined

    // 尝试获取双星组合
    if (s2) {
      const comboKey = `${s1}${s2}` in STAR_COMBINATION_SYSTEM.双星组合 ? `${s1}${s2}` : `${s2}${s1}`;
      const combo = STAR_COMBINATION_SYSTEM.双星组合[comboKey];

      if (combo) {
        return {
          核心性格: combo.通俗解读,
          阴影面: `虽然${combo.优点[0]}，但${combo.缺点[0]}。需要警惕${combo.缺点[1] || '过犹不及'}。`,
          人生主题: combo.性格
        };
      }
    }

    // 单星分析
    const core = ZIWEI_INTERPRETATION_MAP.keywords[s1]?.核心 || '独特';
    const trait = ZIWEI_INTERPRETATION_MAP.keywords[s1]?.命宫 || '';
    const basicInfo = ZIWEI_STAR_TRAITS.mainStars[s1];

    return {
      核心性格: `你的核心是「${core}」。${trait}，${basicInfo?.特质?.[0] || ''}是你最显著的标签。`,
      阴影面: `光芒背后必有阴影。作为${s1}坐命，你可能容易${basicInfo?.缺点?.[0] || '固执'}，或者在压力下变得${basicInfo?.缺点?.[1] || '焦虑'}。`,
      人生主题: core.split('/')[1] || core
    };
  }

  evaluateMingGong(starNames) {
    if (!starNames || starNames.length === 0) return '命宫无主星，命运多变';

    const s1 = starNames[0];
    const s2 = starNames[1];

    if (s2) {
      // 双星
      const comboKey = `${s1}${s2}` in STAR_COMBINATION_SYSTEM.双星组合 ? `${s1}${s2}` : `${s2}${s1}`;
      const combo = STAR_COMBINATION_SYSTEM.双星组合[comboKey];
      if (combo) return `命坐${s1}${s2}，${combo.性格}`;
      return `命坐${s1}、${s2}，双星辉映`;
    }

    const traits = ZIWEI_STAR_TRAITS.mainStars[s1];
    if (!traits) return '个性独特';

    return `命坐${s1}，${traits.性质}，${traits.特质?.slice(0, 2).join('、')}`;
  }

  // 解析五行局起运岁数：水二局 木三局 金四局 土五局 火六局
  getBureauStartAge() {
    const bureauStr = this.chart?.fiveElementsClass || '';
    const bureauMap = { '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };
    for (const [ch, num] of Object.entries(bureauMap)) {
      if (bureauStr.includes(ch)) return num;
    }
    return 5;
  }

  getDaxianAnalysis() {
    if (!this.chart) return null;

    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const age = currentYear - this.birthYear;

      // iztro horoscope 只接受日期字符串或 Date 对象（传数字年份会抛 date.split is not a function）
      const dateStr = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const horoscope = this.chart.horoscope(dateStr);
      const decadal = horoscope?.decadal;

      if (decadal) {
        // 大限宫位取自 decadal.palaceNames[decadal.index]
        const palaceName = decadal.palaceNames?.[decadal.index] || '命宫';
        // 大限岁数：起运岁数 + 大限序号 × 10
        const startAge = this.getBureauStartAge() + decadal.index * 10;
        return {
          岁数范围: `${startAge}-${startAge + 9}岁`,
          宫位: palaceName,
          干支: `${decadal.heavenlyStem || ''}${decadal.earthlyBranch || ''}`,
          四化: decadal.mutagen || [],
          当前年龄: age
        };
      }

      return { 当前年龄: age, 宫位: '待计算' };
    } catch (error) {
      console.error('获取大限分析失败:', error);
      return { 当前年龄: new Date().getFullYear() - this.birthYear };
    }
  }

  getKeyStars() {
    if (!this.chart) return [];

    const keyStars = [];

    try {
      // 检查各宫是否有特殊星曜
      ['命宫', '财帛宫', '官禄宫', '夫妻宫'].forEach(palaceName => {
        const palace = this.getPalaceByName(palaceName);
        if (palace) {
          const allStars = [
            ...(palace.majorStars?.map(s => s.name) || []),
            ...(palace.minorStars?.map(s => s.name) || [])
          ];

          // 检查吉星
          ['左辅', '右弼', '天魁', '天钺', '禄存', '天马'].forEach(star => {
            if (allStars.includes(star)) {
              keyStars.push({
                星曜: star,
                宫位: palaceName,
                类型: '吉星',
                作用: ZIWEI_STAR_TRAITS.supportStars[star]?.作用 || ''
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('获取关键星曜失败:', error);
    }

    return keyStars;
  }

  generateSummary(mingGong, palaces) {
    const summaryParts = [];

    if (mingGong?.命格评价) {
      summaryParts.push(mingGong.命格评价);
    }

    // 找出最好和最需注意的宫位
    const goodPalaces = palaces.filter(p => ['大吉', '吉'].includes(p.吉凶));
    const badPalaces = palaces.filter(p => ['凶', '小凶'].includes(p.吉凶));

    if (goodPalaces.length > 0) {
      summaryParts.push(`${goodPalaces[0].宫位}运势较佳`);
    }
    if (badPalaces.length > 0) {
      summaryParts.push(`${badPalaces[0].宫位}需留意`);
    }

    return summaryParts.join('，') || '请详细查看各宫位分析';
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 新增：星曜角色化分析
  // ════════════════════════════════════════════════════════════════════════════

  analyzeStarCharacters(wuxingBalance, dominantShishen) {
    if (!this.chart) return [];

    const characterAnalysis = [];
    const dominantWuxing = this.getDominantWuxing(wuxingBalance);
    const terrain = WUXING_TERRAIN_SYSTEM.terrains[dominantWuxing];

    try {
      // 获取命宫主星
      const mingGong = this.getPalaceByName('命宫');
      if (mingGong?.majorStars) {
        mingGong.majorStars.forEach(star => {
          const character = STAR_CHARACTER_SYSTEM.characters[star.name];
          if (character) {
            // 计算环境适应度
            const terrainEffect = character.环境适应?.[dominantWuxing] || { 修正: 0, 说明: '无特殊影响' };

            // 计算十神互动
            const shishenEffect = character.十神互动?.[dominantShishen] || { 效果: '无特殊互动', 加成: 0 };

            // 总体能力值计算
            const baseScore = 60;
            const finalScore = Math.max(0, Math.min(100, baseScore + terrainEffect.修正 + shishenEffect.加成));

            characterAnalysis.push({
              名称: star.name, // Standardized Name
              星曜: star.name,
              角色: character.角色定位,
              别名: character.别名,
              icon: character.icon,
              行为模式: character.行为模式,
              性格标签: character.性格标签,
              人生舞台: character.人生舞台, // Standardized
              舞台: character.人生舞台,
              环境效果: {
                地形: terrain?.地形名 || dominantWuxing,
                修正: terrainEffect.修正,
                说明: terrainEffect.说明
              },
              十神效果: shishenEffect,
              能力值: finalScore,
              状态: finalScore >= 75 ? '如鱼得水' : finalScore >= 50 ? '正常发挥' : '受到压制'
            });
          }
        });
      }
    } catch (error) {
      console.error('星曜角色分析失败:', error);
    }

    return characterAnalysis;
  }

  getDominantWuxing(wuxingBalance) {
    if (!wuxingBalance) return '土';

    const sorted = Object.entries(wuxingBalance)
      .sort((a, b) => b[1] - a[1]);

    return sorted[0]?.[0] || '土';
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 新增：人生地图生成 - 星曜x环境的交互地图
  // ════════════════════════════════════════════════════════════════════════════

  generateLifeMap(wuxingBalance, shishenDist) {
    const dominantWuxing = this.getDominantWuxing(wuxingBalance);
    const terrain = WUXING_TERRAIN_SYSTEM.terrains[dominantWuxing];
    const dominantShishen = this.getDominantShishen(shishenDist);
    const forceField = this.getForceField(dominantShishen);

    // 获取命宫主星
    let mingStars = [];
    try {
      const mingGong = this.getPalaceByName('命宫');
      mingStars = mingGong?.majorStars?.map(s => s.name) || [];
    } catch (e) {
      console.error('获取命宫主星失败');
    }

    return {
      地形环境: {
        主导五行: dominantWuxing,
        地形名称: terrain?.地形名 || '未知地形',
        icon: terrain?.icon || '🌍',
        色调: terrain?.色调 || 'from-slate-800 to-slate-900',
        边框色: terrain?.borderColor || 'border-slate-600',
        特性: terrain?.特性 || [],
        描述: terrain?.环境描述 || '',
        有利星曜: terrain?.有利星曜 || [],
        不利星曜: terrain?.不利星曜 || []
      },
      势力场: {
        场域名称: forceField?.场域名称 || '中性场',
        主宰十神: forceField?.主宰 || [],
        icon: forceField?.icon || '⚪',
        效果: forceField?.场域效果 || '',
        有利星曜: forceField?.有利星曜 || [],
        描述: forceField?.环境描述 || ''
      },
      星曜角色: mingStars.map(star => {
        const char = STAR_CHARACTER_SYSTEM.characters[star];
        return {
          名称: star,
          角色: char?.角色定位 || '待定',
          icon: char?.icon || '⭐',
          行为: char?.行为模式?.slice(0, 2) || [],
          适应性: this.calculateAdaptability(star, dominantWuxing, dominantShishen)
        };
      }),
      地图评语: this.generateMapSummary(terrain, forceField, mingStars)
    };
  }

  getDominantShishen(shishenDist) {
    if (!shishenDist) return '比肩';

    const sorted = Object.entries(shishenDist)
      .filter(([k]) => k !== '比肩')
      .sort((a, b) => b[1] - a[1]);

    return sorted[0]?.[0] || '比肩';
  }

  getForceField(dominantShishen) {
    for (const [fieldName, field] of Object.entries(SHISHEN_FORCE_FIELD.fields)) {
      if (field.主宰.includes(dominantShishen)) {
        return { 场域名称: fieldName, ...field };
      }
    }
    return { 场域名称: '中性场', 主宰: [], icon: '⚪', 场域效果: '无特殊影响' };
  }

  calculateAdaptability(star, wuxing, shishen) {
    const char = STAR_CHARACTER_SYSTEM.characters[star];
    if (!char) return { 分数: 50, 等级: '普通' };

    const terrainMod = char.环境适应?.[wuxing]?.修正 || 0;
    const shishenMod = char.十神互动?.[shishen]?.加成 || 0;
    const score = Math.max(0, Math.min(100, 60 + terrainMod + shishenMod));

    let level = '普通';
    if (score >= 85) level = '极佳';
    else if (score >= 70) level = '良好';
    else if (score >= 50) level = '普通';
    else if (score >= 30) level = '受阻';
    else level = '困难';

    return { 分数: score, 等级: level };
  }

  generateMapSummary(terrain, forceField, stars) {
    const parts = [];

    if (terrain) {
      parts.push(`您的人生舞台是「${terrain.地形名}」，${terrain.特性?.slice(0, 2).join('、')}是主调`);
    }

    if (forceField?.场域名称) {
      parts.push(`处于「${forceField.场域名称}」势力范围`);
    }

    if (stars.length > 0) {
      const mainStar = stars[0];
      const char = STAR_CHARACTER_SYSTEM.characters[mainStar];
      if (char) {
        parts.push(`命主星曜「${mainStar}」扮演${char.角色定位}角色`);
      }
    }

    return parts.join('，') + '。';
  }

  // 分析命盘格局
  analyzePatterns() {
    const patterns = { 吉格: [], 凶格: [] };
    if (!this.chart) return patterns;

    try {
      const mingGong = this.getPalaceByName('命宫');
      const mingStars = mingGong?.majorStars?.map(s => s.name) || [];
      const mingMinorStars = mingGong?.minorStars?.map(s => s.name) || [];
      const allMingStars = [...mingStars, ...mingMinorStars];

      // 检查吉格
      // 君臣庆会
      if (mingStars.includes('紫微') &&
        (allMingStars.includes('左辅') || allMingStars.includes('右弼'))) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['君臣庆会'], 名称: '君臣庆会' });
      }

      // 模拟三方四正 (本宫 + 对宫)
      const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const currentIdx = branches.indexOf(mingGong?.earthlyBranch);
      const oppositeIdx = (currentIdx + 6) % 12;
      const oppositeBranch = branches[oppositeIdx];
      let oppositeStars = [];
      for (const pName of ZIWEI_PALACE_SYSTEM.palaceOrder) {
        const p = this.getPalaceByName(pName);
        if (p?.earthlyBranch === oppositeBranch) {
          oppositeStars = [...(p.majorStars?.map(s => s.name) || []), ...(p.minorStars?.map(s => s.name) || [])];
          break;
        }
      }
      const focusStars = [...new Set([...allMingStars, ...oppositeStars])];

      // 检查吉格
      // 君臣庆会
      if (focusStars.includes('紫微') && (focusStars.includes('左辅') || focusStars.includes('右弼'))) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['君臣庆会'], 名称: '君臣庆会' });
      }

      // 紫府朝垣
      if (focusStars.includes('紫微') && focusStars.includes('天府')) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['紫府朝垣'], 名称: '紫府朝垣' });
      }

      // 杀破狼格
      if (['七杀', '破军', '贪狼'].some(s => mingStars.includes(s))) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['杀破狼格'], 名称: '杀破狼格' });
      }

      // 阳梁昌禄
      if (['太阳', '天梁', '文昌', '禄存'].every(s => focusStars.includes(s))) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['阳梁昌禄'], 名称: '阳梁昌禄' });
      }

      // 日出扶桑 (太阳在卯宫)
      if (mingStars.includes('太阳') && mingGong?.earthlyBranch === '卯') {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['日出扶桑'], 名称: '日出扶桑' });
      }

      // 机月同梁
      if (['天机', '太阴', '天同', '天梁'].every(s => focusStars.includes(s))) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['机月同梁'], 名称: '机月同梁' });
      }

      // 府相朝垣
      if (focusStars.includes('天府') && focusStars.includes('天相')) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['府相朝垣'], 名称: '府相朝垣' });
      }

      // 武曲贪狼
      if (mingStars.includes('武曲') && mingStars.includes('贪狼')) {
        patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['贪武同行'], 名称: '贪武同行' });
      }

      // 火贪格/铃贪格
      if (mingStars.includes('贪狼')) {
        if (allMingStars.includes('火星')) patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['火贪格'], 名称: '火贪格' });
        if (allMingStars.includes('铃星')) patterns.吉格.push({ ...ZIWEI_PATTERN_SYSTEM.吉格['铃贪格'], 名称: '铃贪格' });
      }

      // 检查凶格
      // 命无正曜
      if (mingStars.length === 0) {
        patterns.凶格.push({ ...ZIWEI_PATTERN_SYSTEM.凶格['命无正曜'], 名称: '命无正曜' });
      }

      // 巨逢四煞
      const siSha = ['擎羊', '陀罗', '火星', '铃星'];
      if (mingStars.includes('巨门') && siSha.some(s => allMingStars.includes(s))) {
        patterns.凶格.push({ ...ZIWEI_PATTERN_SYSTEM.凶格['巨逢四煞'], 名称: '巨逢四煞' });
      }

    } catch (error) {
      console.error('格局分析失败:', error);
    }

    return patterns;
  }

  // 分析星曜组合
  analyzeCombinations() {
    const combinations = [];
    if (!this.chart) return combinations;

    try {
      const mingGong = this.getPalaceByName('命宫');
      const mingStars = mingGong?.majorStars?.map(s => s.name) || [];

      // 检查双星组合
      const comboPairs = [
        ['紫微', '天府'], ['紫微', '天相'], ['紫微', '七杀'], ['紫微', '破军'],
        ['武曲', '天府'], ['武曲', '贪狼'], ['天机', '巨门'], ['天同', '太阴'],
        ['太阳', '太阴'], ['廉贞', '天府']
      ];

      for (const [star1, star2] of comboPairs) {
        if (mingStars.includes(star1) && mingStars.includes(star2)) {
          const comboKey = star1 + star2;
          const combo = STAR_COMBINATION_SYSTEM.双星组合[comboKey];
          if (combo) {
            combinations.push({ 名称: comboKey, ...combo });
          }
        }
      }

    } catch (error) {
      console.error('组合分析失败:', error);
    }

    return combinations;
  }

  // 分析流年运势
  analyzeLiunian(targetYear) {
    if (!this.chart) return null;

    const currentYear = new Date().getFullYear();
    const year = targetYear || currentYear;

    try {
      // 获取流年命盘（iztro horoscope 只接受日期字符串或 Date 对象）
      const liunianChart = this.chart.horoscope(`${year}-01-01`);
      if (!liunianChart) return null;

      // 获取流年四化
      const liunianSihua = this.getLiunianSihua(year);

      // 分析流年各宫
      const palaceAnalysis = this.analyzeLiunianPalaces(liunianChart);

      // 生成流年解读
      const interpretation = this.interpretLiunian(year, palaceAnalysis, liunianSihua);

      return {
        年份: year,
        流年四化: liunianSihua,
        宫位分析: palaceAnalysis,
        综合解读: interpretation,
        关键提示: this.getLiunianTips(palaceAnalysis)
      };
    } catch (error) {
      console.error('流年分析失败:', error);
      return null;
    }
  }

  getLiunianSihua(year) {
    // 根据流年天干确定四化
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const ganIndex = (year - 4) % 10;
    const gan = tianGan[ganIndex];

    const sihuaByGan = SIHUA_SYSTEM?.tianganSihua?.[gan];
    if (!sihuaByGan) return { 天干: gan, 四化: [] };

    return {
      天干: gan,
      化禄: sihuaByGan.化禄,
      化权: sihuaByGan.化权,
      化科: sihuaByGan.化科,
      化忌: sihuaByGan.化忌
    };
  }

  analyzeLiunianPalaces(liunianChart) {
    const analysis = {};
    const keyPalaces = ['命宫', '官禄宫', '财帛宫', '夫妻宫', '疾厄宫'];

    // 流年把十二宫名重新映射到本命十二宫上。
    // iztro 的宫名列表里只有「命宫」带「宫」字（财帛/官禄/夫妻…均不带），因此两种写法都要试。
    const yearlyNames = liunianChart?.yearly?.palaceNames || [];
    const natalPalaces = liunianChart?.astrolabe?.palaces || this.chart?.palaces || [];

    keyPalaces.forEach(palaceName => {
      try {
        const pos = yearlyNames.indexOf(palaceName) >= 0
          ? yearlyNames.indexOf(palaceName)
          : yearlyNames.indexOf(palaceName.replace(/宫$/, ''));
        const palace = pos >= 0
          ? natalPalaces[pos]
          : this.getPalaceByName(palaceName, liunianChart?.astrolabe);

        if (palace) {
          const stars = palace.majorStars?.map(s => s.name) || [];
          analysis[palaceName] = {
            主星: stars,
            吉凶: this.evaluatePalaceStars(stars),
            简评: this.getPalaceQuickComment(palaceName, stars)
          };
        }
      } catch (e) {
        analysis[palaceName] = { 主星: [], 吉凶: '平', 简评: '待分析' };
      }
    });

    return analysis;
  }

  getPalaceQuickComment(palaceName, stars) {
    const comments = {
      '命宫': stars.length > 0 ? `今年整体运势${stars.join('、')}主导` : '今年变数较多，灵活应变',
      '官禄宫': stars.length > 0 ? `事业方面有${stars[0] || '变化'}影响` : '事业需要自己努力开拓',
      '财帛宫': stars.length > 0 ? `财运受${stars[0] || '星曜'}影响` : '财运平稳，量入为出',
      '夫妻宫': stars.length > 0 ? `感情方面${stars[0] ? '有变化' : '稳定'}` : '感情平淡是福',
      '疾厄宫': '注意保养身体，劳逸结合'
    };
    return comments[palaceName] || '请详细分析';
  }

  interpretLiunian(year, palaceAnalysis, sihua) {
    const parts = [];

    parts.push(`${year}年流年天干为${sihua.天干}`);

    if (sihua.化禄) {
      parts.push(`化禄在${sihua.化禄}，有利于财运和贵人运`);
    }
    if (sihua.化忌) {
      parts.push(`化忌在${sihua.化忌}，需注意此方面的问题`);
    }

    // 命宫评价
    const ming = palaceAnalysis['命宫'];
    if (ming) {
      if (['吉', '大吉'].includes(ming.吉凶)) {
        parts.push('今年整体运势向好');
      } else if (['凶', '小凶'].includes(ming.吉凶)) {
        parts.push('今年需要谨慎行事');
      }
    }

    return parts.join('，') + '。';
  }

  getLiunianTips(palaceAnalysis) {
    const tips = [];

    // 事业提示
    const career = palaceAnalysis['官禄宫'];
    if (career && ['吉', '大吉'].includes(career.吉凶)) {
      tips.push({ 类型: '事业', icon: '💼', 建议: '今年事业运不错，可以主动争取机会' });
    } else if (career && ['凶', '小凶'].includes(career.吉凶)) {
      tips.push({ 类型: '事业', icon: '💼', 建议: '职场谨慎行事，避免大的变动' });
    }

    // 财运提示
    const wealth = palaceAnalysis['财帛宫'];
    if (wealth && ['吉', '大吉'].includes(wealth.吉凶)) {
      tips.push({ 类型: '财运', icon: '💰', 建议: '财运向好，可以考虑投资理财' });
    } else if (wealth && ['凶', '小凶'].includes(wealth.吉凶)) {
      tips.push({ 类型: '财运', icon: '💰', 建议: '守财为主，避免高风险投资' });
    }

    // 感情提示
    const marriage = palaceAnalysis['夫妻宫'];
    if (marriage && ['吉', '大吉'].includes(marriage.吉凶)) {
      tips.push({ 类型: '感情', icon: '💕', 建议: '感情运势佳，单身者有望脱单' });
    }

    // 健康提示
    tips.push({ 类型: '健康', icon: '🏥', 建议: '保持规律作息，注意身体保养' });

    return tips;
  }

  // 深度联动分析：八字与紫微的综合判断
  analyzeDeepLinkage(baziData, patternData, marriageData, careerData) {
    const linkage = {
      事业联动: this.analyzeCareerLinkage(careerData),
      财运联动: this.analyzeWealthLinkage(patternData),
      婚姻联动: this.analyzeMarriageLinkage(marriageData),
      健康联动: this.analyzeHealthLinkage(patternData),
      综合建议: []
    };

    // 生成综合建议
    linkage.综合建议 = this.generateLinkageSummary(linkage);

    return linkage;
  }

  analyzeCareerLinkage(careerData) {
    const guanluGong = this.getPalaceByName('官禄宫');
    const guanluStars = guanluGong?.majorStars?.map(s => s.name) || [];
    const guanluJixiong = this.evaluatePalaceStars(guanluStars);

    // 八字事业信息
    const baziCareer = careerData?.主导十神 || '';
    const careerScore = careerData?.评分 || 70;

    // 综合判断
    let synergy = '中等';
    let description = '';

    if (['吉', '大吉'].includes(guanluJixiong) && careerScore >= 75) {
      synergy = '强';
      description = '八字与紫微都显示事业运势良好，仕途或创业都有不错的发展';
    } else if (['凶', '小凶'].includes(guanluJixiong) || careerScore < 60) {
      synergy = '弱';
      description = '事业方面需要更多努力，建议稳扎稳打，不宜冒进';
    } else {
      description = '事业发展中等偏上，需要把握机会并持续努力';
    }

    const starAdvice = this.getStarCareerAdvice(guanluStars);

    return {
      八字主导: baziCareer,
      紫微官禄: guanluStars.join('、') || '无主星',
      协同度: synergy,
      解读: description,
      星曜建议: starAdvice,
      行业推荐: this.getCareerRecommendation(guanluStars, baziCareer)
    };
  }

  getStarCareerAdvice(stars) {
    if (stars.includes('紫微')) return '适合管理层或创业，有领导才能';
    if (stars.includes('武曲')) return '适合金融、财务相关行业';
    if (stars.includes('天机')) return '适合策划、技术、创意类工作';
    if (stars.includes('太阳')) return '适合公众服务、教育、媒体行业';
    if (stars.includes('七杀')) return '适合开创型岗位，有魄力承担重任';
    if (stars.includes('贪狼')) return '适合销售、公关、娱乐行业';
    return '根据自身兴趣选择职业方向';
  }

  getCareerRecommendation(stars, shishen) {
    const recommendations = [];

    if (stars.includes('紫微') || shishen === '正官') {
      recommendations.push('大企业管理');
    }
    if (stars.includes('武曲') || shishen === '正财') {
      recommendations.push('金融投资');
    }
    if (stars.includes('天机') || shishen === '食神') {
      recommendations.push('技术研发');
    }
    if (stars.includes('贪狼') || shishen === '伤官') {
      recommendations.push('创意营销');
    }

    return recommendations.length > 0 ? recommendations : ['发挥特长，找到适合自己的领域'];
  }

  analyzeWealthLinkage(patternData) {
    const caibogong = this.getPalaceByName('财帛宫');
    const caiboStars = caibogong?.majorStars?.map(s => s.name) || [];
    const caiboJixiong = this.evaluatePalaceStars(caiboStars);

    // 八字财星
    const hasCai = (patternData?.shishenDist?.['正财'] || 0) + (patternData?.shishenDist?.['偏财'] || 0);

    let synergy = '中等';
    let description = '';

    if (['吉', '大吉'].includes(caiboJixiong) && hasCai > 0) {
      synergy = '强';
      description = '财运底子不错，懂得赚钱也擅长理财';
    } else if (['吉', '大吉'].includes(caiboJixiong) || hasCai > 0) {
      synergy = '中上';
      description = '有一定的财运基础，需要把握机会';
    } else {
      description = '财运需要通过努力获得，避免投机取巧';
    }

    return {
      八字财星: hasCai > 0 ? '有财星' : '财星较弱',
      紫微财帛: caiboStars.join('、') || '无主星',
      协同度: synergy,
      解读: description,
      理财建议: this.getWealthAdvice(caiboStars, hasCai)
    };
  }

  getWealthAdvice(stars, hasCai) {
    if (stars.includes('武曲') || stars.includes('天府')) {
      return '适合稳健型投资，如房产、基金定投';
    }
    if (stars.includes('贪狼')) {
      return '有偏财运，但要控制风险，不宜过度投机';
    }
    if (hasCai > 1) {
      return '财运不错，可以积极理财，多元化投资';
    }
    return '以稳健为主，先储蓄后投资';
  }

  analyzeMarriageLinkage(marriageData) {
    const fuqigong = this.getPalaceByName('夫妻宫');
    const fuqiStars = fuqigong?.majorStars?.map(s => s.name) || [];
    const fuqiJixiong = this.evaluatePalaceStars(fuqiStars);

    const marriageScore = marriageData?.婚姻评分?.最终分数 || 70;

    let synergy = '中等';
    let description = '';

    if (['吉', '大吉'].includes(fuqiJixiong) && marriageScore >= 80) {
      synergy = '强';
      description = '婚姻运势很好，容易遇到合适的另一半，婚后生活和谐';
    } else if (['凶', '小凶'].includes(fuqiJixiong) || marriageScore < 60) {
      synergy = '需经营';
      description = '感情方面需要更多用心经营，沟通和理解是关键';
    } else {
      description = '婚姻运势中等，需要双方共同努力';
    }

    return {
      八字婚姻评分: marriageScore,
      紫微夫妻宫: fuqiStars.join('、') || '无主星',
      协同度: synergy,
      解读: description,
      配偶特征: this.getSpouseTraitsByStars(fuqiStars),
      感情建议: this.getMarriageAdvice(fuqiStars, marriageScore)
    };
  }

  getSpouseTraitsByStars(stars) {
    if (stars.includes('紫微')) return '另一半可能有领导气质，事业心强';
    if (stars.includes('天府')) return '另一半稳重顾家，经济条件不错';
    if (stars.includes('太阴')) return '另一半温柔细腻，善解人意';
    if (stars.includes('贪狼')) return '另一半有魅力，但感情可能有变数';
    if (stars.includes('七杀')) return '另一半个性强，需要互相尊重';
    return '另一半性格待相识后了解';
  }

  getMarriageAdvice(stars, score) {
    if (score >= 80) return '保持真诚和尊重，幸福水到渠成';
    if (stars.includes('贪狼') || stars.includes('廉贞')) {
      return '控制好相处的边界感，避免多角关系';
    }
    return '多沟通、多理解，用心经营感情';
  }

  analyzeHealthLinkage(patternData) {
    const jieguanyong = this.getPalaceByName('疾厄宫');
    const jieguanyStars = jieguanyong?.majorStars?.map(s => s.name) || [];
    const jieguanyJixiong = this.evaluatePalaceStars(jieguanyStars);

    // 八字五行判断
    const wuxing = patternData?.wuxing || {};
    const weakElement = Object.entries(wuxing).sort((a, b) => a[1] - b[1])[0]?.[0];

    const healthIssues = this.getHealthIssuesByWuxing(weakElement);

    return {
      八字薄弱五行: weakElement || '无明显薄弱',
      紫微疾厄宫: jieguanyStars.join('、') || '无主星',
      协同度: ['吉', '大吉'].includes(jieguanyJixiong) ? '良好' : '需注意',
      易感部位: healthIssues,
      健康建议: this.getHealthAdvice(weakElement, jieguanyJixiong)
    };
  }

  getHealthIssuesByWuxing(weakElement) {
    const issues = {
      '木': '肝胆、眼睛、筋骨',
      '火': '心脏、小肠、血液循环',
      '土': '脾胃、消化系统',
      '金': '肺、呼吸系统、皮肤',
      '水': '肾、泌尿系统、耳朵'
    };
    return issues[weakElement] || '无特别提示';
  }

  getHealthAdvice(weakElement, jixiong) {
    if (['凶', '小凶'].includes(jixiong)) {
      return '定期体检，注意劳逸结合，避免过度劳累';
    }
    if (weakElement === '木') return '多进行户外活动，保护眼睛';
    if (weakElement === '火') return '保持心情舒畅，避免暴怒';
    if (weakElement === '土') return '规律饮食，少吃生冷';
    if (weakElement === '金') return '保护呼吸系统，注意皮肤保养';
    if (weakElement === '水') return '注意保暖，多喝水';
    return '保持良好生活习惯，定期体检';
  }

  generateLinkageSummary(linkage) {
    const summary = [];

    if (linkage.事业联动?.协同度 === '强') {
      summary.push({ icon: '💼', 内容: '事业运势佳，可大胆追求职业目标' });
    }
    if (linkage.财运联动?.协同度 === '强') {
      summary.push({ icon: '💰', 内容: '财运基础好，适当理财投资' });
    }
    if (linkage.婚姻联动?.协同度 === '强') {
      summary.push({ icon: '💕', 内容: '婚姻运势理想，珍惜身边人' });
    }
    if (linkage.健康联动?.协同度 === '需注意') {
      summary.push({ icon: '🏥', 内容: `注意${linkage.健康联动.易感部位}的保养` });
    }

    return summary;
  }
}
