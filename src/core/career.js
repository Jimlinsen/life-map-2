import { CAREER_PREDICTION_SYSTEM } from './constants/bazi.js';
import { TIANGAN_WUXING } from './constants/wuxing.js';

export class CareerAnalyzer {
  constructor(pillars, dayMaster, shishenDist, wuxing, xiyong, gender) {
    this.pillars = pillars;
    this.dayMaster = dayMaster;
    this.shishenDist = shishenDist;
    this.wuxing = wuxing;
    this.xiyong = xiyong;
    this.gender = gender;
    this.tiangan = pillars.map(p => p.天干);
    this.dizhi = pillars.map(p => p.地支);
  }

  analyze() {
    const dominantShishen = this.getDominantShishen();
    const careerTraits = this.getCareerTraits(dominantShishen);
    const industryRecommendations = this.getIndustryRecommendations();
    const careerIndicators = this.checkCareerIndicators();
    const laborType = this.determineLaborType();

    return {
      主导十神: dominantShishen,
      事业性格: careerTraits,
      行业建议: industryRecommendations,
      从业标志: careerIndicators,
      劳动类型: laborType,
      综合评价: this.generateSummary(dominantShishen, careerTraits, industryRecommendations)
    };
  }

  getDominantShishen() {
    // 找出力量最强的十神（排除比肩本身）
    const sorted = Object.entries(this.shishenDist)
      .filter(([k]) => k !== '比肩')
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return '比肩';

    // 如果多个十神力量相近，优先返回与事业更相关的
    const careerRelevant = ['正官', '七杀', '正财', '偏财', '食神', '伤官'];
    for (const ss of careerRelevant) {
      const found = sorted.find(([k]) => k === ss);
      if (found && found[1] >= sorted[0][1] * 0.8) {
        return found[0];
      }
    }

    return sorted[0][0];
  }

  getCareerTraits(shishen) {
    const traits = CAREER_PREDICTION_SYSTEM.shishenCareerTraits[shishen];
    if (!traits) return null;

    return {
      类型: traits.type,
      性格特点: traits.性格特点,
      事业风格: traits.事业风格,
      适合行业: traits.适合行业,
      财运特点: traits.财运特点,
      忌讳: traits.忌讳
    };
  }

  getIndustryRecommendations() {
    const recommendations = [];

    // 基于喜用神五行推荐行业
    if (this.xiyong?.xi) {
      this.xiyong.xi.forEach(wx => {
        const industry = CAREER_PREDICTION_SYSTEM.industryByWuxing[wx];
        if (industry) {
          recommendations.push({
            五行: wx,
            方位: industry.方位,
            行业列表: industry.行业.slice(0, 5),
            特点: industry.特点
          });
        }
      });
    }

    return recommendations;
  }

  checkCareerIndicators() {
    const results = [];
    const indicators = CAREER_PREDICTION_SYSTEM.careerIndicators;

    // 检查规则1: 四柱地支全是辰戌丑未
    if (this.dizhi.filter(z => ['辰', '戌', '丑', '未'].includes(z)).length === 4) {
      results.push({ id: 1, 符合: true, 结论: '适合从公务或办宜，属于当官属吏之命' });
    }

    // 检查规则2: 柱中有辰戌丑未（土库）
    if (this.dizhi.some(z => ['辰', '戌', '丑', '未'].includes(z))) {
      results.push({ id: 2, 符合: true, 结论: '宜从事医学或养生相关工作' });
    }

    // 检查规则11: 水土重
    if ((this.wuxing['水'] + this.wuxing['土']) >= 12) {
      results.push({ id: 11, 符合: true, 结论: '适合农业、房产等土水相关工作' });
    }

    // 检查正星vs偏星
    const zhengxing = (this.shishenDist['正官'] || 0) + (this.shishenDist['正财'] || 0) +
      (this.shishenDist['正印'] || 0) + (this.shishenDist['食神'] || 0);
    const pianxing = (this.shishenDist['七杀'] || 0) + (this.shishenDist['偏财'] || 0) +
      (this.shishenDist['偏印'] || 0) + (this.shishenDist['伤官'] || 0);

    if (zhengxing >= 6) {
      results.push({ id: 12, 符合: true, 结论: '正星多旺，适合公职或正规单位' });
    }
    if (pianxing >= 6) {
      results.push({ id: 13, 符合: true, 结论: '偏星多旺，适合偏门行业或自由职业' });
    }

    return results;
  }

  determineLaborType() {
    const strengthLevel = this.calculateStrengthLevel();
    const caiStrength = (this.shishenDist['正财'] || 0) + (this.shishenDist['偏财'] || 0);
    const shiShangStrength = (this.shishenDist['食神'] || 0) + (this.shishenDist['伤官'] || 0);

    // 身弱财旺 -> 体力劳动者
    if (strengthLevel <= 2 && caiStrength >= 5) {
      return {
        类型: '体力劳动者倾向',
        说明: '身弱财旺，需要付出更多劳动来获取财富',
        建议: '可通过学习技能提升竞争力'
      };
    }

    // 食伤生财 -> 非体力劳动者
    if (shiShangStrength >= 3 && caiStrength >= 2) {
      return {
        类型: '脑力劳动者倾向',
        说明: '食伤生财格局，适合以才华换取财富',
        建议: '发挥创意和专业技能'
      };
    }

    return {
      类型: '综合型',
      说明: '脑力与体力兼顾',
      建议: '根据具体行业灵活调整'
    };
  }

  calculateStrengthLevel() {
    const dmWuxing = TIANGAN_WUXING[this.dayMaster];
    const biJie = (this.shishenDist['比肩'] || 0) + (this.shishenDist['劫财'] || 0);
    const yin = (this.shishenDist['正印'] || 0) + (this.shishenDist['偏印'] || 0);
    return biJie + yin * 0.7;
  }

  generateSummary(shishen, traits, industries) {
    const summary = [];

    if (traits) {
      summary.push(`您的事业主导十神为【${shishen}】，属于${traits.类型}类型。`);
      summary.push(traits.事业风格);
    }

    if (industries.length > 0) {
      const topIndustry = industries[0];
      summary.push(`建议发展方向：${topIndustry.方位}方，${topIndustry.行业列表.slice(0, 3).join('、')}等行业。`);
    }

    return summary.join(' ');
  }
}
