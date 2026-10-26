import { LIFE_INFLUENCE_SYSTEM, AWAKENING_SYSTEM } from './constants/influence.js';
import { DIZHI_CANGGAN, SHISHEN_TABLE } from './constants/wuxing.js';

export class LifeInfluenceAnalyzer {
  constructor(pillars, dayMaster, age) {
    this.pillars = pillars;
    this.dayMaster = dayMaster;
    this.age = age;
    this.nodes = this.analyzeRelationNodes();
  }

  analyzeRelationNodes() {
    const nodes = [];
    const pillarNames = ['年柱', '月柱', '日柱', '时柱'];

    pillarNames.forEach((name, index) => {
      const pillar = this.pillars[index];
      const nodeConfig = LIFE_INFLUENCE_SYSTEM.relationNodes[name];
      const canggan = DIZHI_CANGGAN[pillar.地支];

      let mainShishen = index !== 2 ? SHISHEN_TABLE[this.dayMaster][pillar.天干] : null;
      const zhiShishen = canggan.主气 ? SHISHEN_TABLE[this.dayMaster][canggan.主气] : null;
      const effectiveShishen = mainShishen || zhiShishen || '比肩';
      const shishenConfig = nodeConfig.shishenMeaning[effectiveShishen] || { mass: 1.0, desc: '普通配置' };
      const timeDecay = LIFE_INFLUENCE_SYSTEM.gravityField.timeDecay(this.age, nodeConfig.peakInfluence);
      const finalMass = nodeConfig.massWeight * shishenConfig.mass * timeDecay;

      nodes.push({
        柱位: name, 别名: nodeConfig.alias, 关系: nodeConfig.name,
        天干: pillar.天干, 地支: pillar.地支, 主十神: effectiveShishen,
        基础权重: nodeConfig.massWeight, 十神质量: shishenConfig.mass, 时间衰减: timeDecay.toFixed(2),
        最终质量: finalMass.toFixed(2), 引力强度: (LIFE_INFLUENCE_SYSTEM.gravityField.G * finalMass).toFixed(2),
        影响描述: shishenConfig.desc, 峰值年龄: `${nodeConfig.peakInfluence[0]}-${nodeConfig.peakInfluence[1]}岁`
      });
    });
    return nodes;
  }

  calculateTotalInfluence() {
    const totalMass = this.nodes.reduce((sum, node) => sum + parseFloat(node.最终质量), 0);
    const selfMass = parseFloat(this.nodes.find(n => n.柱位 === '日柱')?.最终质量 || 1);
    const autonomy = (selfMass / totalMass * 100).toFixed(1);
    const externalGravity = totalMass - selfMass;
    const externalInfluencePercent = (externalGravity / totalMass * 100);
    const rating = LIFE_INFLUENCE_SYSTEM.influenceRating.levels.find(l => externalInfluencePercent >= l.min && externalInfluencePercent < l.max) || LIFE_INFLUENCE_SYSTEM.influenceRating.levels[2];

    return {
      总质量: totalMass.toFixed(2), 自我质量: selfMass.toFixed(2), 外在引力: externalGravity.toFixed(2),
      自主性指数: `${autonomy}%`, 外在影响: `${externalInfluencePercent.toFixed(1)}%`,
      影响等级: rating.level, 等级描述: rating.desc, 等级颜色: rating.color
    };
  }

  generateTrajectoryPrediction() {
    const phases = [
      { 阶段: '早年（0-20岁）', 主导节点: '年柱·祖上父母', node: '年柱' },
      { 阶段: '青中年（20-50岁）', 主导节点: '月柱·社会事业', node: '月柱' },
      { 阶段: '中晚年（50-70岁）', 主导节点: '日柱·自我配偶', node: '日柱' },
      { 阶段: '晚年（70岁后）', 主导节点: '时柱·子女晚年', node: '时柱' }
    ];

    return phases.map(phase => {
      const nodeData = this.nodes.find(n => n.柱位 === phase.node);
      const strength = parseFloat(nodeData?.引力强度 || 1);
      const prediction = strength > 1.2
        ? phase.node === '年柱' ? '家庭支持力度大，早年发展顺利' : phase.node === '月柱' ? '事业发展顺利，社会资源丰富' : phase.node === '日柱' ? '配偶是重要助力，婚姻稳定' : '晚年有靠，子女孝顺'
        : phase.node === '年柱' ? '早年需自立自强，磨练中成长' : phase.node === '月柱' ? '事业需自己开拓，灵活应变' : phase.node === '日柱' ? '独立性强，婚姻重质不重形' : '晚年独立，提前规划';

      return { ...phase, 引力强度: nodeData?.引力强度 || '1.00', 预测: prediction };
    });
  }
}

export class AwakeningAnalyzer {
  constructor(patternResult, shishenDist, wuxing) {
    this.patternResult = patternResult;
    this.shishenDist = shishenDist;
    this.wuxing = wuxing;
  }

  analyze() {
    const baseLevel = this.getBaseLevel();
    const adjustments = this.calculateAdjustments();
    const finalLevel = Math.min(5, Math.max(1, baseLevel + adjustments.total));
    const levelKey = `L${Math.round(finalLevel)}`;
    const levelInfo = AWAKENING_SYSTEM.levels[levelKey];

    return {
      基础层级: baseLevel.toFixed(1), 调整因子: adjustments, 最终层级: finalLevel.toFixed(1),
      层级名称: levelInfo?.name || '协调层', 层级别名: levelInfo?.alias || '反思式',
      层级描述: levelInfo?.description || '', 特征: levelInfo?.characteristics || [],
      生命模式: levelInfo?.lifePattern || '', 提升建议: levelInfo?.upgradeHint || '',
      觉醒潜力: this.assessPotential(finalLevel)
    };
  }

  getBaseLevel() {
    const patternLevel = this.patternResult?.patternLevel || '器用';
    return AWAKENING_SYSTEM.patternMapping[patternLevel]?.baseLevel || 2;
  }

  calculateAdjustments() {
    const factors = [];
    let total = 0;

    const qingzhuo = this.patternResult?.qingzhuoStatus?.status;
    if (qingzhuo === '清') { factors.push({ 因子: '格局清', 调整: +0.5 }); total += 0.5; }
    else if (qingzhuo === '浊') { factors.push({ 因子: '格局浊', 调整: -0.3 }); total -= 0.3; }

    const yinStrength = (this.shishenDist['正印'] || 0) + (this.shishenDist['偏印'] || 0);
    if (yinStrength >= 4) { factors.push({ 因子: '印星旺', 调整: +0.4 }); total += 0.4; }
    else if (yinStrength <= 1) { factors.push({ 因子: '印星弱', 调整: -0.2 }); total -= 0.2; }

    const shiShangStrength = (this.shishenDist['食神'] || 0) + (this.shishenDist['伤官'] || 0);
    if (shiShangStrength >= 4) { factors.push({ 因子: '食伤旺', 调整: +0.3 }); total += 0.3; }

    const wuxingValues = Object.values(this.wuxing);
    const maxWx = Math.max(...wuxingValues);
    const minWx = Math.min(...wuxingValues);
    if (maxWx - minWx <= 4) { factors.push({ 因子: '五行均衡', 调整: +0.3 }); total += 0.3; }
    else if (maxWx - minWx >= 10) { factors.push({ 因子: '五行偏枯', 调整: -0.2 }); total -= 0.2; }

    return { 详情: factors, total };
  }

  assessPotential(level) {
    if (level >= 4) return { 等级: '极高', 描述: '天生慧根，稍加点拨即可开悟', 颜色: '#22c55e' };
    if (level >= 3) return { 等级: '较高', 描述: '悟性较好，持续修炼可突破', 颜色: '#3b82f6' };
    if (level >= 2) return { 等级: '中等', 描述: '普通资质，需要系统学习', 颜色: '#eab308' };
    return { 等级: '待开发', 描述: '需从基础做起，循序渐进', 颜色: '#94a3b8' };
  }
}
