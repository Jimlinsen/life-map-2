const { Lunar } = require('lunar-javascript');

// Mock Data Tables
const SHISHEN_TABLE = {
    '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
    '乙': { '乙': '比肩', '甲': '劫财', '丁': '食神', '丙': '伤官', '己': '偏财', '戊': '正财', '辛': '七杀', '庚': '正官', '癸': '偏印', '壬': '正印' },
    '丙': { '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官', '甲': '偏印', '乙': '正印' },
    // ... simplified for test
};

const DIZHI_CANGGAN = {
    '子': { 主气: '癸' }, '丑': { 主气: '己', 中气: '癸', 余气: '辛' },
    // ... simplified
};

function calculateDailyInfo(dayMaster, dateStr) {
    try {
        console.log('Input:', { dayMaster, dateStr });

        if (!dateStr || !dayMaster) {
            console.log('Missing Input');
            return null;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.log('Invalid Date');
            return null;
        }

        const lunar = Lunar.fromDate(date);
        console.log('Lunar created');

        const dayGan = lunar.getDayGan();
        const dayZhi = lunar.getDayZhi();
        console.log('Day GanZhi:', dayGan, dayZhi);

        const shiShenGan = (SHISHEN_TABLE[dayMaster]) ? SHISHEN_TABLE[dayMaster][dayGan] : 'Undefined Table';
        console.log('ShiShenGan:', shiShenGan);

        return { status: 'success', shiShenGan };
    } catch (e) {
        console.error('Error:', e);
        return null;
    }
}

// Test
calculateDailyInfo('甲', '2025-12-23');
