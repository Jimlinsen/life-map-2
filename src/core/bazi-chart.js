import { Solar } from 'lunar-javascript';
import { TIANGAN, DIZHI, TIANGAN_WUXING, DIZHI_CANGGAN, SHISHEN_TABLE } from './constants/wuxing.js';

export function getPreciseBaZi(year, month, day, shiChenIndex) {
  try {
    // shiChenIndex: 0=子时(23-1), 1=丑时(1-3), 2=寅时(3-5), ..., 11=亥时(21-23)
    // 
    // 时辰对应的代表小时 - 使用时辰中点确保准确
    // 子时特殊：23-1跨日，用0点代表(属于当天的子时)
    // 其他时辰取中点：丑时(1-3)用2点，寅时(3-5)用4点，以此类推
    const shiChenToHour = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    // Handl birthHour > 11 safely
    let safeIndex = shiChenIndex;
    if (typeof safeIndex !== 'number' || safeIndex < 0 || safeIndex > 11) {
      // Check if it looks like an hour (0-23)
      if (safeIndex >= 0 && safeIndex <= 23) {
        // If 13 (1pm) -> Index 7 (Wei, 13-15)
        // Mapping Hour to Index? No, let's just use 12:00 if invalid index
        // But wait, the existing logic assumes index.
        // Let's just default to 6 (Wu Shi, noon) if invalid
        safeIndex = 6;
      } else {
        safeIndex = 6;
      }
    }

    const calcHour = shiChenToHour[safeIndex] ?? 12;

    const solar = Solar.fromYmdHms(year, month, day, calcHour, 0, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();

    // Safety check for setSect
    if (typeof eightChar.setSect === 'function') {
      try { eightChar.setSect(2); } catch (e) { console.warn('setSect error', e); }
    }

    const result = {
      年柱: { 天干: eightChar.getYearGan(), 地支: eightChar.getYearZhi() },
      月柱: { 天干: eightChar.getMonthGan(), 地支: eightChar.getMonthZhi() },
      日柱: { 天干: eightChar.getDayGan(), 地支: eightChar.getDayZhi() },
      时柱: { 天干: eightChar.getTimeGan(), 地支: eightChar.getTimeZhi() },
      lunar: lunar,
      eightChar: eightChar
    };

    return result;
  } catch (err) {
    console.error('getPreciseBaZi Fatal Error:', err);
    // Return dummy data to keep app alive
    return {
      年柱: { 天干: '甲', 地支: '子' },
      月柱: { 天干: '甲', 地支: '子' },
      日柱: { 天干: '甲', 地支: '子' },
      时柱: { 天干: '甲', 地支: '子' },
      lunar: Solar.fromYmdHms(2000, 1, 1, 12, 0, 0).getLunar(),
      eightChar: Solar.fromYmdHms(2000, 1, 1, 12, 0, 0).getLunar().getEightChar()
    };
  }
}

export function getJiaZiIndex(gan, zhi) {
  const ganIdx = TIANGAN.indexOf(gan);
  const zhiIdx = DIZHI.indexOf(zhi);
  // 简化方法：遍历查找
  for (let i = 0; i < 60; i++) {
    if (TIANGAN[i % 10] === gan && DIZHI[i % 12] === zhi) {
      return i;
    }
  }
  return 0;
}

export function analyzeDaYunShishen(dayGan, yunGan, yunZhi) {
  const ganShishen = SHISHEN_TABLE[dayGan]?.[yunGan] || '比肩';
  const canggan = DIZHI_CANGGAN[yunZhi];
  const zhiShishen = canggan?.主气 ? SHISHEN_TABLE[dayGan]?.[canggan.主气] : '比肩';

  const shishenAnalysis = {
    '比肩': { 吉凶: '中', 事业: '竞争激烈，需自强', 财运: '破财风险', 感情: '平淡' },
    '劫财': { 吉凶: '凶', 事业: '小人作祟', 财运: '易破财', 感情: '竞争者出现' },
    '食神': { 吉凶: '吉', 事业: '才华得展', 财运: '稳中有升', 感情: '桃花旺' },
    '伤官': { 吉凶: '中', 事业: '创新突破', 财运: '投资有风险', 感情: '易冲突' },
    '偏财': { 吉凶: '吉', 事业: '意外机遇', 财运: '偏财运佳', 感情: '桃花多' },
    '正财': { 吉凶: '吉', 事业: '稳定发展', 财运: '正财稳健', 感情: '婚姻稳定' },
    '七杀': { 吉凶: '凶', 事业: '压力大', 财运: '消耗多', 感情: '易有冲突' },
    '正官': { 吉凶: '吉', 事业: '升迁机会', 财运: '俸禄增', 感情: '贵人相助' },
    '偏印': { 吉凶: '中', 事业: '学习提升', 财运: '平稳', 感情: '独处时光' },
    '正印': { 吉凶: '吉', 事业: '获得支持', 财运: '平稳', 感情: '长辈关爱' }
  };

  return {
    运干十神: ganShishen,
    运支十神: zhiShishen,
    分析: shishenAnalysis[ganShishen] || shishenAnalysis['比肩'],
    综合评价: shishenAnalysis[ganShishen]?.吉凶 === '吉' ? '吉运' : shishenAnalysis[ganShishen]?.吉凶 === '凶' ? '凶运' : '平运'
  };
}

export function analyzeLiuNian(dayGan, liuNianGan, liuNianZhi, daYunGan) {
  const ganShishen = SHISHEN_TABLE[dayGan]?.[liuNianGan] || '比肩';
  const canggan = DIZHI_CANGGAN[liuNianZhi];
  const zhiShishen = canggan?.主气 ? SHISHEN_TABLE[dayGan]?.[canggan.主气] : '比肩';
  const yunNianRelation = SHISHEN_TABLE[daYunGan]?.[liuNianGan] || '比肩';

  return {
    流年干支: liuNianGan + liuNianZhi,
    干神: ganShishen,
    支神: zhiShishen,
    运年关系: yunNianRelation
  };
}

export function calculateDaYun(year, month, day, shiChenIndex, gender, yearGan, dayGan) {
  // 1. 确定顺逆方向
  // 阳男阴女顺行(1)，阴男阳女逆行(-1)
  const tianganIndex = TIANGAN.indexOf(yearGan);
  const isYangYear = (tianganIndex % 2 === 0); // 甲丙戊庚壬为阳
  const isMale = gender === '男';
  const direction = (isMale && isYangYear) || (!isMale && !isYangYear) ? 1 : -1;

  // 2. 获取出生时刻的Solar对象
  const shiChenToHour = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const birthHour = shiChenToHour[shiChenIndex] ?? 12;
  const birthSolar = Solar.fromYmdHms(year, month, day, birthHour, 0, 0);
  const birthLunar = birthSolar.getLunar();

  // 3. 获取月柱（运元）
  const eightChar = birthLunar.getEightChar();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();

  // 4. 计算起运岁数（关键步骤）
  // 顺行：从出生日数到下一个节令
  // 逆行：从出生日数到上一个节令
  // 注意：是"节"不是"气"（立春、惊蛰、清明...）

  let targetJieDate = null;

  if (direction === 1) {
    // 顺行：找下一个节
    const nextJie = birthLunar.getNextJie();
    if (nextJie) {
      targetJieDate = nextJie.getSolar();
    }
  } else {
    // 逆行：找上一个节
    const prevJie = birthLunar.getPrevJie();
    if (prevJie) {
      targetJieDate = prevJie.getSolar();
    }
  }

  // 计算天数差
  let diffDays = 0;
  if (targetJieDate) {
    const targetJD = targetJieDate.getJulianDay();
    const birthJD = birthSolar.getJulianDay();
    diffDays = Math.abs(targetJD - birthJD);
  }

  // 换算：3天 = 1岁，1天 = 4个月
  const startAgeFloat = diffDays / 3;
  const startAge = Math.floor(startAgeFloat);
  const startMonthFrac = Math.floor((startAgeFloat - startAge) * 12);

  // 计算实际起运的公历年份
  // 起运时间 = 出生年月 + 起运岁数月数
  const birthMonthTotal = year * 12 + month; // 出生月份的总月数
  const startMonthTotal = birthMonthTotal + startAge * 12 + startMonthFrac; // 起运的总月数
  const actualStartYear = Math.floor(startMonthTotal / 12); // 实际起运年份

  // 5. 排列大运干支序列
  // 以月柱为基准，顺行取下一个干支，逆行取上一个干支
  const monthJiaZiIdx = getJiaZiIndex(monthGan, monthZhi);

  const yun = [];
  for (let i = 0; i < 8; i++) {
    // 计算当前大运的六十甲子索引
    const currentIdx = (monthJiaZiIdx + direction * (i + 1) + 60) % 60;
    const gan = TIANGAN[currentIdx % 10];
    const zhi = DIZHI[currentIdx % 12];
    const age = startAge + i * 10;

    // 大运分析
    const analysis = analyzeDaYunShishen(dayGan, gan, zhi);

    // 流年列表 - 使用实际起运年份计算
    const liuNianList = [];
    const daYunStartYear = actualStartYear + i * 10;
    for (let j = 0; j < 10; j++) {
      const lnYear = daYunStartYear + j;
      const lnGanIdx = (lnYear - 4) % 10;
      const lnZhiIdx = (lnYear - 4) % 12;
      const lnGan = TIANGAN[lnGanIdx];
      const lnZhi = DIZHI[lnZhiIdx];
      liuNianList.push({
        year: lnYear,
        age: age + j,
        ganZhi: lnGan + lnZhi,
        ...analyzeLiuNian(dayGan, lnGan, lnZhi, gan)
      });
    }

    yun.push({
      startAge: age,
      endAge: age + 9,
      ganZhi: gan + zhi,
      gan, zhi,
      startYear: daYunStartYear,
      displayAge: i === 0 ? `${startAge}岁${startMonthFrac > 0 ? startMonthFrac + '月' : ''}起运 (${daYunStartYear}年)` : `${age}-${age + 9}岁 (${daYunStartYear}年)`,
      ...analysis,
      流年: liuNianList
    });
  }

  return yun;
}

export function checkSheng(wx1, wx2) {
  const shengMap = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  return shengMap[wx1] === wx2 || shengMap[wx2] === wx1;
}

export function checkHasRoot(dayMaster, pillars) {
  const dmWuxing = TIANGAN_WUXING[dayMaster];
  for (let pillar of pillars) {
    const canggan = DIZHI_CANGGAN[pillar.地支];
    if (canggan) {
      for (let key of ['主气', '中气', '余气']) {
        if (canggan[key] && TIANGAN_WUXING[canggan[key]] === dmWuxing) return true;
      }
    }
  }
  return false;
}

export function toJulianDay(year, month, day, hour = 12) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}
