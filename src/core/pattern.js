import { checkHasRoot } from './bazi-chart.js';
import { PATTERN_INTERPRETATION, PATTERN_HIERARCHY } from './constants/bazi.js';
import { TIANGAN_WUXING, DIZHI_CANGGAN, SHISHEN_TABLE } from './constants/wuxing.js';

export class PatternAnalyzer {
  constructor(pillars, dayMaster) {
    this.pillars = pillars;
    this.dayMaster = dayMaster;
    this.wuxing = this.calculateWuxing();
    this.shishenDist = this.calculateShishenDistribution();
  }

  calculateWuxing() {
    const wuxing = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    this.pillars.forEach(p => {
      wuxing[TIANGAN_WUXING[p.天干]] += 2;
      const cg = DIZHI_CANGGAN[p.地支];
      if (cg.主气) wuxing[TIANGAN_WUXING[cg.主气]] += 1.5;
      if (cg.中气) wuxing[TIANGAN_WUXING[cg.中气]] += 1;
      if (cg.余气) wuxing[TIANGAN_WUXING[cg.余气]] += 0.5;
    });
    return wuxing;
  }

  calculateShishenDistribution() {
    const dist = {};
    this.pillars.forEach((p, i) => {
      if (i !== 2) {
        const ss = SHISHEN_TABLE[this.dayMaster][p.天干];
        dist[ss] = (dist[ss] || 0) + 2;
      }
      const cg = DIZHI_CANGGAN[p.地支];
      for (let key of ['主气', '中气', '余气']) {
        if (cg[key]) {
          const ss = SHISHEN_TABLE[this.dayMaster][cg[key]];
          const weight = key === '主气' ? 1.5 : key === '中气' ? 1 : 0.5;
          dist[ss] = (dist[ss] || 0) + weight;
        }
      }
    });
    return dist;
  }

  analyzeStrength() {
    const dmWuxing = TIANGAN_WUXING[this.dayMaster];
    const relations = {
      '木': { 生: '火', 克: '土', 被生: '水', 被克: '金' }, '火': { 生: '土', 克: '金', 被生: '木', 被克: '水' },
      '土': { 生: '金', 克: '水', 被生: '火', 被克: '木' }, '金': { 生: '水', 克: '木', 被生: '土', 被克: '火' },
      '水': { 生: '木', 克: '火', 被生: '金', 被克: '土' }
    };
    const r = relations[dmWuxing];
    const selfScore = this.wuxing[dmWuxing] + this.wuxing[r.被生] * 0.7;
    const otherScore = this.wuxing[r.被克] + this.wuxing[r.生] * 0.7 + this.wuxing[r.克] * 0.5;
    const score = selfScore - otherScore;

    let strength, strengthLevel;
    if (score >= 4) { strength = '极旺'; strengthLevel = 5; }
    else if (score >= 2) { strength = '偏旺'; strengthLevel = 4; }
    else if (score >= 0) { strength = '中和'; strengthLevel = 3; }
    else if (score >= -2) { strength = '偏弱'; strengthLevel = 2; }
    else { strength = '极弱'; strengthLevel = 1; }

    return { strength, strengthLevel, score: score.toFixed(2), dmWuxing, relations: r };
  }

  analyze() {
    const strengthResult = this.analyzeStrength();
    let result = { strength: strengthResult, patternLevel: null, patternType: null, patternName: null, qingzhuoStatus: null, conghuaStatus: null, recommendations: [], 详细解读: null };

    // 检查形象
    for (let [typeName, typeInfo] of Object.entries(PATTERN_HIERARCHY.形象.types)) {
      const checkResult = typeInfo.check(this.wuxing);
      if (checkResult.valid) {
        result.patternLevel = '形象';
        result.patternType = typeName;
        result.patternName = checkResult.name || typeName;
        result.详细解读 = this.getDetailedInterpretation('形象', { type: typeName, details: checkResult });
        return this.finalize(result);
      }
    }

    // 检查从化
    if (strengthResult.strengthLevel <= 1) {
      const hasRoot = checkHasRoot(this.dayMaster, this.pillars);
      result.conghuaStatus = hasRoot ? { type: '假从', desc: '日主有根假从' } : { type: '真从', desc: '日主无根真从' };
    }

    // 检查气局
    const dizhi = this.pillars.map(p => p.地支);
    for (let [juName, juZhi] of Object.entries(PATTERN_HIERARCHY.气局.types.局.patterns)) {
      if (juZhi.filter(z => dizhi.includes(z)).length >= 2) {
        result.patternLevel = '气局'; result.patternType = '三合局'; result.patternName = juName;
        return this.finalize(result);
      }
    }

    // 检查八格
    const monthZhi = this.pillars[1].地支;
    const monthCanggan = DIZHI_CANGGAN[monthZhi];
    const tiangan = this.pillars.map(p => p.天干);

    for (let key of ['主气', '中气', '余气']) {
      if (monthCanggan[key] && tiangan.includes(monthCanggan[key])) {
        const tougan = monthCanggan[key];
        const shishen = SHISHEN_TABLE[this.dayMaster][tougan];
        for (let [geName, geInfo] of Object.entries(PATTERN_HIERARCHY.格局.八格)) {
          if (geInfo.shishen === shishen) {
            result.patternLevel = '格局'; result.patternType = '八格'; result.patternName = geName;
            result.格局详情 = { 透干: tougan, 十神: shishen, 喜神: geInfo.positive, 忌神: geInfo.negative };
            result.详细解读 = this.getDetailedInterpretation('八格', { name: geName });
            return this.finalize(result);
          }
        }
        break;
      }
    }

    result.patternLevel = '器用'; result.patternType = '无格'; result.patternName = '不执格论';
    return this.finalize(result);
  }

  getDetailedInterpretation(type, data) {
    if (type === '形象') {
      if (data.type === '两气成象' && data.details?.elements) {
        const possibleKeys = ['木火相生', '火土相生', '土金相生', '金水相生', '水木相生'];
        for (let k of possibleKeys) {
          if (k.includes(data.details.elements[0]) && k.includes(data.details.elements[1])) {
            return PATTERN_INTERPRETATION.形象详解.两气成象[k];
          }
        }
      }
      if (data.type === '独象' && data.details?.name) return PATTERN_INTERPRETATION.形象详解.独象[data.details.name + '格'];
      if (data.type === '五气成形') return PATTERN_INTERPRETATION.形象详解.五气成形;
    }
    if (type === '八格') return PATTERN_INTERPRETATION.八格详解[data.name];
    if (type === '从化') return PATTERN_INTERPRETATION.从化详解[data.type];
    return null;
  }

  checkQingzhuo() {
    const totalShishen = Object.keys(this.shishenDist).length;
    const maxShishen = Math.max(...Object.values(this.shishenDist));
    if (totalShishen <= 5 && maxShishen >= 4) return { status: '清', desc: '格局纯净' };
    if (totalShishen >= 7 || maxShishen <= 2) return { status: '浊', desc: '格局驳杂' };
    return { status: '平', desc: '格局普通' };
  }

  finalize(result) {
    result.qingzhuoStatus = this.checkQingzhuo();
    const r = result.strength.relations;
    const score = parseFloat(result.strength.score);
    result.xiyong = score >= 2
      ? { xi: [r.生, r.克, r.被克], ji: [result.strength.dmWuxing, r.被生], strength: result.strength.strength }
      : { xi: [r.被生, result.strength.dmWuxing], ji: [r.被克, r.生, r.克], strength: result.strength.strength };
    return result;
  }
}
