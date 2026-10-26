import { Lunar } from 'lunar-javascript';
import { TIANGAN_WUXING, DIZHI_WUXING, DIZHI_CANGGAN, SHISHEN_TABLE } from './constants/wuxing.js';

export function calculateDailyInfo(dayMaster, dateStr) {
  try {
    if (!dateStr || !dayMaster) return null;
    // 按本地时区解析 'YYYY-MM-DD'（new Date(str) 会当成 UTC 午夜，非 UTC+ 时区会退一天）
    const parts = String(dateStr).split('-').map(Number);
    const date = (parts.length === 3 && parts.every(n => Number.isFinite(n)))
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(dateStr);
    if (isNaN(date.getTime())) return null; // Invalid date check

    // Safety check for Lunar
    if (typeof Lunar === 'undefined' || typeof Lunar.fromDate !== 'function') {
      console.error('Lunar library missing');
      return null;
    }

    const lunar = Lunar.fromDate(date);
    const dayGan = lunar.getDayGan();
    const dayZhi = lunar.getDayZhi();

    // 简单的十神查找
    const shiShenGan = (typeof SHISHEN_TABLE !== 'undefined' && SHISHEN_TABLE[dayMaster]) ? SHISHEN_TABLE[dayMaster][dayGan] : '';
    const zhiMainQi = (typeof DIZHI_CANGGAN !== 'undefined' && DIZHI_CANGGAN[dayZhi]) ? DIZHI_CANGGAN[dayZhi]['主气'] : '';
    const shiShenZhi = (typeof SHISHEN_TABLE !== 'undefined' && SHISHEN_TABLE[dayMaster]) ? SHISHEN_TABLE[dayMaster][zhiMainQi] : '';

    // Use lookup tables instead of method calls
    const wuxingGan = (typeof TIANGAN_WUXING !== 'undefined') ? TIANGAN_WUXING[dayGan] : '木';
    const wuxingZhi = (typeof DIZHI_WUXING !== 'undefined') ? DIZHI_WUXING[dayZhi] : '木';

    // 生成建议
    let advice = [];
    let score = 3;
    let highlight = '';

    // 天干十神判断
    if (['正财', '偏财'].includes(shiShenGan)) {
      advice.push('今日财星主事，适合进行商业谈判、投资理财或处理财务问题。');
      highlight = '财运亨通';
      score += 1;
    } else if (['正官', '七杀'].includes(shiShenGan)) {
      advice.push('今日官杀主事，事业运势强，利于晋升、求职或承担责任，但也需注意压力管理。');
      highlight = '事业进阶';
    } else if (['食神', '伤官'].includes(shiShenGan)) {
      advice.push('今日食伤泄秀，灵感迸发，非常适合创作、演讲或享受生活。');
      highlight = '创意无限';
      score += 0.5;
    } else if (['正印', '偏印'].includes(shiShenGan)) {
      advice.push('今日印星生身，利于学习进修、规划思考，也是休养生息的好时机。');
      highlight = '贵人相助';
      score += 0.5;
    } else if (['比肩', '劫财'].includes(shiShenGan)) {
      advice.push('今日比劫旺相，利于社交聚会、团队合作，但需警惕财务支出或竞争纠纷。');
      highlight = '广结善缘';
    } else {
      advice.push('今日运势平稳，宜沉淀积累，按部就班。');
      highlight = '平稳过渡';
    }

    // 地支补充
    const zhiRel = shiShenZhi;
    if (zhiRel && zhiRel.includes('财')) advice.push('暗藏财机，注意观察身边的机会。');
    if (zhiRel && (zhiRel.includes('官') || zhiRel.includes('杀'))) advice.push('内心有自我约束或压力，宜调整心态。');

    // 五行建议
    const luckyColors = { '木': '绿色、青色', '火': '红色、紫色', '土': '黄色、棕色', '金': '白色、金色', '水': '黑色、蓝色' };

    return {
      lunarStr: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      ganZhi: lunar.getDayInGanZhi(),
      jieQi: lunar.getJieQi() || '无节气',
      shiShenGan: shiShenGan || '未知',
      shiShenZhi: shiShenZhi || '未知',
      yi: lunar.getDayYi(),
      ji: lunar.getDayJi(),
      wuxing: `${wuxingGan}${wuxingZhi} (${lunar.getDayNaYin()})`,
      advice,
      highlight,
      score: Math.min(5, Math.max(1, score)),
      luckyColor: luckyColors[wuxingGan] || '白色',
      luckyPosition: lunar.getPositionFuDesc() || '正南'
    };
  } catch (e) {
    console.error('CalculateDailyInfo Error:', e);
    return { error: e.toString(), stack: e.stack };
  }
}
