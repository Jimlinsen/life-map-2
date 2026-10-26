
export const LIFE_INFLUENCE_SYSTEM = {
  relationNodes: {
    年柱: {
      name: '祖上·父母',
      alias: '根源节点',
      peakInfluence: [0, 20],
      massWeight: 1.2,
      description: '生命的起点，决定初始条件',
      influences: ['家庭背景', '早年教育', '价值观基础', '遗传特质'],
      shishenMeaning: {
        '正印': { mass: 1.5, desc: '父母为知识分子或教育者，早年受良好教育' },
        '偏印': { mass: 1.2, desc: '父母有特殊技能或非传统职业，早年独立' },
        '正官': { mass: 1.4, desc: '父母有社会地位，家教严格' },
        '七杀': { mass: 1.3, desc: '父母权威强势，或早年经历磨难' },
        '正财': { mass: 1.3, desc: '家庭经济稳定，父母勤劳务实' },
        '偏财': { mass: 1.1, desc: '家庭经济波动，或父亲经商' },
        '食神': { mass: 1.2, desc: '家庭氛围和谐，父母开明' },
        '伤官': { mass: 1.0, desc: '家庭关系复杂，或早年叛逆' },
        '比肩': { mass: 0.9, desc: '兄弟姐妹多，资源需分享' },
        '劫财': { mass: 0.8, desc: '家庭竞争激烈，需自强' }
      }
    },
    月柱: {
      name: '社会·事业',
      alias: '扩展节点',
      peakInfluence: [20, 50],
      massWeight: 1.0,
      description: '人生的主战场，决定社会位置',
      influences: ['职业发展', '社会关系', '事业格局', '财富积累'],
      shishenMeaning: {
        '正印': { mass: 1.4, desc: '从事文化教育，有学历优势' },
        '偏印': { mass: 1.2, desc: '从事技术研究，偏门得利' },
        '正官': { mass: 1.5, desc: '体制内发展，仕途可期' },
        '七杀': { mass: 1.3, desc: '竞争性行业，需魄力决断' },
        '正财': { mass: 1.3, desc: '稳定收入，正当经营' },
        '偏财': { mass: 1.2, desc: '投资经商，财运起伏' },
        '食神': { mass: 1.1, desc: '技艺为生，口福事业' },
        '伤官': { mass: 1.0, desc: '创新创业，不走常路' },
        '比肩': { mass: 0.9, desc: '同业竞争，合伙经营' },
        '劫财': { mass: 0.8, desc: '财来财去，需防合作纠纷' }
      }
    },
    日柱: {
      name: '自我·配偶',
      alias: '核心节点',
      peakInfluence: [0, 100],
      massWeight: 1.5,
      description: '生命的核心，决定本质特征',
      influences: ['自我认知', '配偶质量', '婚姻状态', '内在动力'],
      shishenMeaning: {
        '正印': { mass: 1.3, desc: '日支坐印，配偶知性体贴' },
        '偏印': { mass: 1.1, desc: '日支坐枭，配偶独特或晚婚' },
        '正官': { mass: 1.4, desc: '日支坐官，配偶有地位' },
        '七杀': { mass: 1.2, desc: '日支坐杀，配偶强势或波折' },
        '正财': { mass: 1.3, desc: '日支坐财，配偶持家有道' },
        '偏财': { mass: 1.1, desc: '日支坐偏财，感情丰富' },
        '食神': { mass: 1.2, desc: '日支坐食，配偶温和有才' },
        '伤官': { mass: 1.0, desc: '日支坐伤，配偶个性鲜明' },
        '比肩': { mass: 0.9, desc: '日支坐比，配偶平等独立' },
        '劫财': { mass: 0.8, desc: '日支坐劫，婚姻需经营' }
      }
    },
    时柱: {
      name: '子女·晚年',
      alias: '延续节点',
      peakInfluence: [45, 100],
      massWeight: 0.8,
      description: '生命的延续，决定晚年格局',
      influences: ['子女状况', '晚年生活', '精神归宿', '遗产传承'],
      shishenMeaning: {
        '正印': { mass: 1.3, desc: '晚年有人照顾，子女孝顺' },
        '偏印': { mass: 1.1, desc: '晚年独处，或有特殊兴趣' },
        '正官': { mass: 1.4, desc: '晚年有地位，子女有成' },
        '七杀': { mass: 1.2, desc: '晚年忙碌，或子女强势' },
        '正财': { mass: 1.3, desc: '晚年富足，有积蓄' },
        '偏财': { mass: 1.1, desc: '晚年仍有投资，财来财去' },
        '食神': { mass: 1.2, desc: '晚年享福，子女和气' },
        '伤官': { mass: 1.0, desc: '晚年创作，或子女叛逆' },
        '比肩': { mass: 0.9, desc: '晚年有伴，朋友多' },
        '劫财': { mass: 0.8, desc: '晚年需防破财，子女分家' }
      }
    }
  },

  gravityField: {
    G: 1.0,
    timeDecay: (age, peakRange) => {
      if (age >= peakRange[0] && age <= peakRange[1]) return 1.0;
      if (age < peakRange[0]) return 0.3 + 0.7 * (age / peakRange[0]);
      return Math.max(0.3, 1.0 - 0.02 * (age - peakRange[1]));
    }
  },

  influenceRating: {
    levels: [
      { min: 0, max: 20, level: '微弱', desc: '关系节点影响力较小，自主性强', color: '#94a3b8' },
      { min: 20, max: 40, level: '普通', desc: '关系节点影响力适中，平衡发展', color: '#22c55e' },
      { min: 40, max: 60, level: '显著', desc: '关系节点影响力明显，需借力', color: '#3b82f6' },
      { min: 60, max: 80, level: '强烈', desc: '关系节点影响力强，命运受牵引', color: '#eab308' },
      { min: 80, max: 100, level: '主导', desc: '关系节点主导轨迹，需识别关键人', color: '#ef4444' }
    ]
  }
};

export const AWAKENING_SYSTEM = {
  levels: {
    L1: {
      name: '执行层',
      alias: '反应式',
      range: [0, 1],
      description: '对外界刺激的直接反应，被动应对',
      characteristics: ['被环境和他人影响较大', '情绪化决策为主', '很少反思自己的行为模式', '命运感强，认为"命中注定"'],
      lifePattern: '随波逐流，命运由外在因素主导',
      upgradeHint: '开始问"为什么我会这样反应？"'
    },
    L2: {
      name: '协调层',
      alias: '反思式',
      range: [1, 2],
      description: '能觉察自身行为，开始反思调整',
      characteristics: ['能觉察自己的情绪和反应', '开始有意识地调整行为', '能从失败中总结经验', '开始理解"性格决定命运"'],
      lifePattern: '主动适应，命运可调整',
      upgradeHint: '开始问"我为什么总是这样思考问题？"'
    },
    L3: {
      name: '创新层',
      alias: '元认知',
      range: [2, 3],
      description: '能审视自己的认知模式，突破惯性',
      characteristics: ['能识别自己的思维定式', '能主动改变认知框架', '能创造性解决问题', '理解"认知决定命运"'],
      lifePattern: '主动创造，命运可重塑',
      upgradeHint: '开始问"谁是那个在观察我思考的？"'
    },
    L4: {
      name: '整合层',
      alias: '系统性',
      range: [3, 4],
      description: '能整合多维度信息，把握全局',
      characteristics: ['能同时处理复杂矛盾', '能整合不同视角和立场', '能预见长期后果', '理解"周期与结构决定命运"'],
      lifePattern: '顺势而为，与命运共舞',
      upgradeHint: '开始问"这一切是如何连接在一起的？"'
    },
    L5: {
      name: '超越层',
      alias: '觉悟式',
      range: [4, 5],
      description: '超越个体视角，接近整体智慧',
      characteristics: ['能超越自我中心', '能感知更大的模式和规律', '能在不确定中保持清明', '理解"我与命运本是一体"'],
      lifePattern: '自在无碍，命运即自我展开',
      upgradeHint: '无需升级，保持觉察即可'
    }
  },

  patternMapping: {
    '形象': { baseLevel: 4, desc: '高维格局，天生易觉醒' },
    '气局': { baseLevel: 3, desc: '中高维格局，有觉醒潜力' },
    '格局': { baseLevel: 2, desc: '标准格局，需努力觉醒' },
    '器用': { baseLevel: 1, desc: '灵活格局，觉醒路径多样' }
  }
};

export const AWAKENING_LEVELS = {
  L1: { range: [0, 1.5], name: '执行层', color: '#94a3b8', multiplier: 1.5, desc: '被动反应' },
  L2: { range: [1.5, 2.5], name: '协调层', color: '#22c55e', multiplier: 1.2, desc: '开始反思' },
  L3: { range: [2.5, 3.5], name: '创新层', color: '#3b82f6', multiplier: 1.0, desc: '突破惯性' },
  L4: { range: [3.5, 4.5], name: '整合层', color: '#eab308', multiplier: 0.8, desc: '系统思维' },
  L5: { range: [4.5, 6], name: '超越层', color: '#a855f7', multiplier: 0.5, desc: '天人合一' }
};

export const PILLAR_NODES = {
  年柱: { name: '祖上·父母', peak: [0, 20], color: '#3fb98f', weight: 1.2 },
  月柱: { name: '社会·事业', peak: [20, 40], color: '#d9bb84', weight: 1.2 },
  日柱: { name: '自我·配偶', peak: [40, 60], color: '#e2604f', weight: 1.2 },
  时柱: { name: '子女·晚年', peak: [60, 80], color: '#9d8cf0', weight: 1.2 }
};
