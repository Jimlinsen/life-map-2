import { MARRIAGE_PREDICTION_SYSTEM } from './constants/bazi.js';
import { TIANGAN_WUXING, DIZHI_CANGGAN, SHISHEN_TABLE } from './constants/wuxing.js';

export class MarriageAnalyzer {
  constructor(pillars, dayMaster, shishenDist, gender, birthDay) {
    this.pillars = pillars;
    this.dayMaster = dayMaster;
    this.shishenDist = shishenDist;
    this.gender = gender;
    this.birthDay = birthDay;
    this.dayZhi = pillars[2].地支; // 日支 = 夫妻宫
    this.yearZhi = pillars[0].地支;
  }

  analyze() {
    const spouseHouse = this.analyzeSpouseHouse();
    const marriageScore = this.calculateMarriageScore();
    const spouseAppearance = this.predictSpouseAppearance();
    const spouseAgeDiff = this.predictSpouseAgeDiff();
    const marriageTiming = this.predictMarriageTiming();
    const spouseDirection = this.predictSpouseDirection();
    const warnings = this.checkWarnings();

    return {
      夫妻宫分析: spouseHouse,
      婚姻评分: marriageScore,
      配偶样貌: spouseAppearance,
      年龄差距: spouseAgeDiff,
      婚期预测: marriageTiming,
      配偶方位: spouseDirection,
      婚姻警示: warnings,
      综合评价: this.generateSummary(spouseHouse, marriageScore)
    };
  }

  analyzeSpouseHouse() {
    // 获取日支藏干
    const canggan = DIZHI_CANGGAN[this.dayZhi];
    const mainGan = canggan?.主气;

    if (!mainGan) return null;

    // 获取日支主气的十神
    const shishen = SHISHEN_TABLE[this.dayMaster]?.[mainGan];
    const analysis = MARRIAGE_PREDICTION_SYSTEM.spouseHouseAnalysis[shishen];

    return {
      夫妻宫: this.dayZhi,
      藏干主气: mainGan,
      藏干十神: shishen,
      配偶类型: analysis?.配偶类型 || '普通',
      特征: analysis?.特征 || [],
      评价: analysis?.评价 || ''
    };
  }

  calculateMarriageScore() {
    let score = MARRIAGE_PREDICTION_SYSTEM.marriageScoring.baseScore;
    const deductions = [];

    // 检查六冲
    const liuchong = {
      '子': '午', '午': '子', '丑': '未', '未': '丑',
      '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
      '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
    };

    // 检查日支是否与其他地支相冲
    const dizhi = this.pillars.map(p => p.地支);
    dizhi.forEach((z, i) => {
      if (i !== 2 && liuchong[this.dayZhi] === z) {
        score += MARRIAGE_PREDICTION_SYSTEM.marriageScoring.penalties['六冲'].分数;
        deductions.push({ 类型: '六冲', 说明: `日支${this.dayZhi}与${z}相冲`, 扣分: 60 });
      }
    });

    // 检查六害
    const liuhai = {
      '子': '未', '未': '子', '丑': '午', '午': '丑',
      '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯',
      '申': '亥', '亥': '申', '酉': '戌', '戌': '酉'
    };

    dizhi.forEach((z, i) => {
      if (i !== 2 && liuhai[this.dayZhi] === z) {
        score += MARRIAGE_PREDICTION_SYSTEM.marriageScoring.penalties['六害'].分数;
        deductions.push({ 类型: '六害', 说明: `日支${this.dayZhi}与${z}相害`, 扣分: 30 });
      }
    });

    // 检查男命比劫过多
    if (this.gender === '男') {
      const biJie = (this.shishenDist['比肩'] || 0) + (this.shishenDist['劫财'] || 0);
      if (biJie >= 5) {
        score -= 20;
        deductions.push({ 类型: '比劫过多', 说明: '男命比劫过重，财受制', 扣分: 20 });
      }
    }

    // 检查女命食伤过多
    if (this.gender === '女') {
      const shiShang = (this.shishenDist['食神'] || 0) + (this.shishenDist['伤官'] || 0);
      if (shiShang >= 5) {
        score -= 20;
        deductions.push({ 类型: '食伤过多', 说明: '女命食伤过重，官受制', 扣分: 20 });
      }
    }

    return {
      原始分数: 100,
      最终分数: Math.max(0, score),
      扣分明细: deductions,
      等级: score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : '需注意',
      说明: score >= 80 ? '婚姻稳定，夫妻和谐' :
        score >= 60 ? '婚姻尚可，需相互包容' :
          score >= 40 ? '婚姻有波折，需用心经营' : '婚姻需特别注意，建议晚婚'
    };
  }

  predictSpouseAppearance() {
    const result = {};

    // 根据夫妻宫地支判断
    const siling = ['子', '午', '卯', '酉'];
    const siyu = ['寅', '申', '巳', '亥'];
    const siku = ['辰', '戌', '丑', '未'];

    if (siling.includes(this.dayZhi)) {
      result.外表 = '长相较好，气质出众';
    } else if (siyu.includes(this.dayZhi)) {
      result.外表 = '相貌一般，但有特点';
    } else if (siku.includes(this.dayZhi)) {
      result.外表 = '朴素敦厚，踏实可靠';
    }

    // 根据夫妻星五行判断
    const spouseStar = this.gender === '男' ? ['正财', '偏财'] : ['正官', '七杀'];
    let spouseWuxing = null;

    for (const star of spouseStar) {
      if (this.shishenDist[star]) {
        // 找到对应的天干
        for (const [gan, ss] of Object.entries(SHISHEN_TABLE[this.dayMaster] || {})) {
          if (ss === star) {
            spouseWuxing = TIANGAN_WUXING[gan];
            break;
          }
        }
        break;
      }
    }

    if (spouseWuxing) {
      const appearance = MARRIAGE_PREDICTION_SYSTEM.spouseAppearance.看夫妻星[spouseWuxing];
      if (appearance) {
        result.五行特征 = appearance.外貌;
      }
    }

    return result;
  }

  predictSpouseAgeDiff() {
    // 根据主导十神判断年龄差
    const sorted = Object.entries(this.shishenDist).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0]?.[0];

    const ageDiffRules = {
      '伤官': { 差距: '较大', 说明: '伤官旺者喜欢有年龄差距的人' },
      '偏财': { 差距: '较大', 说明: '偏财旺者异性缘广泛，配偶年龄差距可能较大' },
      '七杀': { 差距: '较大', 说明: '七杀代表权威，倾向年龄差距' },
      '食神': { 差距: '较小', 说明: '食神主和谐，配偶年龄接近，1-2岁' },
      '正印': { 差距: '很小', 说明: '正印主稳定，同龄或相差1岁左右' },
      '比肩': { 差距: '很小', 说明: '比肩代表同辈，年龄相近' },
      '正财': { 差距: '适中', 说明: '正财主稳定，年龄差距适中' },
      '正官': { 差距: '适中', 说明: '正官主成熟，通常差距不大' }
    };

    return ageDiffRules[dominant] || { 差距: '正常', 说明: '配偶年龄差距在正常范围' };
  }

  predictMarriageTiming() {
    const conditions = [];

    // 桃花星判断
    const taohuaMap = {
      '申': '酉', '子': '酉', '辰': '酉',
      '寅': '卯', '午': '卯', '戌': '卯',
      '亥': '子', '卯': '子', '未': '子',
      '巳': '午', '酉': '午', '丑': '午'
    };

    const taohua = taohuaMap[this.dayZhi] || taohuaMap[this.yearZhi];
    if (taohua) {
      conditions.push({ 标志: '桃花星', 地支: taohua, 说明: `遇${taohua}年桃花旺，易遇正缘` });
    }

    // 一般婚期条件
    conditions.push({ 标志: '合化年', 说明: '日元或夫妻宫逢流年合化时' });
    conditions.push({ 标志: '夫妻宫增强', 说明: '夫妻宫能量增强的流年' });

    return {
      适婚年龄: '22-35岁',
      婚期标志: conditions,
      桃花位: taohua
    };
  }

  predictSpouseDirection() {
    // 简化的方位判断
    const directions = MARRIAGE_PREDICTION_SYSTEM.spouseDirection.directions;

    // 根据日支对冲取方位
    const chong = {
      '子': '午', '午': '子', '丑': '未', '未': '丑',
      '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
      '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
    };

    const oppositZhi = chong[this.dayZhi];
    const direction = directions[oppositZhi] || '不定';

    return {
      方位: direction,
      参考地支: oppositZhi,
      说明: `配偶可能来自${direction}方向（相对于出生地）`
    };
  }

  checkWarnings() {
    const warnings = [];

    // 检查日支被冲
    const dizhi = this.pillars.map(p => p.地支);
    const chong = {
      '子': '午', '午': '子', '丑': '未', '未': '丑',
      '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
      '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
    };

    // 月支或年支冲日支
    if (chong[this.dayZhi] === dizhi[0] || chong[this.dayZhi] === dizhi[1]) {
      warnings.push({ 类型: '夫妻宫受冲', 严重程度: '中', 建议: '婚姻需用心经营，避免冲动决定' });
    }

    // 男命无财才
    if (this.gender === '男' && !this.shishenDist['正财'] && !this.shishenDist['偏财']) {
      warnings.push({ 类型: '无财星', 严重程度: '低', 建议: '异性缘稍弱，建议多参加社交活动' });
    }

    // 女命无官杀
    if (this.gender === '女' && !this.shishenDist['正官'] && !this.shishenDist['七杀']) {
      warnings.push({ 类型: '无官星', 严重程度: '低', 建议: '异性缘稍弱，建议拓展社交圈' });
    }

    return warnings;
  }

  generateSummary(spouseHouse, score) {
    const summary = [];

    if (spouseHouse) {
      summary.push(`夫妻宫坐${spouseHouse.藏干十神}，配偶为${spouseHouse.配偶类型}型。`);
    }

    summary.push(`婚姻评分${score.最终分数}分，等级【${score.等级}】。`);
    summary.push(score.说明);

    return summary.join(' ');
  }
}
