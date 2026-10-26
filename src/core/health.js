import { WUYUN_SYSTEM, LIUQI_SYSTEM } from './constants/health.js';
import { TIANGAN, DIZHI, WUXING_INFO } from './constants/wuxing.js';

export class HealthAnalyzer {
  constructor(yearGan, yearZhi, currentYear) {
    this.yearGan = yearGan;
    this.yearZhi = yearZhi;
    this.currentYear = currentYear;
  }

  getBirthWuyun() {
    const yunInfo = WUYUN_SYSTEM.tianganToYun[this.yearGan];
    const healthInfo = WUYUN_SYSTEM.yunToHealth[yunInfo.运][yunInfo.太过 ? '太过' : '不及'];
    return { 运: yunInfo.运, 性质: yunInfo.性质, ...healthInfo };
  }

  getBirthLiuqi() {
    const zhiPairs = { '子': '子午', '午': '子午', '丑': '丑未', '未': '丑未', '寅': '寅申', '申': '寅申', '卯': '卯酉', '酉': '卯酉', '辰': '辰戌', '戌': '辰戌', '巳': '巳亥', '亥': '巳亥' };
    const pairKey = zhiPairs[this.yearZhi];
    const qiInfo = LIUQI_SYSTEM.dizhiToQi[pairKey];
    return {
      司天: { 名称: qiInfo.司天, ...LIUQI_SYSTEM.qiToHealth[qiInfo.司天] },
      在泉: { 名称: qiInfo.在泉, ...LIUQI_SYSTEM.qiToHealth[qiInfo.在泉] }
    };
  }

  getCurrentYunQi(year) {
    const yearGanIndex = (year - 4) % 10;
    const yearZhiIndex = (year - 4) % 12;
    const currentGan = TIANGAN[yearGanIndex];
    const currentZhi = DIZHI[yearZhiIndex];

    const yunInfo = WUYUN_SYSTEM.tianganToYun[currentGan];
    const healthInfo = WUYUN_SYSTEM.yunToHealth[yunInfo.运][yunInfo.太过 ? '太过' : '不及'];

    const zhiPairs = { '子': '子午', '午': '子午', '丑': '丑未', '未': '丑未', '寅': '寅申', '申': '寅申', '卯': '卯酉', '酉': '卯酉', '辰': '辰戌', '戌': '辰戌', '巳': '巳亥', '亥': '巳亥' };
    const pairKey = zhiPairs[currentZhi];
    const qiInfo = LIUQI_SYSTEM.dizhiToQi[pairKey];

    return {
      年份: year, 干支: currentGan + currentZhi,
      五运: { 运: yunInfo.运, 性质: yunInfo.性质, ...healthInfo },
      六气: { 司天: { 名称: qiInfo.司天, ...LIUQI_SYSTEM.qiToHealth[qiInfo.司天] }, 在泉: { 名称: qiInfo.在泉, ...LIUQI_SYSTEM.qiToHealth[qiInfo.在泉] } }
    };
  }

  analyzeHealth(wuxingBalance, age) {
    const birthWuyun = this.getBirthWuyun();
    const birthLiuqi = this.getBirthLiuqi();
    const currentYunQi = this.getCurrentYunQi(this.currentYear);
    const organs = this.analyzeOrgans(wuxingBalance);
    const ageStage = this.getAgeStage(age);

    return {
      先天体质: { 体质类型: birthWuyun.体质倾向, 养生重点: birthWuyun.养生要点, 饮食建议: birthWuyun.饮食建议, 先天弱点: birthWuyun.易患疾病, 保健穴位: birthWuyun.穴位保健 },
      当年预测: { 年份: currentYunQi.年份, 干支: currentYunQi.干支, 运气特点: currentYunQi.五运.性质, 上半年: `司天${currentYunQi.六气.司天.名称}，${currentYunQi.六气.司天.养生}`, 下半年: `在泉${currentYunQi.六气.在泉.名称}，${currentYunQi.六气.在泉.养生}`, 养生要点: currentYunQi.五运.养生要点 },
      脏腑分析: organs, 年龄阶段: ageStage,
      综合建议: [{ 类型: '先天体质', 建议: `您属于${birthWuyun.体质倾向}，${birthWuyun.养生要点}` }, { 类型: '当年运气', 建议: `今年${currentYunQi.五运.性质}，${currentYunQi.五运.养生要点}` }]
    };
  }

  analyzeOrgans(wuxingBalance) {
    const organs = [];
    const total = Object.values(wuxingBalance).reduce((a, b) => a + b, 0);
    for (let [wx, value] of Object.entries(wuxingBalance)) {
      const percentage = (value / total * 100).toFixed(1);
      const info = WUXING_INFO[wx];
      let status = percentage > 25 ? '偏旺' : percentage < 15 ? '不足' : '平衡';
      organs.push({ 五行: wx, 比例: percentage + '%', 状态: status, 脏腑: info.脏腑, 建议: status === '偏旺' ? `泄${wx}` : status === '不足' ? `补${wx}` : '保持' });
    }
    return organs;
  }

  getAgeStage(age) {
    if (age < 20) return '生发期（养肝明目）';
    if (age < 40) return '旺盛期（养心理气）';
    if (age < 60) return '成熟期（养脾健胃）';
    return '收敛期（养肾固元）';
  }
}
