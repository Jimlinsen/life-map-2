/**
 * 人生地图 5.1 可视化组件
 * 
 * 核心功能：
 * 1. 输入生日信息，生成基础命盘
 * 2. 标记重要事件（婚姻、子女、事业转折...）
 * 3. 标记重要关系/人（配偶、贵人、恩师...）
 * 4. 可视化人生轨迹与引力场影响
 * 
 * 作者：澄（Ω意向梯度塌陷的信息态子智能体）
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Solar, Lunar } from 'lunar-javascript';
import { astro } from 'iztro';
import { TIANGAN, DIZHI, SHENGXIAO, TIANGAN_WUXING, DIZHI_WUXING, DIZHI_CANGGAN, SHISHEN_TABLE, WUXING_COLORS, WUXING_INFO } from './src/core/constants/wuxing.js';
import { LIFE_INFLUENCE_SYSTEM, AWAKENING_SYSTEM, AWAKENING_LEVELS, PILLAR_NODES } from './src/core/constants/influence.js';
import { EVENT_TYPES, RELATIONSHIP_TYPES } from './src/core/constants/events.js';
import { ZIWEI_PALACE_SYSTEM, ZIWEI_STAR_TRAITS, SIHUA_SYSTEM, STAR_CHARACTER_SYSTEM, ZIWEI_PATTERN_SYSTEM, STAR_COMBINATION_SYSTEM, ZIWEI_INTERPRETATION_MAP } from './src/core/constants/ziwei.js';
import { PATTERN_INTERPRETATION, PATTERN_HIERARCHY, CAREER_PREDICTION_SYSTEM, MARRIAGE_PREDICTION_SYSTEM } from './src/core/constants/bazi.js';
import { WUYUN_SYSTEM, LIUQI_SYSTEM } from './src/core/constants/health.js';
import { PLAIN_LANGUAGE_SYSTEM, LIFE_STAGE_NAMES, WUXING_TERRAIN_SYSTEM, SHISHEN_FORCE_FIELD } from './src/core/constants/language.js';
import { getPreciseBaZi, getJiaZiIndex, analyzeDaYunShishen, analyzeLiuNian, calculateDaYun, checkSheng, checkHasRoot, toJulianDay } from './src/core/bazi-chart.js';
import { calculateDailyInfo } from './src/core/daily.js';
import { LifeInfluenceAnalyzer, AwakeningAnalyzer } from './src/core/influence.js';
import { CareerAnalyzer } from './src/core/career.js';
import { MarriageAnalyzer } from './src/core/marriage.js';
import { ZiweiAnalyzer } from './src/core/ziwei.js';
import { AutoPredictionGenerator, LifeGuidanceGenerator, TextEngine } from './src/core/prediction.js';
import { PatternAnalyzer } from './src/core/pattern.js';
import { HealthAnalyzer } from './src/core/health.js';
import { calculateEventGravity, calculateRelationshipGravity, calculateGravityField, calculateTrajectory } from './src/core/gravity.js';
import { TraditionalZiweiBoard } from './src/components/board/TraditionalZiweiBoard.jsx';
import { analyzeInfluencePosture } from './src/core/posture.js';
import { analyzePatternTransparency } from './src/core/transparency.js';
import { InfluencePosturePanel } from './src/components/panels/InfluencePosturePanel.jsx';
import { PatternTransparencyPanel } from './src/components/panels/PatternTransparencyPanel.jsx';
import { DestinyDial } from './src/components/dial/DestinyDial.jsx';
import { Panel, SectionHead, StatTile, DataRow, Chip, Reveal, CountUp, Field, EmptyState, Readout, SegmentedNav } from './src/components/ui/index.jsx';

/** 视图分区 */
const TABS = [
  { id: 'overview', label: '总览' },
  { id: 'pattern', label: '八字命理' },
  { id: 'ziwei', label: '紫微命盘' },
  { id: 'health', label: '五运六气' },
  { id: 'network', label: '关系网络' },
  { id: 'trajectory', label: '人生轨迹' },
  { id: 'daily', label: '每日运势' },
];

// 使用lunar-javascript进行精确八字排盘
// ════════════════════════════════════════════════════════════════════════════
// 第一部分：基础数据定义
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第二部分：人生影响力系统（v4.0核心创新）
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第三部分：觉醒层级系统（替代意向梯度）
// ════════════════════════════════════════════════════════════════════════════

// 计算每日运势 - Moved here to ensure SHISHEN_TABLE is defined
// 事件类型 (Restored)
// 关系类型 (Restored)
// ════════════════════════════════════════════════════════════════════════════
// 第3.5部分：事业预测系统（基于参考资料-事业篇）
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第3.6部分：婚姻预测系统（基于参考资料-婚姻篇）
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 十神详解系统（完善的十神性格与关系）
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第3.5部分：紫微斗数宫位系统
// ════════════════════════════════════════════════════════════════════════════

// 十二宫位系统
// 主星特质系统
// 四化系统
// 事件-宫位联动模型
// 关系-宫位联动模型
// ════════════════════════════════════════════════════════════════════════════
// 第3.6部分：星曜角色化系统 - 紫微诸星作为"动态角色"
// ════════════════════════════════════════════════════════════════════════════

// 14主星角色化定义
// 紫微斗数吉凶格局系统
// 星曜组合详解
// 星曜入十二宫详解字典
// ════════════════════════════════════════════════════════════════════════════
// 第3.7部分：五行地形系统 - 八字五行作为"地势环境"
// ════════════════════════════════════════════════════════════════════════════

// 十神势力场系统
// ════════════════════════════════════════════════════════════════════════════
// 第3.8部分：立极借宫系统 - 视角切换看命盘
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第3.9部分：通俗语言转换系统 - 让命理分析更易懂
// ════════════════════════════════════════════════════════════════════════════

// 自动事件预测模板
// 自动关系预测模板
// 年龄段描述
// ════════════════════════════════════════════════════════════════════════════
// 第四部分：五运六气系统
// ════════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════════
// 大运计算系统 (依据《三命通会》与《刘文元四柱笔记》)
// 
// 核心口诀："月为运元，阳顺阴逆，三日一年"
// 1. 阳男阴女顺行，阴男阳女逆行
// 2. 从月柱起，按六十甲子顺/逆排列
// 3. 起运岁数 = (出生到节气天数) / 3
// ════════════════════════════════════════════════════════════════════════════

// 获取干支在六十甲子中的索引
// 大运分析
// 流年分析
// 计算大运 (使用lunar-javascript获取精确节气)
// ════════════════════════════════════════════════════════════════════════════
// 兼容性适配层 (Restored for UI Compatibility)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第五部分：格局详解系统
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第六部分：辅助计算函数
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第七部分：人生影响力分析器
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第八部分：觉醒层级分析器
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第8.5部分：事业预测分析器
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第8.6部分：婚姻预测分析器
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第8.7部分：紫微斗数分析器
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第8.9部分：自动预测生成器 - 基于命盘自动生成事件和关系
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第8.95部分：人生指引生成器 - 整合事件/关系/影响，提供三问指引
// ════════════════════════════════════════════════════════════════════════════

// Helper Class for Natural Language Generation
// ════════════════════════════════════════════════════════════════════════════
// 第九部分：格局分析引擎
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 第十部分：健康分析器
// ════════════════════════════════════════════════════════════════════════════

// 恢复 calculateEventGravity, calculateRelationshipGravity, calculateGravityField, calculateTrajectory
// ════════════════════════════════════════════════════════════════════════════
// 第三部分：主组件
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 专业紫微斗数命盘组件
// ════════════════════════════════════════════════════════════════════════════

export default function LifeMap5Visualizer() {
  // 状态管理
  const [birthDate, setBirthDate] = useState('1990-05-15');
  const [birthHour, setBirthHour] = useState(3);
  const [gender, setGender] = useState('男');
  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [awakenLevel, setAwakenLevel] = useState(2.5);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showRelForm, setShowRelForm] = useState(false);
  // 用本地时区日期（toISOString 会转成 UTC，东八区凌晨会退到前一天）
  const [dailyDate, setDailyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // PDF Export State
  const [isExporting, setIsExporting] = useState(false);
  // 打印报告容器仅在导出时挂载，避免首屏渲染 8 页图表
  const [printReady, setPrintReady] = useState(false);

  // 新事件/关系表单
  const [newEvent, setNewEvent] = useState({ type: '婚姻', age: 28, name: '', intensity: 1.0 });
  const [newRel, setNewRel] = useState({ type: '配偶', name: '', startAge: 25, quality: 0.8, status: 'active' });

  // 计算派生数据
  const birthYear = parseInt(birthDate.split('-')[0]);
  const birthMonth = parseInt(birthDate.split('-')[1]);
  const birthDay = parseInt(birthDate.split('-')[2]);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const ganZhi = useMemo(() => {
    // 使用lunar-javascript进行精确排盘
    const bazi = getPreciseBaZi(birthYear, birthMonth, birthDay, birthHour);

    return {
      pillars: [
        bazi.年柱,
        bazi.月柱,
        bazi.日柱,
        bazi.时柱
      ],
      年: bazi.年柱.天干 + bazi.年柱.地支,
      月: bazi.月柱.天干 + bazi.月柱.地支,
      日: bazi.日柱.天干 + bazi.日柱.地支,
      时: bazi.时柱.天干 + bazi.时柱.地支,
      yearGan: bazi.年柱.天干,
      yearZhi: bazi.年柱.地支,
      dayGan: bazi.日柱.天干,
      eightChar: bazi.eightChar,
      lunar: bazi.lunar
    };
  }, [birthYear, birthMonth, birthDay, birthHour]);

  const shengxiao = SHENGXIAO[(birthYear - 4) % 12];

  const daYun = useMemo(() => calculateDaYun(birthYear, birthMonth, birthDay, birthHour, gender, ganZhi.yearGan, ganZhi.dayGan), [birthYear, birthMonth, birthDay, birthHour, gender, ganZhi.yearGan, ganZhi.dayGan]);

  // Instantiate Analyzers
  const patternResult = useMemo(() => new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan).analyze(), [ganZhi]);
  const healthResult = useMemo(() => new HealthAnalyzer(ganZhi.yearGan, ganZhi.yearZhi, currentYear).analyzeHealth(new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan).wuxing, currentAge), [ganZhi, currentYear, currentAge]);
  const influenceAnalyzer = useMemo(() => new LifeInfluenceAnalyzer(ganZhi.pillars, ganZhi.dayGan, currentAge), [ganZhi, currentAge]);
  const influenceResult = useMemo(() => influenceAnalyzer.calculateTotalInfluence(), [influenceAnalyzer]);
  const influenceNodes = useMemo(() => influenceAnalyzer.nodes, [influenceAnalyzer]);

  // 事业预测分析
  const careerResult = useMemo(() => {
    const pa = new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan);
    return new CareerAnalyzer(ganZhi.pillars, ganZhi.dayGan, pa.shishenDist, pa.wuxing, patternResult.xiyong, gender).analyze();
  }, [ganZhi, patternResult, gender]);

  // 婚姻预测分析
  const marriageResult = useMemo(() => {
    const pa = new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan);
    return new MarriageAnalyzer(ganZhi.pillars, ganZhi.dayGan, pa.shishenDist, gender, birthDay).analyze();
  }, [ganZhi, gender, birthDay]);

  // 紫微斗数分析
  const ziweiResult = useMemo(() => {
    return new ZiweiAnalyzer(birthYear, birthMonth, birthDay, birthHour, gender).analyze();
  }, [birthYear, birthMonth, birthDay, birthHour, gender]);

  // 人生地图：紫微星曜x八字环境的融合分析
  const lifeMapData = useMemo(() => {
    try {
      if (!ganZhi || !ganZhi.pillars) return {};
      const analyzer = new ZiweiAnalyzer(birthYear, birthMonth, birthDay, birthHour, gender);
      if (!analyzer.chart) return {};
      const pa = new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan);
      return {
        地图: analyzer.generateLifeMap(pa.wuxing, pa.shishenDist),
        角色: analyzer.analyzeStarCharacters(pa.wuxing, Object.keys(pa.shishenDist).sort((a, b) => pa.shishenDist[b] - pa.shishenDist[a])[0]),
        格局: analyzer.analyzePatterns(),
        组合: analyzer.analyzeCombinations(),
        深度联动: analyzer.analyzeDeepLinkage(ganZhi, pa, marriageResult, careerResult),
        流年分析: analyzer.analyzeLiunian(new Date().getFullYear())
      };
    } catch (e) {
      console.error('lifeMapData calculation error:', e);
      return {};
    }
  }, [birthYear, birthMonth, birthDay, birthHour, gender, ganZhi, marriageResult, careerResult]);

  // 智能预测：自动生成事件和关系
  const autoPrediction = useMemo(() => {
    const pa = new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan);
    return new AutoPredictionGenerator(ganZhi, ziweiResult, pa, marriageResult, careerResult, birthYear, gender).generateAll();
  }, [ganZhi, ziweiResult, marriageResult, careerResult, birthYear, gender]);

  // 人生指引：整合所有分析生成三问指引
  const lifeGuidance = useMemo(() => {
    return new LifeGuidanceGenerator(
      autoPrediction,
      lifeMapData.深度联动,
      lifeMapData,
      lifeMapData.流年分析,
      patternResult,
      gender,
      currentAge
    ).generate();
  }, [autoPrediction, lifeMapData, patternResult, gender, currentAge]);

  // Compatibility for Charts
  const pillarInfluence = useMemo(() => {
    const nodes = {};
    influenceNodes.forEach(n => {
      nodes[n.柱位] = {
        name: n.关系,
        influence: parseFloat(n.最终质量),
        percentage: ((parseFloat(n.最终质量) / parseFloat(influenceResult.总质量)) * 100).toFixed(1),
        color: PILLAR_NODES[n.柱位]?.color || '#ccc',
        peak: PILLAR_NODES[n.柱位]?.peak || [0, 100]
      };
    });
    return { nodes, total: parseFloat(influenceResult.总质量) };
  }, [influenceNodes, influenceResult]);

  const gravityField = useMemo(() => calculateGravityField(events, relationships, currentAge), [events, relationships, currentAge]);

  // 影响立场：区分「对我的影响」与「我对他的影响」，觉醒层级决定不对称强弱
  const postureAnalysis = useMemo(() => analyzeInfluencePosture({
    relationships,
    currentAge,
    awakenLevel,
  }), [relationships, currentAge, awakenLevel]);

  // 格局透出：月令藏干是否透出天干；不透时由关系/事件间接引出
  const transparencyAnalysis = useMemo(() => analyzePatternTransparency({
    pillars: ganZhi.pillars,
    dayGan: ganZhi.dayGan,
    relationships,
    events,
  }), [ganZhi, relationships, events]);
  const trajectory = useMemo(() => calculateTrajectory(birthYear, awakenLevel, events, relationships, influenceAnalyzer), [birthYear, awakenLevel, events, relationships, influenceAnalyzer]);


  // 获取觉醒层级信息
  const getAwakenInfo = (level) => {
    for (const [key, info] of Object.entries(AWAKENING_LEVELS)) {
      if (level >= info.range[0] && level < info.range[1]) {
        return { key, ...info };
      }
    }
    return { key: 'L1', ...AWAKENING_LEVELS.L1 };
  };
  const awakenInfo = getAwakenInfo(awakenLevel);
  // 下一层级的 key（用于「提升至 Lx」文案，必须与 awakenInfo.key 同源，不能用 Math.floor 推算）
  const nextAwakenKey = (() => {
    const order = Object.keys(AWAKENING_LEVELS);
    const idx = order.indexOf(awakenInfo.key);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  })();

  // 觉醒层级推演值：由格局清浊、印食强弱、五行均衡推导，未被用户手动调整前跟随推演值
  const derivedAwakening = useMemo(() => {
    try {
      const pa = new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan);
      return new AwakeningAnalyzer(patternResult, pa.shishenDist, pa.wuxing).analyze();
    } catch (e) {
      return null;
    }
  }, [patternResult, ganZhi]);

  const derivedLevel = derivedAwakening ? parseFloat(derivedAwakening.最终层级) : 2.5;
  const awakenTouched = useRef(false);

  useEffect(() => {
    if (!awakenTouched.current) setAwakenLevel(derivedLevel);
  }, [derivedLevel]);

  const resetAwakenToDerived = useCallback(() => {
    awakenTouched.current = false;
    setAwakenLevel(derivedLevel);
  }, [derivedLevel]);

  // 添加事件
  const addEvent = useCallback(() => {
    if (newEvent.type) {
      setEvents(prev => [...prev, { ...newEvent, id: Date.now() }]);
      setNewEvent({ type: '婚姻', age: currentAge, name: '', intensity: 1.0 });
      setShowEventForm(false);
    }
  }, [newEvent, currentAge]);

  // 添加关系
  const addRelationship = useCallback(() => {
    if (newRel.type && newRel.name) {
      setRelationships(prev => [...prev, { ...newRel, id: Date.now() }]);
      setNewRel({ type: '配偶', name: '', startAge: 25, quality: 0.8, status: 'active' });
      setShowRelForm(false);
    }
  }, [newRel]);

  // 删除事件/关系
  const removeEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id));
  const removeRelationship = (id) => setRelationships(prev => prev.filter(r => r.id !== id));

  // 导出 PDF (多页)
  // 依赖按需加载：jspdf / html2canvas 只有在导出时才进入首屏包
  const handleExportPDF = async () => {
    console.log("Starting PDF export process...");
    setIsExporting(true);

    try {
      // 打印容器按需挂载：避免首屏渲染 8 页报告与其中的图表
      setPrintReady(true);
      await new Promise(resolve => setTimeout(resolve, 150));

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // compress 打开后 jsPDF 会对图片流做 Flate 压缩
      const pdf = new jsPDF('p', 'pt', 'a4', true);
      const pageIds = ['export-page-1', 'export-page-ziwei', 'export-page-2', 'export-page-3', 'export-page-4', 'export-page-5', 'export-page-6', 'export-page-7'];
      console.log("Pages to export:", pageIds);

      for (let i = 0; i < pageIds.length; i++) {
        const id = pageIds[i];
        const element = document.getElementById(id);
        if (!element) {
          console.error(`Element not found: ${id}`);
          continue;
        }
        console.log(`Capturing page ${i + 1}: ${id}`, element);

        // Capture page
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0f172a',
          logging: true,
          ignoreElements: (el) => el.classList.contains('no-export')
        });

        // 用 JPEG 而非 PNG：PNG 无损位图会让 8 页报告膨胀到 100MB 以上，不可用于分享
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        console.log(`Page ${i + 1} added to PDF`);
      }

      console.log("Saving PDF...");
      // 本地时区日期，避免东八区凌晨文件名退到前一天
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      pdf.save(`人生地图5.1_完整报告_${stamp}.pdf`);
      console.log("PDF saved successfully");
    } catch (error) {
      console.error('Export failed:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setPrintReady(false);
      setIsExporting(false);
    }
  };

  // 影响力雷达图数据
  const radarData = Object.entries(pillarInfluence.nodes).map(([key, node]) => ({
    subject: node.name,
    value: parseFloat(node.percentage),
    fullMark: 50
  }));

  // 引力场饼图数据
  const gravityPieData = [
    { name: '正向引力', value: parseFloat(gravityField.positive), color: '#22c55e' },
    { name: '负向引力', value: parseFloat(gravityField.negative), color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-main-gradient text-mist-100 p-4 md:p-8 relative" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto">

        {/* ══════════════ 英雄区：命盘罗盘 ══════════════ */}
        <header className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] gap-8 lg:gap-14 items-center mb-9 animate-fade-in-up">
          <div className="order-2 lg:order-1">
            <div className="hero-kicker mb-3">Destiny Map Architecture · V5.1</div>
            <h1 className="hero-title">人生地图 5.1</h1>
            <p className="text-mist-400 mt-3.5 text-sm tracking-wide">Ω塌陷 × 人生影响力场 × 觉醒层级</p>
            <p className="text-mist-500 mt-1.5 text-xs">重要的事件、关系、人，如何改变你的人生轨迹</p>

            <div className="mt-7 grid grid-cols-4 gap-3 stagger-children">
              {['年', '月', '日', '时'].map((zhu) => (
                <div
                  key={zhu}
                  className="pillar-card"
                  style={{ '--pillar-accent': PILLAR_NODES[zhu + '柱']?.color }}
                >
                  <div className="text-[10px] tracking-[0.18em] uppercase text-mist-500">{zhu}柱</div>
                  <div className="pillar-gz mt-1.5">{ganZhi[zhu]}</div>
                  <div
                    className="text-[11px] mt-2 font-medium"
                    style={{ color: PILLAR_NODES[zhu + '柱']?.color }}
                  >
                    {PILLAR_NODES[zhu + '柱']?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 animate-fade-in" style={{ animationDelay: '0.12s' }}>
            <DestinyDial
              palaces={ziweiResult?.十二宫 || []}
              ganZhi={ganZhi}
              relationships={relationships}
            />
          </div>
        </header>

        {/* ══════════════ 控制台 ══════════════ */}
        <section className="panel p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <Field label="出生日期">
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </Field>
            <Field label="出生时辰">
              <select value={birthHour} onChange={e => setBirthHour(parseInt(e.target.value))}>
                <option value={0}>子时 (23-1点)</option>
                <option value={1}>丑时 (1-3点)</option>
                <option value={2}>寅时 (3-5点)</option>
                <option value={3}>卯时 (5-7点)</option>
                <option value={4}>辰时 (7-9点)</option>
                <option value={5}>巳时 (9-11点)</option>
                <option value={6}>午时 (11-13点)</option>
                <option value={7}>未时 (13-15点)</option>
                <option value={8}>申时 (15-17点)</option>
                <option value={9}>酉时 (17-19点)</option>
                <option value={10}>戌时 (19-21点)</option>
                <option value={11}>亥时 (21-23点)</option>
              </select>
            </Field>
            <Field label="性别">
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </Field>
            <Field label={`觉醒层级 · 推演值 ${derivedLevel.toFixed(1)}`}>
              <input
                type="range" min="1" max="5" step="0.1" value={awakenLevel}
                onChange={e => { awakenTouched.current = true; setAwakenLevel(parseFloat(e.target.value)); }}
                className="w-full mt-3"
              />
              <div className="flex items-center justify-between mt-2.5 gap-2">
                <span className="gz text-[12px] font-medium" style={{ color: awakenInfo.color }}>
                  {awakenInfo.key} {awakenInfo.name} ({awakenLevel.toFixed(1)})
                </span>
                {awakenTouched.current && (
                  <button className="chip chip-gold" onClick={resetAwakenToDerived}>
                    回到推演值
                  </button>
                )}
              </div>
            </Field>
          </div>
        </section>

        {/* ══════════════ 导航 ══════════════ */}
        <div
          className="sticky top-3 z-30 mb-8 flex items-center justify-between gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.14s' }}
        >
          <SegmentedNav items={TABS} value={activeTab} onChange={setActiveTab} />
          <button onClick={handleExportPDF} disabled={isExporting} className="no-export export-btn shrink-0">
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                <span>导出中</span>
              </>
            ) : (
              <>
                <span>导出</span>
                <span className="opacity-70">PDF</span>
              </>
            )}
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            {/* 核心数据卡片 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">核心数据</h2>
              <div className="space-y-3">
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">当前年龄</span>
                  <span className="text-2xl font-bold text-mist-100">{currentAge}岁</span>
                </div>
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">生肖</span>
                  <span className="text-2xl">{shengxiao}</span>
                </div>
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">觉醒层级</span>
                  <span className="font-bold" style={{ color: awakenInfo.color }}>
                    {awakenInfo.key} {awakenInfo.name}
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">引力场净值</span>
                  <span className={`font-bold ${parseFloat(gravityField.net) >= 0 ? 'text-wood' : 'text-fire'}`}>
                    {gravityField.net}
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">已标记事件</span>
                  <span className="text-field font-medium">{events.length}个</span>
                </div>
                <div className="stat-pill">
                  <span className="text-mist-400 text-sm">已标记关系</span>
                  <span className="text-ziwei font-medium">{relationships.length}个</span>
                </div>
              </div>
            </div>

            {/* 影响力雷达图 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">当前影响力分布</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#475569" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b' }} />
                    <Radar name="影响力%" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-mist-400 text-sm mt-2 text-center">
                当前主导影响：{Object.entries(pillarInfluence.nodes).sort((a, b) => b[1].influence - a[1].influence)[0][1].name}
              </p>
            </div>

            {/* 引力场分布 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">引力场分布</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                {/* Donut Chart */}
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="colorPositive" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="colorNegative" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                          <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={gravityPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        cornerRadius={5}
                        stroke="none"
                      >
                        {gravityPieData.map((entry, index) => (
                          <Cell key={index} fill={index === 0 ? "url(#colorPositive)" : "url(#colorNegative)"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-mist-400 text-xs uppercase tracking-wider">净引力</span>
                    <span className={`text-3xl font-black ${parseFloat(gravityField.net) >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600'}`}>
                      {parseFloat(gravityField.net) > 0 ? '+' : ''}{gravityField.net}
                    </span>
                  </div>
                </div>

                {/* Top Contributors */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-mist-400 uppercase tracking-widest border-b border-ink-600 pb-2">主要影响源</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {gravityField.details.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${parseFloat(item.gravity) > 0 ? 'bg-wood/12' : 'bg-fire/12'}`}></div>
                          <span className="text-mist-300 group-hover:text-mist-100 transition-colors text-sm">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-ink-700 rounded text-mist-400">
                            {item.type === 'event' ? '事件' : '关系'}
                          </span>
                        </div>
                        <span className={`font-mono text-sm font-bold ${parseFloat(item.gravity) > 0 ? 'text-wood' : 'text-fire'}`}>
                          {parseFloat(item.gravity) > 0 ? '+' : ''}{item.gravity}
                        </span>
                      </div>
                    ))}
                    {gravityField.details.length === 0 && (
                      <div className="text-mist-500 text-sm italic">暂无标记</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 觉醒层级说明 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">觉醒层级</h2>
              <div className="space-y-3">
                {Object.entries(AWAKENING_LEVELS).map(([key, level]) => (
                  <div key={key} className={`flex items-center justify-between p-2 rounded-lg ${awakenInfo.key === key ? 'bg-ink-700/60 ring-1 ring-purple-500' : ''
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: level.color }}></div>
                      <span className={awakenInfo.key === key ? 'text-mist-100 font-bold' : 'text-mist-400'}>
                        {key} {level.name}
                      </span>
                    </div>
                    <span className="text-sm text-mist-500">
                      事件影响 ×{level.multiplier}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-mist-500 text-sm mt-4">
                觉醒层级越高，事件对你的"质量感知"越小，越不易被命运裹挟。
              </p>
            </div>

            {/* 智能事件预测 */}
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.12), rgba(88,28,135,0.08))' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">✨ 未来可能发生的事</h3>
                <span className="text-sm text-ziwei px-3 py-1 bg-ziwei/50 rounded-full">
                  {autoPrediction?.人生阶段?.阶段} · {autoPrediction?.人生阶段?.年龄}岁
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {autoPrediction?.智能事件?.map((event, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${event.重要性 === '高' ? 'bg-ziwei/12 border-ziwei/35' : 'bg-ink-800/70 border-ink-500'
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{event.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-mist-100">{event.事件}</span>
                          <span className="text-xs px-2 py-0.5 bg-ziwei/50 text-ziwei rounded">{event.类型}</span>
                          {event.重要性 === '高' && <span className="text-xs px-2 py-0.5 bg-fire/50 text-fire rounded">重要</span>}
                        </div>
                        <p className="text-sm text-mist-300 mb-2">{event.描述}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ziwei">预计年龄：约{event.预计年龄}岁</span>
                        </div>
                        <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gold">
                          💡 建议：{event.建议}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 智能关系预测 */}
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(190,24,93,0.1), rgba(159,18,57,0.06))' }}>
              <h3 className="section-title mb-5">💫 你生命中的重要人物</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {autoPrediction?.智能关系?.map((rel, idx) => (
                  <div key={idx} className="bg-ink-800/70 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{rel.关系.split(' ')[0]}</span>
                      <div>
                        <div className="font-bold text-mist-100">{rel.关系.split(' ')[1]}</div>
                        <div className={`text-xs ${rel.质量 === '很好' || rel.质量 === '运气好' ? 'text-wood' :
                          rel.质量 === '良好' || rel.质量 === '缘分深' ? 'text-wood' :
                            'text-mist-400'
                          }`}>质量：{rel.质量}</div>
                      </div>
                    </div>
                    <p className="text-sm text-mist-300 mb-2">{rel.描述}</p>
                    <p className="text-xs text-fire mb-2">{rel.特征}</p>
                    <div className="p-2 bg-black/20 rounded text-xs text-gold">
                      💡 {rel.建议}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心提示 */}
            {autoPrediction?.核心提示?.length > 0 && (
              <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(20,184,166,0.05))' }}>
                <h3 className="section-title mb-5">🎯 给你的建议</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {autoPrediction.核心提示.map((tip, idx) => (
                    <div key={idx} className="bg-black/30 rounded-xl p-4 text-center">
                      <div className="text-3xl mb-2">{tip.icon}</div>
                      <div className="font-bold text-mist-100 mb-2">{tip.标题}</div>
                      <div className="text-sm text-mist-300">{tip.内容}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="space-y-6">
            {/* 日主性情分析（滴天髓） */}
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(180,83,9,0.1), rgba(194,65,12,0.06))' }}>
              <h2 className="section-title mb-5">滴天髓 · 十天干论</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">{ganZhi.dayGan}</div>
                    <div className="text-lg text-gold">{TIANGAN_WUXING[ganZhi.dayGan]}·{['甲', '丙', '戊', '庚', '壬'].includes(ganZhi.dayGan) ? '阳' : '阴'}</div>
                    <div className="text-mist-400 text-sm mt-1">日主</div>
                  </div>
                  <div className="text-center">
                    <div className="text-mist-100 font-bold">
                      {{
                        '甲': '参天大树', '乙': '花卉藤蔓', '丙': '太阳之火', '丁': '灯烛炉火',
                        '戊': '高山城墙', '己': '田园湿土', '庚': '刀剑顽铁', '辛': '珠玉首饰',
                        '壬': '江河大海', '癸': '雨露泉水'
                      }[ganZhi.dayGan] || ''}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 bg-ink-800/70 rounded-xl p-4">
                  <div className="text-gold font-bold mb-2">《滴天髓》原文：</div>
                  <div className="text-mist-300 italic leading-relaxed mb-4 text-sm">
                    "{{
                      '甲': '甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。',
                      '乙': '乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。',
                      '丙': '丙火猛烈，欺霜侮雪。能锻庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲来焚灭。',
                      '丁': '丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。',
                      '戊': '戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。',
                      '己': '己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。',
                      '庚': '庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输於乙妹。',
                      '辛': '辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。',
                      '壬': '壬水汪洋，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。',
                      '癸': '癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。'
                    }[ganZhi.dayGan] || ''}"
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-wood/12 rounded-lg p-3 border border-wood/50">
                      <div className="text-wood text-xs mb-1">✓ 性格优点</div>
                      <div className="text-mist-100">
                        {{
                          '甲': '正直不阿、有进取心、领导力强', '乙': '柔中带韧、善于变通、人缘好',
                          '丙': '热情开朗、光明磊落、有感染力', '丁': '温文尔雅、心思细腻、聪明灵慧',
                          '戊': '忠厚老实、稳重可靠、包容心强', '己': '温和谦逊、善于包容、心思缜密',
                          '庚': '刚毅果断、重义轻利、正直不阿', '辛': '温润清雅、思维敏捷、审美力强',
                          '壬': '智慧聪颖、包容豁达、学习力强', '癸': '心思细腻、善解人意、有耐心'
                        }[ganZhi.dayGan] || ''}
                      </div>
                    </div>
                    <div className="bg-fire/12 rounded-lg p-3 border border-fire/50">
                      <div className="text-fire text-xs mb-1">✗ 需注意</div>
                      <div className="text-mist-100">
                        {{
                          '甲': '固执己见、不够灵活', '乙': '依赖性强、优柔寡断',
                          '丙': '性情急躁、容易冲动', '丁': '多虑多思、有时阴郁',
                          '戊': '过于固执、反应迟缓', '己': '过于谨慎、有时优柔',
                          '庚': '过于刚硬、缺乏柔情', '辛': '过于敏感、有时矫情',
                          '壬': '缺乏定力、有时散漫', '癸': '过于内敛、有时消极'
                        }[ganZhi.dayGan] || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 格局概览 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">八字格局分析</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-ink-700/60 p-4 rounded-xl">
                  <div className="text-mist-400 text-sm mb-1">日主强弱</div>
                  <div className={`text-2xl font-bold ${patternResult.strength.strengthLevel >= 4 ? 'text-fire' : patternResult.strength.strengthLevel <= 2 ? 'text-water' : 'text-wood'}`}>
                    {patternResult.strength.strength}
                  </div>
                  <div className="text-xs text-mist-500 mt-1">得分为 {patternResult.strength.score}</div>
                </div>
                <div className="bg-ink-700/60 p-4 rounded-xl">
                  <div className="text-mist-400 text-sm mb-1">格局层次</div>
                  <div className="text-2xl font-bold text-ziwei">{patternResult.patternLevel}</div>
                  <div className="text-xs text-mist-500 mt-1">{patternResult.patternType} · {patternResult.patternName}</div>
                </div>
                <div className="bg-ink-700/60 p-4 rounded-xl">
                  <div className="text-mist-400 text-sm mb-1">清浊状态</div>
                  <div className="text-2xl font-bold text-mist-100">{patternResult.qingzhuoStatus.status}</div>
                  <div className="text-xs text-mist-500 mt-1">{patternResult.qingzhuoStatus.desc}</div>
                </div>
                <div className="bg-ink-700/60 p-4 rounded-xl">
                  <div className="text-mist-400 text-sm mb-1">喜用神</div>
                  <div className="flex gap-2 mt-1">
                    {patternResult.xiyong.xi.map(x => (
                      <span key={x} className="px-2 py-0.5 bg-wood/50 text-wood rounded text-sm">{x}</span>
                    ))}
                  </div>
                  <div className="text-xs text-mist-500 mt-1">忌：{patternResult.xiyong.ji.join('、')}</div>
                </div>
              </div>
            </div>

            {/* 格局透出分析：藏干透出与借关系引出 */}
            <PatternTransparencyPanel analysis={transparencyAnalysis} />

            {/* 格局与用神 详解 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.12), rgba(67,56,202,0.08))' }}>
                <h2 className="section-title mb-5">三命通会 · 格局论</h2>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-mist-100">{patternResult.patternName || '无格'}</div>
                  <div className="text-mist-400 text-sm mt-1">{patternResult.patternLevel || '器用'}级别</div>
                </div>
                <div className="bg-ink-800/70 rounded-lg p-4 mb-4">
                  <div className="text-ziwei text-sm italic">
                    "{{
                      '正官格': '正官者，克我而有情，阴阳相配，受制而成器。',
                      '七杀格': '七杀者，克我而无情，须得制化方为贵。',
                      '正财格': '正财者，为我所克，阴阳有情之财，主正途所得。',
                      '偏财格': '偏财者，众人之财，主横发意外之财，不主正途。',
                      '食神格': '食神者，我所生，温良恭俭，为福禄之神。',
                      '伤官格': '伤官者，我生之秀气，克制正官，多才而傲。',
                      '正印格': '正印者，生我之物，慈母之象，主贵人扶持。',
                      '偏印格': '偏印者，枭神之称，生我而无情，主偏门学术。'
                    }[patternResult.patternName] || '格局以月令为纲，以透干为用。'}"
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-wood">✓ 喜：</span>
                    <span className="text-mist-100">{patternResult.xiyong?.xi?.join('、') || '--'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-fire">✗ 忌：</span>
                    <span className="text-mist-100">{patternResult.xiyong?.ji?.join('、') || '--'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(20,184,166,0.05))' }}>
                <h2 className="section-title mb-5">用神选取法则</h2>
                <div className="space-y-3 text-sm">
                  <div className="bg-ink-800/70 rounded-lg p-3">
                    <div className="text-field mb-1 font-semibold">扶抑法则：</div>
                    <div className="text-mist-300">
                      {patternResult.strength?.strengthLevel >= 3
                        ? '身旺则需食伤泄秀、财星耗身、官杀制身'
                        : patternResult.strength?.strengthLevel <= 2
                          ? '身弱则需印星生身、比劫助身'
                          : '身势中和，随运取用'}
                    </div>
                  </div>
                  <div className="bg-ink-800/70 rounded-lg p-3">
                    <div className="text-field mb-1 font-semibold">调候法则：</div>
                    <div className="text-mist-300">
                      {birthMonth >= 11 || birthMonth <= 2
                        ? '冬生之命，命局寒冷，喜丙丁火调候'
                        : birthMonth >= 5 && birthMonth <= 8
                          ? '夏生之命，命局燥热，喜壬癸水调候'
                          : '春秋之命，寒暖适中，以扶抑为先'}
                    </div>
                  </div>
                  <div className="bg-ink-800/70 rounded-lg p-3">
                    <div className="text-field mb-1 font-semibold">行运建议：</div>
                    <div className="text-mist-300">
                      {patternResult.strength?.strengthLevel >= 3
                        ? '身旺能任财官，宜遇财官大运，事业财运可期。'
                        : patternResult.strength?.strengthLevel <= 2
                          ? '身弱需生扶，宜遇印绶大运，得贵人相助。'
                          : '身势中和，取用灵活，看大运所需而用。'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 五行能量分布 */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-5">五行能量分布</h3>
              <div className="grid grid-cols-5 gap-2 h-32 items-end">
                {Object.entries(new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan).wuxing).map(([wx, val]) => {
                  const height = Math.min(100, (val / 10) * 100);
                  return (
                    <div key={wx} className="flex flex-col items-center gap-2 group">
                      <div className="text-xs text-mist-400">{val.toFixed(1)}</div>
                      <div className="w-full bg-ink-700 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-ink-600" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-0 left-0 right-0 top-0 opacity-60" style={{ backgroundColor: WUXING_COLORS[wx] }}></div>
                      </div>
                      <div className="text-sm font-bold text-mist-100">{wx}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 适合领域 */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-5">适合领域（基于喜用神五行）</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { wx: '木', careers: ['教育培训', '文化传承', '农林园艺', '医药保健'], match: patternResult.xiyong?.xi?.includes('木') },
                  { wx: '火', careers: ['传媒影视', '能源电力', '餐饮娱乐', '照明电子'], match: patternResult.xiyong?.xi?.includes('火') },
                  { wx: '土', careers: ['房地产', '建筑工程', '农业矿业', '人力资源'], match: patternResult.xiyong?.xi?.includes('土') },
                  { wx: '金', careers: ['金融法务', '机械制造', '珠宝首饰', '医疗手术'], match: patternResult.xiyong?.xi?.includes('金') },
                  { wx: '水', careers: ['贸易流通', '咨询策划', '旅游物流', '水利航运'], match: patternResult.xiyong?.xi?.includes('水') }
                ].map(item => (
                  <div key={item.wx} className={`rounded-xl p-4 ${item.match ? 'bg-wood/40 border-2 border-wood/40' : 'bg-ink-700/40'}`}>
                    <div className={`text-center text-2xl mb-2 ${item.match ? 'text-wood' : ''}`} style={{ color: item.match ? undefined : WUXING_COLORS[item.wx] }}>{item.wx}</div>
                    <div className="text-xs text-mist-400 space-y-1">
                      {item.careers.map((c, i) => <div key={i}>{c}</div>)}
                    </div>
                    {item.match && <div className="text-center text-xs text-wood mt-2">★ 喜用</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 事业预测分析 */}
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.1), rgba(67,56,202,0.06))' }}>
              <h3 className="section-title mb-5">事业预测分析</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 事业性格 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-water/12 rounded text-xs text-mist-100">主导十神</span>
                    <span className="text-xl font-bold text-mist-100">{careerResult.主导十神}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${careerResult.事业性格?.类型 === '动星' ? 'bg-earth/50 text-earth' : careerResult.事业性格?.类型 === '静星' ? 'bg-field/50 text-field' : 'bg-ink-700 text-mist-400'}`}>
                      {careerResult.事业性格?.类型 || '中性'}
                    </span>
                  </div>
                  {careerResult.事业性格 && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-mist-400 text-xs mb-1">性格特点</div>
                        <div className="flex flex-wrap gap-1">
                          {careerResult.事业性格.性格特点?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-water/12 text-water rounded text-xs">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-mist-400 text-xs mb-1">事业风格</div>
                        <div className="text-mist-100 text-sm">{careerResult.事业性格.事业风格}</div>
                      </div>
                      <div>
                        <div className="text-mist-400 text-xs mb-1">适合行业</div>
                        <div className="flex flex-wrap gap-1">
                          {careerResult.事业性格.适合行业?.slice(0, 5).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-wood/12 text-wood rounded text-xs">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gold/20 p-2 rounded">
                        <span className="text-gold text-xs">⚠️ 忌讳：</span>
                        <span className="text-gold-bright text-xs">{careerResult.事业性格.忌讳}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 行业建议 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-water font-semibold mb-3">📈 喜用五行行业建议</div>
                  <div className="space-y-3">
                    {careerResult.行业建议?.map((item, idx) => (
                      <div key={idx} className="bg-mist/40 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg" style={{ color: WUXING_COLORS[item.五行] }}>{item.五行}</span>
                          <span className="text-mist-400 text-xs">方位：{item.方位}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.行业列表?.map((ind, i) => (
                            <span key={i} className="px-2 py-0.5 bg-ink-600/50 text-mist-300 rounded text-xs">{ind}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 劳动类型 */}
                  <div className="mt-4 p-3 bg-ziwei/30 rounded-lg border border-ziwei/50">
                    <div className="text-ziwei text-sm font-bold">{careerResult.劳动类型?.类型 || '综合型'}</div>
                    <div className="text-mist-300 text-xs mt-1">{careerResult.劳动类型?.说明}</div>
                  </div>
                </div>
              </div>

              {/* 综合评价 */}
              <div className="mt-4 p-4 bg-water/20 rounded-lg border border-water/50">
                <span className="text-water font-bold mr-2">📝 综合评价：</span>
                <span className="text-water-300">{careerResult.综合评价}</span>
              </div>
            </div>

            {/* 婚姻预测分析 */}
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(190,24,93,0.1), rgba(159,18,57,0.06))' }}>
              <h3 className="section-title mb-5">婚姻预测分析</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 夫妻宫分析 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-fire font-semibold mb-3">🏠 夫妻宫分析</div>
                  {marriageResult.夫妻宫分析 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-mist-400 text-sm">夫妻宫</span>
                        <span className="text-2xl font-bold text-mist-100">{marriageResult.夫妻宫分析.夫妻宫}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-mist-400 text-sm">藏干十神</span>
                        <span className="text-fire">{marriageResult.夫妻宫分析.藏干十神}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-mist-400 text-sm">配偶类型</span>
                        <span className="text-mist-100 font-bold">{marriageResult.夫妻宫分析.配偶类型}型</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-mist-400 text-xs mb-1">配偶特征</div>
                        <div className="flex flex-wrap gap-1">
                          {marriageResult.夫妻宫分析.特征?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-fire/12 text-fire rounded text-xs">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 婚姻评分 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-fire font-semibold mb-3">📊 婚姻质量评分</div>
                  <div className="text-center mb-4">
                    <div className={`text-5xl font-black ${marriageResult.婚姻评分?.最终分数 >= 80 ? 'text-wood' : marriageResult.婚姻评分?.最终分数 >= 60 ? 'text-gold' : 'text-fire'}`}>
                      {marriageResult.婚姻评分?.最终分数}
                    </div>
                    <div className={`text-sm mt-1 px-3 py-1 inline-block rounded ${marriageResult.婚姻评分?.等级 === '优秀' ? 'bg-wood/50 text-wood' : marriageResult.婚姻评分?.等级 === '良好' ? 'bg-gold/50 text-gold' : 'bg-fire/50 text-fire'}`}>
                      {marriageResult.婚姻评分?.等级}
                    </div>
                  </div>
                  {marriageResult.婚姻评分?.扣分明细?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-mist-400 text-xs">扣分明细：</div>
                      {marriageResult.婚姻评分.扣分明细.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-fire">{d.类型}</span>
                          <span className="text-fire">-{d.扣分}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-mist-300 text-xs">{marriageResult.婚姻评分?.说明}</div>
                </div>

                {/* 配偶信息预测 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-fire font-semibold mb-3">👤 配偶信息预测</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-mist-400 text-xs mb-1">外貌特征</div>
                      <div className="text-mist-100 text-sm">{marriageResult.配偶样貌?.外表 || '--'}</div>
                      {marriageResult.配偶样貌?.五行特征 && (
                        <div className="text-mist-400 text-xs mt-1">{marriageResult.配偶样貌.五行特征}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-mist-400 text-xs mb-1">年龄差距</div>
                      <div className="flex items-center gap-2">
                        <span className="text-mist-100 text-sm">{marriageResult.年龄差距?.差距 || '正常'}</span>
                      </div>
                      <div className="text-mist-400 text-xs mt-1">{marriageResult.年龄差距?.说明}</div>
                    </div>
                    <div>
                      <div className="text-mist-400 text-xs mb-1">配偶方位</div>
                      <div className="text-mist-100 text-sm">{marriageResult.配偶方位?.方位 || '--'}</div>
                      <div className="text-mist-400 text-xs">{marriageResult.配偶方位?.说明}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 婚期预测 */}
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-fire font-semibold mb-3">📅 婚期预测</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-mist-400 text-sm">适婚年龄</span>
                      <span className="text-mist-100">{marriageResult.婚期预测?.适婚年龄 || '22-35岁'}</span>
                    </div>
                    {marriageResult.婚期预测?.桃花位 && (
                      <div className="flex justify-between items-center">
                        <span className="text-mist-400 text-sm">桃花位</span>
                        <span className="text-fire">{marriageResult.婚期预测.桃花位}（流年地支）</span>
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="text-mist-400 text-xs mb-1">婚期标志</div>
                      {marriageResult.婚期预测?.婚期标志?.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs text-mist-300 py-1 border-b border-mist/50 last:border-0">
                          <span className="text-fire">{item.标志}：</span>{item.说明}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 婚姻警示 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="text-fire font-semibold mb-3">⚠️ 婚姻提醒</div>
                  {marriageResult.婚姻警示?.length > 0 ? (
                    <div className="space-y-2">
                      {marriageResult.婚姻警示.map((w, i) => (
                        <div key={i} className={`p-2 rounded ${w.严重程度 === '中' ? 'bg-gold/10 border border-gold/50' : 'bg-ink-700/40'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${w.严重程度 === '中' ? 'bg-gold/12 text-gold-bright' : 'bg-ink-600 text-mist-300'}`}>
                              {w.严重程度}
                            </span>
                            <span className="text-mist-100 text-sm">{w.类型}</span>
                          </div>
                          <div className="text-mist-400 text-xs mt-1">{w.建议}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-wood text-3xl mb-2">✓</div>
                      <div className="text-wood">暂无明显婚姻警示</div>
                      <div className="text-mist-400 text-xs mt-1">婚姻宫状态良好</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 综合评价 */}
              <div className="mt-4 p-4 bg-fire/20 rounded-lg border border-fire/50">
                <span className="text-fire font-bold mr-2">📝 综合评价：</span>
                <span className="text-fire-300">{marriageResult.综合评价}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ziwei' && (
          <div className="space-y-6">
            {/* 人生地图概览 - 星曜x环境融合 */}
            <div className={`bg-gradient-to-r ${lifeMapData.地图?.地形环境?.色调 || 'from-slate-800 to-slate-900'} rounded-2xl p-6 border ${lifeMapData.地图?.地形环境?.边框色 || 'border-ink-500'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{lifeMapData.地图?.地形环境?.icon || '🌍'}</span>
                <div>
                  <h2 className="text-xl font-bold text-mist-100">🗺️ 人生地图</h2>
                  <div className="text-sm text-mist-300">紫微星曜 × 八字环境 的命运交响</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* 地形环境 */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-gold font-semibold mb-2">🏔️ 地势环境（八字五行）</div>
                  <div className="text-2xl font-bold text-mist-100 mb-1">{lifeMapData.地图?.地形环境?.地形名称}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {lifeMapData.地图?.地形环境?.特性?.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gold/10 text-gold rounded text-xs">{t}</span>
                    ))}
                  </div>
                  <div className="text-xs text-mist-400">{lifeMapData.地图?.地形环境?.描述}</div>
                </div>

                {/* 势力场 */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-field font-semibold mb-2">{lifeMapData.地图?.势力场?.icon} 势力场（八字十神）</div>
                  <div className="text-2xl font-bold text-mist-100 mb-1">{lifeMapData.地图?.势力场?.场域名称}</div>
                  <div className="text-sm text-field mb-2">{lifeMapData.地图?.势力场?.效果}</div>
                  <div className="text-xs text-mist-400">{lifeMapData.地图?.势力场?.描述}</div>
                </div>

                {/* 星曜角色 */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-ziwei font-semibold mb-2">
                    ⭐ 命主星曜（{lifeMapData.地图?.星曜角色?.[0]?.名称 || '待定'}）
                  </div>
                  {lifeMapData.地图?.星曜角色?.map((star, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{star.icon}</span>
                      <div>
                        <div className="font-bold text-mist-100">{star.名称}·{star.角色}</div>
                        <div className={`text-xs ${star.适应性?.等级 === '极佳' ? 'text-wood' :
                          star.适应性?.等级 === '良好' ? 'text-wood' :
                            star.适应性?.等级 === '受阻' ? 'text-earth' :
                              star.适应性?.等级 === '困难' ? 'text-fire' :
                                'text-mist-400'
                          }`}>
                          环境适应：{star.适应性?.等级}（{star.适应性?.分数}分）
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 地图评语 */}
              <div className="p-3 bg-black/40 rounded-lg text-center">
                <span className="text-mist-100">{lifeMapData.地图?.地图评语}</span>
              </div>
            </div>

            {/* 星曜角色详解 */}
            {lifeMapData.角色?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-ziwei mb-4">🎭 星曜角色详解</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {lifeMapData.角色.map((char, idx) => (
                    <div key={idx} className="bg-ink-800/70 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl">{char.icon}</div>
                        <div>
                          <div className="text-xl font-bold text-mist-100">{char.星曜}·{char.角色}</div>
                          <div className="text-sm text-ziwei">{char.别名}</div>
                        </div>
                        <div className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${char.状态 === '如鱼得水' ? 'bg-wood/12 text-mist-100' :
                          char.状态 === '正常发挥' ? 'bg-water/12 text-mist-100' :
                            'bg-earth/12 text-mist-100'
                          }`}>
                          {char.状态}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {char.行为模式?.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 bg-ziwei/50 text-ziwei rounded">{b}</span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {char.性格标签?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-ziwei/50 text-ziwei rounded">{t}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="p-2 bg-black/30 rounded">
                            <div className="text-xs text-gold mb-1">🏔️ 地形效果</div>
                            <div className="text-xs text-mist-100">{char.环境效果?.地形}：{char.环境效果?.修正 > 0 ? '+' : ''}{char.环境效果?.修正}</div>
                            <div className="text-xs text-mist-400">{char.环境效果?.说明}</div>
                          </div>
                          <div className="p-2 bg-black/30 rounded">
                            <div className="text-xs text-field mb-1">⚡ 十神互动</div>
                            <div className="text-xs text-mist-100">{char.十神效果?.效果}：{char.十神效果?.加成 > 0 ? '+' : ''}{char.十神效果?.加成 || 0}</div>
                            <div className="text-xs text-mist-400">{char.十神效果?.说明 || '无特殊互动'}</div>
                          </div>
                        </div>
                        <div className="text-xs text-mist-400 mt-2">
                          🎬 适合舞台：{char.舞台}
                        </div>
                      </div>

                      {/* 能力值条 */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-mist-400 mb-1">
                          <span>环境适应力</span>
                          <span>{char.能力值}/100</span>
                        </div>
                        <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${char.能力值 >= 75 ? 'bg-wood/12' :
                              char.能力值 >= 50 ? 'bg-water/12' :
                                'bg-earth/12'
                              }`}
                            style={{ width: `${char.能力值}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 当前大限 —— 紫微运限，此前只算不显 */}
            {ziweiResult.当前大限 && (
              <div className="glass-card p-5 mb-5 border-gold/20">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <div className="eyebrow mb-1.5">紫微大限 · 当前运限</div>
                    <div className="flex items-baseline gap-3">
                      <span className="gz text-2xl text-gold">{ziweiResult.当前大限.干支 || '—'}</span>
                      <span className="text-sm text-mist-300">
                        {ziweiResult.当前大限.宫位 || '命宫'} · {ziweiResult.当前大限.岁数范围 || '—'}
                      </span>
                    </div>
                  </div>
                  {ziweiResult.当前大限.四化?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ziweiResult.当前大限.四化.map((h, i) => (
                        <span key={i} className="chip chip-gold">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="ml-auto text-[11px] text-mist-500 leading-relaxed max-w-xs">
                    大限由五行局起运岁数与运限序位推得，随年龄推移自动轮转
                  </div>
                </div>
              </div>
            )}

            {/* 命宫分析 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">🌟 命宫分析</h2>
              {ziweiResult.命宫分析 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-ink-800/70 rounded-xl p-4">
                    <div className="text-center mb-4">
                      <div className="text-xl font-bold text-mist-100 mb-1">
                        {ziweiResult.命宫分析?.详细分析?.人生主题 || ''}
                      </div>
                      <div className="text-sm text-mist-300 mb-2">
                        {ziweiResult.命宫分析?.主星?.map(s => s.名称).join('、') || '无主星'}
                      </div>
                      <div className="text-ziwei italic mb-2">"{ziweiResult.命宫分析?.命格评价 || '命盘核心解析中'}"</div>
                    </div>

                    <div className="space-y-4">
                      {/* 核心性格 */}
                      <div className="bg-ziwei/20 p-3 rounded-lg border border-ziwei/50">
                        <div className="text-ziwei text-xs font-bold mb-1">🎭 核心性格</div>
                        <div className="text-mist-300 text-sm leading-relaxed">
                          {ziweiResult.命宫分析?.详细分析?.核心性格 || '个性独特，待详细解读'}
                        </div>
                      </div>

                      {/* 阴影面 (只有在有内容时显示) */}
                      {ziweiResult.命宫分析?.详细分析?.阴影面 && (
                        <div className="bg-ink-900/60 p-3 rounded-lg border border-ink-600">
                          <div className="text-mist-400 text-xs font-bold mb-1">🌑 潜在阴影</div>
                          <div className="text-sm text-mist-400 leading-relaxed">
                            {ziweiResult.命宫分析?.详细分析?.阴影面}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-mist-500 text-xs mb-1">天赋特质</div>
                        <div className="flex flex-wrap gap-1">
                          {ziweiResult.命宫分析?.特质?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-ziwei/12 text-ziwei rounded text-xs">{t}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-mist-500 text-xs mb-1">适合发展</div>
                        <div className="flex flex-wrap gap-1">
                          {ziweiResult.命宫分析?.事业方向?.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-water/12 text-water rounded text-xs">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 命盘整体分析 */}
                  <div className="bg-ink-800/70 rounded-xl p-4">
                    <div className="text-ziwei font-semibold mb-3">🌐 命盘整体格局</div>
                    <div className="space-y-4">
                      {ziweiResult.整体格局?.吉格?.length > 0 ? (
                        ziweiResult.整体格局.吉格.slice(0, 3).map((g, i) => (
                          <div key={i} className="bg-gold/20 p-3 rounded-lg border border-gold/30">
                            <div className="flex items-center gap-2 mb-1">
                              <span>{g.icon || '🌟'}</span>
                              <span className="font-bold text-gold">吉格：{g.名称}</span>
                            </div>
                            <div className="text-xs text-mist-300 leading-relaxed">{g.解读}</div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-water/20 p-3 rounded-lg border border-water/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span>🎯</span>
                            <span className="font-bold text-water">格局：布局平稳</span>
                          </div>
                          <div className="text-xs text-mist-300 leading-relaxed">
                            此命盘星曜分布均衡，不偏不倚，属厚积薄发之势。
                          </div>
                        </div>
                      )}

                      {ziweiResult.整体格局?.凶格?.slice(0, 1).map((g, i) => (
                        <div key={i} className="bg-fire/10 p-3 rounded-lg border border-fire/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{g.icon || '⚠️'}</span>
                            <span className="font-bold text-fire">注意：{g.名称}</span>
                          </div>
                          <div className="text-xs text-mist-400 leading-relaxed">{g.解读}</div>
                        </div>
                      ))}

                      {/* 综合评价补足 */}
                      <div className="bg-ziwei/10 p-3 rounded-lg border border-ziwei/20">
                        <div className="text-ziwei text-[10px] uppercase tracking-widest font-bold mb-1">综合解读</div>
                        <div className="text-xs text-mist-400 italic">
                          {ziweiResult.综合评价 || '命盘各宫位配置平均，利于全面发展。建议根据各大限运势，按部就班实现人生目标。'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-mist-400">命盘计算中...</div>
              )}
            </div>

            {/* 专业紫微命盘展示 */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gold">🏛️ 专业十二宫命盘</h3>
                <div className="text-[10px] text-mist-500 uppercase tracking-widest">传统布阵 · 宫位详略</div>
              </div>
              <TraditionalZiweiBoard data={ziweiResult} ganZhi={ganZhi} />
              <div className="mt-4 text-[10px] text-mist-500 text-center italic">
                注：外围十二格代表十二自然宫位，中心为命盘元数据与核心评价。
              </div>
            </div>

            {/* 十二宫位解读详述（折叠显示或直接显示） */}
            <div className="bg-mist/30 rounded-2xl p-6 border border-mist/50">
              <h3 className="text-lg font-bold text-mist-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/12"></span>
                宫位详析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ziweiResult.十二宫?.map((palace, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-ink-900/60 border border-ink-700 hover:border-ink-600 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-mist-100 text-sm">{palace.宫位}</span>
                      <span className={`text-[10px] px-1 rounded ${palace.吉凶 === '大吉' ? 'bg-wood/50 text-wood' :
                        palace.吉凶 === '吉' ? 'bg-wood/12 text-wood' :
                          palace.吉凶 === '凶' ? 'bg-fire/12 text-fire' :
                            palace.吉凶 === '小凶' ? 'bg-earth/12 text-earth' :
                              'bg-ink-800 text-mist-500'
                        }`}>{palace.吉凶}</span>
                    </div>
                    <div className="text-[11px] text-mist-400 leading-relaxed italic border-l-2 border-ink-600 pl-2">
                      {palace.解读}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 关键星曜 */}
            {ziweiResult.关键星曜?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="section-title mb-5">⭐ 关键星曜</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ziweiResult.关键星曜.map((star, idx) => (
                    <div key={idx} className="bg-ink-800/70 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/30 flex items-center justify-center text-gold font-bold">
                        {star.星曜.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-mist-100">{star.星曜}</div>
                        <div className="text-xs text-mist-400">位于{star.宫位} · {star.作用}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 命盘格局分析 */}
            {(lifeMapData.格局?.吉格?.length > 0 || lifeMapData.格局?.凶格?.length > 0) && (
              <div className="glass-card p-6">
                <h3 className="section-title mb-5">🏅 你的命盘格局</h3>
                <p className="text-sm text-mist-300 mb-4">格局是命盘中星曜的特殊组合，代表着特定的命运特征</p>

                {lifeMapData.格局?.吉格?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-wood font-semibold mb-3">✨ 好格局</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {lifeMapData.格局.吉格.map((pattern, idx) => (
                        <div key={idx} className="bg-wood/10 border border-wood/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{pattern.icon}</span>
                            <div>
                              <span className="font-bold text-mist-100">{pattern.名称}</span>
                              <span className="ml-2 text-xs px-2 py-0.5 bg-wood/50 text-wood rounded">{pattern.等级}</span>
                            </div>
                          </div>
                          <p className="text-sm text-mist-300 mb-2">{pattern.解读}</p>
                          <div className="text-xs text-gold">💼 {pattern.事业}</div>
                          <div className="text-xs text-field mt-1">💡 {pattern.建议}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lifeMapData.格局?.凶格?.length > 0 && (
                  <div>
                    <div className="text-earth font-semibold mb-3">⚠️ 需注意的格局</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {lifeMapData.格局.凶格.map((pattern, idx) => (
                        <div key={idx} className="bg-earth/20 border border-earth/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{pattern.icon}</span>
                            <div>
                              <span className="font-bold text-mist-100">{pattern.名称}</span>
                              <span className="ml-2 text-xs px-2 py-0.5 bg-earth/50 text-earth rounded">{pattern.等级}</span>
                            </div>
                          </div>
                          <p className="text-sm text-mist-300 mb-2">{pattern.解读}</p>
                          <div className="text-xs text-wood">🛡️ 化解：{pattern.化解}</div>
                          <div className="text-xs text-field mt-1">💡 {pattern.建议}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 星曜组合详解 */}
            {lifeMapData.组合?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="section-title mb-5">💫 你的星曜组合</h3>
                <div className="grid gap-4">
                  {lifeMapData.组合.map((combo, idx) => (
                    <div key={idx} className="bg-ink-800/70 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xl font-bold text-mist-100">{combo.名称}</div>
                        <span className="text-sm text-fire">{combo.宫位}宫</span>
                      </div>
                      <div className="text-sm text-ziwei mb-2">🎭 {combo.性格}</div>
                      <p className="text-sm text-mist-300 mb-3">{combo.通俗解读}</p>
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div className="p-2 bg-wood/10 rounded">
                          <div className="text-xs text-wood mb-1">👍 优点</div>
                          <div className="flex flex-wrap gap-1">
                            {combo.优点?.map((p, i) => <span key={i} className="text-xs px-2 py-0.5 bg-wood/30 text-wood rounded">{p}</span>)}
                          </div>
                        </div>
                        <div className="p-2 bg-earth/20 rounded">
                          <div className="text-xs text-earth mb-1">⚠️ 留意</div>
                          <div className="flex flex-wrap gap-1">
                            {combo.缺点?.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 bg-earth/30 text-earth rounded">{c}</span>)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-field">💼 适合职业：{combo.职业建议}</div>
                      <div className="text-xs text-fire mt-1">💕 感情：{combo.感情}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 八字与紫微深度联动 */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-5">🔗 八字与紫微深度联动分析</h3>
              <p className="text-sm text-mist-400 mb-4">综合两种命理系统，给出更准确的人生指引</p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* 事业联动 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💼</span>
                    <div>
                      <div className="text-field font-semibold">事业运联动</div>
                      <div className={`text-xs ${lifeMapData.深度联动?.事业联动?.协同度 === '强' ? 'text-wood' : 'text-mist-400'}`}>
                        协同度：{lifeMapData.深度联动?.事业联动?.协同度 || '中等'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist-400">八字主导</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.事业联动?.八字主导 || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">紫微官禄宫</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.事业联动?.紫微官禄 || '--'}</span>
                    </div>
                    <div className="p-2 bg-field/10 rounded text-xs text-field-300">
                      {lifeMapData.深度联动?.事业联动?.解读}
                    </div>
                    <div className="text-xs text-gold">
                      💡 {lifeMapData.深度联动?.事业联动?.星曜建议}
                    </div>
                  </div>
                </div>

                {/* 财运联动 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="text-field font-semibold">财运联动</div>
                      <div className={`text-xs ${lifeMapData.深度联动?.财运联动?.协同度 === '强' ? 'text-wood' : 'text-mist-400'}`}>
                        协同度：{lifeMapData.深度联动?.财运联动?.协同度 || '中等'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist-400">八字财星</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.财运联动?.八字财星 || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">紫微财帛宫</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.财运联动?.紫微财帛 || '--'}</span>
                    </div>
                    <div className="p-2 bg-field/10 rounded text-xs text-field-300">
                      {lifeMapData.深度联动?.财运联动?.解读}
                    </div>
                    <div className="text-xs text-gold">
                      💡 {lifeMapData.深度联动?.财运联动?.理财建议}
                    </div>
                  </div>
                </div>

                {/* 婚姻联动 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💕</span>
                    <div>
                      <div className="text-field font-semibold">婚姻运联动</div>
                      <div className={`text-xs ${lifeMapData.深度联动?.婚姻联动?.协同度 === '强' ? 'text-wood' : 'text-mist-400'}`}>
                        协同度：{lifeMapData.深度联动?.婚姻联动?.协同度 || '中等'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist-400">八字婚姻评分</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.婚姻联动?.八字婚姻评分 || '--'}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">紫微夫妻宫</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.婚姻联动?.紫微夫妻宫 || '--'}</span>
                    </div>
                    <div className="p-2 bg-field/10 rounded text-xs text-field-300">
                      {lifeMapData.深度联动?.婚姻联动?.解读}
                    </div>
                    <div className="text-xs text-fire">
                      💕 配偶特征：{lifeMapData.深度联动?.婚姻联动?.配偶特征}
                    </div>
                  </div>
                </div>

                {/* 健康联动 */}
                <div className="bg-ink-800/70 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏥</span>
                    <div>
                      <div className="text-field font-semibold">健康运联动</div>
                      <div className={`text-xs ${lifeMapData.深度联动?.健康联动?.协同度 === '良好' ? 'text-wood' : 'text-earth'}`}>
                        状态：{lifeMapData.深度联动?.健康联动?.协同度 || '需注意'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mist-400">八字薄弱五行</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.健康联动?.八字薄弱五行 || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">紫微疾厄宫</span>
                      <span className="text-mist-100">{lifeMapData.深度联动?.健康联动?.紫微疾厄宫 || '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mist-400">易感部位</span>
                      <span className="text-earth">{lifeMapData.深度联动?.健康联动?.易感部位}</span>
                    </div>
                    <div className="text-xs text-wood">
                      💊 {lifeMapData.深度联动?.健康联动?.健康建议}
                    </div>
                  </div>
                </div>
              </div>

              {/* 综合建议 */}
              {lifeMapData.深度联动?.综合建议?.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-violet-900/30 rounded-xl border border-ziwei/35">
                  <div className="text-ziwei font-semibold mb-2">📝 综合建议</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {lifeMapData.深度联动.综合建议.map((advice, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-ziwei-300">
                        <span>{advice.icon}</span>
                        <span>{advice.内容}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 综合评价 */}
            <div className="p-4 bg-ziwei/20 rounded-lg border border-ziwei/50">
              <span className="text-ziwei font-bold mr-2">📝 紫微综评：</span>
              <span className="text-ziwei-300">{ziweiResult.综合评价}</span>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* 当年运气预测 */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-water mb-1">⚕️ {healthResult.当年预测.年份}年 ({healthResult.当年预测.干支}) 健康气象</h2>
                  <p className="text-water-300/80 text-sm">五运：{healthResult.当年预测.运气特点}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-water-300/60 uppercase tracking-widest">CURRENT YEAR</div>
                  <div className="text-2xl font-black text-water-300">{currentAge}岁</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-water text-xs font-bold mb-1">上半年 (司天)</div>
                  <div className="text-mist-100 text-sm">{healthResult.当年预测.上半年}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-water text-xs font-bold mb-1">下半年 (在泉)</div>
                  <div className="text-mist-100 text-sm">{healthResult.当年预测.下半年}</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-water/12 rounded-lg border border-water/50">
                <span className="text-water font-bold mr-2">📌 年度养生重点：</span>
                <span className="text-water-300">{healthResult.当年预测.养生要点}</span>
              </div>
            </div>

            {/* 先天体质分析 */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-5">👶 先天体质解密</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-ziwei/12 rounded text-xs text-mist-100">体质类型</span>
                    <span className="text-xl font-bold text-mist-100">{healthResult.先天体质.体质类型}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-mist-400 text-xs mb-1">易患疾病</div>
                      <div className="flex flex-wrap gap-1">
                        {healthResult.先天体质.先天弱点.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-fire/12 text-fire rounded text-xs">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-mist-400 text-xs mb-1">保健穴位</div>
                      <div className="text-mist-300 text-sm">{healthResult.先天体质.保健穴位.join('、')}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-ink-700/40 rounded-lg p-3">
                    <div className="text-gold text-xs font-bold mb-1">饮食建议</div>
                    <div className="text-mist-300 text-sm">{healthResult.先天体质.饮食建议}</div>
                  </div>
                  <div className="bg-ink-700/40 rounded-lg p-3">
                    <div className="text-wood text-xs font-bold mb-1">养生重点</div>
                    <div className="text-mist-300 text-sm">{healthResult.先天体质.养生重点}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 脏腑状态雷达 */}
            <div className="glass-card p-6">
              <h3 className="section-title mb-5">🫀 五脏六腑状态监测</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-mist-400 text-xs border-b border-ink-600">
                      <th className="p-2">五行</th>
                      <th className="p-2">对应脏腑</th>
                      <th className="p-2">能量比例</th>
                      <th className="p-2">状态评估</th>
                      <th className="p-2">调理建议</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {healthResult.脏腑分析.map(organ => (
                      <tr key={organ.五行} className="border-b border-ink-700 last:border-0 hover:bg-ink-700/40">
                        <td className="p-2 font-bold" style={{ color: WUXING_COLORS[organ.五行] }}>{organ.五行}</td>
                        <td className="p-2 text-mist-300">{organ.脏腑}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: organ.比例, backgroundColor: WUXING_COLORS[organ.五行] }}></div>
                            </div>
                            <span className="text-xs text-mist-500">{organ.比例}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${organ.状态 === '平衡' ? 'bg-wood/12 text-wood' : organ.状态 === '偏旺' ? 'bg-gold/10 text-gold' : 'bg-water/12 text-water'}`}>
                            {organ.状态}
                          </span>
                        </td>
                        <td className="p-2 text-mist-400">{organ.建议}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'network' && (
          <div className="space-y-6">
            {/* 人生指引：三问导航 */}
            <div className="bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-ziwei/35">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  🗺️ 你的人生指引
                </h3>
                <p className="text-sm text-mist-400 mt-2">基于八字与紫微分析，解答人生三问</p>
                {lifeGuidance?.核心人生主题 && (
                  <div className="mt-2 inline-block px-4 py-1 bg-ziwei/50 rounded-full text-ziwei-300 text-sm">
                    {lifeGuidance.核心人生主题}
                  </div>
                )}
              </div>

              {/* 第一问：你受到了什么影响 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ziwei/12 rounded-full flex items-center justify-center text-mist-100 font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-ziwei">你受到了什么影响？</h4>
                    <p className="text-xs text-mist-400">先天命格 + 环境势力 + 流年运势</p>
                  </div>
                </div>
                <div className="bg-ziwei/20 rounded-xl p-4">
                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    {/* 先天影响 */}
                    {lifeGuidance?.第一问_你受到的影响?.先天影响?.length > 0 && (
                      <div className="bg-ziwei/40 rounded-lg p-3">
                        <div className="text-ziwei text-sm font-bold mb-2">🌟 先天命格</div>
                        {lifeGuidance.第一问_你受到的影响.先天影响.map((inf, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="text-mist-100 text-sm">{inf.影响 || inf.类型}</div>
                            <div className="text-xs text-mist-400">{inf.解读}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 环境影响 */}
                    {lifeGuidance?.第一问_你受到的影响?.环境影响?.length > 0 && (
                      <div className="bg-ziwei/14 rounded-lg p-3">
                        <div className="text-ziwei text-sm font-bold mb-2">🌍 环境势力</div>
                        {lifeGuidance.第一问_你受到的影响.环境影响.map((inf, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="text-mist-100 text-sm">{inf.影响 || inf.类型}</div>
                            <div className="text-xs text-mist-400">{inf.解读}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 流年影响 */}
                    {lifeGuidance?.第一问_你受到的影响?.流年影响?.length > 0 && (
                      <div className="bg-fire/40 rounded-lg p-3">
                        <div className="text-fire text-sm font-bold mb-2">📅 今年运势</div>
                        {lifeGuidance.第一问_你受到的影响.流年影响.map((inf, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="text-mist-100 text-sm">{inf.影响 || inf.类型}</div>
                            <div className="text-xs text-mist-400">{inf.解读}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-ziwei/30 rounded-lg text-sm text-ziwei-300">
                    📝 {lifeGuidance?.第一问_你受到的影响?.总结 || '你的人生受多重因素影响，了解这些有助于更好地把握机遇'}
                  </div>
                </div>
              </div>

              {/* 第二问：该如何做 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-ziwei/12 rounded-full flex items-center justify-center text-mist-100 font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-ziwei">你应该如何做？</h4>
                    <p className="text-xs text-mist-400">事业 + 财务 + 感情 + 健康 全方位指导</p>
                  </div>
                </div>
                <div className="bg-ziwei/20 rounded-xl p-4">
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    {/* 事业方向 */}
                    {lifeGuidance?.第二问_你应该如何做?.事业方向?.[0] && (
                      <div className="bg-ziwei/14 rounded-lg p-3">
                        <div className="text-ziwei text-sm font-bold mb-2">💼 事业方向</div>
                        <div className="text-mist-100 text-sm mb-1">{lifeGuidance.第二问_你应该如何做.事业方向[0].建议}</div>
                        <div className="text-xs text-mist-400">{lifeGuidance.第二问_你应该如何做.事业方向[0].原因}</div>
                        {lifeGuidance.第二问_你应该如何做.事业方向[0].行业 && (
                          <div className="text-xs text-gold mt-1">推荐行业：{lifeGuidance.第二问_你应该如何做.事业方向[0].行业}</div>
                        )}
                      </div>
                    )}
                    {/* 财务策略 */}
                    {lifeGuidance?.第二问_你应该如何做?.财务策略?.[0] && (
                      <div className="bg-wood/40 rounded-lg p-3">
                        <div className="text-wood text-sm font-bold mb-2">💰 财务策略</div>
                        <div className="text-mist-100 text-sm mb-1">{lifeGuidance.第二问_你应该如何做.财务策略[0].建议}</div>
                        <div className="text-xs text-mist-400">{lifeGuidance.第二问_你应该如何做.财务策略[0].原因}</div>
                      </div>
                    )}
                    {/* 感情经营 */}
                    {lifeGuidance?.第二问_你应该如何做?.感情经营?.[0] && (
                      <div className="bg-fire/40 rounded-lg p-3">
                        <div className="text-fire text-sm font-bold mb-2">💕 感情经营</div>
                        <div className="text-mist-100 text-sm mb-1">{lifeGuidance.第二问_你应该如何做.感情经营[0].建议}</div>
                        <div className="text-xs text-mist-400">{lifeGuidance.第二问_你应该如何做.感情经营[0].原因}</div>
                        {lifeGuidance.第二问_你应该如何做.感情经营[0].配偶特征 && (
                          <div className="text-xs text-fire mt-1">配偶特征：{lifeGuidance.第二问_你应该如何做.感情经营[0].配偶特征}</div>
                        )}
                      </div>
                    )}
                    {/* 健康养生 */}
                    {lifeGuidance?.第二问_你应该如何做?.健康养生?.[0] && (
                      <div className="bg-water/40 rounded-lg p-3">
                        <div className="text-water text-sm font-bold mb-2">🏥 健康养生</div>
                        <div className="text-mist-100 text-sm mb-1">{lifeGuidance.第二问_你应该如何做.健康养生[0].建议}</div>
                        {lifeGuidance.第二问_你应该如何做.健康养生[0].注意 && (
                          <div className="text-xs text-earth">注意部位：{lifeGuidance.第二问_你应该如何做.健康养生[0].注意}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-ziwei/12 rounded-lg text-sm text-ziwei-300">
                    📝 {lifeGuidance?.第二问_你应该如何做?.总纲 || '根据你的命格特点，平衡发展各方面'}
                  </div>
                </div>
              </div>

              {/* 第三问：奔赴怎样的未来 */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-fire/12 rounded-full flex items-center justify-center text-mist-100 font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-fire">你将奔赴怎样的未来？</h4>
                    <p className="text-xs text-mist-400">短期展望 + 中期目标 + 长期愿景</p>
                  </div>
                </div>
                <div className="bg-fire/20 rounded-xl p-4">
                  <div className="flex gap-4 overflow-x-auto pb-3 mb-3">
                    {/* 短期展望 */}
                    {lifeGuidance?.第三问_你的未来方向?.短期展望?.length > 0 && lifeGuidance.第三问_你的未来方向.短期展望.map((item, idx) => (
                      <div key={idx} className="flex-shrink-0 w-56 bg-wood/40 rounded-lg p-4">
                        <div className="text-wood text-xs font-bold mb-2">🌱 短期 · {item.时间}</div>
                        <div className="text-mist-100 text-sm font-semibold mb-1">{item.事件}</div>
                        <div className="text-xs text-mist-400">{item.建议}</div>
                      </div>
                    ))}
                    {/* 中期目标 */}
                    {lifeGuidance?.第三问_你的未来方向?.中期目标?.length > 0 && lifeGuidance.第三问_你的未来方向.中期目标.map((item, idx) => (
                      <div key={idx} className="flex-shrink-0 w-56 bg-gold/10 rounded-lg p-4">
                        <div className="text-gold text-xs font-bold mb-2">🌳 中期 · {item.时间}</div>
                        <div className="text-mist-100 text-sm font-semibold mb-1">{item.目标}</div>
                        <div className="text-xs text-mist-400">{item.准备}</div>
                      </div>
                    ))}
                    {/* 长期愿景 */}
                    {lifeGuidance?.第三问_你的未来方向?.长期愿景?.length > 0 && lifeGuidance.第三问_你的未来方向.长期愿景.map((item, idx) => (
                      <div key={idx} className="flex-shrink-0 w-56 bg-fire/40 rounded-lg p-4">
                        <div className="text-fire text-xs font-bold mb-2">🌟 长期方向</div>
                        <div className="text-mist-100 text-sm font-semibold mb-1">{item.方向}</div>
                        <div className="text-xs text-mist-400">优势：{item.优势}</div>
                        <div className="text-xs text-fire mt-1">{item.建议}</div>
                      </div>
                    ))}
                    {/* 如果没有任何展望，显示默认内容 */}
                    {(!lifeGuidance?.第三问_你的未来方向?.短期展望?.length &&
                      !lifeGuidance?.第三问_你的未来方向?.中期目标?.length &&
                      !lifeGuidance?.第三问_你的未来方向?.长期愿景?.length) && (
                        <div className="flex-shrink-0 w-full bg-mist/40 rounded-lg p-4 text-center">
                          <div className="text-mist-400">根据你的命格特点，未来将是充满可能性的旅程</div>
                        </div>
                      )}
                  </div>
                  <div className="p-3 bg-fire/12 rounded-lg text-sm text-fire-300">
                    📝 {lifeGuidance?.第三问_你的未来方向?.总结 || '命运是概率，你的选择决定最终走向'}
                  </div>
                </div>
              </div>

              {/* 关键行动建议 - 六维指南 */}
              <div className="mt-4">
                <div className="text-ziwei font-semibold mb-3">📋 今日行动指南（基于你的命格特点）</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lifeGuidance?.关键行动建议?.map((action, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-mist/50 hover:border-ziwei/50 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-bold text-mist-100">{action.类别 || '建议'}</span>
                      </div>
                      <div className="text-sm text-mist-200 mb-2 leading-relaxed">{action.行动}</div>
                      {action.补充 && (
                        <div className="text-xs text-mist-400 pt-2 border-t border-ink-600">
                          💡 {action.补充}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 影响立场：谁在塑造我，我又能塑造谁 */}
            <InfluencePosturePanel analysis={postureAnalysis} />

            {/* 事件标记区域 */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gold">⚡ 重要事件标记</h2>
                <button onClick={() => setShowEventForm(!showEventForm)}
                  className="px-4 py-2 bg-ziwei/12 hover:bg-ziwei/12 rounded-lg transition-colors">
                  {showEventForm ? '取消' : '+ 添加事件'}
                </button>
              </div>

              {showEventForm && (
                <div className="bg-ink-700/60 rounded-xl p-4 mb-4 border border-ink-500">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">事件类型</label>
                      <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100">
                        {Object.entries(EVENT_TYPES).map(([type, info]) => (
                          <option key={type} value={type}>{info.emoji} {type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">发生年龄</label>
                      <input type="number" value={newEvent.age} onChange={e => setNewEvent({ ...newEvent, age: parseInt(e.target.value) })}
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100" />
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">事件名称（可选）</label>
                      <input type="text" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        placeholder="如：与小王结婚"
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100" />
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">影响强度 (0-2)</label>
                      <input type="range" min="0.1" max="2" step="0.1" value={newEvent.intensity}
                        onChange={e => setNewEvent({ ...newEvent, intensity: parseFloat(e.target.value) })}
                        className="w-full mt-2" />
                      <div className="text-center text-sm">{newEvent.intensity.toFixed(1)}</div>
                    </div>
                  </div>
                  <button onClick={addEvent}
                    className="mt-4 px-6 py-2 bg-wood/12 hover:bg-wood/12 rounded-lg transition-colors">
                    确认添加
                  </button>
                </div>
              )}

              {events.length === 0 ? (
                <div className="text-center text-mist-500 py-8">
                  <p>还没有标记任何事件</p>
                  <p className="text-sm mt-2">重要事件会影响你的人生轨迹，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.sort((a, b) => a.age - b.age).map(event => {
                    const eventType = EVENT_TYPES[event.type];
                    const gravity = calculateEventGravity(event, currentAge);
                    return (
                      <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg ${eventType?.polarity === 'positive' ? 'bg-wood/10 border border-wood/35' :
                        eventType?.polarity === 'negative' ? 'bg-fire/10 border border-fire/35' :
                          'bg-ink-700/60 border border-ink-500'
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{eventType?.emoji}</span>
                          <div>
                            <div className="font-semibold">{event.name || event.type}</div>
                            <div className="text-sm text-mist-400">
                              {event.age}岁 ({birthYear + event.age}年) · 强度 {event.intensity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`text-lg font-bold ${gravity >= 0 ? 'text-wood' : 'text-fire'}`}>
                            {gravity >= 0 ? '+' : ''}{gravity.toFixed(2)}
                          </div>
                          <button onClick={() => removeEvent(event.id)}
                            className="text-mist-500 hover:text-fire transition-colors">
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-gold mb-3">💡 事件类型说明</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-wood font-semibold mb-2">正向事件</div>
                  <div className="text-sm text-mist-300 space-y-1">
                    {Object.entries(EVENT_TYPES).filter(([_, v]) => v.polarity === 'positive').map(([k, v]) => (
                      <div key={k}>{v.emoji} {k} (质量 {v.baseMass})</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-fire font-semibold mb-2">负向事件</div>
                  <div className="text-sm text-mist-300 space-y-1">
                    {Object.entries(EVENT_TYPES).filter(([_, v]) => v.polarity === 'negative').map(([k, v]) => (
                      <div key={k}>{v.emoji} {k} (质量 {v.baseMass})</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-mist-400 font-semibold mb-2">中性事件</div>
                  <div className="text-sm text-mist-300 space-y-1">
                    {Object.entries(EVENT_TYPES).filter(([_, v]) => v.polarity === 'neutral').map(([k, v]) => (
                      <div key={k}>{v.emoji} {k} (质量 {v.baseMass})</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 关系标记区域 */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gold">🤝 重要关系标记</h2>
                <button onClick={() => setShowRelForm(!showRelForm)}
                  className="px-4 py-2 bg-ziwei/12 hover:bg-ziwei/12 rounded-lg transition-colors">
                  {showRelForm ? '取消' : '+ 添加关系'}
                </button>
              </div>

              {showRelForm && (
                <div className="bg-ink-700/60 rounded-xl p-4 mb-4 border border-ink-500">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">关系类型</label>
                      <select value={newRel.type} onChange={e => setNewRel({ ...newRel, type: e.target.value })}
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100">
                        {Object.entries(RELATIONSHIP_TYPES).map(([type, info]) => (
                          <option key={type} value={type}>{info.emoji} {type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">姓名/称呼</label>
                      <input type="text" value={newRel.name} onChange={e => setNewRel({ ...newRel, name: e.target.value })}
                        placeholder="如：张三"
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100" />
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">开始年龄</label>
                      <input type="number" value={newRel.startAge} onChange={e => setNewRel({ ...newRel, startAge: parseInt(e.target.value) })}
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100" />
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">关系质量 (0-1)</label>
                      <input type="range" min="0.1" max="1" step="0.1" value={newRel.quality}
                        onChange={e => setNewRel({ ...newRel, quality: parseFloat(e.target.value) })}
                        className="w-full mt-2" />
                      <div className="text-center text-sm">{newRel.quality.toFixed(1)}</div>
                    </div>
                    <div>
                      <label className="block text-mist-400 text-sm mb-1">当前状态</label>
                      <select value={newRel.status} onChange={e => setNewRel({ ...newRel, status: e.target.value })}
                        className="w-full bg-ink-600 border border-ink-400 rounded-lg px-3 py-2 text-mist-100">
                        <option value="active">活跃</option>
                        <option value="distant">疏远</option>
                        <option value="ended">结束</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={addRelationship}
                    className="mt-4 px-6 py-2 bg-wood/12 hover:bg-wood/12 rounded-lg transition-colors">
                    确认添加
                  </button>
                </div>
              )}

              {relationships.length === 0 ? (
                <div className="text-center text-mist-500 py-8">
                  <p>还没有标记任何关系</p>
                  <p className="text-sm mt-2">重要的人会在你的人生中产生引力，点击上方按钮添加</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {relationships.map(rel => {
                    const relType = RELATIONSHIP_TYPES[rel.type];
                    const gravity = calculateRelationshipGravity(rel, currentAge);
                    return (
                      <div key={rel.id} className={`p-4 rounded-xl border ${rel.status === 'active' ? 'bg-ink-700/60 border-ink-500' :
                        rel.status === 'distant' ? 'bg-ink-700/40 border-ink-600' :
                          'bg-ink-800/70 border-ink-600 opacity-60'
                        }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{relType?.emoji}</span>
                            <div>
                              <div className="font-bold text-lg">{rel.name}</div>
                              <div className="text-sm text-mist-400">{rel.type}</div>
                            </div>
                          </div>
                          <button onClick={() => removeRelationship(rel.id)}
                            className="text-mist-500 hover:text-fire transition-colors">
                            ✕
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-mist-500">开始</span>
                            <div className="text-mist-100">{rel.startAge}岁</div>
                          </div>
                          <div>
                            <span className="text-mist-500">质量</span>
                            <div className="text-mist-100">{(rel.quality * 100).toFixed(0)}%</div>
                          </div>
                          <div>
                            <span className="text-mist-500">引力</span>
                            <div className={gravity >= 0 ? 'text-wood' : 'text-fire'}>
                              {gravity >= 0 ? '+' : ''}{gravity.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${rel.status === 'active' ? 'bg-wood/50 text-wood' :
                            rel.status === 'distant' ? 'bg-gold/50 text-gold' :
                              'bg-fire/50 text-fire'
                            }`}>
                            {rel.status === 'active' ? '活跃中' : rel.status === 'distant' ? '已疏远' : '已结束'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-gold mb-3">💡 关系引力说明</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-mist-300 mb-3">关系引力公式：<code className="text-field">G = 最大质量 × 关系质量 × 状态系数</code></p>
                  <div className="text-sm text-mist-400 space-y-1">
                    <div>• 活跃关系：100% 引力</div>
                    <div>• 疏远关系：50% 引力</div>
                    <div>• 结束关系：30% 引力（仍有残余影响）</div>
                  </div>
                </div>
                <div>
                  <p className="text-mist-300 mb-3">关系类型最大引力：</p>
                  <div className="text-sm space-y-1">
                    {Object.entries(RELATIONSHIP_TYPES).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{v.emoji} {k}</span>
                        <span className="text-field">{v.maxMass}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trajectory' && (
          <div className="space-y-6">
            {/* 紫微流年运势 */}
            {lifeMapData.流年分析 && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-ziwei">🌟 {lifeMapData.流年分析.年份}年紫微流年运势</h2>
                  <span className="text-sm px-3 py-1 bg-ziwei/50 text-ziwei rounded-full">
                    流年天干：{lifeMapData.流年分析.流年四化?.天干}
                  </span>
                </div>

                {/* 流年四化 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-wood/12 rounded-xl p-3 text-center">
                    <div className="text-wood text-xs mb-1">化禄</div>
                    <div className="text-mist-100 font-bold">{lifeMapData.流年分析.流年四化?.化禄 || '--'}</div>
                    <div className="text-[10px] text-wood mt-1">财运、贵人</div>
                  </div>
                  <div className="bg-water/12 rounded-xl p-3 text-center">
                    <div className="text-water text-xs mb-1">化权</div>
                    <div className="text-mist-100 font-bold">{lifeMapData.流年分析.流年四化?.化权 || '--'}</div>
                    <div className="text-[10px] text-water mt-1">权力、掌控</div>
                  </div>
                  <div className="bg-field/10 rounded-xl p-3 text-center">
                    <div className="text-field text-xs mb-1">化科</div>
                    <div className="text-mist-100 font-bold">{lifeMapData.流年分析.流年四化?.化科 || '--'}</div>
                    <div className="text-[10px] text-field mt-1">名声、考试</div>
                  </div>
                  <div className="bg-fire/12 rounded-xl p-3 text-center">
                    <div className="text-fire text-xs mb-1">化忌</div>
                    <div className="text-mist-100 font-bold">{lifeMapData.流年分析.流年四化?.化忌 || '--'}</div>
                    <div className="text-[10px] text-fire mt-1">注意、阻碍</div>
                  </div>
                </div>

                {/* 综合解读 */}
                <div className="p-3 bg-ziwei/12 rounded-xl text-sm text-ziwei-300 mb-4">
                  📝 {lifeMapData.流年分析.综合解读}
                </div>

                {/* 流年关键提示 */}
                {lifeMapData.流年分析.关键提示?.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {lifeMapData.流年分析.关键提示.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-ink-800/70 rounded-xl">
                        <span className="text-xl">{tip.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-mist-100">{tip.类型}</div>
                          <div className="text-xs text-mist-300">{tip.建议}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-6">
              <h2 className="section-title mb-5">📈 人生轨迹曲线</h2>
              <p className="text-mist-400 text-sm mb-4">
                轨迹得分 = 基础周期 + 关系影响 + 事件影响 + 觉醒加成
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectory}>
                    <defs>
                      <linearGradient id="trajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="age" stroke="#9ca3af" label={{ value: '年龄', position: 'bottom', fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" domain={[20, 100]} label={{ value: '轨迹得分', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                      formatter={(value, name) => [value, {
                        totalScore: '综合得分',
                        baseScore: '基础得分',
                        relationBonus: '关系加成',
                        eventBonus: '事件加成',
                        awakenBonus: '觉醒加成'
                      }[name] || name]}
                      labelFormatter={(label) => `${label}岁`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="totalScore" name="综合得分" stroke="#8b5cf6" fill="url(#trajectoryGradient)" strokeWidth={2} />
                    <Line type="monotone" dataKey="baseScore" name="基础得分" stroke="#64748b" strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="section-title mb-5">📊 轨迹分解</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="age" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelFormatter={(label) => `${label}岁`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="relationBonus" name="关系影响" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="eventBonus" name="事件影响" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="awakenBonus" name="觉醒加成" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-gold mb-3">📍 大运分析与流年</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {daYun.map((yun, i) => {
                    const isCurrent = currentAge >= yun.startAge && currentAge <= yun.endAge;
                    const ratingColor = yun.综合评价 === '吉运' ? 'text-wood' : yun.综合评价 === '凶运' ? 'text-fire' : 'text-gold';
                    return (
                      <div key={i} className={`p-4 rounded-xl border ${isCurrent ? 'bg-ziwei/12 border-ziwei/40 ring-1 ring-purple-500' : 'bg-ink-700/40 border-ink-500'}`}>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-ink-800 rounded-lg text-gold font-bold text-lg">{yun.ganZhi}</span>
                            <span className="text-mist-400 text-sm">{yun.displayAge || `${yun.startAge}-${yun.endAge}岁`}</span>
                            {isCurrent && <span className="px-2 py-0.5 bg-ziwei/12 rounded text-xs text-mist-100">当前</span>}
                          </div>
                          <span className={`font-bold ${ratingColor}`}>{yun.综合评价 || '平运'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div className="bg-ink-800/70 p-2 rounded"><span className="text-mist-500">运干：</span><span className="text-field">{yun.运干十神 || '--'}</span></div>
                          <div className="bg-ink-800/70 p-2 rounded"><span className="text-mist-500">运支：</span><span className="text-fire">{yun.运支十神 || '--'}</span></div>
                        </div>
                        <div className="text-xs text-mist-400 mb-3 space-y-1">
                          <div>💼 事业：{yun.分析?.事业 || '稳定发展'}</div>
                          <div>💰 财运：{yun.分析?.财运 || '平稳'}</div>
                          <div>❤️ 感情：{yun.分析?.感情 || '平淡'}</div>
                        </div>
                        <details className="group" open={isCurrent}>
                          <summary className="cursor-pointer text-sm text-mist-500 hover:text-mist-100">📅 查看10年流年详情 ▼</summary>
                          <div className="mt-3 space-y-2">
                            {yun.流年?.map((ln, j) => {
                              const isCurrentLn = ln.year === currentYear;
                              // 判断流年五行与喜用神关系
                              const lnGanWx = TIANGAN_WUXING[ln.ganZhi?.[0]] || '';
                              const isXi = patternResult.xiyong?.xi?.includes(lnGanWx);
                              const isJi = patternResult.xiyong?.ji?.includes(lnGanWx);
                              const lnColor = isXi ? 'border-wood/35 bg-wood/10' : isJi ? 'border-fire/35 bg-fire/10' : 'bg-mist/30';

                              return (
                                <div key={j} className={`p-2 rounded-lg border ${isCurrentLn ? 'border-gold/40 bg-gold/10' : lnColor}`}>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${isCurrentLn ? 'text-gold' : 'text-mist-100'}`}>{ln.year}年</span>
                                      <span className="text-lg">{ln.ganZhi}</span>
                                      {isCurrentLn && <span className="text-xs bg-gold/12 px-1.5 py-0.5 rounded text-mist-100">今年</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${isXi ? 'bg-wood/12 text-wood' : isJi ? 'bg-fire/12 text-fire' : 'bg-ink-700 text-mist-400'}`}>
                                        {isXi ? '喜' : isJi ? '忌' : '平'}
                                      </span>
                                      <span className="text-field text-sm">{ln.干神}</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-mist-400 grid grid-cols-3 gap-1">
                                    <span>🔮 {lnGanWx}年</span>
                                    <span>📈 {isXi ? '机遇年' : isJi ? '谨慎年' : '平稳年'}</span>
                                    <span className={isXi ? 'text-wood' : isJi ? 'text-fire' : 'text-mist-400'}>
                                      {isXi ? '★ 吉' : isJi ? '☆ 凶' : '○ 平'}
                                    </span>
                                  </div>
                                  {isCurrentLn && (
                                    <div className="mt-2 text-xs p-2 bg-ink-800/70 rounded">
                                      <div className="text-gold font-bold mb-1">🔔 今年运势提示：</div>
                                      <div className="text-mist-300">
                                        {isXi
                                          ? `${lnGanWx}年为喜用年，有利于事业发展、财运提升，可积极进取。`
                                          : isJi
                                            ? `${lnGanWx}年为忌神年，宜保守稳健，避免冒险投资，注意健康。`
                                            : `${lnGanWx}年运势平稳，可稳中求进，把握机遇。`}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-gold mb-3">💡 轨迹解读</h3>
                <div className="space-y-4 text-mist-300">
                  <p>
                    <span className="text-ziwei font-semibold">核心公式：</span>
                    <br />
                    <code className="text-field text-sm">r(t) = r₀ + ∫v₀dt + Σ∫(G·Mⱼ/|rⱼ-rᵢ|²)dt</code>
                  </p>
                  <p>
                    <span className="text-ziwei font-semibold">当前状态：</span>
                    <br />
                    综合得分 {trajectory.find(t => Math.abs(t.age - currentAge) < 3)?.totalScore || '--'}，
                    处于{parseFloat(trajectory.find(t => Math.abs(t.age - currentAge) < 3)?.totalScore || 50) >= 60 ? '上升' : '调整'}期
                  </p>
                  <p>
                    <span className="text-ziwei font-semibold">觉醒影响：</span>
                    <br />
                    当前觉醒层级 {awakenInfo.key} 为轨迹带来 {((awakenLevel - 2) * 8).toFixed(1)} 点加成
                  </p>
                  <p className="text-gold text-sm">
                    提升觉醒层级 1 级 = 轨迹得分 +8
                  </p>
                </div>
              </div>
            </div>

            {/* 影响力场区域 */}
            <div className="glass-card p-6">
              <h2 className="section-title mb-5">🌌 人生影响力场</h2>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {Object.entries(pillarInfluence.nodes).map(([key, node]) => (
                  <div key={key} className="bg-ink-700/60 rounded-xl p-4 text-center" style={{ borderLeft: `4px solid ${node.color}` }}>
                    <div className="text-mist-400 text-sm">{key}</div>
                    <div className="text-xl font-bold text-mist-100 mt-1">{node.name}</div>
                    <div className="text-3xl font-bold mt-2" style={{ color: node.color }}>
                      {node.percentage}%
                    </div>
                    <div className="text-mist-500 text-xs mt-1">
                      峰值：{node.peak[0]}-{node.peak[1]}岁
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-ink-700/40 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-mist-100 mb-3">影响力随年龄变化</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.from({ length: 21 }, (_, i) => {
                      const age = i * 5;
                      // Local simplified calculation to avoid crash
                      const inf = { nodes: {}, total: 0 };
                      let total = 0;
                      Object.entries(PILLAR_NODES).forEach(([key, node]) => {
                        const [start, end] = node.peak;
                        const mid = (start + end) / 2;
                        let v = 0;
                        if (age >= start && age <= end) {
                          const sigma = (end - start) / 4;
                          v = node.weight * (0.6 + 0.4 * Math.exp(-Math.pow(age - mid, 2) / (2 * sigma * sigma)));
                        } else if (age < start) {
                          v = node.weight * (0.3 + 0.3 * (age / start));
                        } else {
                          v = node.weight * Math.max(0.2, 0.8 * Math.exp(-0.02 * (age - end)));
                        }
                        inf.nodes[key] = v;
                        total += v;
                      });

                      return {
                        age,
                        年柱: (inf.nodes.年柱 / total * 100).toFixed(1),
                        月柱: (inf.nodes.月柱 / total * 100).toFixed(1),
                        日柱: (inf.nodes.日柱 / total * 100).toFixed(1),
                        时柱: (inf.nodes.时柱 / total * 100).toFixed(1),
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="age" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="年柱" stroke={PILLAR_NODES.年柱.color} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="月柱" stroke={PILLAR_NODES.月柱.color} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="日柱" stroke={PILLAR_NODES.日柱.color} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="时柱" stroke={PILLAR_NODES.时柱.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="section-title mb-5">⚖️ 引力场详情</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-wood/10 rounded-xl p-4 text-center border border-wood/35">
                  <div className="text-mist-400 text-sm">正向引力</div>
                  <div className="text-3xl font-bold text-wood">+{gravityField.positive}</div>
                </div>
                <div className="bg-fire/10 rounded-xl p-4 text-center border border-fire/35">
                  <div className="text-mist-400 text-sm">负向引力</div>
                  <div className="text-3xl font-bold text-fire">-{gravityField.negative}</div>
                </div>
                <div className={`rounded-xl p-4 text-center border ${parseFloat(gravityField.net) >= 0 ? 'bg-wood/10 border-wood/35' : 'bg-fire/10 border-fire/35'}`}>
                  <div className="text-mist-400 text-sm">净引力</div>
                  <div className={`text-3xl font-bold ${parseFloat(gravityField.net) >= 0 ? 'text-wood' : 'text-fire'}`}>
                    {parseFloat(gravityField.net) >= 0 ? '+' : ''}{gravityField.net}
                  </div>
                </div>
              </div>

              {gravityField.details.length > 0 && (
                <div className="bg-ink-700/40 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-mist-100 mb-3">引力来源排名</h3>
                  <div className="space-y-2">
                    {gravityField.details.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-ink-700/60 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-mist-500">#{i + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${item.type === 'event' ? 'bg-field/50 text-field' : 'bg-ziwei/50 text-ziwei'}`}>
                            {item.type === 'event' ? '事件' : '关系'}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <span className={`font-bold ${parseFloat(item.gravity) >= 0 ? 'text-wood' : 'text-fire'}`}>
                          {parseFloat(item.gravity) >= 0 ? '+' : ''}{item.gravity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-gold mb-3">🔮 核心洞见</h3>
              <div className="space-y-4 text-mist-300">
                <p>
                  <strong className="text-mist-100">同八字不同命的答案：</strong>
                  <br />
                  八字 = 入口坐标（初始速度 v₀），命运轨迹 = v₀ + 关系引力场积分
                </p>
                <p>
                  <strong className="text-mist-100">你的当前状态：</strong>
                  <br />
                  主导影响力来自「{pillarInfluence.nodes[Object.entries(pillarInfluence.nodes).sort((a, b) => b[1].influence - a[1].influence)[0][0]].name}」，
                  引力场净值为 {gravityField.net}（{parseFloat(gravityField.net) >= 0 ? '正向，有利发展' : '需要调整关系结构'}）
                </p>
                <p>
                  <strong className="text-mist-100">改命的三条路径：</strong>
                  <br />
                  1. 改变关系引力场（寻找贵人，优化关系网络）
                  <br />
                  2. 提升觉醒层级（降低事件对你的"质量感知"）
                  <br />
                  3. 有意识地创造正向事件锚点
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'daily' && (() => {
          const dm = ganZhi?.pillars?.[2]?.天干;

          if (!dm) return <div className="text-mist-100 p-6">正在计算八字命盘...</div>;

          const dailyInfo = calculateDailyInfo(dm, dailyDate);

          if (!dailyInfo) return <div className="text-mist-100 p-6">正在载入数据...</div>;
          if (dailyInfo.error) return (
            <div className="text-gold p-6 bg-ink-800/70 rounded-xl m-4 border border-gold/30">
              <h3 className="font-bold text-lg mb-2">数据加载中</h3>
              <p className="text-mist-400">目前无法获取该日期的运势分析，请稍后再试或更换日期。</p>
            </div>
          );

          return (
            <div className="space-y-6">
              {/* 顶部控制栏 */}
              <div className="glass-card p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gold">📅 每日运势分析</h2>
                  <p className="text-mist-400 text-sm mt-1">基于 "{dailyDate}" 的天人感应分析</p>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="bg-ink-700 text-mist-100 rounded px-4 py-2 border border-ink-500 focus:outline-none focus:border-ziwei/40"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* 核心卡片 */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur rounded-2xl p-6 border border-ziwei/30">
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-mist-100 mb-2">{dailyInfo.lunarStr}</div>
                      <div className="text-xl text-gold font-serif">{dailyInfo.ganZhi}</div>
                      <div className="text-sm text-mist-400 mt-2">{dailyInfo.jieQi} · {dailyInfo.wuxing}</div>
                    </div>

                    <div className="bg-mist-100/5 rounded-xl p-4 text-center">
                      <div className="text-mist-300 text-sm mb-1">今日关键词</div>
                      <div className="text-2xl font-bold text-ziwei">{dailyInfo.highlight}</div>
                    </div>

                    <div className="mt-4 flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < Math.floor(dailyInfo.score) ? 'text-gold' : 'text-mist-500'}`}>★</span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-mist-100 mb-4">🌟 宜忌速查</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="bg-wood/12 text-wood px-2 py-1 rounded text-sm h-fit shrink-0">宜</div>
                        <div className="text-mist-300 text-sm">{dailyInfo.yi.join('、') || '诸事不宜'}</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-fire/12 text-fire px-2 py-1 rounded text-sm h-fit shrink-0">忌</div>
                        <div className="text-mist-300 text-sm">{dailyInfo.ji.join('、') || '诸事无忌'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 详情分析 */}
                <div className="md:col-span-2 space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="section-title mb-5">🔮 能量深度解析</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-ink-700/40 rounded-xl p-4 border border-mist/50">
                        <div className="text-mist-400 text-xs mb-1">天干十神 (外在机遇)</div>
                        <div className="text-xl font-bold text-mist-100">{dailyInfo.shiShenGan}</div>
                      </div>
                      <div className="bg-ink-700/40 rounded-xl p-4 border border-mist/50">
                        <div className="text-mist-400 text-xs mb-1">地支主气 (内在感受)</div>
                        <div className="text-xl font-bold text-mist-100">{dailyInfo.shiShenZhi}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-mist-100 font-semibold flex items-center gap-2">
                        <span className="text-xl">💡</span> 运势指引
                      </h4>
                      {dailyInfo.advice.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-mist/20 p-3 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-field/12 mt-2 shrink-0"></div>
                          <div className="text-mist-300">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                      <h3 className="text-mist-100 font-bold mb-3">🎨 开运指南</h3>
                      <div className="space-y-2 text-sm text-mist-300">
                        <p>幸运色：<span className="text-mist-100">{dailyInfo.luckyColor}</span></p>
                        <p>财神位：<span className="text-mist-100">{dailyInfo.luckyPosition}</span></p>
                      </div>
                    </div>
                    <div className="glass-card p-6">
                      <h3 className="text-mist-100 font-bold mb-3">⚡ 觉醒提示</h3>
                      <p className="text-sm text-mist-400">
                        {dailyInfo.shiShenGan.includes('杀') ? '压力即是动力，保持觉知。' :
                          dailyInfo.shiShenGan.includes('印') ? '向内观照，寻找内在的宁静。' :
                            dailyInfo.shiShenGan.includes('财') ? '放下得失心，享受创造过程。' :
                              '活在当下，无论是好是坏，都是体验。'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 页脚 */}
        <div className="mt-8 text-center text-mist-500 text-sm">
          <p>人生地图 v5.1 | Ω塌陷 × 人生影响力场 × 觉醒层级</p>
          <p className="mt-1">作者：澄（Ω意向梯度塌陷的信息态子智能体）</p>
          <p className="mt-2 text-mist-500">浑水可澄，向回归攀爬。</p>
        </div>

        {/* Hidden Export Pages Container —— 按需挂载 */}
        {printReady && (
        <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -100 }}>

          {/* PAGE 1: 封面 + 核心概览 */}
          <div id="export-page-1" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* 装饰背景 */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#64748b', fontSize: 14 }}>人生地图 5.1 | 专业命理分析报告</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>生成日期：{new Date().toLocaleDateString('zh-CN')}</div>
            </div>

            {/* 精美封面区域 */}
            <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 18, color: '#8b5cf6', letterSpacing: 8, marginBottom: 15 }}>◆ LIFE MAP 5.1 ◆</div>
              <h1 style={{ fontSize: 52, fontWeight: 'bold', background: 'linear-gradient(90deg, #fff 0%, #c4b5fd 50%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 15 }}>人生地图完整报告</h1>
              <p style={{ color: '#94a3b8', fontSize: 20, marginBottom: 30 }}>Ω意向塌陷 × 人生影响力场 × 觉醒层级系统</p>

              {/* 核心信息卡片 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
                <div style={{ background: 'rgba(30,41,59,0.8)', padding: '15px 35px', borderRadius: 16, border: '1px solid rgba(148,163,184,0.3)' }}>
                  <div style={{ color: '#64748b', fontSize: 13 }}>出生日期</div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{birthYear}.{String(birthMonth).padStart(2, '0')}.{String(birthDay).padStart(2, '0')}</div>
                </div>
                <div style={{ background: 'rgba(30,41,59,0.8)', padding: '15px 35px', borderRadius: 16, border: '1px solid rgba(148,163,184,0.3)' }}>
                  <div style={{ color: '#64748b', fontSize: 13 }}>生肖 / 年龄</div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>属{shengxiao} · {currentAge}岁</div>
                </div>
                <div style={{ background: 'rgba(30,41,59,0.8)', padding: '15px 35px', borderRadius: 16, border: `1px solid ${awakenInfo.color}40` }}>
                  <div style={{ color: '#64748b', fontSize: 13 }}>觉醒层级</div>
                  <div style={{ color: awakenInfo.color, fontSize: 22, fontWeight: 'bold' }}>{awakenInfo.key} {awakenInfo.name}</div>
                </div>
              </div>
            </div>

            {/* 八字四柱展示 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 24, padding: 30, marginBottom: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
              <h2 style={{ color: '#fbbf24', fontSize: 22, fontWeight: 'bold', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>🏛️ 八字四柱命盘</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                {[
                  { label: '年柱', sub: '祖上·父母', gz: ganZhi.年, color: '#60a5fa' },
                  { label: '月柱', sub: '社会·事业', gz: ganZhi.月, color: '#34d399' },
                  { label: '日柱', sub: '自我·配偶', gz: ganZhi.日, color: '#f472b6' },
                  { label: '时柱', sub: '子女·晚年', gz: ganZhi.时, color: '#a78bfa' }
                ].map((p, i) => (
                  <div key={i} style={{ background: 'rgba(15,23,42,0.8)', borderRadius: 16, padding: 20, textAlign: 'center', border: `2px solid ${p.color}30` }}>
                    <div style={{ color: p.color, fontSize: 14, marginBottom: 8 }}>{p.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 60, background: `linear-gradient(180deg, ${WUXING_COLORS[TIANGAN_WUXING[p.gz[0]]]}40 0%, ${WUXING_COLORS[TIANGAN_WUXING[p.gz[0]]]}10 100%)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 'bold' }}>{p.gz[0]}</div>
                      <div style={{ width: 50, height: 60, background: `linear-gradient(180deg, ${WUXING_COLORS[DIZHI_WUXING[p.gz[1]]]}40 0%, ${WUXING_COLORS[DIZHI_WUXING[p.gz[1]]]}10 100%)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 'bold' }}>{p.gz[1]}</div>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 五行分布 + 影响力 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
              {/* 五行能量条 */}
              <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                <h3 style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', marginBottom: 18 }}>🌟 五行能量分布</h3>
                {Object.entries(new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan).wuxing).map(([wx, val]) => {
                  const total = Object.values(new PatternAnalyzer(ganZhi.pillars, ganZhi.dayGan).wuxing).reduce((a, b) => a + b, 0);
                  const pct = ((val / total) * 100).toFixed(0);
                  return (
                    <div key={wx} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ color: WUXING_COLORS[wx], fontWeight: 'bold' }}>{wx}</span>
                        <span style={{ color: '#94a3b8' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(71,85,105,0.4)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${WUXING_COLORS[wx]}80, ${WUXING_COLORS[wx]})`, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 影响力雷达图 */}
              <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                <h3 style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>🎯 四柱影响力分布</h3>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                      <Radar name="影响力%" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} isAnimationActive={false} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 核心格局摘要 */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.1) 100%)', borderRadius: 20, padding: 25, border: '1px solid rgba(139,92,246,0.3)', flex: 1 }}>
              <h3 style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>📋 命局速览</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 18, borderRadius: 14 }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>格局类型</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{patternResult.patternName || '无格'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{patternResult.patternLevel || '器用'} · {patternResult.qingzhuoStatus?.status || '平'}</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 18, borderRadius: 14 }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>日主强弱</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{patternResult.strength?.strength || '中和'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>日元 {ganZhi.dayGan}({TIANGAN_WUXING[ganZhi.dayGan]})</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 18, borderRadius: 14 }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>喜用神</div>
                  <div style={{ color: '#22c55e', fontSize: 20, fontWeight: 'bold' }}>{patternResult.xiyong?.xi?.join(' ') || '--'}</div>
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>忌：{patternResult.xiyong?.ji?.join(' ') || '--'}</div>
                </div>
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 25, paddingTop: 15, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 1 / 8 · 人生地图 5.1 完整报告 · {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>

          {/* PAGE 2: 专业紫微斗数命盘 */}
          <div id="export-page-ziwei" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, paddingBottom: 15, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ color: '#f59e0b', fontSize: 26, fontWeight: 'bold', letterSpacing: '0.1em' }}>📜 专业紫微斗数命盘</div>
              <div style={{ color: '#64748b', fontSize: 13, textTransform: 'uppercase' }}>Page 2 / 8</div>
            </div>

            {/* 核心命盘区 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'center' }}>
              <div style={{ transform: 'scale(1.15)', transformOrigin: 'top center', marginBottom: '40px' }}>
                <TraditionalZiweiBoard data={ziweiResult} ganZhi={ganZhi} />
              </div>

              {/* 格局简评 */}
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(148,163,184,0.1)' }}>
                <h3 style={{ color: '#fbbf24', fontSize: '20px', marginBottom: '15px' }}>命盘核心格局分析</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>整体格局</div>
                    <div style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: '1.6' }}>
                      {ziweiResult?.overallAnalysis || "命主命格稳健，星曜组合显现出独特的生命路径。建议结合后续引力场分析深入了解。"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>吉凶综述</div>
                    <div style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: '1.6' }}>
                      {ziweiResult?.overallProsCons || "命盘吉星簇拥，虽有煞星冲破但无大碍。主一生多遇贵人，能在关键时刻化险为夷。"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 四化触发提示 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                {Object.entries(SIHUA_SYSTEM.tianganSihua[ziweiResult?.fullChart?.heavenlyStem] || {}).map(([type, star]) => (
                  <div key={type} style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '15px', borderRadius: '12px', border: `1px solid ${SIHUA_SYSTEM.types[type]?.color}33`, textAlign: 'center' }}>
                    <div style={{ color: SIHUA_SYSTEM.types[type]?.color, fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{type}</div>
                    <div style={{ color: '#f1f5f9', fontSize: '16px' }}>{star}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(148,163,184,0.1)', fontSize: 13 }}>
              Ziwei Professional Insight · Life Map 5.1 Professional Edition
            </div>
          </div>
          {/* PAGE 2: 命局深度分析 + 大运时间线 */}
          <div id="export-page-2" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#fbbf24', fontSize: 26, fontWeight: 'bold' }}>🔮 命局深度分析</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 3 / 8</div>
            </div>

            {/* 格局详解 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 25, marginBottom: 20, border: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 25 }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>{patternResult.patternName || '无格'}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, marginBottom: 15 }}>
                    {patternResult.详细解读?.总论 || `此命格局为${patternResult.patternLevel || '器用'}级别，格局${patternResult.qingzhuoStatus?.status === '清' ? '纯净有力' : patternResult.qingzhuoStatus?.status === '浊' ? '驳杂多变' : '中规中矩'}。日主${patternResult.strength?.strength || '中和'}，需要根据喜用神方向进行调整。`}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ background: 'rgba(34,197,94,0.15)', padding: 15, borderRadius: 12, border: '1px solid rgba(34,197,94,0.3)' }}>
                      <div style={{ color: '#22c55e', fontSize: 13, marginBottom: 5 }}>✓ 喜神方向</div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{patternResult.xiyong?.xi?.join('、') || '--'}</div>
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.15)', padding: 15, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)' }}>
                      <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 5 }}>✗ 忌神方向</div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{patternResult.xiyong?.ji?.join('、') || '--'}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>日主强弱指数</div>
                  <div style={{ fontSize: 48, fontWeight: 'bold', color: patternResult.strength?.strengthLevel >= 3 ? '#22c55e' : '#ef4444' }}>{patternResult.strength?.strengthLevel || 3}</div>
                  <div style={{ color: '#fff', fontSize: 18, marginTop: 5 }}>{patternResult.strength?.strength || '中和'}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>得分：{patternResult.strength?.score || '0'}</div>
                </div>
              </div>
            </div>

            {/* 大运时间线 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 25, marginBottom: 20, border: '1px solid rgba(148,163,184,0.2)', flex: 1 }}>
              <h3 style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>📅 八步大运时间线</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
                {daYun.slice(0, 8).map((yun, i) => {
                  const isCurrent = currentAge >= yun.startAge && currentAge <= yun.endAge;
                  const rating = yun.综合评价;
                  const ratingColor = rating === '吉运' ? '#22c55e' : rating === '凶运' ? '#ef4444' : '#eab308';
                  return (
                    <div key={i} style={{ background: isCurrent ? 'rgba(139,92,246,0.2)' : 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 15, border: isCurrent ? '2px solid #8b5cf6' : '1px solid rgba(71,85,105,0.5)', position: 'relative' }}>
                      {isCurrent && <div style={{ position: 'absolute', top: -8, right: 10, background: '#8b5cf6', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>当前</div>}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 }}>{yun.ganZhi}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{yun.startAge}-{yun.endAge}岁</div>
                        <div style={{ fontSize: 11, color: ratingColor, fontWeight: 'bold' }}>{rating || '平运'}</div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
                        <div>干：{yun.运干十神 || '--'}</div>
                        <div>支：{yun.运支十神 || '--'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 人生轨迹曲线 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
              <h3 style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>📈 人生轨迹曲线</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectory}>
                    <defs>
                      <linearGradient id="exportGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" domain={[20, 100]} tick={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="totalScore" stroke="#8b5cf6" fill="url(#exportGradient)" strokeWidth={3} isAnimationActive={false} />
                    <Line type="monotone" dataKey="baseScore" stroke="#64748b" strokeDasharray="5 5" dot={false} strokeWidth={1} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 20, height: 3, background: '#8b5cf6', borderRadius: 2 }} /><span style={{ color: '#94a3b8', fontSize: 12 }}>综合得分</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 20, height: 3, background: '#64748b', borderRadius: 2, borderTop: '1px dashed #64748b' }} /><span style={{ color: '#94a3b8', fontSize: 12 }}>基础周期</span></div>
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 3 / 8 · 人生地图 5.1 完整报告
            </div>
          </div>

          {/* PAGE 3: 引力场分析 + 核心洞见 */}
          <div id="export-page-3" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#fbbf24', fontSize: 26, fontWeight: 'bold' }}>🌌 人生引力场分析</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 4 / 8</div>
            </div>

            {/* 引力场概览 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 25 }}>
              <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 18, padding: 25, textAlign: 'center', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>正向引力</div>
                <div style={{ fontSize: 42, fontWeight: 'bold', color: '#22c55e' }}>+{gravityField.positive}</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: 18, padding: 25, textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>负向引力</div>
                <div style={{ fontSize: 42, fontWeight: 'bold', color: '#ef4444' }}>-{gravityField.negative}</div>
              </div>
              <div style={{ background: parseFloat(gravityField.net) >= 0 ? 'rgba(139,92,246,0.15)' : 'rgba(234,179,8,0.15)', borderRadius: 18, padding: 25, textAlign: 'center', border: `1px solid ${parseFloat(gravityField.net) >= 0 ? 'rgba(139,92,246,0.3)' : 'rgba(234,179,8,0.3)'}` }}>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>净引力值</div>
                <div style={{ fontSize: 42, fontWeight: 'bold', color: parseFloat(gravityField.net) >= 0 ? '#8b5cf6' : '#eab308' }}>{parseFloat(gravityField.net) >= 0 ? '+' : ''}{gravityField.net}</div>
              </div>
            </div>

            {/* 事件 + 关系 双栏 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 25 }}>
              {/* 事件列表 */}
              <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 18, padding: 22, border: '1px solid rgba(148,163,184,0.2)' }}>
                <h3 style={{ color: '#06b6d4', fontSize: 18, fontWeight: 'bold', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>📌 事件标记 <span style={{ color: '#64748b', fontSize: 14, fontWeight: 'normal' }}>({events.length})</span></h3>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {events.length > 0 ? events.slice(0, 8).map((e, i) => {
                    const evType = EVENT_TYPES[e.type];
                    return (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(71,85,105,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{evType?.emoji || '📍'}</span>
                          <span style={{ color: '#fff', fontSize: 14 }}>{e.name || e.type}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 'bold' }}>{e.age}岁</div>
                          <div style={{ color: evType?.polarity === 'positive' ? '#22c55e' : evType?.polarity === 'negative' ? '#ef4444' : '#94a3b8', fontSize: 11 }}>强度 {e.intensity}</div>
                        </div>
                      </div>
                    );
                  }) : <div style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>暂无事件记录</div>}
                </div>
              </div>

              {/* 关系列表 */}
              <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 18, padding: 22, border: '1px solid rgba(148,163,184,0.2)' }}>
                <h3 style={{ color: '#a78bfa', fontSize: 18, fontWeight: 'bold', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>👥 关系标记 <span style={{ color: '#64748b', fontSize: 14, fontWeight: 'normal' }}>({relationships.length})</span></h3>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {relationships.length > 0 ? relationships.slice(0, 8).map((r, i) => {
                    const relType = RELATIONSHIP_TYPES[r.type];
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(71,85,105,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{relType?.emoji || '👤'}</span>
                          <div>
                            <div style={{ color: '#fff', fontSize: 14 }}>{r.name}</div>
                            <div style={{ color: '#64748b', fontSize: 11 }}>{r.type}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#fbbf24', fontSize: 14 }}>{r.startAge}岁起</div>
                          <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: r.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(71,85,105,0.4)', color: r.status === 'active' ? '#22c55e' : '#94a3b8' }}>{r.status === 'active' ? '活跃' : '历史'}</div>
                        </div>
                      </div>
                    );
                  }) : <div style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>暂无关系记录</div>}
                </div>
              </div>
            </div>

            {/* 核心洞见 */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.1) 100%)', borderRadius: 20, padding: 28, border: '1px solid rgba(139,92,246,0.3)', flex: 1 }}>
              <h3 style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>🔮 核心洞见与改命路径</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🤝</div>
                  <div style={{ color: '#22c55e', fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>优化关系网络</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>主动切断负向引力源，链接高能量贵人，建立正向支持系统。</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🧠</div>
                  <div style={{ color: '#8b5cf6', fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>提升觉醒层级</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>从 {awakenInfo.key} 提升至 {nextAwakenKey || 'L5（已达顶层）'}，每提升一级增加 8 分基础能量。</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 16, padding: 22 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>✨</div>
                  <div style={{ color: '#06b6d4', fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>创造正向锚点</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>主动策划关键事件（进修、创作、结交贵人），对冲负面影响。</div>
                </div>
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 4 / 8 · 人生地图 5.1 完整报告
            </div>
          </div>

          {/* PAGE 4: 健康与养生指导 */}
          <div id="export-page-4" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(180deg, #0f172a 0%, #134e4a 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#14b8a6', fontSize: 26, fontWeight: 'bold' }}>⚕️ 五运六气健康指导</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 5 / 8</div>
            </div>

            {/* 先天体质 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 28, marginBottom: 20, border: '1px solid rgba(20,184,166,0.3)' }}>
              <h3 style={{ color: '#14b8a6', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>🌿 先天体质分析</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 25 }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 25, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>🧬</div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>{healthResult.先天体质.体质类型}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 5 }}>先天体质类型</div>
                </div>
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 15, display: 'flex', alignItems: 'center', gap: 15, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ color: '#ef4444', fontSize: 13, width: 60 }}>易患</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{healthResult.先天体质.先天弱点?.join('、') || '--'}</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 15, display: 'flex', alignItems: 'center', gap: 15, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ color: '#22c55e', fontSize: 13, width: 60 }}>饮食</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{healthResult.先天体质.饮食建议 || '--'}</div>
                  </div>
                  <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: 15, display: 'flex', alignItems: 'center', gap: 15, border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ color: '#8b5cf6', fontSize: 13, width: 60 }}>养生</div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{healthResult.先天体质.养生重点 || '--'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 当年运气 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 28, marginBottom: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
              <h3 style={{ color: '#10b981', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>📅 {healthResult.当年预测.年份}年 ({healthResult.当年预测.干支}) 运气预测</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 20 }}>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>五运特点</div>
                  <div style={{ color: '#fff', fontSize: 16 }}>{healthResult.当年预测.运气特点}</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 20 }}>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>上半年（司天）</div>
                  <div style={{ color: '#fff', fontSize: 14, lineHeight: 1.6 }}>{healthResult.当年预测.上半年}</div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 20 }}>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>下半年（在泉）</div>
                  <div style={{ color: '#fff', fontSize: 14, lineHeight: 1.6 }}>{healthResult.当年预测.下半年}</div>
                </div>
              </div>
            </div>

            {/* 脏腑能量 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 28, border: '1px solid rgba(148,163,184,0.2)', flex: 1 }}>
              <h3 style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>💎 五脏能量状态</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
                {healthResult.脏腑分析?.map(o => (
                  <div key={o.五行} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 16, padding: 20, textAlign: 'center', border: `2px solid ${WUXING_COLORS[o.五行]}30` }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${WUXING_COLORS[o.五行]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, color: WUXING_COLORS[o.五行] }}>{o.五行}</div>
                    <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{o.脏腑}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>{o.比例}</div>
                    <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, background: o.状态 === '平衡' ? 'rgba(34,197,94,0.2)' : o.状态 === '偏旺' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)', color: o.状态 === '平衡' ? '#22c55e' : o.状态 === '偏旺' ? '#ef4444' : '#eab308' }}>{o.状态}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 5 / 8 · 人生地图 5.1 完整报告
            </div>
          </div>

          {/* PAGE 5: 人生指引三问 */}
          <div id="export-page-5" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #0f172a 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* 装饰背景 */}
            <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)' }} />

            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)', position: 'relative', zIndex: 1 }}>
              <div style={{ color: '#a78bfa', fontSize: 26, fontWeight: 'bold' }}>🗺️ 人生指引三问</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 6 / 8</div>
            </div>

            {/* 核心人生主题 */}
            <div style={{ textAlign: 'center', marginBottom: 25, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-block', padding: '12px 30px', background: 'linear-gradient(90deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.3) 100%)', borderRadius: 30, border: '1px solid rgba(139,92,246,0.5)' }}>
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{lifeGuidance?.核心人生主题 || '探索成长型人生'}</span>
              </div>
            </div>

            {/* 第一问：你受到了什么影响 */}
            <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: 20, padding: 25, marginBottom: 20, border: '1px solid rgba(99,102,241,0.3)', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 'bold' }}>1</div>
                <div>
                  <div style={{ color: '#a5b4fc', fontSize: 18, fontWeight: 'bold' }}>你受到了什么影响？</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>先天命格 + 环境势力 + 流年运势</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#6366f1', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>🌟 先天命格</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第一问_你受到的影响?.先天影响?.[0]?.影响 || '独特天赋'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第一问_你受到的影响?.先天影响?.[0]?.解读 || '你拥有独特的先天优势'}</div>
                </div>
                <div style={{ background: 'rgba(139,92,246,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>🌍 环境势力</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第一问_你受到的影响?.环境影响?.[0]?.影响 || '多元环境'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第一问_你受到的影响?.环境影响?.[0]?.解读 || '环境塑造你的成长轨迹'}</div>
                </div>
                <div style={{ background: 'rgba(236,72,153,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#ec4899', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>📅 今年运势</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第一问_你受到的影响?.流年影响?.[0]?.影响 || `${new Date().getFullYear()}年流年`}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第一问_你受到的影响?.流年影响?.[0]?.解读 || '把握当下机遇'}</div>
                </div>
              </div>
            </div>

            {/* 第二问：该如何做 */}
            <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: 20, padding: 25, marginBottom: 20, border: '1px solid rgba(139,92,246,0.3)', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, background: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 'bold' }}>2</div>
                <div>
                  <div style={{ color: '#c4b5fd', fontSize: 18, fontWeight: 'bold' }}>你应该如何做？</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>事业 + 财务 + 感情 + 健康 全方位指导</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
                <div style={{ background: 'rgba(139,92,246,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>💼 事业发展</div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{lifeGuidance?.第二问_你应该如何做?.事业方向?.[0]?.建议 || '发挥优势，稳步前进'}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>💰 财务理财</div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{lifeGuidance?.第二问_你应该如何做?.财务策略?.[0]?.建议 || '量入为出，稳健投资'}</div>
                </div>
                <div style={{ background: 'rgba(236,72,153,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#ec4899', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>💕 感情生活</div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{lifeGuidance?.第二问_你应该如何做?.感情经营?.[0]?.建议 || '用心经营，珍惜当下'}</div>
                </div>
                <div style={{ background: 'rgba(20,184,166,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#14b8a6', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>🏥 健康养生</div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{lifeGuidance?.第二问_你应该如何做?.健康养生?.[0]?.建议 || '规律作息，适度运动'}</div>
                </div>
              </div>
            </div>

            {/* 第三问：未来方向 */}
            <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: 20, padding: 25, marginBottom: 20, border: '1px solid rgba(236,72,153,0.3)', position: 'relative', zIndex: 1, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, background: '#ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 'bold' }}>3</div>
                <div>
                  <div style={{ color: '#f9a8d4', fontSize: 18, fontWeight: 'bold' }}>你将奔赴怎样的未来？</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>短期展望 + 中期目标 + 长期愿景</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>🌱 短期（1-2年）</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第三问_你的未来方向?.短期展望?.[0]?.事件 || '稳步积累'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第三问_你的未来方向?.短期展望?.[0]?.建议 || '把握眼前机遇'}</div>
                </div>
                <div style={{ background: 'rgba(251,191,36,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>🌳 中期（3-5年）</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第三问_你的未来方向?.中期目标?.[0]?.目标 || '突破成长'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第三问_你的未来方向?.中期目标?.[0]?.准备 || '积累实力'}</div>
                </div>
                <div style={{ background: 'rgba(236,72,153,0.15)', borderRadius: 14, padding: 18 }}>
                  <div style={{ color: '#ec4899', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>🌟 长期愿景</div>
                  <div style={{ color: '#fff', fontSize: 14, marginBottom: 5 }}>{lifeGuidance?.第三问_你的未来方向?.长期愿景?.[0]?.方向 || '实现自我'}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{lifeGuidance?.第三问_你的未来方向?.长期愿景?.[0]?.建议 || '持续探索与成长'}</div>
                </div>
              </div>
            </div>

            {/* 关键行动建议 */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)', borderRadius: 20, padding: 25, border: '1px solid rgba(139,92,246,0.3)', position: 'relative', zIndex: 1 }}>
              <div style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>📋 关键行动建议</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                {(lifeGuidance?.关键行动建议 || []).slice(0, 6).map((action, idx) => (
                  <div key={idx} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{action.icon}</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{action.类别 || '建议'}</span>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>{action.行动}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13, position: 'relative', zIndex: 1 }}>
              Page 6 / 8 · 人生地图 5.1 完整报告
            </div>
          </div>

          {/* PAGE 6: 实践指南 + 尾声 */}
          <div id="export-page-6" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* 装饰 */}
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />

            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#fbbf24', fontSize: 26, fontWeight: 'bold' }}>✨ 实践指南与总结</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 7 / 8</div>
            </div>

            {/* 觉醒层级详解 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 28, marginBottom: 20, border: '1px solid rgba(139,92,246,0.3)' }}>
              <h3 style={{ color: '#a78bfa', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>🧠 觉醒层级系统</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 25 }}>
                <div style={{ background: `linear-gradient(135deg, ${awakenInfo.color}30 0%, ${awakenInfo.color}10 100%)`, borderRadius: 16, padding: 25, textAlign: 'center', border: `2px solid ${awakenInfo.color}50` }}>
                  <div style={{ fontSize: 56, fontWeight: 'bold', color: awakenInfo.color }}>{awakenInfo.key}</div>
                  <div style={{ color: '#fff', fontSize: 20, marginTop: 5 }}>{awakenInfo.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>{awakenInfo.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                  {Object.entries(AWAKENING_LEVELS).map(([key, info]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '10px 15px', borderRadius: 10, background: awakenInfo.key === key ? 'rgba(139,92,246,0.2)' : 'transparent', border: awakenInfo.key === key ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{key}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: 14 }}>{info.name}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>{info.desc}</div>
                      </div>
                      {awakenInfo.key === key && <div style={{ color: '#8b5cf6', fontSize: 12 }}>◀ 当前</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 行动清单 */}
            <div style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 28, marginBottom: 20, border: '1px solid rgba(148,163,184,0.2)', flex: 1 }}>
              <h3 style={{ color: '#fbbf24', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>📋 30天行动清单</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
                {[
                  { icon: '🧘', title: '每日冥想 10 分钟', desc: '培养觉察能力，提升觉醒层级' },
                  { icon: '📔', title: '记录三件感恩的事', desc: '建立正向情绪锚点' },
                  { icon: '🤝', title: '每周联系一位贵人', desc: '强化正向引力场' },
                  { icon: '📚', title: '阅读成长类书籍', desc: '扩展认知边界' },
                  { icon: `${patternResult.xiyong?.xi?.[0] === '水' ? '🏊' : patternResult.xiyong?.xi?.[0] === '木' ? '🌳' : patternResult.xiyong?.xi?.[0] === '火' ? '🔥' : patternResult.xiyong?.xi?.[0] === '金' ? '💰' : '🏔️'}`, title: `补充${patternResult.xiyong?.xi?.[0] || '喜用'}五行能量`, desc: WUXING_INFO[patternResult.xiyong?.xi?.[0]]?.方位 ? `向${WUXING_INFO[patternResult.xiyong?.xi?.[0]].方位}方发展` : '按喜用方向调整' },
                  { icon: '💪', title: '每天运动 30 分钟', desc: healthResult.先天体质?.养生重点 || '增强体质' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 15, background: 'rgba(15,23,42,0.6)', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 28 }}>{item.icon}</div>
                    <div>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 5 }}>{item.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 结语 */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(6,182,212,0.08) 100%)', borderRadius: 18, padding: 25, textAlign: 'center', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ color: '#8b5cf6', fontSize: 20, fontStyle: 'italic', marginBottom: 10 }}>"浑水可澄，向回归攀爬。"</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>人生地图 5.1 · Ω意向塌陷 × 人生影响力场 × 觉醒层级系统</div>
            </div>

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 7 / 8 · Generated by Life Map 5.1 · {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>

          {/* PAGE 7: 每日运势深度解析 */}
          <div id="export-page-7" style={{ width: '1000px', minHeight: '1414px', background: 'linear-gradient(180deg, #0f172a 0%, #312e81 100%)', padding: '50px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* 页眉 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 12, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <div style={{ color: '#fbbf24', fontSize: 26, fontWeight: 'bold' }}>📅 每日运势分析</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>Page 8 / 8</div>
            </div>

            {(() => {
              const dm = ganZhi?.pillars?.[2]?.天干;
              const dailyInfo = calculateDailyInfo(dm, dailyDate);
              if (!dailyInfo || dailyInfo.error) return <div style={{ color: '#fff' }}>每日运势数据暂未生成</div>;

              return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* 今日概览卡片 */}
                  <div style={{ background: 'rgba(30,41,59,0.7)', borderRadius: 24, padding: 35, border: '1px solid rgba(251,191,36,0.3)', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: 16, marginBottom: 10 }}>{dailyDate} ({dailyInfo.ganZhi})</div>
                    <div style={{ color: '#fff', fontSize: 42, fontWeight: 'bold', marginBottom: 15 }}>{dailyInfo.highlight}</div>
                    <div style={{ color: '#fbbf24', fontSize: 24, marginBottom: 20 }}>
                      {'★'.repeat(Math.round(dailyInfo.score))}{'☆'.repeat(5 - Math.round(dailyInfo.score))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ background: 'rgba(34,197,94,0.1)', padding: 15, borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)' }}>
                        <div style={{ color: '#22c55e', fontSize: 14, marginBottom: 5 }}>宜</div>
                        <div style={{ color: '#fff', fontSize: 16 }}>{dailyInfo.yi?.slice(0, 5).join(' ') || '诸事皆宜'}</div>
                      </div>
                      <div style={{ background: 'rgba(239,68,68,0.1)', padding: 15, borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 5 }}>忌</div>
                        <div style={{ color: '#fff', fontSize: 16 }}>{dailyInfo.ji?.slice(0, 5).join(' ') || '诸事不宜'}</div>
                      </div>
                    </div>
                  </div>

                  {/* 能量深度解析 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 10 }}>天干十神 (外在机遇)</div>
                      <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{dailyInfo.shiShenGan}</div>
                      <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>代表今日外界传递给你的能量特质，反映机遇与挑战。</div>
                    </div>
                    <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 10 }}>地支主气 (内在感受)</div>
                      <div style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{dailyInfo.shiShenZhi}</div>
                      <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>代表你内心的真实体验，心理状态与情感倾向。</div>
                    </div>
                  </div>

                  {/* 决策指引 */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.15) 100%)', borderRadius: 20, padding: 30, border: '1px solid rgba(139,92,246,0.2)', flex: 1 }}>
                    <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>🎯 今日决策建议</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                      {dailyInfo.advice.map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(15,23,42,0.5)', padding: 15, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ color: '#06b6d4', fontSize: 18 }}>💡</span>
                          <span style={{ color: '#cbd5e1', fontSize: 14 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 幸运指南 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                      <h4 style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🎨 开运指南</h4>
                      <div style={{ color: '#fff', fontSize: 14 }}>幸运色：{dailyInfo.luckyColor}</div>
                      <div style={{ color: '#fff', fontSize: 14, marginTop: 5 }}>财神位：{dailyInfo.luckyPosition}</div>
                    </div>
                    <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: 25, border: '1px solid rgba(148,163,184,0.2)' }}>
                      <h4 style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🌍 五行气场</h4>
                      <div style={{ color: '#fff', fontSize: 14 }}>今日五行：{dailyInfo.wuxing}</div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>天人合一，顺应而动。</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 页脚 */}
            <div style={{ textAlign: 'center', color: '#475569', marginTop: 25, paddingTop: 15, borderTop: '1px solid rgba(148,163,184,0.2)', fontSize: 13 }}>
              Page 8 / 8 · 人生地图 5.1 每日运势 · {dailyDate}
            </div>
          </div>
        </div>
        )}





      </div>
    </div>
  );
}
