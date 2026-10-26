import { PLAIN_LANGUAGE_SYSTEM, LIFE_STAGE_NAMES } from './constants/language.js';

export class AutoPredictionGenerator {
  constructor(baziData, ziweiData, patternData, marriageData, careerData, birthYear, gender) {
    this.bazi = baziData;
    this.ziwei = ziweiData;
    this.pattern = patternData;
    this.marriage = marriageData;
    this.career = careerData;
    this.birthYear = birthYear;
    this.gender = gender;
    this.currentYear = new Date().getFullYear();
    this.age = this.currentYear - birthYear;
  }

  generateAll() {
    return {
      智能事件: this.generateAutoEvents(),
      智能关系: this.generateAutoRelationships(),
      人生阶段: this.getCurrentLifeStage(),
      核心提示: this.generateCoreTips()
    };
  }

  getCurrentLifeStage() {
    for (const [key, stage] of Object.entries(LIFE_STAGE_NAMES)) {
      if (this.age >= stage.年龄[0] && this.age <= stage.年龄[1]) {
        return {
          阶段: stage.名称,
          重点: stage.重点,
          年龄: this.age,
          建议: this.getStageAdvice(key)
        };
      }
    }
    return { 阶段: '人生旅程', 年龄: this.age };
  }

  getStageAdvice(stageKey) {
    const adviceMap = {
      childhood: '培养兴趣爱好，打好学习基础',
      adolescence: '专注学业，探索自我定位',
      youngAdult: '大胆尝试，积累经验和人脉',
      primeAge: '深耕专业，平衡工作与家庭',
      middleAge: '稳健投资，关注身心健康',
      senior: '享受生活，传承智慧给后辈'
    };
    return adviceMap[stageKey] || '';
  }

  generateAutoEvents() {
    const events = [];

    // 基于事业分析生成事件
    if (this.career) {
      events.push(...this.generateCareerEvents());
    }

    // 基于婚姻分析生成事件
    if (this.marriage) {
      events.push(...this.generateMarriageEvents());
    }

    // 基于紫微宫位生成事件
    if (this.ziwei?.十二宫) {
      events.push(...this.generateZiweiEvents());
    }

    // 按年龄排序并去重
    return events
      .filter(e => e.预计年龄 >= this.age - 5) // 只显示近期和未来事件
      .sort((a, b) => a.预计年龄 - b.预计年龄)
      .slice(0, 8); // 最多显示8个事件
  }

  generateCareerEvents() {
    const events = [];
    const mainShishen = this.career?.主导十神;

    // 根据主导十神生成事业事件
    if (['正官', '七杀'].includes(mainShishen)) {
      events.push({
        类型: '事业',
        事件: '晋升机会',
        描述: '你有强烈的责任感和领导潜质，在职场中容易被上级注意到',
        预计年龄: Math.max(28, this.age + 2),
        重要性: '高',
        icon: '📈',
        建议: '主动承担项目，展示你的管理能力'
      });
    }

    if (['食神', '伤官'].includes(mainShishen)) {
      events.push({
        类型: '事业',
        事件: '创意项目',
        描述: '你的才华和创意会找到展示的舞台，可能有作品问世或新点子被采纳',
        预计年龄: Math.max(25, this.age + 1),
        重要性: '中',
        icon: '💡',
        建议: '让更多人看到你的作品，不要害怕表达'
      });
    }

    if (['正财', '偏财'].includes(mainShishen)) {
      events.push({
        类型: '财富',
        事件: '收入增长',
        描述: '你的赚钱能力会逐渐体现，可能会有加薪或额外收入',
        预计年龄: Math.max(27, this.age + 2),
        重要性: '高',
        icon: '💰',
        建议: '做好财务规划，适当投资理财'
      });
    }

    return events;
  }

  generateMarriageEvents() {
    const events = [];
    const score = this.marriage?.婚姻评分?.最终分数 || 70;

    if (score >= 80 && this.age < 35) {
      events.push({
        类型: '感情',
        事件: '感情顺利期',
        描述: '你的婚姻宫位置不错，感情运势理想，有望遇到合适的人',
        预计年龄: this.age < 25 ? 26 : this.age + 1,
        重要性: '高',
        icon: '💕',
        建议: '多参加社交活动，保持开放心态'
      });
    }

    if (this.age >= 25 && this.age <= 35) {
      events.push({
        类型: '家庭',
        事件: '家庭规划期',
        描述: '这是规划家庭生活的好时机，考虑结婚或生育',
        预计年龄: this.age + 2,
        重要性: '中',
        icon: '🏠',
        建议: '与伴侣多沟通未来规划'
      });
    }

    return events;
  }

  generateZiweiEvents() {
    const events = [];
    const palaces = this.ziwei?.十二宫 || [];

    // 检查各宫位吉凶
    const careerPalace = palaces.find(p => p.宫位 === '官禄宫');
    const wealthPalace = palaces.find(p => p.宫位 === '财帛宫');
    const healthPalace = palaces.find(p => p.宫位 === '疾厄宫');

    if (careerPalace?.吉凶 === '吉' || careerPalace?.吉凶 === '大吉') {
      events.push({
        类型: '事业',
        事件: '贵人相助',
        描述: '工作中会遇到帮助你的人，可能是上司、前辈或合作伙伴',
        预计年龄: this.age + 1,
        重要性: '高',
        icon: '🤝',
        建议: '真诚待人，珍惜每一次合作机会'
      });
    }

    if (wealthPalace?.吉凶 === '吉' || wealthPalace?.吉凶 === '大吉') {
      events.push({
        类型: '财富',
        事件: '财务改善',
        描述: '收入状况会有所改善，可能是涨薪、奖金或投资收益',
        预计年龄: this.age + 2,
        重要性: '中',
        icon: '💵',
        建议: '抓住理财机会，但也要量力而行'
      });
    }

    if (['小凶', '凶'].includes(healthPalace?.吉凶)) {
      events.push({
        类型: '健康',
        事件: '注意保养',
        描述: '身体方面需要多关注，尤其是作息和饮食习惯',
        预计年龄: this.age,
        重要性: '高',
        icon: '🏥',
        建议: '定期体检，保持良好生活习惯'
      });
    }

    return events;
  }

  generateAutoRelationships() {
    const relationships = [];

    // 配偶/伴侣
    relationships.push(this.generateSpouseRelation());

    // 父母
    relationships.push(this.generateParentsRelation());

    // 子女（如果年龄合适）
    if (this.age >= 25) {
      relationships.push(this.generateChildrenRelation());
    }

    // 贵人
    relationships.push(this.generateMentorRelation());

    // 朋友/合作者
    relationships.push(this.generateFriendsRelation());

    return relationships.filter(r => r != null);
  }

  generateSpouseRelation() {
    const spouseInfo = this.marriage?.夫妻宫分析;
    const spouseType = spouseInfo?.配偶类型 || '待分析';

    let quality = '一般';
    let description = '婚姻方面需要用心经营';

    if (this.marriage?.婚姻评分?.最终分数 >= 80) {
      quality = '很好';
      description = '婚姻运势不错，容易遇到合适的另一半，相处融洽';
    } else if (this.marriage?.婚姻评分?.最终分数 >= 60) {
      quality = '良好';
      description = '婚姻需要双方共同努力，沟通是关键';
    }

    return {
      关系: '💑 另一半',
      质量: quality,
      描述: description,
      特征: `可能是${spouseType}，${this.getSpouseTraits()}`,
      建议: this.getRelationAdvice('spouse')
    };
  }

  getSpouseTraits() {
    const traits = this.marriage?.配偶信息;
    if (!traits) return '需要多了解对方';

    const parts = [];
    if (traits.样貌特征?.描述) parts.push(traits.样貌特征.描述);
    if (traits.年龄差?.描述) parts.push(traits.年龄差.描述);
    return parts.join('，') || '独特而有魅力';
  }

  generateParentsRelation() {
    return {
      关系: '👨‍👩‍👧 父母',
      质量: '需珍惜',
      描述: '父母是人生的第一位老师，他们的影响塑造了你的价值观',
      特征: '家庭是温暖的港湾',
      建议: '多陪伴父母，表达感谢和爱'
    };
  }

  generateChildrenRelation() {
    const childPalace = this.ziwei?.十二宫?.find(p => p.宫位 === '子女宫');
    const isGood = ['吉', '大吉'].includes(childPalace?.吉凶);

    return {
      关系: '👶 子女',
      质量: isGood ? '缘分深' : '需培养',
      描述: isGood ? '子女运不错，亲子关系和谐' : '需要用心培养亲子关系',
      特征: '子女是生命的延续',
      建议: '注重教育方式，做孩子的朋友'
    };
  }

  generateMentorRelation() {
    const hasInYin = this.pattern?.shishenDist?.['正印'] > 0 || this.pattern?.shishenDist?.['偏印'] > 0;

    return {
      关系: '👔 贵人/导师',
      质量: hasInYin ? '运气好' : '需主动',
      描述: hasInYin ? '你容易遇到贵人相助，事业上有人指点' : '贵人需要自己去寻找，多向优秀的人学习',
      特征: '可能是老师、上司或行业前辈',
      建议: '保持谦虚好学的态度，真诚待人'
    };
  }

  generateFriendsRelation() {
    const hasBijie = this.pattern?.shishenDist?.['比肩'] > 0 || this.pattern?.shishenDist?.['劫财'] > 0;

    return {
      关系: '🤝 朋友/合作者',
      质量: hasBijie ? '竞争中成长' : '互帮互助',
      描述: hasBijie ? '身边有竞争者，但竞争也是成长的动力' : '朋友运不错，容易获得朋友的帮助',
      特征: '志同道合的人会自然聚集',
      建议: '选择积极向上的朋友圈，远离消极人群'
    };
  }

  getRelationAdvice(type) {
    const adviceMap = {
      spouse: '真诚沟通，互相尊重，共同成长',
      parents: '多陪伴，少争吵，理解他们的不易',
      children: '用爱引导，而非控制',
      mentor: '虚心请教，知恩图报',
      friends: '真心交往，不计较得失'
    };
    return adviceMap[type] || '用心经营每一段关系';
  }

  generateCoreTips() {
    const tips = [];

    // 根据人生阶段生成建议
    const stage = this.getCurrentLifeStage();
    tips.push({
      类型: 'life_stage',
      标题: `${stage.阶段}的你`,
      内容: stage.建议,
      icon: '🎯'
    });

    // 根据主导能力生成建议
    const mainStar = this.ziwei?.命宫分析?.主星?.[0]?.名称;
    if (mainStar) {
      const ability = PLAIN_LANGUAGE_SYSTEM.starTranslation[mainStar];
      tips.push({
        类型: 'core_ability',
        标题: '你的核心优势',
        内容: `你的${ability || '天赋'}是与生俱来的优势，善用它可以事半功倍`,
        icon: '⭐'
      });
    }

    // 根据五行倾向生成建议
    const wuxingType = this.pattern?.wuxing;
    if (wuxingType) {
      const dominant = Object.entries(wuxingType).sort((a, b) => b[1] - a[1])[0]?.[0];
      const type = PLAIN_LANGUAGE_SYSTEM.wuxingTranslation[dominant];
      tips.push({
        类型: 'personality',
        标题: '你的性格特点',
        内容: `你是${type}人格，${this.getPersonalityAdvice(dominant)}`,
        icon: '🧠'
      });
    }

    return tips;
  }

  getPersonalityAdvice(wuxing) {
    const adviceMap = {
      '木': '擅长学习和成长，保持好奇心是你的优势',
      '火': '热情有感染力，但要控制冲动',
      '土': '稳重可靠，是团队的定心丸',
      '金': '执行力强，做事有条理，但要学会变通',
      '水': '聪明睿智，善于变通，但要避免想太多'
    };
    return adviceMap[wuxing] || '发挥自己的特点';
  }
}

export class LifeGuidanceGenerator {
  constructor(autoPrediction, deepLinkage, lifeMap, liunian, baziPattern, gender, age) {
    this.prediction = autoPrediction || {};
    this.linkage = deepLinkage || {};
    this.lifeMap = lifeMap || {};
    this.liunian = liunian || {};
    this.pattern = baziPattern || {};
    this.gender = gender;
    this.age = age;
    this.textEngine = new TextEngine(); // Helper for text generation
  }

  generate() {
    return {
      // 三问指引 - 深度优化
      第一问_你受到的影响: this.analyzeInfluences(),
      第二问_你应该如何做: this.generateActions(),
      第三问_你的未来方向: this.predictFuture(),

      // 自动生成的事件和关系 (Keep existing logic but safe)
      推荐事件标记: this.generateRecommendedEvents(),
      推荐关系标记: this.generateRecommendedRelationships(),

      // 综合人生导航
      核心人生主题: this.getCoreTheme(),
      当前阶段任务: this.getCurrentStageTask(),
      关键行动建议: this.getKeyActions()
    };
  }

  // --------------------------------------------------------------------------
  // 第一问：你受到了什么影响 (The "Who Am I" & "Where Am I" Question)
  // --------------------------------------------------------------------------
  analyzeInfluences() {
    const influences = {
      先天影响: [],
      环境影响: [],
      流年影响: [],
      总结: ''
    };

    // 1. 先天影响：八字命格(Terrain) x 紫微主星(Star) 的化学反应
    const terrain = this.safeGet(this.lifeMap, '地图.地形', {});
    const star = this.safeGet(this.lifeMap, '角色.0', {});

    // Bazi Terrain Logic
    if (terrain.地形名称) {
      influences.先天影响.push({
        类型: '命格基调',
        icon: terrain.icon || '🏔️',
        影响: terrain.地形名称,
        解读: `你的底层生命能量呈现「${terrain.地形名称}」特质，${terrain.特性?.join('，') || '独具一格'}。`
      });
    }

    // Ziwei Star Logic
    if (star.名称) {
      const starName = star.名称;
      const starRole = star.角色 || '潜行者';

      // Synthesis: Conflict or Resonance?
      const wuxing = terrain.主导五行 || '土';
      // Simple heuristic for synthesis (can be expanded)
      const synthesis = this.synthesizeStarAndTerrain(starName, wuxing);

      influences.先天影响.push({
        类型: '灵魂角色',
        icon: '⭐',
        影响: `${starName} · ${starRole}`,
        解读: `你的显性人格由「${starName}」主导，扮演「${starRole}」的角色。${synthesis}`
      });
    }

    // 2. 环境影响：十神势力场
    const field = this.safeGet(this.lifeMap, '地图.势力场', {});
    if (field.场域名称) {
      influences.环境影响.push({
        类型: '命运磁场',
        icon: field.icon || '🌍',
        影响: field.场域名称,
        解读: field.描述 || `你身处「${field.场域名称}」之中，这意味着外界环境对你的期待是：${field.场域效果 || '顺其自然'}。`
      });
    }

    // 3. 流年影响
    const yearNum = new Date().getFullYear();
    const liunianTxt = this.safeGet(this.liunian, '综合解读', `${yearNum}年运势平稳`);
    influences.流年影响.push({
      类型: '流年运势',
      icon: '🌊',
      影响: `${yearNum}年能级`,
      解读: liunianTxt
    });

    // 4. Deep Summary
    influences.总结 = this.textEngine.composeInfluenceSummary(terrain, star, field, this.liunian);

    return influences;
  }

  // --------------------------------------------------------------------------
  // 第二问：你应该如何做 (The Strategy Question)
  // --------------------------------------------------------------------------
  generateActions() {
    const actions = {
      事业方向: [],
      财务策略: [],
      感情经营: [],
      健康养生: [],
      总纲: ''
    };

    // Helper to push actions
    const pushAction = (category, item) => {
      if (item && item.建议) actions[category].push(item);
    };

    // Career Strategy: Xi Yong Shen (Bazi) + Guan Lu Gong (Ziwei)
    const careerLink = this.safeGet(this.linkage, '事业联动', {});
    const xiyong = this.safeGet(this.pattern, 'xiyong.xi', []);

    pushAction('事业方向', {
      建议: careerLink.星曜建议 || '发挥自身优势，寻找突破口',
      原因: careerLink.解读 || '命理显示你有独特的职业潜力',
      行业: careerLink.行业推荐?.length ? careerLink.行业推荐.join('、') : `五行属${xiyong[0] || '综合'}的行业`,
      优先级: careerLink.协同度 === '强' ? '高' : '中',
      icon: '💼'
    });

    // Wealth Strategy
    const wealthLink = this.safeGet(this.linkage, '财运联动', {});
    pushAction('财务策略', {
      建议: wealthLink.理财建议 || '稳健为主，开源节流',
      原因: wealthLink.解读,
      优先级: wealthLink.协同度 === '强' ? '高' : '中',
      icon: '💰'
    });

    // Relationship Strategy
    const marriageLink = this.safeGet(this.linkage, '婚姻联动', {});
    const spouse = marriageLink.配偶特征 || '成熟稳重';
    pushAction('感情经营', {
      建议: marriageLink.感情建议 || '真诚沟通，包容差异',
      配偶特征: spouse,
      原因: marriageLink.解读,
      优先级: marriageLink.协同度 === '强' ? '高' : '中',
      icon: '💕'
    });

    // Health Strategy
    const healthLink = this.safeGet(this.linkage, '健康联动', {});
    const weakElem = healthLink.八字薄弱五行 || '土';
    pushAction('健康养生', {
      建议: healthLink.健康建议 || '规律作息，注意饮食卫生',
      注意: healthLink.易感部位 || '脾胃',
      原因: `五行${weakElem}较弱，需注意平衡`,
      优先级: healthLink.协同度 === '需注意' ? '高' : '中',
      icon: '🏥'
    });

    // Action Summary
    actions.总纲 = this.textEngine.composeActionSummary(this.prediction?.人生阶段, xiyong);

    return actions;
  }

  // --------------------------------------------------------------------------
  // 第三问：你的未来方向 (The Vision Question)
  // --------------------------------------------------------------------------
  predictFuture() {
    const future = {
      短期展望: [],
      中期目标: [],
      长期愿景: [],
      总结: ''
    };

    // Short Term (1-2 years): Focus on Liunian Sihua
    const currentYear = new Date().getFullYear();
    const sihua = this.safeGet(this.liunian, '流年四化', {});

    if (sihua.化禄) {
      future.短期展望.push({
        事件: `流年化禄在${sihua.化禄}`,
        时间: `${currentYear}年`,
        类型: '机遇',
        建议: `今年${sihua.化禄}相关的机会较多，也就是你的「${this.getStarKeyword(sihua.化禄)}」能量被激活，请大胆把握。`,
        重要性: '高'
      });
    }

    // Mid Term (3-5 years): Auto Prediction Events
    const events = this.safeGet(this.prediction, '智能事件', []);
    const midEvents = events.filter(e => e.预计年龄 > this.age && e.预计年龄 <= this.age + 5).slice(0, 2);

    midEvents.forEach(e => {
      future.中期目标.push({
        目标: e.事件,
        时间: `约${e.预计年龄}岁`,
        类型: e.类型,
        准备: e.建议 || '提前规划，从容应对'
      });
    });

    if (midEvents.length === 0) {
      future.中期目标.push({
        目标: '能力积淀期',
        时间: '未来3-5年',
        类型: '成长',
        准备: '这是厚积薄发的阶段，专注提升核心竞争力'
      });
    }

    // Long Term (Life Mission): Based on Ming Palace & Pattern
    const star = this.safeGet(this.lifeMap, '角色.0', {});
    const pattern = this.safeGet(this.lifeMap, '格局.吉格.0', {});

    const stageName = star.人生舞台 || '自我实现';
    const trait = star.性格标签 ? star.性格标签[0] : '独特特质';

    future.长期愿景.push({
      方向: stageName,
      优势: pattern.名称 ? `${pattern.名称}加持` : `发挥${trait}`,
      建议: `你的人生长板在于「${stageName}」。不要被短期的波动干扰，坚持在${stageName}领域深耕，你的${trait}终将大放异彩。`
    });

    // Summary
    future.总结 = `短期看运气，长期看格局。眼下重点在于${sihua.化禄 ? '把握化禄引发的流动' : '稳住心态'}；未来3-5年是${midEvents.length ? '关键转折期' : '沉淀期'}；而终极目标，是完成你从「${star.名称 || '命主'}」到「${stageName}者」的蜕变。`;

    return future;
  }

  // --------------------------------------------------------------------------
  // Helper Methods & Generators
  // --------------------------------------------------------------------------

  // Safe getter for deep properties
  safeGet(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    return result === undefined ? defaultValue : result;
  }

  // Synthesize Logic: Ziwei Star vs Bazi Terrain
  synthesizeStarAndTerrain(starName, wuxing) {
    // This is a simplified logic. 
    // Ideally we know star element vs wuxing.
    // Assuming star elements roughly:
    const starElements = {
      '紫微': '土', '天机': '木', '太阳': '火', '武曲': '金', '天同': '水',
      '廉贞': '火', '天府': '土', '太阴': '水', '贪狼': '木', '巨门': '水',
      '天相': '水', '天梁': '土', '七杀': '金', '破军': '水'
    };
    const sElem = starElements[starName] || '土';

    if (sElem === wuxing) return '命格与环境高度共鸣，能量纯粹，执行力强。';

    const generating = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    if (generating[sElem] === wuxing) return '你的内在能量滋养着你的环境，付出型人格，利他思维。';
    if (generating[wuxing] === sElem) return '环境滋养着你，贵人运强，容易获得资源。';

    return '命格与环境存在张力，这种张力往往是创造力的来源，也意味着需要更多磨合。';
  }

  getStarKeyword(starName) {
    const keywords = {
      '紫微': '尊贵与领导', '天机': '智慧与变动', '太阳': '奉献与博爱', '武曲': '刚毅与执行',
      '天同': '和谐与享受', '廉贞': '秩序与情感', '天府': '包容与积累', '太阴': '温柔与收藏',
      '贪狼': '欲望与才艺', '巨门': '沟通与洞察', '天相': '辅助与公正', '天梁': '庇佑与原则',
      '七杀': '肃杀与决断', '破军': '破旧与立新'
    };
    return keywords[starName] || '能量';
  }

  generateRecommendedEvents() {
    const events = [];
    if (this.prediction?.智能事件) {
      this.prediction.智能事件.forEach((e, idx) => {
        events.push({
          id: `auto_event_${idx}`,
          name: e.事件,
          type: this.mapEventType(e.类型),
          age: e.预计年龄,
          description: e.描述,
          isAuto: true,
          icon: e.icon,
          source: '命理预测'
        });
      });
    }
    return events;
  }

  mapEventType(type) {
    const typeMap = { '事业': 'career_promotion', '财富': 'investment', '感情': 'relationship', '家庭': 'family', '健康': 'health_issue' };
    return typeMap[type] || 'turning_point';
  }

  generateRecommendedRelationships() {
    const relationships = [];
    if (this.prediction?.智能关系) {
      this.prediction.智能关系.forEach((r, idx) => {
        const parts = r.关系.split(' ');
        relationships.push({
          id: `auto_rel_${idx}`,
          name: parts[1] || r.关系,
          type: this.mapRelationType(parts[1]),
          quality: r.质量,
          description: r.描述,
          advice: r.建议,
          traits: r.特征,
          isAuto: true,
          icon: parts[0],
          source: '命理预测'
        });
      });
    }
    return relationships;
  }

  mapRelationType(type) {
    const typeMap = { '另一半': 'spouse', '父母': 'parent', '子女': 'child', '贵人/导师': 'mentor', '朋友/合作者': 'friend' };
    return typeMap[type] || 'friend';
  }

  getCoreTheme() {
    const themes = [];
    const terrain = this.safeGet(this.lifeMap, '地图.地形', {});
    if (terrain.地形名称) themes.push(`${terrain.地形名称}人生`);

    const star = this.safeGet(this.lifeMap, '角色.0', {});
    if (star.名称) themes.push(`${star.名称}坐命`);

    return themes.length ? themes.join(' · ') : '探索中';
  }

  getCurrentStageTask() {
    const stage = this.prediction?.人生阶段 || {};
    return {
      阶段: stage.阶段 || '成长期',
      重点: stage.重点 || '积累经验',
      建议: stage.建议 || '多尝试，多犯错，快速迭代',
      年龄: this.age
    };
  }

  getKeyActions() {
    const actions = [];
    // Just reuse logic from generateActions but simplified for Cards
    const act = this.generateActions();

    if (act.事业方向.length) actions.push({ icon: '💼', 类别: '事业', 行动: act.事业方向[0].建议, 补充: act.事业方向[0].原因 });
    if (act.财务策略.length) actions.push({ icon: '💰', 类别: '财富', 行动: act.财务策略[0].建议, 补充: '量入为出' });
    if (act.感情经营.length) actions.push({ icon: '💕', 类别: '感情', 行动: act.感情经营[0].建议, 补充: '珍惜缘分' });

    return actions;
  }
}

export class TextEngine {
  composeInfluenceSummary(terrain, star, field, liunian) {
    const starName = star.名称 || '命主';
    const wuxing = terrain.主导五行 || '中性';
    const fieldName = field.场域名称 || '社会';

    let intro = `你拥有${wuxing}行的基调，这赋予了你${terrain.地形名称?.replace('型', '') || '独特'}的底色。`;
    let middle = `在「${starName}」这颗星的照耀下，你习惯于${star.行为模式?.[0] || '按自己的方式生活'}。`;
    let context = `身处「${fieldName}」的环境中，你时常感受到${field.描述 || '独特'}的氛围。`;

    return `${intro}${middle}${context} 命运是一场宏大的交响曲，而你是领衔的独奏者。`;
  }

  composeActionSummary(stage, xiyong) {
    const stageName = stage?.阶段 || '当前阶段';
    const element = xiyong?.[0] || '平衡';

    return `${stageName}的核心在于「${element}」。像是培育一颗植物，你需要${element === '木' ? '向上生长' : element === '火' ? '向外表达' : element === '金' ? '修剪枝叶' : element === '水' ? '向下扎根' : '厚积薄发'}。顺应五行的能量，事半功倍。`;
  }
}
