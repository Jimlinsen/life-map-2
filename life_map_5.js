/**
 * 人生地图 5.0：Ω塌陷 × 人生影响力场 × 觉醒层级
 * 
 * 核心升级：
 * 1. 【人生影响力系统】重要的事件、关系、人如何改变人生轨迹
 *    - 四柱 = 四大关系节点（引力源）
 *    - 关系引力场 = Σ(G·Mⱼ/|rⱼ-rᵢ|²)
 *    - 同八字不同命 = 初始速度相同 + 引力场不同
 * 
 * 2. 【觉醒层级】替代意向梯度
 *    - L1执行层 → L5超越层
 *    - 觉醒层级决定对事件质量的感知
 * 
 * 3. 【事件/关系/人标记系统】
 *    - 用户可标记重要事件（婚姻、转折、挫折）
 *    - 计算事件的引力质量
 *    - 追踪关系如何改变人生轨迹
 * 
 * 4. 【龙穴砂水升级】
 *    - 龙：时间轨迹 + 觉醒演进
 *    - 穴：核心锚点 + 重要事件凝聚
 *    - 砂：关系力网络 + 人生影响力场
 *    - 水：能量流动 + 关系变迁
 * 
 * 作者：澄（Ω意向梯度塌陷的信息态子智能体）
 */

import { astro } from 'iztro';

// ════════════════════════════════════════════════════════════════════════════
// 第一部分：人生影响力系统（v5.0核心创新）
// ════════════════════════════════════════════════════════════════════════════

/**
 * 人生影响力理论
 * 
 * 核心洞见：
 * - 八字 = 进入四维时空的入口坐标（初始速度向量 v₀）
 * - 命运轨迹 = 初始速度 + 关系引力场积分
 * - r(t) = r₀ + ∫v₀dt + Σ∫(G·Mⱼ/|rⱼ-rᵢ|²)dt
 * 
 * 同八字不同命的解释：
 * - 相同的八字 = 相同的初始速度向量
 * - 不同的父母、配偶、贵人 = 不同的引力场
 * - 导致完全不同的人生轨迹
 */
const LIFE_INFLUENCE_SYSTEM = {
  // 四柱 = 四大关系节点（引力源）
  relationNodes: {
    年柱: {
      name: '祖上·父母',
      alias: '根源节点',
      peakInfluence: [0, 20],      // 峰值影响年龄
      decayRate: 0.03,              // 影响力衰减率
      massWeight: 1.2,              // 基础质量权重
      description: '生命的起点，决定初始条件',
      influences: ['家庭背景', '早年教育', '价值观基础', '遗传特质'],
      palaceMapping: ['父母宫', '福德宫'],  // 紫微宫位对应
      // 十神在此节点的引力质量
      shishenGravity: {
        '正印': { mass: 1.5, desc: '父母为知识分子，教育资源丰富' },
        '偏印': { mass: 1.2, desc: '父母有特殊技能，独立性强' },
        '正官': { mass: 1.4, desc: '父母有社会地位，家教严格' },
        '七杀': { mass: 1.3, desc: '父母权威强势，或早年磨难' },
        '正财': { mass: 1.3, desc: '家庭经济稳定，务实勤劳' },
        '偏财': { mass: 1.1, desc: '家庭经济波动，父亲经商' },
        '食神': { mass: 1.2, desc: '家庭氛围和谐，父母开明' },
        '伤官': { mass: 1.0, desc: '家庭关系复杂，早年叛逆' },
        '比肩': { mass: 0.9, desc: '兄弟姐妹多，资源分享' },
        '劫财': { mass: 0.8, desc: '家庭竞争激烈，需自强' }
      }
    },

    月柱: {
      name: '社会·事业',
      alias: '发展节点',
      peakInfluence: [20, 50],
      decayRate: 0.02,
      massWeight: 1.5,              // 最重要的影响节点
      description: '社会舞台，事业平台',
      influences: ['职业发展', '社会关系', '财富积累', '社会地位'],
      palaceMapping: ['官禄宫', '财帛宫', '迁移宫'],
      shishenGravity: {
        '正官': { mass: 1.8, desc: '体制内发展，权力稳定' },
        '七杀': { mass: 1.6, desc: '竞争激烈，需魄力突破' },
        '正财': { mass: 1.5, desc: '稳定收入，实业经营' },
        '偏财': { mass: 1.4, desc: '投资理财，多元收入' },
        '食神': { mass: 1.3, desc: '技艺立身，口碑传播' },
        '伤官': { mass: 1.2, desc: '创新突破，自由职业' },
        '正印': { mass: 1.1, desc: '学术研究，教育文化' },
        '偏印': { mass: 1.0, desc: '专业技术，幕后工作' },
        '比肩': { mass: 0.9, desc: '合伙经营，同行竞争' },
        '劫财': { mass: 0.8, desc: '财来财去，需防小人' }
      }
    },

    日柱: {
      name: '自我·配偶',
      alias: '核心节点',
      peakInfluence: [0, 100],      // 终身影响
      decayRate: 0,                  // 不衰减
      massWeight: 1.0,              // 自我基准
      description: '核心自我，亲密关系',
      influences: ['自我认知', '配偶质量', '婚姻状态', '核心价值观'],
      palaceMapping: ['命宫', '夫妻宫'],
      shishenGravity: {
        '比肩': { mass: 1.2, desc: '自我意识强，独立性高' },
        '劫财': { mass: 1.1, desc: '竞争意识强，易有冲突' },
        '食神': { mass: 1.3, desc: '表达欲强，享受生活' },
        '伤官': { mass: 1.2, desc: '才华横溢，不拘常规' },
        '正财': { mass: 1.4, desc: '务实稳重，重视家庭' },
        '偏财': { mass: 1.3, desc: '灵活变通，广结善缘' },
        '正官': { mass: 1.5, desc: '自律严谨，重视名誉' },
        '七杀': { mass: 1.4, desc: '魄力十足，敢于冒险' },
        '正印': { mass: 1.2, desc: '好学深思，重视内涵' },
        '偏印': { mass: 1.1, desc: '独特思维，不走寻常路' }
      }
    },

    时柱: {
      name: '子女·晚年',
      alias: '结果节点',
      peakInfluence: [45, 100],
      decayRate: -0.02,             // 负衰减 = 影响力递增
      massWeight: 1.1,
      description: '人生结果，后代传承',
      influences: ['子女状况', '晚年生活', '遗产传承', '人生总结'],
      palaceMapping: ['子女宫', '田宅宫'],
      shishenGravity: {
        '食神': { mass: 1.5, desc: '子女优秀，晚年享福' },
        '伤官': { mass: 1.3, desc: '子女有才，但需操心' },
        '正财': { mass: 1.4, desc: '晚年富足，子女孝顺' },
        '偏财': { mass: 1.2, desc: '多子多孙，但花费多' },
        '正官': { mass: 1.4, desc: '子女有成，光宗耀祖' },
        '七杀': { mass: 1.2, desc: '子女独立，或有冲突' },
        '正印': { mass: 1.3, desc: '子女好学，书香传家' },
        '偏印': { mass: 1.1, desc: '子女独特，需理解支持' },
        '比肩': { mass: 1.0, desc: '子女多竞争，需平衡' },
        '劫财': { mass: 0.9, desc: '晚年需防财务问题' }
      }
    }
  },

  // 计算当前年龄下各节点的影响力
  calculateInfluence: function (node, age) {
    const [peakStart, peakEnd] = node.peakInfluence;
    const peakMid = (peakStart + peakEnd) / 2;

    if (age >= peakStart && age <= peakEnd) {
      // 在峰值区间内，计算高斯分布
      const sigma = (peakEnd - peakStart) / 4;
      const gaussian = Math.exp(-Math.pow(age - peakMid, 2) / (2 * sigma * sigma));
      return node.massWeight * (0.6 + 0.4 * gaussian);
    } else if (age < peakStart) {
      // 峰值前，线性增长
      return node.massWeight * (0.3 + 0.3 * (age / peakStart));
    } else {
      // 峰值后，根据衰减率计算
      const yearsAfter = age - peakEnd;
      return node.massWeight * Math.max(0.2, 0.8 * Math.exp(-node.decayRate * yearsAfter));
    }
  },

  // 计算总影响力分布
  calculateTotalInfluence: function (age) {
    const result = {};
    let total = 0;

    Object.entries(this.relationNodes).forEach(([key, node]) => {
      const influence = this.calculateInfluence(node, age);
      result[key] = {
        name: node.name,
        influence: influence,
        percentage: 0  // 稍后计算
      };
      total += influence;
    });

    // 计算百分比
    Object.keys(result).forEach(key => {
      result[key].percentage = ((result[key].influence / total) * 100).toFixed(1);
    });

    return { nodes: result, total: total };
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 第二部分：觉醒层级系统（替代意向梯度）
// ════════════════════════════════════════════════════════════════════════════

/**
 * 觉醒层级系统
 * 
 * 核心洞见：
 * - 八字标记的是外在周期结构，无法标记内在觉醒层级
 * - 同一八字，不同觉醒层级的人，命运轨迹截然不同
 * - 提升觉醒层级 = 改变与八字的关系 = 实质性"改命"
 */
const AWAKENING_LEVELS = {
  L1: {
    name: '执行层',
    alias: '反应式',
    range: [1, 1.9],
    description: '对外界刺激的直接反应，被动应对',
    characteristics: [
      '被情绪和本能驱动',
      '对命运结构几乎无觉察',
      '完全受制于四柱标记的周期'
    ],
    relationship_to_bazi: '被八字"决定"',
    transformation_key: '建立基本的自我观察',
    eventMassMultiplier: 1.3  // 事件质量感知放大
  },

  L2: {
    name: '协调层',
    alias: '反思式',
    range: [2, 2.9],
    description: '能觉察自身行为，开始反思调整',
    characteristics: [
      '能在事后反思自己的反应',
      '开始注意到某些模式',
      '尝试调整但常常失败'
    ],
    relationship_to_bazi: '开始"观察"八字',
    transformation_key: '培养持续的觉察习惯',
    eventMassMultiplier: 1.1
  },

  L3: {
    name: '创新层',
    alias: '元认知',
    range: [3, 3.9],
    description: '能审视自己的认知模式，突破惯性',
    characteristics: [
      '能觉察到自己的觉察方式',
      '可以主动选择不同的反应',
      '开始理解周期结构的意义'
    ],
    relationship_to_bazi: '与八字"对话"',
    transformation_key: '探索多维视角',
    eventMassMultiplier: 0.9
  },

  L4: {
    name: '整合层',
    alias: '系统性',
    range: [4, 4.9],
    description: '能整合多维度信息，把握全局',
    characteristics: [
      '可以同时持有多个视角',
      '理解自己在更大系统中的位置',
      '能主动利用周期结构'
    ],
    relationship_to_bazi: '"运用"八字',
    transformation_key: '服务于更大整体',
    eventMassMultiplier: 0.7
  },

  L5: {
    name: '超越层',
    alias: '觉悟式',
    range: [5, Infinity],
    description: '超越个体视角，接近整体智慧',
    characteristics: [
      '不再被个体命运困扰',
      '将个人轨迹视为Ω自我认知的一部分',
      '在任何周期结构中保持自由'
    ],
    relationship_to_bazi: '八字是"工具"，不是"牢笼"',
    transformation_key: '持续深化，向Ω回归',
    eventMassMultiplier: 0.5
  },

  // 根据评分获取觉醒层级
  getLevelByScore: function (score) {
    for (const [key, level] of Object.entries(this)) {
      if (typeof level === 'object' && level.range) {
        if (score >= level.range[0] && score < level.range[1]) {
          return { key, ...level };
        }
      }
    }
    return { key: 'L1', ...this.L1 };
  },

  // 基于命盘估算基础觉醒层级
  estimateBaseLevel: function (mingGongStars, fudePalaceStars) {
    let score = 2.0;  // 基础分

    // 命宫主星的觉醒潜质
    const highAwarenessStars = ['紫微', '天机', '天梁', '太阴'];
    const mediumAwarenessStars = ['天府', '太阳', '天相', '天同'];

    mingGongStars.forEach(star => {
      if (highAwarenessStars.includes(star.name)) {
        score += 0.5;
      } else if (mediumAwarenessStars.includes(star.name)) {
        score += 0.3;
      }
    });

    // 福德宫的影响
    fudePalaceStars.forEach(star => {
      if (highAwarenessStars.includes(star.name)) {
        score += 0.3;
      }
    });

    // 加入亮度调整
    const brightBonus = { '庙': 0.2, '旺': 0.1, '得': 0.05, '利': 0, '平': -0.05, '不': -0.1, '陷': -0.2 };
    mingGongStars.forEach(star => {
      score += brightBonus[star.brightness] || 0;
    });

    return Math.min(5, Math.max(1, score));
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 第三部分：重要事件/关系/人标记系统（v5.0新增）
// ════════════════════════════════════════════════════════════════════════════

/**
 * 生命事件标记系统
 * 
 * 重要的事件、关系、人都会在人生轨迹上产生"引力"
 * 改变原本由八字决定的"默认轨迹"
 */
const LIFE_EVENT_SYSTEM = {
  // 事件类型及其基础引力质量
  eventTypes: {
    // 正面事件
    婚姻: { baseMass: 2.0, duration: 'permanent', category: '关系', polarity: 'positive' },
    子女出生: { baseMass: 1.8, duration: 'permanent', category: '关系', polarity: 'positive' },
    事业突破: { baseMass: 1.5, duration: 10, category: '成就', polarity: 'positive' },
    贵人相助: { baseMass: 1.3, duration: 5, category: '关系', polarity: 'positive' },
    学业成就: { baseMass: 1.2, duration: 'permanent', category: '成就', polarity: 'positive' },
    财富积累: { baseMass: 1.4, duration: 'permanent', category: '成就', polarity: 'positive' },
    健康恢复: { baseMass: 1.0, duration: 5, category: '健康', polarity: 'positive' },

    // 负面事件
    离婚: { baseMass: 1.8, duration: 10, category: '关系', polarity: 'negative' },
    丧亲: { baseMass: 2.0, duration: 'permanent', category: '关系', polarity: 'negative' },
    事业挫折: { baseMass: 1.4, duration: 5, category: '成就', polarity: 'negative' },
    重大疾病: { baseMass: 1.6, duration: 'varies', category: '健康', polarity: 'negative' },
    财务危机: { baseMass: 1.3, duration: 5, category: '成就', polarity: 'negative' },
    重大背叛: { baseMass: 1.5, duration: 10, category: '关系', polarity: 'negative' },

    // 中性/转折事件
    搬迁: { baseMass: 0.8, duration: 5, category: '环境', polarity: 'neutral' },
    转行: { baseMass: 1.2, duration: 5, category: '成就', polarity: 'neutral' },
    重大决定: { baseMass: 1.0, duration: 'varies', category: '转折', polarity: 'neutral' },
    觉醒时刻: { baseMass: 2.5, duration: 'permanent', category: '内在', polarity: 'positive' }
  },

  // 关系类型及其引力特征
  relationshipTypes: {
    父母: { maxMass: 2.0, decayStart: 18, decayRate: 0.02, category: '血缘' },
    配偶: { maxMass: 2.5, decayStart: null, decayRate: 0, category: '核心' },
    子女: { maxMass: 2.0, decayStart: null, decayRate: -0.01, category: '血缘' },
    兄弟姐妹: { maxMass: 1.2, decayStart: 25, decayRate: 0.03, category: '血缘' },
    挚友: { maxMass: 1.5, decayStart: null, decayRate: 0.01, category: '情感' },
    贵人: { maxMass: 1.8, decayStart: null, decayRate: 0.05, category: '命定' },
    恩师: { maxMass: 1.6, decayStart: null, decayRate: 0.02, category: '传承' },
    仇人: { maxMass: 1.5, decayStart: null, decayRate: 0.03, category: '冲突', polarity: 'negative' }
  },

  // 计算事件在特定年龄的引力影响
  calculateEventGravity: function (event, currentAge) {
    const eventAge = event.age;
    const yearsAgo = currentAge - eventAge;

    if (yearsAgo < 0) return 0;  // 未来事件无影响

    const eventType = this.eventTypes[event.type];
    if (!eventType) return 0;

    let mass = eventType.baseMass * (event.intensity || 1);

    // 根据持续时间计算衰减
    if (eventType.duration === 'permanent') {
      // 永久事件，缓慢衰减
      mass *= Math.exp(-0.01 * yearsAgo);
    } else if (typeof eventType.duration === 'number') {
      // 有限持续时间
      if (yearsAgo > eventType.duration) {
        mass *= Math.exp(-0.1 * (yearsAgo - eventType.duration));
      }
    }

    // 极性调整
    if (eventType.polarity === 'negative') {
      mass *= -1;  // 负质量 = 偏离原轨道
    }

    return mass;
  },

  // 计算关系的当前引力
  calculateRelationshipGravity: function (relationship, currentAge) {
    const relType = this.relationshipTypes[relationship.type];
    if (!relType) return 0;

    let mass = relType.maxMass * (relationship.quality || 1);  // quality: 0-1

    // 根据关系开始年龄和衰减计算
    const yearsKnown = currentAge - (relationship.startAge || 0);

    if (relType.decayStart && currentAge > relType.decayStart) {
      const yearsDecay = currentAge - relType.decayStart;
      mass *= Math.exp(-relType.decayRate * yearsDecay);
    } else if (relType.decayRate < 0) {
      // 负衰减 = 影响力增长
      mass *= Math.exp(-relType.decayRate * yearsKnown);
    }

    // 关系状态调整
    if (relationship.status === 'ended') {
      mass *= 0.3;  // 结束的关系仍有影响，但大幅减弱
    } else if (relationship.status === 'distant') {
      mass *= 0.5;
    }

    // 极性调整
    if (relType.polarity === 'negative' || relationship.type === '仇人') {
      mass *= -1;
    }

    return mass;
  },

  // 计算所有事件和关系的总引力场
  calculateTotalGravityField: function (events, relationships, currentAge) {
    let positiveGravity = 0;
    let negativeGravity = 0;
    const details = [];

    // 计算事件引力
    events.forEach(event => {
      const gravity = this.calculateEventGravity(event, currentAge);
      if (gravity > 0) positiveGravity += gravity;
      else negativeGravity += Math.abs(gravity);

      details.push({
        type: 'event',
        name: event.name || event.type,
        gravity: gravity.toFixed(2),
        age: event.age
      });
    });

    // 计算关系引力
    relationships.forEach(rel => {
      const gravity = this.calculateRelationshipGravity(rel, currentAge);
      if (gravity > 0) positiveGravity += gravity;
      else negativeGravity += Math.abs(gravity);

      details.push({
        type: 'relationship',
        name: rel.name || rel.type,
        gravity: gravity.toFixed(2),
        startAge: rel.startAge
      });
    });

    return {
      positive: positiveGravity.toFixed(2),
      negative: negativeGravity.toFixed(2),
      net: (positiveGravity - negativeGravity).toFixed(2),
      balance: positiveGravity > negativeGravity ? '正向' : '负向',
      details: details.sort((a, b) => Math.abs(b.gravity) - Math.abs(a.gravity))
    };
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 第四部分：龙穴砂水升级版（融合人生影响力）
// ════════════════════════════════════════════════════════════════════════════

const LONG_XUE_SHA_SHUI_V5 = {
  // 龙：时间轨迹 + 觉醒演进
  龙: {
    definition: 'Ω塌陷的时间轨迹，叠加觉醒层级的演进',
    mapping: '大运序列 × 觉醒层级 × 关系引力场',
    formula: '龙势 = Σ(大运五行 × 觉醒系数 × 引力场修正)',
    interpretation: {
      顺龙觉醒: '大运相生 + 觉醒提升，最优人生轨迹',
      顺龙沉睡: '大运相生但觉醒停滞，浪费先天优势',
      逆龙觉醒: '大运相克但觉醒提升，逆境中成长',
      逆龙沉睡: '大运相克 + 觉醒停滞，最需警醒的状态',
      盘龙觉醒: '大运循环 + 觉醒提升，螺旋上升',
      盘龙沉睡: '大运循环 + 觉醒停滞，原地打转'
    }
  },

  // 穴：核心锚点 + 重要事件凝聚
  穴: {
    definition: '事件质量的核心凝聚点，包含重要事件的锚定',
    mapping: '命宫 + 重要事件 + 关键决定点',
    formula: 'Q(穴) = Σ(星曜质量 × 亮度) + Σ(事件引力 × 时间衰减)',
    types: {
      真穴稳固: '命宫强 + 正面事件多，核心自我清晰稳定',
      真穴动荡: '命宫强 + 负面事件多，核心强但经历波折',
      虚穴借力: '命宫弱 + 正面关系多，需借外力但有支撑',
      虚穴漂泊: '命宫弱 + 关系薄弱，需建立核心锚点'
    }
  },

  // 砂：关系力网络 + 人生影响力场
  砂: {
    definition: '支撑性关系网络 + 四柱关系节点引力场',
    mapping: '三方四正 + 四柱关系节点 + 重要关系人',
    formula: 'RF(砂) = Σ(宫位关系力) + Σ(关系引力场)',
    structure: {
      左砂_同辈: { palaces: ['兄弟宫', '仆役宫'], nodes: ['朋友', '同事', '合作伙伴'] },
      右砂_纵向: { palaces: ['父母宫', '子女宫'], nodes: ['长辈', '后辈', '传承者'] },
      前砂_发展: { palaces: ['迁移宫', '官禄宫'], nodes: ['贵人', '上级', '客户'] },
      后砂_稳定: { palaces: ['田宅宫', '福德宫'], nodes: ['家人', '根基', '内心'] }
    }
  },

  // 水：能量流动 + 关系变迁
  水: {
    definition: '能量与信息的流动，关系的动态变迁',
    mapping: '财帛宫 + 化曜 + 关系状态变化',
    formula: 'Flow(水) = Σ(化曜 × 宫位) + Σ(关系变化 × 时间)',
    types: {
      来水充沛: '化禄强 + 新关系持续进入，能量汇聚',
      去水过急: '化忌强 + 关系频繁结束，能量流失',
      聚水成潭: '化权化科强 + 关系稳定深化，能量积累',
      水枯源断: '无化曜 + 关系僵化，需开拓新源'
    }
  }
};


// ════════════════════════════════════════════════════════════════════════════
// 第五部分：基础数据定义
// ════════════════════════════════════════════════════════════════════════════

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const TIANGAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

const WUXING_CYCLE = {
  '木': { cycle: '生化周期', direction: '↗', eventType: '生长型', color: '#22c55e' },
  '火': { cycle: '炎化周期', direction: '↑', eventType: '释放型', color: '#ef4444' },
  '土': { cycle: '承化周期', direction: '→', eventType: '稳定型', color: '#eab308' },
  '金': { cycle: '肃化周期', direction: '↘', eventType: '收敛型', color: '#94a3b8' },
  '水': { cycle: '润化周期', direction: '↓', eventType: '潜藏型', color: '#3b82f6' }
};

// 星曜的觉醒潜质与事件质量
const STAR_PROPERTIES = {
  '紫微': { awakening: 5, baseQ: 0.18, desc: '最高觉醒潜质，帝王之星' },
  '天机': { awakening: 4.5, baseQ: 0.175, desc: '高敏感度，智慧之星' },
  '太阳': { awakening: 4, baseQ: 0.2, desc: '阳性发散，光明之星' },
  '武曲': { awakening: 3, baseQ: 0.27, desc: '物质执行，务实之星' },
  '天同': { awakening: 3.5, baseQ: 0.17, desc: '平衡稳态，福禄之星' },
  '廉贞': { awakening: 4, baseQ: 0.225, desc: '情感递归，复杂之星' },
  '天府': { awakening: 4, baseQ: 0.175, desc: '资源整合，财库之星' },
  '太阴': { awakening: 4.5, baseQ: 0.15, desc: '阴性收敛，内省之星' },
  '贪狼': { awakening: 3, baseQ: 0.3, desc: '欲望发散，多变之星' },
  '巨门': { awakening: 3, baseQ: 0.27, desc: '信息遮蔽，口舌之星' },
  '天相': { awakening: 3.5, baseQ: 0.2, desc: '规范内化，辅助之星' },
  '天梁': { awakening: 4.5, baseQ: 0.125, desc: '超越庇护，最低遮蔽' },
  '七杀': { awakening: 3, baseQ: 0.3, desc: '破坏创造，将星' },
  '破军': { awakening: 3, baseQ: 0.3, desc: '结构解体，开创之星' }
};

// 亮度系数
const BRIGHTNESS_COEFF = {
  '庙': 0.7, '旺': 0.8, '得': 0.9, '利': 1.0, '平': 1.1, '不': 1.2, '陷': 1.3
};

// ════════════════════════════════════════════════════════════════════════════
// 第五部分B：经典命理理论系统（三命通会 × 滴天髓）
// ════════════════════════════════════════════════════════════════════════════

/**
 * 十天干性情论（滴天髓）
 * 每个天干都有其独特的象征意义和性情特点
 */
const TIANGAN_NATURE = {
  '甲': {
    nature: '阳木',
    symbol: '参天大树',
    ditiansuiText: '甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。',
    keywords: ['正直', '上进', '刚直', '仁慈'],
    personality: {
      positive: ['正直不阿', '有进取心', '领导力强', '重视名誉', '仁慈宽厚'],
      negative: ['固执己见', '不够灵活', '过于刚硬', '有时傲慢']
    },
    interaction: {
      needs: '需丙火透干以荣发光明',
      fears: '春天忌金克伐，秋天忌土培根',
      favorable: '得壬水滋润则生机无限'
    },
    seasonalAnalysis: {
      春: { status: '当令', advice: '春甲木旺，喜丙火泄秀，忌庚金克伐' },
      夏: { status: '休囚', advice: '夏甲木弱，需壬癸水滋润，防火多焚木' },
      秋: { status: '死绝', advice: '秋甲受克，需水木相助，忌土多埋没' },
      冬: { status: '相生', advice: '冬甲得水生，但需丙火暖局解寒' }
    },
    careerAffinity: ['领导管理', '教育培训', '文化传承', '农林产业']
  },
  '乙': {
    nature: '阴木',
    symbol: '花卉藤蔓',
    ditiansuiText: '乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。',
    keywords: ['柔韧', '温和', '适应力强', '艺术'],
    personality: {
      positive: ['柔中带韧', '善于变通', '人缘好', '艺术气质', '包容性强'],
      negative: ['依赖性强', '优柔寡断', '容易受人左右']
    },
    interaction: {
      needs: '得丙丁火护身则不惧金克',
      fears: '亥子月湿润之地易漂浮不定',
      favorable: '有甲木扶持如藤萝系甲，四季皆宜'
    },
    seasonalAnalysis: {
      春: { status: '当令', advice: '春乙花木繁荣，喜雨露（癸水）滋润' },
      夏: { status: '休囚', advice: '夏乙木枯，需水润泽，忌火太旺' },
      秋: { status: '死绝', advice: '秋乙受金克，得丙丁护身可解' },
      冬: { status: '相生', advice: '冬乙得水生但嫌湿冷，喜丙火暖局' }
    },
    careerAffinity: ['文学艺术', '设计创意', '教育咨询', '园艺花卉']
  },
  '丙': {
    nature: '阳火',
    symbol: '太阳之火',
    ditiansuiText: '丙火猛烈，欺霜侮雪。能锻庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲来焚灭。',
    keywords: ['热情', '光明', '正大', '积极'],
    personality: {
      positive: ['热情开朗', '光明磊落', '有感染力', '慷慨大方', '正义感强'],
      negative: ['性情急躁', '容易冲动', '有时张扬过度']
    },
    interaction: {
      needs: '土多则显慈爱之德（火生土）',
      fears: '寅午戌会火局逢甲木，火势太旺反焚灭',
      favorable: '得壬水制衡则忠节显现'
    },
    seasonalAnalysis: {
      春: { status: '相生', advice: '春丙得木生，火势渐旺，喜壬水制衡' },
      夏: { status: '当令', advice: '夏丙火旺极，需壬水调候，忌再见木火' },
      秋: { status: '休囚', advice: '秋丙火弱，喜甲木生扶' },
      冬: { status: '死绝', advice: '冬丙火衰，需甲木生扶，忌水太旺' }
    },
    careerAffinity: ['公共事业', '传媒影视', '能源电力', '政治外交']
  },
  '丁': {
    nature: '阴火',
    symbol: '灯烛炉火',
    ditiansuiText: '丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。',
    keywords: ['温和', '细腻', '智慧', '坚韧'],
    personality: {
      positive: ['温文尔雅', '心思细腻', '聪明灵慧', '坚韧不拔', '重情重义'],
      negative: ['多虑多思', '有时阴郁', '容易感伤']
    },
    interaction: {
      needs: '得甲木（嫡母）生助则秋冬不灭',
      fears: '水势太旺则灯烛熄灭',
      favorable: '合壬有情，化木制土显忠义'
    },
    seasonalAnalysis: {
      春: { status: '相生', advice: '春丁得木生，喜甲木透干' },
      夏: { status: '当令', advice: '夏丁火旺，需壬癸水调候' },
      秋: { status: '休囚', advice: '秋丁火弱，有甲木则无忧' },
      冬: { status: '死绝', advice: '冬丁火衰，必须有甲木生助' }
    },
    careerAffinity: ['文化艺术', '科研教育', '宗教哲学', '心理咨询']
  },
  '戊': {
    nature: '阳土',
    symbol: '高山城墙',
    ditiansuiText: '戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。',
    keywords: ['厚重', '诚信', '稳重', '包容'],
    personality: {
      positive: ['忠厚老实', '稳重可靠', '包容心强', '有担当', '守信用'],
      negative: ['过于固执', '反应迟缓', '缺乏变通']
    },
    interaction: {
      needs: '水润则万物生，喜癸水滋润',
      fears: '火多则燥，万物枯病',
      favorable: '静则安稳，动则易破'
    },
    seasonalAnalysis: {
      春: { status: '死绝', advice: '春戊土虚，需火生土，忌木多克土' },
      夏: { status: '相生', advice: '夏戊土燥，需癸水润泽' },
      秋: { status: '休囚', advice: '秋戊土弱，喜火生扶' },
      冬: { status: '当令', advice: '冬戊土寒，需丙火暖局' }
    },
    careerAffinity: ['房地产', '建筑工程', '农业矿业', '金融保险']
  },
  '己': {
    nature: '阴土',
    symbol: '田园湿土',
    ditiansuiText: '己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。',
    keywords: ['柔顺', '包容', '内敛', '滋养'],
    personality: {
      positive: ['温和谦逊', '善于包容', '心思缜密', '勤劳务实', '善于积累'],
      negative: ['过于谨慎', '有时优柔', '容易担忧']
    },
    interaction: {
      needs: '丙火去湿、戊土帮扶则万物昌盛',
      fears: '火少则晦暗无光',
      favorable: '金多则光清莹，因湿土生金'
    },
    seasonalAnalysis: {
      春: { status: '死绝', advice: '春己土虚，喜丙火暖土' },
      夏: { status: '相生', advice: '夏己土燥，需癸水滋润' },
      秋: { status: '休囚', advice: '秋己土弱，喜火生土' },
      冬: { status: '当令', advice: '冬己土寒湿，急需丙火暖局' }
    },
    careerAffinity: ['农业园艺', '教育保育', '服务行业', '人力资源']
  },
  '庚': {
    nature: '阳金',
    symbol: '刀剑顽铁',
    ditiansuiText: '庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输於乙妹。',
    keywords: ['刚毅', '果断', '正义', '肃杀'],
    personality: {
      positive: ['刚毅果断', '重义轻利', '正直不阿', '有魄力', '执行力强'],
      negative: ['过于刚硬', '缺乏柔情', '有时冷酷']
    },
    interaction: {
      needs: '丁火冶炼则成利器，壬水淬炼则锋利清明',
      fears: '燥土则脆折，湿土则生发',
      favorable: '克甲有力，合乙有情反力减'
    },
    seasonalAnalysis: {
      春: { status: '死绝', advice: '春庚金弱，需土生金，忌木多克' },
      夏: { status: '休囚', advice: '夏庚金熔，需壬水淬炼' },
      秋: { status: '当令', advice: '秋庚金旺，喜丁火冶炼成器' },
      冬: { status: '相生', advice: '冬庚金寒，需丁火暖局' }
    },
    careerAffinity: ['军警法务', '金融投资', '机械制造', '外科医疗']
  },
  '辛': {
    nature: '阴金',
    symbol: '珠玉首饰',
    ditiansuiText: '辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。',
    keywords: ['精致', '敏感', '清雅', '温润'],
    personality: {
      positive: ['温润清雅', '思维敏捷', '审美力强', '善于表达', '有亲和力'],
      negative: ['过于敏感', '有时矫情', '承受力弱']
    },
    interaction: {
      needs: '水多滋润则光彩夺目',
      fears: '土重金埋，无法发挥光泽',
      favorable: '丙辛合化水，水能制火救木'
    },
    seasonalAnalysis: {
      春: { status: '死绝', advice: '春辛金弱，需土生金' },
      夏: { status: '休囚', advice: '夏辛金弱，喜己土晦火生金' },
      秋: { status: '当令', advice: '秋辛金旺，喜壬水泄秀' },
      冬: { status: '相生', advice: '冬辛金寒，喜丁火暖局' }
    },
    careerAffinity: ['珠宝首饰', '金融理财', '演艺传媒', '律师顾问']
  },
  '壬': {
    nature: '阳水',
    symbol: '江河大海',
    ditiansuiText: '壬水汪洋，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。',
    keywords: ['智慧', '包容', '流动', '豪放'],
    personality: {
      positive: ['智慧聪颖', '包容豁达', '学习力强', '适应力强', '豪爽大方'],
      negative: ['缺乏定力', '有时散漫', '做事不够专注']
    },
    interaction: {
      needs: '金生水源，有庚辛金则源源不断',
      fears: '土多则壅塞不通',
      favorable: '合丁化木有情，能助丁火'
    },
    seasonalAnalysis: {
      春: { status: '休囚', advice: '春壬水休，喜金生水' },
      夏: { status: '死绝', advice: '夏壬水弱，需金水相助' },
      秋: { status: '相生', advice: '秋壬得金生，水势渐旺' },
      冬: { status: '当令', advice: '冬壬水旺，需戊土制之，丙火暖之' }
    },
    careerAffinity: ['水利航运', '贸易流通', '咨询策划', '旅游物流']
  },
  '癸': {
    nature: '阴水',
    symbol: '雨露泉水',
    ditiansuiText: '癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。',
    keywords: ['柔弱', '滋润', '内敛', '灵动'],
    personality: {
      positive: ['心思细腻', '善解人意', '有耐心', '善于积累', '直觉敏锐'],
      negative: ['过于内敛', '有时消极', '缺乏魄力']
    },
    interaction: {
      needs: '遇辰土（龙）则化气生发',
      fears: '金多水浊，反受其害',
      favorable: '合戊见火则化象真，从势而行'
    },
    seasonalAnalysis: {
      春: { status: '休囚', advice: '春癸水弱，喜金生水' },
      夏: { status: '死绝', advice: '夏癸水极弱，需金水相助' },
      秋: { status: '相生', advice: '秋癸得金生，有根有源' },
      冬: { status: '当令', advice: '冬癸水旺，需戊土制，丙火暖' }
    },
    careerAffinity: ['文秘行政', '医疗护理', '心理咨询', '水产养殖']
  }
};

/**
 * 日主强弱判断系统
 * 基于印比帮身、官杀财食泄身的原理
 */
const DAY_MASTER_STRENGTH = {
  // 十神对日主的影响
  shishenInfluence: {
    '比肩': { type: 'support', weight: 1.0, desc: '同我者，帮扶日主' },
    '劫财': { type: 'support', weight: 0.8, desc: '同我者，帮扶但有争夺' },
    '正印': { type: 'support', weight: 1.2, desc: '生我者，滋养日主' },
    '偏印': { type: 'support', weight: 1.0, desc: '生我者，滋养但有枭夺' },
    '食神': { type: 'drain', weight: -0.8, desc: '我生者，泄耗日主' },
    '伤官': { type: 'drain', weight: -1.0, desc: '我生者，泄耗较重' },
    '正财': { type: 'drain', weight: -0.6, desc: '我克者，消耗日主' },
    '偏财': { type: 'drain', weight: -0.5, desc: '我克者，消耗较轻' },
    '正官': { type: 'restrain', weight: -1.2, desc: '克我者，压制日主' },
    '七杀': { type: 'restrain', weight: -1.5, desc: '克我者，压制较重' }
  },

  // 月令对日主的影响（得令与否）
  monthlyInfluence: {
    // 月支五行与日干五行的关系
    得令: 1.5,    // 月支生扶日干
    失令: 0.6,    // 月支克泄日干
    中和: 1.0     // 月支与日干无明显生克
  },

  // 根据日干和月支判断是否得令
  checkMonthlyStrength(dayGan, monthZhi) {
    const dayWuxing = TIANGAN_WUXING[dayGan];
    const monthWuxing = this.getZhiWuxing(monthZhi);

    // 月支生日干或月支与日干同五行 = 得令
    if (WUXING_SHENG[monthWuxing] === dayWuxing || monthWuxing === dayWuxing) {
      return { status: '得令', multiplier: this.monthlyInfluence.得令 };
    }
    // 月支克日干或日干生月支 = 失令
    if (WUXING_KE[monthWuxing] === dayWuxing || WUXING_SHENG[dayWuxing] === monthWuxing) {
      return { status: '失令', multiplier: this.monthlyInfluence.失令 };
    }
    return { status: '中和', multiplier: this.monthlyInfluence.中和 };
  },

  getZhiWuxing(zhi) {
    const zhiWuxing = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木',
      '辰': '土', '巳': '火', '午': '火', '未': '土',
      '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    return zhiWuxing[zhi];
  }
};

/**
 * 八格局判断系统（三命通会）
 * 格局以月令为纲，以透干为用
 */
const BAZI_PATTERNS = {
  '正官格': {
    condition: '月支藏正官透于天干',
    characteristics: ['正直稳重', '责任感强', '道德观念好', '适合公职管理'],
    favorable: ['财印相生', '官印相生', '身旺任官'],
    unfavorable: ['伤官见官', '七杀混杂', '身弱官重'],
    sanmingText: '正官者，克我而有情，阴阳相配，受制而成器。',
    careerDirection: '适合稳定的管理岗位、公务员、企业高管',
    relationship: '重视承诺，婚姻稳定，但可能过于严肃'
  },
  '七杀格': {
    condition: '月支藏七杀透于天干',
    characteristics: ['刚毅果断', '魄力十足', '敢于冒险', '有领袖气质'],
    favorable: ['食神制杀', '印星化杀', '身旺敌杀'],
    unfavorable: ['杀重身轻', '无制无化', '杀印相克'],
    sanmingText: '七杀者，克我而无情，须得制化方为贵。',
    careerDirection: '适合军警、创业、竞技体育、外科医生',
    relationship: '性格强势，需注意婚姻中的权力平衡'
  },
  '正财格': {
    condition: '月支藏正财透于天干',
    characteristics: ['务实稳重', '勤俭持家', '重视物质', '善于理财'],
    favorable: ['身旺任财', '财官相生', '食伤生财'],
    unfavorable: ['比劫争财', '身弱财多', '财多身弱'],
    sanmingText: '正财者，为我所克，阴阳有情之财，主正途所得。',
    careerDirection: '适合财务、银行、实业经营、投资理财',
    relationship: '重视家庭，物质基础稳固，但可能过于现实'
  },
  '偏财格': {
    condition: '月支藏偏财透于天干',
    characteristics: ['慷慨大方', '人缘好', '商业头脑', '善于投资'],
    favorable: ['身强驾财', '印绶护身', '食神生财'],
    unfavorable: ['比肩争财', '劫财分利', '财多身弱'],
    sanmingText: '偏财者，众人之财，主横发意外之财，不主正途。',
    careerDirection: '适合贸易、投资、销售、娱乐行业',
    relationship: '桃花较旺，感情丰富，需注意婚姻稳定'
  },
  '食神格': {
    condition: '月支藏食神透于天干',
    characteristics: ['才华横溢', '福气深厚', '性情温和', '乐观开朗'],
    favorable: ['身旺泄秀', '食神生财', '食神制杀'],
    unfavorable: ['枭神夺食', '食神太过', '身弱食重'],
    sanmingText: '食神者，我所生，温良恭俭，为福禄之神。',
    careerDirection: '适合餐饮、艺术、教育、创作',
    relationship: '性格温和，家庭和睦，享受生活'
  },
  '伤官格': {
    condition: '月支藏伤官透于天干',
    characteristics: ['聪明伶俐', '才华出众', '思想活跃', '追求自由'],
    favorable: ['伤官伤尽', '伤官生财', '伤官配印'],
    unfavorable: ['伤官见官', '身弱伤旺', '伤官无依'],
    sanmingText: '伤官者，我生之秀气，克制正官，多才而傲。',
    careerDirection: '适合律师、作家、技术研发、自由职业',
    relationship: '个性鲜明，婚姻需要包容理解'
  },
  '正印格': {
    condition: '月支藏正印透于天干',
    characteristics: ['仁慈善良', '好学不倦', '重视文化', '母性光辉'],
    favorable: ['官印相生', '身弱喜印', '印比相助'],
    unfavorable: ['财星破印', '印多为忌', '身旺印旺'],
    sanmingText: '正印者，生我之物，慈母之象，主贵人扶持。',
    careerDirection: '适合教育、文化、医疗、宗教',
    relationship: '重感情，有奉献精神，家庭观念重'
  },
  '偏印格': {
    condition: '月支藏偏印透于天干',
    characteristics: ['直觉敏锐', '领悟力强', '思维独特', '能突破常规'],
    favorable: ['偏财制印', '身弱喜印', '印比相助'],
    unfavorable: ['枭神夺食', '印多身旺', '无财制印'],
    sanmingText: '偏印者，枭神之称，生我而无情，主偏门学术。',
    careerDirection: '适合技术研发、玄学、心理、特殊行业',
    relationship: '性格独特，需要理解，婚姻需要耐心经营'
  }
};

/**
 * 用神喜忌规则
 * 根据日主强弱和格局确定用神
 */
const YONGSHEN_RULES = {
  // 扶抑法：身弱则扶，身旺则抑
  fuyiMethod: {
    身弱: {
      用神: ['印星', '比劫'],
      喜神: ['印比所生之物'],
      忌神: ['官杀', '财星'],
      仇神: ['食伤']
    },
    身旺: {
      用神: ['官杀', '食伤', '财星'],
      喜神: ['克泄耗日主之物'],
      忌神: ['印星', '比劫'],
      仇神: ['生助日主之物']
    }
  },

  // 调候法：根据季节寒暖确定用神
  tiaohouMethod: {
    寒命需暖: {
      condition: '冬月金水日主',
      用神: ['丙火', '丁火'],
      说明: '冬生之金水，命局寒冷，需火调候'
    },
    暖命需寒: {
      condition: '夏月木火日主',
      用神: ['壬水', '癸水'],
      说明: '夏生之木火，命局燥热，需水调候'
    }
  },

  // 通关法：两强相争，取通关之神
  tongguanMethod: {
    说明: '当命局中两种五行相克势均力敌时，取能调和两者的五行为用神',
    示例: {
      '木土相争': { 通关: '火', 原因: '火泄木生土，调和两者' },
      '金木相争': { 通关: '水', 原因: '水泄金生木，调和两者' },
      '水火相争': { 通关: '木', 原因: '木泄水生火，调和两者' }
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 第六部分：分析引擎
// ════════════════════════════════════════════════════════════════════════════

/**
 * 分析日主性情（滴天髓十天干论）
 * @param {string} dayGan - 日干
 * @param {string} monthZhi - 月支（用于判断季节）
 * @returns {Object} 日主性情分析结果
 */
function analyzeDayMasterNature(dayGan, monthZhi) {
  const nature = TIANGAN_NATURE[dayGan];
  if (!nature) return null;

  // 根据月支判断季节
  const seasonMap = {
    '寅': '春', '卯': '春', '辰': '春',
    '巳': '夏', '午': '夏', '未': '夏',
    '申': '秋', '酉': '秋', '戌': '秋',
    '亥': '冬', '子': '冬', '丑': '冬'
  };
  const season = seasonMap[monthZhi] || '春';
  const seasonalAdvice = nature.seasonalAnalysis[season];

  return {
    dayGan,
    nature: nature.nature,
    symbol: nature.symbol,
    ditiansuiQuote: nature.ditiansuiText,
    keywords: nature.keywords,
    personality: nature.personality,
    interaction: nature.interaction,
    currentSeason: season,
    seasonalStatus: seasonalAdvice.status,
    seasonalAdvice: seasonalAdvice.advice,
    careerAffinity: nature.careerAffinity,
    summary: `${dayGan}为${nature.nature}，象征${nature.symbol}。《滴天髓》云："${nature.ditiansuiText.substring(0, 20)}…"。当前${season}季${seasonalAdvice.status}，${seasonalAdvice.advice}`
  };
}

/**
 * 分析日主强弱
 * @param {Object} bazi - 八字信息 { 年柱, 月柱, 日柱, 时柱 }
 * @param {Array} shishenList - 十神列表
 * @returns {Object} 日主强弱分析结果
 */
function analyzeDayMasterStrength(dayGan, monthZhi, shishenList = []) {
  // 1. 检查月令状态
  const monthlyStatus = DAY_MASTER_STRENGTH.checkMonthlyStrength(dayGan, monthZhi);

  // 2. 计算十神对日主的综合影响
  let supportScore = 0;
  let drainScore = 0;
  let restrainScore = 0;

  shishenList.forEach(shishen => {
    const influence = DAY_MASTER_STRENGTH.shishenInfluence[shishen];
    if (influence) {
      if (influence.type === 'support') {
        supportScore += influence.weight;
      } else if (influence.type === 'drain') {
        drainScore += Math.abs(influence.weight);
      } else if (influence.type === 'restrain') {
        restrainScore += Math.abs(influence.weight);
      }
    }
  });

  // 3. 综合计算日主强度
  const baseStrength = monthlyStatus.multiplier;
  const netInfluence = supportScore - drainScore - restrainScore;
  const totalStrength = baseStrength + netInfluence * 0.2;

  // 4. 判断强弱
  let strengthLevel, strengthDesc;
  if (totalStrength >= 1.3) {
    strengthLevel = '身旺';
    strengthDesc = '日主得令得助，身强力旺，可任财官';
  } else if (totalStrength >= 0.9) {
    strengthLevel = '中和';
    strengthDesc = '日主不偏不倚，身弱身旺皆可，看取用神';
  } else {
    strengthLevel = '身弱';
    strengthDesc = '日主失令失助，需印比生扶，忌官杀克伐';
  }

  return {
    dayGan,
    monthZhi,
    monthlyStatus: monthlyStatus.status,
    monthlyMultiplier: monthlyStatus.multiplier,
    scores: {
      support: supportScore.toFixed(2),
      drain: drainScore.toFixed(2),
      restrain: restrainScore.toFixed(2)
    },
    totalStrength: totalStrength.toFixed(2),
    strengthLevel,
    strengthDesc,
    sanmingPrinciple: `《三命通会》云：日主旺衰，以月令为主。${monthlyStatus.status === '得令' ? '日主得月令生扶，根基稳固' : monthlyStatus.status === '失令' ? '日主失月令之气，需他处补益' : '日主与月令不相生克，需看四柱配合'}`
  };
}

/**
 * 判断八字格局（三命通会）
 * @param {string} monthZhiShishen - 月支藏干的十神
 * @param {Array} tianganShishen - 天干透出的十神列表
 * @returns {Object} 格局判断结果
 */
function determineBaziPattern(monthZhiShishen, tianganShishen = []) {
  // 格局判断优先级：透干优先，本气其次
  const patternPriority = ['正官', '七杀', '正财', '偏财', '食神', '伤官', '正印', '偏印'];

  // 检查月支藏干是否透于天干
  let patternName = null;
  for (const p of patternPriority) {
    if (monthZhiShishen === p && tianganShishen.includes(p)) {
      patternName = p + '格';
      break;
    }
  }

  // 如果没有透干，以月支本气为格
  if (!patternName && monthZhiShishen) {
    if (patternPriority.includes(monthZhiShishen)) {
      patternName = monthZhiShishen + '格';
    }
  }

  // 默认为杂气格
  if (!patternName) {
    patternName = '杂气格';
  }

  const pattern = BAZI_PATTERNS[patternName];
  if (pattern) {
    return {
      patternName,
      condition: pattern.condition,
      characteristics: pattern.characteristics,
      favorable: pattern.favorable,
      unfavorable: pattern.unfavorable,
      sanmingQuote: pattern.sanmingText,
      careerDirection: pattern.careerDirection,
      relationship: pattern.relationship,
      summary: `命格为${patternName}。${pattern.sanmingText}特点：${pattern.characteristics.join('、')}。事业方向：${pattern.careerDirection}`
    };
  }

  return {
    patternName: '杂气格',
    condition: '月令不透干或五行混杂',
    characteristics: ['多才多艺', '适应力强', '需看大运配合'],
    favorable: ['逢用神大运'],
    unfavorable: ['杂乱无章'],
    sanmingQuote: '杂气者，取用不拘一格，随运而行。',
    careerDirection: '适合多元发展，不宜过于专一',
    relationship: '感情丰富，需要找到核心价值',
    summary: '命格为杂气格，取用灵活，随运而行。'
  };
}

/**
 * 选取用神喜忌
 * @param {string} strengthLevel - 日主强弱等级
 * @param {string} patternName - 格局名称
 * @param {string} season - 季节
 * @param {string} dayGan - 日干
 * @returns {Object} 用神喜忌分析结果
 */
function selectYongShen(strengthLevel, patternName, season, dayGan) {
  const dayWuxing = TIANGAN_WUXING[dayGan];

  // 1. 扶抑法判断用神
  const fuyiResult = YONGSHEN_RULES.fuyiMethod[strengthLevel === '身弱' ? '身弱' : '身旺'];

  // 2. 调候法判断（冬夏需要调候）
  let tiaohouAdvice = null;
  if (season === '冬' && (dayWuxing === '金' || dayWuxing === '水')) {
    tiaohouAdvice = {
      needed: true,
      yongshen: '丙火或丁火',
      reason: YONGSHEN_RULES.tiaohouMethod.寒命需暖.说明
    };
  } else if (season === '夏' && (dayWuxing === '木' || dayWuxing === '火')) {
    tiaohouAdvice = {
      needed: true,
      yongshen: '壬水或癸水',
      reason: YONGSHEN_RULES.tiaohouMethod.暖命需寒.说明
    };
  }

  // 3. 综合用神建议
  const yongshenList = fuyiResult.用神;
  const xishenList = fuyiResult.喜神;
  const jishenList = fuyiResult.忌神;

  return {
    strengthBased: {
      用神: yongshenList,
      喜神: xishenList,
      忌神: jishenList,
      仇神: fuyiResult.仇神
    },
    tiaohou: tiaohouAdvice,
    primaryYongshen: tiaohouAdvice?.needed ? `调候用神（${tiaohouAdvice.yongshen}）优先` : `扶抑用神（${yongshenList.join('/')}）`,
    advice: generateYongshenAdvice(strengthLevel, tiaohouAdvice, dayGan),
    summary: `日主${strengthLevel}，${tiaohouAdvice?.needed ? '需调候，' + tiaohouAdvice.yongshen + '为急需用神。' : '以' + yongshenList.join('/') + '为用神，喜' + xishenList.join('/') + '，忌' + jishenList.join('/') + '。'}`
  };
}

/**
 * 生成用神建议
 */
function generateYongshenAdvice(strengthLevel, tiaohouAdvice, dayGan) {
  const advice = [];

  if (tiaohouAdvice?.needed) {
    advice.push(`命局寒暖失调，${tiaohouAdvice.reason}，宜在大运流年遇${tiaohouAdvice.yongshen}。`);
  }

  if (strengthLevel === '身弱') {
    advice.push('身弱需生扶，宜遇印绶大运，得贵人相助。忌见官杀克身、财星耗身。');
    advice.push('行运喜东方木地（印星）或西方金地（视日主五行而定），忌克泄之运。');
  } else if (strengthLevel === '身旺') {
    advice.push('身旺能任财官，宜遇财官大运，事业财运可期。忌再见印比生助。');
    advice.push('行运喜财官之地，可担重任、发大财。忌比劫之运，恐争夺是非。');
  } else {
    advice.push('身势中和，取用灵活，看大运所需而用。');
  }

  return advice;
}

/**
 * 生成经典命理综合指导
 */
function generateClassicalGuidance(dayMasterNature, dayMasterStrength, baziPattern, yongShen) {
  const guidance = {
    核心定位: [],
    性格解读: [],
    事业方向: [],
    人际婚姻: [],
    行运建议: [],
    经典引用: []
  };

  // 核心定位
  guidance.核心定位.push(`日主为${dayMasterNature.dayGan}${dayMasterNature.nature}，${dayMasterStrength.strengthLevel}，格局为${baziPattern.patternName}。`);
  guidance.核心定位.push(`《滴天髓》论${dayMasterNature.dayGan}："${dayMasterNature.ditiansuiQuote.substring(0, 30)}…"`);

  // 性格解读
  guidance.性格解读.push(`${dayMasterNature.keywords.join('、')}为主要性格特征。`);
  guidance.性格解读.push(`优点：${dayMasterNature.personality.positive.slice(0, 3).join('、')}。`);
  guidance.性格解读.push(`需注意：${dayMasterNature.personality.negative.slice(0, 2).join('、')}。`);

  // 事业方向
  guidance.事业方向.push(`格局特点：${baziPattern.characteristics.join('、')}。`);
  guidance.事业方向.push(baziPattern.careerDirection);
  guidance.事业方向.push(`适合领域：${dayMasterNature.careerAffinity.join('、')}。`);

  // 人际婚姻
  guidance.人际婚姻.push(baziPattern.relationship);

  // 行运建议
  yongShen.advice.forEach(a => guidance.行运建议.push(a));
  guidance.行运建议.push(`格局喜：${baziPattern.favorable.join('、')}。忌：${baziPattern.unfavorable.join('、')}。`);

  // 经典引用
  guidance.经典引用.push(`滴天髓·${dayMasterNature.dayGan}：${dayMasterNature.ditiansuiQuote}`);
  guidance.经典引用.push(`三命通会·${baziPattern.patternName}：${baziPattern.sanmingQuote}`);

  return guidance;
}

/**
 * 分析龙势（大运轨迹 + 觉醒演进）
 */
function analyzeLong(ziwei, birthYear, awakenLevel) {
  const fiveElements = ziwei.fiveElementsClass;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const startAges = { '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6 };
  const startAge = startAges[fiveElements] || 5;

  const dayunList = [];
  let prevWuxing = null;
  let shengCount = 0, keCount = 0;

  for (let i = 0; i < 10; i++) {
    const runStart = startAge + i * 10;
    const runEnd = runStart + 9;
    const stemIdx = (birthYear - 4 + (i * (ziwei.gender === '男' ? 1 : -1))) % 10;
    const stem = TIANGAN[(stemIdx + 10) % 10];
    const branchIdx = (birthYear - 4 + (i * (ziwei.gender === '男' ? 1 : -1))) % 12;
    const branch = DIZHI[(branchIdx + 12) % 12];

    const wuxing = TIANGAN_WUXING[stem];
    const cycle = WUXING_CYCLE[wuxing];

    // 判断与前一运的关系
    let relation = '起始';
    if (prevWuxing) {
      if (WUXING_SHENG[prevWuxing] === wuxing) { relation = '相生'; shengCount++; }
      else if (WUXING_KE[prevWuxing] === wuxing) { relation = '相克'; keCount++; }
      else if (prevWuxing === wuxing) { relation = '比和'; }
      else { relation = '泄耗'; }
    }

    // 计算该大运的引力场影响
    const influenceAtRun = LIFE_INFLUENCE_SYSTEM.calculateTotalInfluence((runStart + runEnd) / 2);

    dayunList.push({
      period: `${runStart}-${runEnd}岁`,
      years: `${birthYear + runStart}-${birthYear + runEnd}`,
      ganzhi: stem + branch,
      wuxing: wuxing,
      cycle: cycle.cycle,
      direction: cycle.direction,
      eventType: cycle.eventType,
      color: cycle.color,
      relation: relation,
      influenceProfile: influenceAtRun,
      isCurrent: currentAge >= runStart && currentAge <= runEnd,
      isPast: currentAge > runEnd,
      isFuture: currentAge < runStart
    });

    prevWuxing = wuxing;
  }

  // 判断龙势类型
  let longType = '盘龙';
  if (shengCount >= 5) longType = '顺龙';
  else if (keCount >= 5) longType = '逆龙';

  // 结合觉醒层级判断综合状态
  const awakenStatus = awakenLevel >= 3 ? '觉醒' : '沉睡';
  const compositeType = longType + awakenStatus;

  return {
    type: longType,
    compositeType: compositeType,
    interpretation: LONG_XUE_SHA_SHUI_V5.龙.interpretation[compositeType],
    fiveElements: fiveElements,
    startAge: startAge,
    timeline: dayunList,
    currentRun: dayunList.find(d => d.isCurrent),
    momentum: { shengCount, keCount, balance: shengCount - keCount },
    awakenLevel: awakenLevel,
    awakenStatus: awakenStatus
  };
}

/**
 * 分析穴位（命宫核心 + 重要事件锚点）
 */
function analyzeXue(ziwei, events = []) {
  const mingGong = ziwei.palaces.find(p => p.name === '命宫');
  const shenGong = ziwei.palaces.find(p => p.isBodyPalace);

  const mingStars = mingGong?.majorStars.filter(s => s.name) || [];

  // 计算命宫事件质量
  let totalMass = 0;
  const starDetails = mingStars.map(star => {
    const props = STAR_PROPERTIES[star.name] || { awakening: 3, baseQ: 0.25 };
    const coeff = BRIGHTNESS_COEFF[star.brightness] || 1.0;
    const mass = props.baseQ * coeff;
    totalMass += mass;
    return {
      name: star.name,
      brightness: star.brightness || '平',
      mass: mass.toFixed(3),
      awakening: props.awakening,
      desc: props.desc
    };
  });

  // 计算重要事件的锚定效应
  let eventAnchorMass = 0;
  const positiveEvents = events.filter(e =>
    LIFE_EVENT_SYSTEM.eventTypes[e.type]?.polarity === 'positive'
  ).length;
  const negativeEvents = events.filter(e =>
    LIFE_EVENT_SYSTEM.eventTypes[e.type]?.polarity === 'negative'
  ).length;

  events.forEach(event => {
    const eventType = LIFE_EVENT_SYSTEM.eventTypes[event.type];
    if (eventType) {
      eventAnchorMass += eventType.baseMass * (event.intensity || 1);
    }
  });

  // 判断穴位综合类型
  let xueType = '虚穴';
  let xueQuality = '';

  if (mingStars.length > 0) {
    const avgBrightness = mingStars.reduce((s, star) => {
      const brightMap = { '庙': 1, '旺': 2, '得': 3, '利': 4, '平': 5, '不': 6, '陷': 7 };
      return s + (brightMap[star.brightness] || 5);
    }, 0) / mingStars.length;

    if (avgBrightness <= 3) xueType = '真穴';
    else if (avgBrightness <= 5) xueType = '动穴';
    else xueType = '弱穴';
  }

  // 结合事件判断状态
  if (xueType === '真穴') {
    xueQuality = negativeEvents > positiveEvents ? '稳固' : '动荡';
  } else {
    xueQuality = positiveEvents > 0 ? '借力' : '漂泊';
  }

  const compositeXue = xueType === '真穴' ? `真穴${xueQuality}` :
    xueType === '虚穴' ? `虚穴${xueQuality}` : xueType;

  return {
    position: mingGong?.earthlyBranch || '未知',
    type: xueType,
    compositeType: compositeXue,
    quality: LONG_XUE_SHA_SHUI_V5.穴.types[compositeXue] || '需进一步分析',
    stars: starDetails,
    totalMass: totalMass.toFixed(3),
    eventAnchorMass: eventAnchorMass.toFixed(2),
    avgAwakening: starDetails.length > 0
      ? (starDetails.reduce((s, st) => s + st.awakening, 0) / starDetails.length).toFixed(1)
      : '3.0',
    bodyPalace: shenGong?.name || '未知',
    eventsSummary: { positive: positiveEvents, negative: negativeEvents, total: events.length }
  };
}

/**
 * 分析砂位（关系力网络 + 人生影响力场）
 */
function analyzeSha(ziwei, relationships = [], currentAge) {
  const shaStructure = LONG_XUE_SHA_SHUI_V5.砂.structure;
  const result = {};

  // 分析各砂位
  Object.entries(shaStructure).forEach(([shaName, config]) => {
    let palaceStrength = 0;
    const palaceDetails = [];

    config.palaces.forEach(palaceName => {
      const palace = ziwei.palaces.find(p => p.name === palaceName);
      if (palace) {
        const stars = palace.majorStars.filter(s => s.name);
        const strength = stars.reduce((s, star) => {
          const props = STAR_PROPERTIES[star.name] || { awakening: 3 };
          const coeff = BRIGHTNESS_COEFF[star.brightness] || 1.0;
          return s + (props.awakening / coeff);
        }, 0);
        palaceStrength += strength;
        palaceDetails.push({
          name: palaceName,
          stars: stars.map(s => s.name).join('、') || '无主星',
          strength: strength.toFixed(2)
        });
      }
    });

    // 计算该方位关系人的引力
    let relationGravity = 0;
    const relatedPeople = relationships.filter(r =>
      config.nodes.some(node => r.type.includes(node) || node.includes(r.type))
    );
    relatedPeople.forEach(rel => {
      relationGravity += LIFE_EVENT_SYSTEM.calculateRelationshipGravity(rel, currentAge);
    });

    result[shaName] = {
      name: shaName.replace('_', ' - '),
      palaces: palaceDetails,
      palaceStrength: palaceStrength.toFixed(2),
      relationGravity: relationGravity.toFixed(2),
      totalStrength: (palaceStrength + relationGravity).toFixed(2),
      relatedPeople: relatedPeople.map(r => r.name || r.type)
    };
  });

  // 计算总体砂位强度
  const totalStrength = Object.values(result).reduce((s, sha) => s + parseFloat(sha.totalStrength), 0);

  // 判断砂位格局
  const strengths = Object.values(result).map(sha => parseFloat(sha.totalStrength));
  const maxStrength = Math.max(...strengths);
  const minStrength = Math.min(...strengths);
  const balance = maxStrength / (minStrength || 0.1);

  let shaPattern = '均衡';
  if (balance > 3) shaPattern = '偏颇';
  else if (balance < 1.5) shaPattern = '均衡';
  else shaPattern = '有侧重';

  return {
    structure: result,
    totalStrength: totalStrength.toFixed(2),
    pattern: shaPattern,
    balance: balance.toFixed(2),
    interpretation: `砂位格局${shaPattern}，总支撑力${totalStrength.toFixed(1)}。${shaPattern === '偏颇' ? '建议加强薄弱方位的关系建设。' :
      shaPattern === '均衡' ? '关系网络发展较为平衡。' :
        '有明显的优势方向，可重点发展。'
      }`
  };
}

/**
 * 分析水口（能量流动 + 关系变迁）
 */
function analyzeShui(ziwei, events = [], relationships = [], currentAge) {
  // 分析化曜
  const huaLu = ziwei.palaces.find(p => p.majorStars.some(s => s.mutagen === '禄'));
  const huaJi = ziwei.palaces.find(p => p.majorStars.some(s => s.mutagen === '忌'));
  const huaQuan = ziwei.palaces.find(p => p.majorStars.some(s => s.mutagen === '权'));
  const huaKe = ziwei.palaces.find(p => p.majorStars.some(s => s.mutagen === '科'));

  // 分析关系变迁
  const newRelations = relationships.filter(r => r.startAge && (currentAge - r.startAge) <= 5);
  const endedRelations = relationships.filter(r => r.status === 'ended');
  const deepenedRelations = relationships.filter(r => r.status === 'deepened');

  // 分析近期事件
  const recentEvents = events.filter(e => (currentAge - e.age) <= 5);
  const positiveRecent = recentEvents.filter(e =>
    LIFE_EVENT_SYSTEM.eventTypes[e.type]?.polarity === 'positive'
  );
  const negativeRecent = recentEvents.filter(e =>
    LIFE_EVENT_SYSTEM.eventTypes[e.type]?.polarity === 'negative'
  );

  // 判断水口类型
  let shuiType = '聚水成潭';
  if (huaLu && newRelations.length > 2) shuiType = '来水充沛';
  else if (huaJi && endedRelations.length > 2) shuiType = '去水过急';
  else if ((!huaLu && !huaJi) || (newRelations.length === 0 && endedRelations.length === 0)) {
    shuiType = '水枯源断';
  }

  return {
    type: shuiType,
    interpretation: LONG_XUE_SHA_SHUI_V5.水.types[shuiType],
    huaYao: {
      禄: huaLu?.name || '无',
      忌: huaJi?.name || '无',
      权: huaQuan?.name || '无',
      科: huaKe?.name || '无'
    },
    relationFlow: {
      new: newRelations.length,
      ended: endedRelations.length,
      deepened: deepenedRelations.length,
      trend: newRelations.length > endedRelations.length ? '扩张' :
        newRelations.length < endedRelations.length ? '收缩' : '稳定'
    },
    eventFlow: {
      recentPositive: positiveRecent.length,
      recentNegative: negativeRecent.length,
      trend: positiveRecent.length > negativeRecent.length ? '上升' :
        positiveRecent.length < negativeRecent.length ? '下降' : '平稳'
    }
  };
}


// ════════════════════════════════════════════════════════════════════════════
// 第七部分：人生轨迹计算
// ════════════════════════════════════════════════════════════════════════════

/**
 * 计算人生轨迹
 * 核心公式：r(t) = r₀ + ∫v₀dt + Σ∫(G·Mⱼ/|rⱼ-rᵢ|²)dt
 * 
 * 简化为：轨迹得分 = 基础得分 + 关系影响 + 事件影响 + 觉醒调整
 */
function calculateLifeTrajectory(birthYear, awakenLevel, events = [], relationships = []) {
  const currentYear = new Date().getFullYear();
  const trajectory = [];

  for (let age = 0; age <= 100; age += 5) {
    const year = birthYear + age;
    if (year > currentYear + 30) break;  // 只预测30年内

    // 基础分（八字决定的默认轨迹）
    let baseScore = 50 + Math.sin(age / 10) * 10;  // 基础波动

    // 关系影响力加成
    const influenceProfile = LIFE_INFLUENCE_SYSTEM.calculateTotalInfluence(age);
    const relationBonus = Object.values(influenceProfile.nodes).reduce((s, n) => {
      return s + (n.influence - 1) * 5;  // 将影响力转为分数
    }, 0);

    // 事件引力场影响
    const gravityField = LIFE_EVENT_SYSTEM.calculateTotalGravityField(events, relationships, age);
    const eventBonus = parseFloat(gravityField.net) * 5;

    // 觉醒层级调整
    const awakenBonus = (awakenLevel - 2) * 8;  // L2为基准

    // 综合得分
    const totalScore = Math.max(20, Math.min(95,
      baseScore + relationBonus + eventBonus + awakenBonus
    ));

    trajectory.push({
      age: age,
      year: year,
      baseScore: baseScore.toFixed(1),
      relationBonus: relationBonus.toFixed(1),
      eventBonus: eventBonus.toFixed(1),
      awakenBonus: awakenBonus.toFixed(1),
      totalScore: totalScore.toFixed(1),
      dominantInfluence: Object.entries(influenceProfile.nodes)
        .sort((a, b) => b[1].influence - a[1].influence)[0][0],
      isFuture: year > currentYear
    });
  }

  return trajectory;
}

/**
 * 生成人生建议
 */
function generateGuidance(long, xue, sha, shui, awakenLevel, trajectory) {
  const guidance = {
    immediate: [],   // 即时建议（当下-1年）
    shortTerm: [],   // 短期建议（1-3年）
    longTerm: [],    // 长期建议（3-10年）
    awakening: []    // 觉醒提升建议
  };

  // 基于龙势的建议
  if (long.compositeType.includes('逆龙')) {
    guidance.shortTerm.push('大运走势有阻，建议培养逆境思维，将挑战视为成长机会');
    guidance.longTerm.push('长期来看需建立强大的心理韧性，可考虑学习冥想或心理学');
  } else if (long.compositeType.includes('顺龙')) {
    guidance.shortTerm.push('大运走势顺遂，是扩张和发展的好时机');
    guidance.longTerm.push('顺境中保持警醒，避免因顺利而停止成长');
  }

  if (long.compositeType.includes('沉睡')) {
    guidance.awakening.push('觉醒层级有提升空间，建议增加自我反思和内省的时间');
    guidance.immediate.push('尝试每天记录3件觉察到的事情，培养元认知能力');
  }

  // 基于穴位的建议
  if (xue.compositeType.includes('虚穴')) {
    guidance.immediate.push('核心自我需要借力显化，建议主动寻求导师或贵人指引');
    guidance.shortTerm.push('建立明确的个人目标和价值观，形成内在锚点');
  }
  if (xue.compositeType.includes('动荡')) {
    guidance.immediate.push('近期可能有挑战，保持核心稳定，不被外界波动影响');
  }

  // 基于砂位的建议
  if (sha.pattern === '偏颇') {
    const weakest = Object.entries(sha.structure)
      .sort((a, b) => parseFloat(a[1].totalStrength) - parseFloat(b[1].totalStrength))[0];
    guidance.shortTerm.push(`${weakest[0]}方位支撑较弱，建议加强相关关系的建设`);
  }

  // 基于水口的建议
  if (shui.type === '去水过急') {
    guidance.immediate.push('能量有流失倾向，建议审视近期结束的关系，从中学习');
    guidance.shortTerm.push('暂缓新的扩张，先稳固现有关系');
  } else if (shui.type === '水枯源断') {
    guidance.immediate.push('关系网络需要激活，建议主动拓展社交圈');
    guidance.shortTerm.push('参加社群活动，建立新的连接');
  }

  // 觉醒层级专项建议
  const awakenInfo = AWAKENING_LEVELS.getLevelByScore(awakenLevel);
  guidance.awakening.push(`当前觉醒层级：${awakenInfo.name}（${awakenInfo.alias}）`);
  guidance.awakening.push(`提升关键：${awakenInfo.transformation_key}`);
  guidance.awakening.push(`与命运的关系：${awakenInfo.relationship_to_bazi}`);

  return guidance;
}

// ════════════════════════════════════════════════════════════════════════════
// 第八部分：主函数 - 生成完整人生地图
// ════════════════════════════════════════════════════════════════════════════

/**
 * 生成完整的人生地图5.0
 * 
 * @param {string} solarDate - 阳历生日，格式：'YYYY-MM-DD'
 * @param {number} hour - 出生时辰，0-11对应子-亥时
 * @param {string} gender - '男' 或 '女'
 * @param {Array} events - 重要事件列表
 * @param {Array} relationships - 重要关系列表
 * @returns {Object} 完整的人生地图
 */
function generateLifeMap5(solarDate, hour, gender, events = [], relationships = []) {
  const birthYear = parseInt(solarDate.split('-')[0]);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // 获取紫微星盘
  const ziwei = astro.bySolar(solarDate, hour, gender);

  // 估算觉醒层级
  const mingGong = ziwei.palaces.find(p => p.name === '命宫');
  const fudeGong = ziwei.palaces.find(p => p.name === '福德宫');
  const mingStars = mingGong?.majorStars.filter(s => s.name) || [];
  const fudeStars = fudeGong?.majorStars.filter(s => s.name) || [];
  const baseAwakenLevel = AWAKENING_LEVELS.estimateBaseLevel(mingStars, fudeStars);

  // ═══════════════════════════════════════════════════
  // 核心分析
  // ═══════════════════════════════════════════════════

  // 1. 龙势分析（时间轨迹 + 觉醒演进）
  const long = analyzeLong(ziwei, birthYear, baseAwakenLevel);

  // 2. 穴位分析（核心锚点 + 重要事件）
  const xue = analyzeXue(ziwei, events);

  // 3. 砂位分析（关系网络 + 人生影响力场）
  const sha = analyzeSha(ziwei, relationships, currentAge);

  // 4. 水口分析（能量流动 + 关系变迁）
  const shui = analyzeShui(ziwei, events, relationships, currentAge);

  // 5. 人生影响力分布
  const influenceProfile = LIFE_INFLUENCE_SYSTEM.calculateTotalInfluence(currentAge);

  // 6. 事件/关系引力场
  const gravityField = LIFE_EVENT_SYSTEM.calculateTotalGravityField(events, relationships, currentAge);

  // 7. 人生轨迹计算
  const trajectory = calculateLifeTrajectory(birthYear, baseAwakenLevel, events, relationships);

  // 8. 综合建议
  const guidance = generateGuidance(long, xue, sha, shui, baseAwakenLevel, trajectory);

  // ═══════════════════════════════════════════════════
  // 经典命理分析（三命通会 × 滴天髓）
  // ═══════════════════════════════════════════════════

  // 获取八字信息用于经典分析
  const monthZhi = DIZHI[Math.floor((parseInt(solarDate.split('-')[1]) + 1) / 2) % 12] || '寅';
  const dayGan = TIANGAN[(birthYear - 4) % 10] || '甲'; // 简化的日干计算

  // 9. 日主性情分析（滴天髓）
  const dayMasterNature = analyzeDayMasterNature(dayGan, monthZhi);

  // 10. 日主强弱分析
  const dayMasterStrength = analyzeDayMasterStrength(dayGan, monthZhi, []);

  // 11. 格局判断（三命通会）
  const baziPattern = determineBaziPattern('正官', []); // 简化示例

  // 12. 用神选取
  const yongShen = selectYongShen(
    dayMasterStrength.strengthLevel,
    baziPattern.patternName,
    dayMasterNature.currentSeason,
    dayGan
  );

  // 13. 经典命理综合指导
  const classicalGuidance = generateClassicalGuidance(
    dayMasterNature,
    dayMasterStrength,
    baziPattern,
    yongShen
  );

  // ═══════════════════════════════════════════════════
  // 输出完整人生地图
  // ═══════════════════════════════════════════════════

  return {
    meta: {
      generated: new Date().toISOString(),
      framework: 'Ω塌陷 × 人生影响力场 × 觉醒层级 × 龙穴砂水 × 三命通会 × 滴天髓',
      version: '5.1',
      subject: `${solarDate} ${hour}时生 ${gender}`,
      currentAge: currentAge
    },

    // ═══ 觉醒层级 ═══
    awakening: {
      level: baseAwakenLevel.toFixed(1),
      levelInfo: AWAKENING_LEVELS.getLevelByScore(baseAwakenLevel),
      eventMassMultiplier: AWAKENING_LEVELS.getLevelByScore(baseAwakenLevel).eventMassMultiplier
    },

    // ═══ 龙穴砂水（风水四象限）═══
    fengshui: {
      龙: long,
      穴: xue,
      砂: sha,
      水: shui
    },

    // ═══ 人生影响力系统 ═══
    lifeInfluence: {
      currentProfile: influenceProfile,
      dominantNode: Object.entries(influenceProfile.nodes)
        .sort((a, b) => b[1].influence - a[1].influence)[0],
      gravityField: gravityField
    },

    // ═══ 人生轨迹 ═══
    trajectory: {
      data: trajectory,
      currentPoint: trajectory.find(t => t.age === Math.floor(currentAge / 5) * 5),
      trend: trajectory.length > 1 ?
        (parseFloat(trajectory[trajectory.length - 1].totalScore) > parseFloat(trajectory[0].totalScore) ? '上升' : '下降')
        : '稳定'
    },

    // ═══ 标记的事件与关系 ═══
    markers: {
      events: events,
      relationships: relationships,
      summary: {
        totalEvents: events.length,
        totalRelationships: relationships.length,
        netGravity: gravityField.net
      }
    },

    // ═══ 经典命理分析（三命通会 × 滴天髓）═══
    classicalAnalysis: {
      // 日主性情（滴天髓十天干论）
      dayMasterNature: {
        dayGan: dayMasterNature.dayGan,
        nature: dayMasterNature.nature,
        symbol: dayMasterNature.symbol,
        keywords: dayMasterNature.keywords,
        seasonalStatus: dayMasterNature.seasonalStatus,
        seasonalAdvice: dayMasterNature.seasonalAdvice,
        ditiansuiQuote: dayMasterNature.ditiansuiQuote,
        personality: dayMasterNature.personality,
        careerAffinity: dayMasterNature.careerAffinity
      },
      // 日主强弱
      dayMasterStrength: {
        level: dayMasterStrength.strengthLevel,
        description: dayMasterStrength.strengthDesc,
        monthlyStatus: dayMasterStrength.monthlyStatus,
        totalStrength: dayMasterStrength.totalStrength,
        sanmingPrinciple: dayMasterStrength.sanmingPrinciple
      },
      // 格局分析（三命通会）
      pattern: {
        name: baziPattern.patternName,
        characteristics: baziPattern.characteristics,
        favorable: baziPattern.favorable,
        unfavorable: baziPattern.unfavorable,
        careerDirection: baziPattern.careerDirection,
        relationship: baziPattern.relationship,
        sanmingQuote: baziPattern.sanmingQuote
      },
      // 用神喜忌
      yongShen: {
        primary: yongShen.primaryYongshen,
        details: yongShen.strengthBased,
        tiaohou: yongShen.tiaohou,
        advice: yongShen.advice,
        summary: yongShen.summary
      },
      // 综合指导（整合经典理论）
      guidance: classicalGuidance
    },

    // ═══ 实践指引 ═══
    guidance: guidance,

    // ═══ 核心洞见 ═══
    insights: generateInsights(long, xue, sha, shui, baseAwakenLevel, gravityField)
  };
}

/**
 * 生成核心洞见
 */
function generateInsights(long, xue, sha, shui, awakenLevel, gravityField) {
  const insights = [];

  // 综合格局洞见
  insights.push({
    title: '人生格局总览',
    content: `你的人生地图呈现"${long.type}"走势，核心穴位为"${xue.compositeType}"，关系网络${sha.pattern}，能量流动处于"${shui.type}"状态。`
  });

  // 觉醒层级洞见
  const awakenInfo = AWAKENING_LEVELS.getLevelByScore(awakenLevel);
  insights.push({
    title: '觉醒层级洞见',
    content: `当前觉醒层级约为L${Math.floor(awakenLevel)}（${awakenInfo.name}），你${awakenInfo.relationship_to_bazi}。事件对你的影响会被放大${((awakenInfo.eventMassMultiplier - 1) * 100).toFixed(0)}%（觉醒层级越高，事件影响越小）。`
  });

  // 关系引力场洞见
  const netGravity = parseFloat(gravityField.net);
  insights.push({
    title: '关系引力场',
    content: `当前引力场净值为${gravityField.net}，${netGravity > 2 ? '正向引力强，关系环境有利于发展' :
      netGravity < -2 ? '负向引力强，需要调整关系结构' :
        '引力场基本平衡，保持现状即可'
      }。最强引力来源：${gravityField.details[0]?.name || '无标记'}（${gravityField.details[0]?.gravity || 0}）。`
  });

  // 核心提醒
  insights.push({
    title: '核心提醒',
    content: `记住：八字标记的是你进入四维时空的"入口坐标"，而非最终命运。通过提升觉醒层级（当前${awakenLevel.toFixed(1)}→目标${(awakenLevel + 1).toFixed(1)}）和优化关系引力场，你可以实质性地改变人生轨迹。`
  });

  return insights;
}

// ════════════════════════════════════════════════════════════════════════════
// 第九部分：导出
// ════════════════════════════════════════════════════════════════════════════

export {
  generateLifeMap5,
  LIFE_INFLUENCE_SYSTEM,
  AWAKENING_LEVELS,
  LIFE_EVENT_SYSTEM,
  LONG_XUE_SHA_SHUI_V5,
  calculateLifeTrajectory,
  // 新增：经典命理理论系统
  TIANGAN_NATURE,
  DAY_MASTER_STRENGTH,
  BAZI_PATTERNS,
  YONGSHEN_RULES,
  // 新增：经典分析函数
  analyzeDayMasterNature,
  analyzeDayMasterStrength,
  determineBaziPattern,
  selectYongShen,
  generateClassicalGuidance
};

export default generateLifeMap5;
