import { calculateRelationshipGravity } from './gravity.js';
import { RELATIONSHIP_TYPES } from './constants/events.js';
import { AWAKENING_LEVELS } from './constants/influence.js';

/**
 * 影响立场分析（Influence Posture Analysis）
 * ==========================================================
 *
 * 命理语义：
 *   人生轨迹 = 初始速度(八字) + ∫关系引力场dt
 *   同一条关系在我的生命里同时有两个身份：
 *     · 它是"作用在我身上的力"  → incoming（我被影响）
 *     · 它是"我作用出去的力"    → outgoing（我施影响）
 *
 * 核心公式：
 *   mass        = calculateRelationshipGravity(rel, currentAge)
 *                 关系的衰减后引力质量（正负号表示极性，仇人为负）
 *   multiplier  = 觉醒层级的接收灵敏度
 *                 L1 执行层 1.5（被影响最强）… L5 超越层 0.5（被影响最弱）
 *   incoming    = mass * multiplier
 *                 别人给我的作用：觉醒越低，被牵动得越厉害
 *   outgoing    = mass * (2 - multiplier)
 *                 我施加出去的作用：觉醒越高，输出的相对强度越大
 *                 （2 - multiplier 保证 L3 = 1.0 时收发相等，为平衡点）
 *   postureGap  = outgoing - incoming = mass * (2 - 2 * multiplier)
 *                 立场差：正 = 我主导，负 = 我被牵引
 *
 * 判定阈值统一取质量的 15%（压倒性门槛）：
 *   postureGap < -0.15 * |mass| → 被牵引
 *   postureGap >  0.15 * |mass| → 主导者
 *   其余                          → 相互平衡
 */

/** 立场判定的压倒性阈值（占质量的比例） */
const POSTURE_THRESHOLD = 0.15;

/**
 * 数值规整：统一四舍五入到 2 位小数，消除浮点噪声
 * @param {number} value
 * @returns {number}
 */
function round2(value) {
  if (!Number.isFinite(value)) return 0;
  const n = Number(value.toFixed(2));
  return Object.is(n, -0) ? 0 : n;
}

/**
 * 解析觉醒层级：区间口径与应用侧 getAwakenInfo 完全一致
 * （level >= range[0] && level < range[1]，落在区间外一律按 L1 兜底）
 * @param {number} level
 * @returns {{key:string,name:string,multiplier:number,range:number[]}}
 */
function resolveAwaken(level) {
  for (const [key, info] of Object.entries(AWAKENING_LEVELS)) {
    if (level >= info.range[0] && level < info.range[1]) {
      return { key, name: info.name, multiplier: info.multiplier, range: info.range };
    }
  }
  const fallback = AWAKENING_LEVELS.L1;
  return { key: 'L1', name: fallback.name, multiplier: fallback.multiplier, range: fallback.range };
}

/**
 * 立场判定（带极性定向）
 * @param {number} orientedGap 极性定向后的立场差
 * @param {number} threshold    判定门槛
 * @returns {'被牵引'|'主导者'|'相互平衡'}
 */
function stanceLabel(orientedGap, threshold) {
  if (orientedGap < -threshold) return '被牵引';
  if (orientedGap > threshold) return '主导者';
  return '相互平衡';
}

/**
 * 总体倾向标签
 * @param {'被牵引'|'主导者'|'相互平衡'} stance
 * @returns {'易受影响'|'双向平衡'|'主导他人'}
 */
function overallLabel(stance) {
  if (stance === '被牵引') return '易受影响';
  if (stance === '主导者') return '主导他人';
  return '双向平衡';
}

/**
 * 描述某类关系的时间衰减情况（回答"是否已衰减"）
 * @param {string} typeKey 关系类型
 * @param {Array} rels 该类型下的关系明细
 * @param {number} age 当前年龄
 * @returns {string}
 */
function describeDecay(typeKey, rels, age) {
  const type = RELATIONSHIP_TYPES[typeKey];
  if (!type) return '该类型未在关系类型表中定义，质量按 0 计';

  const rate = type.decayRate ?? 0;
  if (rate === 0) return '该类型关系不随时间衰减';

  if (rate < 0) {
    return `影响力随年岁每年增强 ${(Math.abs(rate) * 100).toFixed(0)}%`;
  }

  const startAge = type.decayStart != null
    ? type.decayStart
    : (rels.length ? Math.min(...rels.map(r => r.startAge)) : 0);

  if (age > startAge) {
    const factor = Math.exp(-rate * (age - startAge));
    return `自 ${startAge} 岁起每年衰减 ${(rate * 100).toFixed(0)}%，当前已衰减至 ${(factor * 100).toFixed(0)}%`;
  }
  return `${startAge} 岁后才进入衰减期，当前尚未开始衰减`;
}

/**
 * 按类型聚合关系数据
 * @param {Array} details 关系明细
 */
function aggregateByType(details) {
  const map = new Map();
  details.forEach(d => {
    if (!map.has(d.类型)) {
      map.set(d.类型, {
        类型: d.类型,
        关系数: 0,
        incoming: 0,
        outgoing: 0,
        incoming绝对值: 0,
        outgoing绝对值: 0,
        质量绝对值: 0,
        stance: 0,
        关系: []
      });
    }
    const agg = map.get(d.类型);
    agg.关系数 += 1;
    agg.incoming += d.incoming;
    agg.outgoing += d.outgoing;
    agg.incoming绝对值 += Math.abs(d.incoming);
    agg.outgoing绝对值 += Math.abs(d.outgoing);
    agg.质量绝对值 += Math.abs(d.mass);
    agg.stance += Math.abs(d.mass) * (2 - 2 * d.multiplier);
    agg.关系.push(d);
  });
  return map;
}

/**
 * 影响立场分析主函数
 *
 * @param {Object} params
 * @param {Array}  params.relationships 关系列表 [{ type, name, quality, startAge, status }]
 * @param {number} params.currentAge    当前年龄
 * @param {number} params.awakenLevel    觉醒层级（0–6 的连续值，按区间归档）
 * @returns {Object} 立场分析报告
 */
export function analyzeInfluencePosture({ relationships = [], currentAge, awakenLevel } = {}) {
  const age = Number.isFinite(Number(currentAge)) ? Number(currentAge) : 0;
  const rawLevel = Number.isFinite(Number(awakenLevel)) ? Number(awakenLevel) : 0;
  const list = (Array.isArray(relationships) ? relationships : [])
    .filter(rel => rel && typeof rel === 'object');

  const awaken = resolveAwaken(rawLevel);
  const multiplier = awaken.multiplier;

  // ── 1. 逐条关系：质量 → 收发 → 立场差 → 立场判定 ────────────────────────
  const details = list.map(rel => {
    const relType = RELATIONSHIP_TYPES[rel.type] || null;
    const mass = calculateRelationshipGravity(rel, age);

    // 被影响（别人给我的作用）与施影响（我给出的作用）
    const incoming = mass * multiplier;
    const outgoing = mass * (2 - multiplier);
    const postureGap = outgoing - incoming;

    // 极性定向：mass < 0 是"阻力型"关系（仇人/负面关系），
    // 其收发皆为负值，若直接用 gap 的符号判断，会把"被仇人拖住"读成"我主导"。
    // 用 |mass| 表达"作用的强弱"，方向只由 multiplier 决定：
    //   正向关系 → 与 postureGap 完全同值（公式原文口径）
    //   负向关系 → 符号翻转，语义恢复为"谁的作用更强谁就是主导者"
    const absMass = Math.abs(mass);
    const orientedGap = absMass * (2 - 2 * multiplier);
    const posture = stanceLabel(orientedGap, POSTURE_THRESHOLD * absMass);

    const startAge = Number.isFinite(Number(rel.startAge)) ? Number(rel.startAge) : 0;
    const quality = Number.isFinite(Number(rel.quality)) ? Number(rel.quality) : 0.8;
    const status = rel.status ?? 'active';

    return {
      名称: rel.name || rel.type || '未命名关系',
      类型: rel.type || '未标注类型',
      mass: round2(mass),
      incoming: round2(incoming),
      outgoing: round2(outgoing),
      postureGap: round2(postureGap),
      posture,
      quality: round2(quality),
      startAge: round2(startAge),
      status,
      极性: relType
        ? ((relType.polarity === 'negative' || rel.type === '仇人') ? '负向' : '正向')
        : '未知',
      // 边界标记：关系开始年龄晚于当前年龄 → 尚未进入发生期
      生效状态: age < startAge ? '未开始' : '生效中',
      multiplier
    };
  }).sort((a, b) => Math.abs(b.mass) - Math.abs(a.mass));

  // ── 2. 按类型聚合 ──────────────────────────────────────────────────────
  const typeMap = aggregateByType(details);
  const totalAbsMass = details.reduce((sum, d) => sum + Math.abs(d.mass), 0);
  const totalIncomingAbs = details.reduce((sum, d) => sum + Math.abs(d.incoming), 0);
  const totalOutgoingAbs = details.reduce((sum, d) => sum + Math.abs(d.outgoing), 0);

  // 净立场差（原文口径：所有关系 postureGap 之和）
  const netGap = details.reduce((sum, d) => sum + d.postureGap, 0);
  // 净主导差（极性定向口径）：Σ|mass|(2-2*multiplier)，用于判定总体倾向
  const netOriented = details.reduce((sum, d) => sum + Math.abs(d.mass) * (2 - 2 * multiplier), 0);

  const overallStance = stanceLabel(netOriented, POSTURE_THRESHOLD * totalAbsMass);
  const 立场 = overallLabel(overallStance);

  // 类型汇总
  const 类型汇总 = {};
  typeMap.forEach(agg => {
    const typeStance = stanceLabel(agg.stance, POSTURE_THRESHOLD * agg.质量绝对值);
    类型汇总[agg.类型] = {
      incoming: round2(agg.incoming),
      outgoing: round2(agg.outgoing),
      incoming绝对值: round2(agg.incoming绝对值),
      outgoing绝对值: round2(agg.outgoing绝对值),
      关系数: agg.关系数,
      立场: typeStance,
      说明: describeDecay(agg.类型, agg.关系, age)
    };
  });

  // ── 3. 问题一：什么样的人对我影响大（按类型汇总 incoming 绝对值，降序）────
  const 对我影响最大 = [...typeMap.values()]
    .filter(agg => agg.incoming绝对值 > 0)
    .sort((a, b) => b.incoming绝对值 - a.incoming绝对值)
    .map(agg => {
      const contributors = [...agg.关系].sort((x, y) => Math.abs(y.mass) - Math.abs(x.mass));
      const ended = contributors.filter(r => r.status === 'ended').length;
      const notStarted = contributors.filter(r => r.生效状态 === '未开始').length;
      const noteParts = [
        `由 ${contributors.map(r => `${r.名称}（质量 ${r.mass}）`).join('、')} 贡献`,
        `当前 ${age} 岁`,
        describeDecay(agg.类型, contributors, age)
      ];
      if (ended) noteParts.push(`含 ${ended} 段已结束关系（质量按 30% 计）`);
      if (notStarted) noteParts.push(`含 ${notStarted} 段尚未开始的关系`);
      return {
        类型: agg.类型,
        名称: contributors[0].名称,
        影响: round2(agg.incoming绝对值),
        占比: round2(totalIncomingAbs > 0 ? (agg.incoming绝对值 / totalIncomingAbs) * 100 : 0),
        关系数: agg.关系数,
        说明: `${noteParts.join('；')}。`
      };
    });

  // ── 4. 问题二：我对什么样的人影响大（按类型汇总 outgoing，降序）─────────
  const 我影响最大 = [...typeMap.values()]
    .filter(agg => agg.outgoing绝对值 > 0)
    .sort((a, b) => b.outgoing绝对值 - a.outgoing绝对值)
    .map(agg => {
      const contributors = [...agg.关系].sort((x, y) => Math.abs(y.outgoing) - Math.abs(y.outgoing));
      const noteParts = [
        `由 ${contributors.map(r => `${r.名称}（质量 ${r.mass}）`).join('、')} 贡献`,
        `当前 ${age} 岁`,
        describeDecay(agg.类型, contributors, age)
      ];
      if (agg.outgoing < 0) noteParts.push('该类关系对我的作用为负向（阻力型），负值代表我在消耗这段关系');
      return {
        类型: agg.类型,
        名称: contributors[0].名称,
        影响: round2(agg.outgoing),
        绝对影响: round2(agg.outgoing绝对值),
        占比: round2(totalOutgoingAbs > 0 ? (agg.outgoing绝对值 / totalOutgoingAbs) * 100 : 0),
        关系数: agg.关系数,
        说明: `${noteParts.join('；')}。`
      };
    });

  // ── 5. 问题三：觉醒度相关结论（L1–L5 在当前关系集下的净立场差）─────────
  const 觉醒对照 = Object.entries(AWAKENING_LEVELS).map(([key, info]) => {
    const mult = info.multiplier;
    const levelNet = details.reduce((sum, d) => sum + d.mass * (2 - 2 * mult), 0);
    const levelOriented = details.reduce((sum, d) => sum + Math.abs(d.mass) * (2 - 2 * mult), 0);
    const levelStance = stanceLabel(levelOriented, POSTURE_THRESHOLD * totalAbsMass);
    return {
      key,
      name: info.name,
      multiplier: mult,
      净立场差: round2(levelNet),
      净主导差: round2(levelOriented),
      倾向: overallLabel(levelStance)
    };
  });

  const currentRow = 觉醒对照.find(row => row.key === awaken.key);
  const levelKeys = 觉醒对照.map(row => row.key);
  const currentIdx = levelKeys.indexOf(awaken.key);
  const nextRow = currentIdx >= 0 && currentIdx < 觉醒对照.length - 1 ? 觉醒对照[currentIdx + 1] : null;
  const prevRow = currentIdx > 0 ? 觉醒对照[currentIdx - 1] : null;

  // 最该调整的关系类型：立场偏离最大的一类
  let keyType = null;
  typeMap.forEach(agg => {
    if (!keyType || Math.abs(agg.stance) > Math.abs(keyType.stance)) keyType = agg;
  });

  // ── 6. 结论与建议 ──────────────────────────────────────────────────────
  const 结论 = buildConclusion({
    empty: details.length === 0,
    age,
    awaken,
    立场,
    overallStance,
    netGap,
    netOriented,
    对我影响最大,
    我影响最大,
    keyType,
    currentRow,
    nextRow,
    prevRow,
    unknownTypeCount: details.filter(d => d.极性 === '未知').length
  });

  const 建议 = buildSuggestions({
    empty: details.length === 0,
    立场,
    overallStance,
    netGap,
    netOriented,
    对我影响最大,
    我影响最大,
    keyType,
    currentRow,
    nextRow,
    unknownTypeCount: details.filter(d => d.极性 === '未知').length,
    age
  });

  return {
    觉醒层级: {
      level: round2(rawLevel),
      key: awaken.key,
      name: awaken.name,
      multiplier
    },
    立场,
    净立场差: round2(netGap),
    净主导差: round2(netOriented),
    关系明细: details.map(d => ({
      名称: d.名称,
      类型: d.类型,
      mass: d.mass,
      incoming: d.incoming,
      outgoing: d.outgoing,
      postureGap: d.postureGap,
      posture: d.posture,
      quality: d.quality,
      startAge: d.startAge,
      status: d.status,
      极性: d.极性,
      生效状态: d.生效状态
    })),
    对我影响最大,
    我影响最大,
    类型汇总,
    觉醒对照,
    结论,
    建议
  };
}

/**
 * 生成中文结论（具体、不说空话）
 */
function buildConclusion(ctx) {
  const {
    empty, age, awaken, 立场, overallStance, netGap, netOriented,
    对我影响最大, 我影响最大, keyType, currentRow, nextRow, unknownTypeCount
  } = ctx;

  if (empty) {
    return `当前没有记录任何关系，${age} 岁的你还没有可分析的引力场，因此谈"谁在影响你、你影响谁"都无从谈起。`
      + `请先在「关系」里录入父母、配偶等关键关系（标注开始年龄与亲疏程度），`
      + `再用 L1–L5 的对照看自己在不同觉醒层级下的立场变化。`;
  }

  const inTop = 对我影响最大[0];
  const outTop = 我影响最大[0];
  const typeNote = keyType ? `「${keyType.类型}」类` : '各类';
  const stanceWord = overallStance === '被牵引'
    ? '对方在牵引你'
    : (overallStance === '主导者' ? '你在主导对方' : '双向互动、势均力敌');

  let text = `在 L${awaken.key.slice(1)} ${awaken.name}（影响系数 ${awaken.multiplier}）下，${age} 岁的你整体立场为「${立场}」，净立场差 ${round2(netGap)}。`;

  if (inTop) {
    text += `对你影响最大的是「${inTop.类型}」类（占 ${inTop.占比}%${inTop.关系数 > 1 ? `、共 ${inTop.关系数} 段` : ''}），`;
    text += inTop.关系数 > 1 ? '主要由 ' + inTop.名称 + ' 等人构成；' : `主要就是 ${inTop.名称}；`;
  }
  if (outTop) {
    text += `而你施加影响最大的是「${outTop.类型}」类（${outTop.影响}）——你与这一类人之间是${stanceWord}。`;
  } else {
    text += '目前还没有你对他人形成明显作用力的关系。';
  }

  if (nextRow && currentRow) {
    text += `若觉醒层级从 ${currentRow.key} 升到 ${nextRow.key}，整体立场差会从 ${currentRow.净立场差} 变为 ${nextRow.净立场差}，`;
    text += currentRow.倾向 === nextRow.倾向
      ? `倾向仍是「${nextRow.倾向}」，只是量级在变；`
      : `倾向由「${currentRow.倾向}」转为「${nextRow.倾向}」；`;
  } else if (!nextRow) {
    text += `你已在最高层级 ${currentRow ? currentRow.key : awaken.key}，立场差已达 ${currentRow ? currentRow.净立场差 : round2(netGap)}，再往上不是加码影响，而是选对关系深耕；`;
  }
  text += `最该调整的是${typeNote}关系。`;

  if (unknownTypeCount > 0) {
    text += `（另有 ${unknownTypeCount} 段关系的类型未在关系类型表中定义，质量按 0 计，请检查类型填写。）`;
  }
  return text;
}

/**
 * 生成 2–4 条具体建议
 */
function buildSuggestions(ctx) {
  const {
    empty, 立场, overallStance, netGap, 对我影响最大, 我影响最大,
    keyType, currentRow, nextRow, unknownTypeCount, age
  } = ctx;

  if (empty) {
    return [
      '先录入 3–5 段关键关系（父母、配偶、子女或贵人），至少填上开始年龄与亲疏程度（quality），否则引力质量只能按默认值估算。',
      '录入后重跑立场分析：同一批关系在 L1–L5 下的净立场差对比，就是你的"可改命空间"量化结果。'
    ];
  }

  const tips = [];

  // 建议 1：最该调整的关系类型（具体到类）
  if (keyType) {
    const typeName = keyType.类型;
    const base = TYPE_ADVICE[typeName] || '把这段关系里的期待写下来，区分「我认同的」和「我只是承接的」，先分清立场再谈相处。';
    // 按该类型当前的实际立场起头，避免建议与计算结果自相矛盾
    const typeStance = stanceLabel(keyType.stance, POSTURE_THRESHOLD * keyType.质量绝对值);
    const lead = typeStance === '被牵引'
      ? `${typeName}类关系目前是牵引你最多的地方：`
      : (typeStance === '主导者'
        ? `${typeName}类关系上你在主导：`
        : `${typeName}类关系目前收发平衡：`);
    const share = 对我影响最大.find(t => t.类型 === typeName);
    const extra = share ? `这类关系占你被影响总量的 ${share.占比}%。` : '';
    tips.push(`优先处理「${typeName}」类关系：${lead}${base}${extra}`);
  }

  // 建议 2：觉醒层级的实际收益
  if (nextRow && currentRow) {
    tips.push(
      `把觉醒层级从 ${currentRow.key} ${currentRow.name} 提到 ${nextRow.key} ${nextRow.name}，`
      + `净立场差会从 ${currentRow.净立场差} 变到 ${nextRow.净立场差}，`
      + (currentRow.倾向 === nextRow.倾向
        ? `你的角色维持「${nextRow.倾向}」，只是强度在变。`
        : `你的角色由「${currentRow.倾向}」转为「${nextRow.倾向}」。`)
      + `这项提升要落在具体关系上才有效——先在「${keyType ? keyType.类型 : '主导关系'}」这一类里练。`
    );
  } else {
    tips.push(
      `你已处于最高觉醒档（${currentRow ? currentRow.key : 'L5'}），立场差 ${currentRow ? currentRow.净立场差 : round2(netGap)} 已接近上限；`
      + '此时继续加码影响意义不大，把精力集中到 1–2 段真正重要的关系上。'
    );
  }

  // 建议 3：整体立场对应的行动方向
  if (overallStance === '被牵引') {
    tips.push(
      `整体上你被关系牵动得比施加的多（净立场差 ${round2(netGap)}）：`
      + '每次重要决定先写一句"这是我选的，还是我在顺从"，再给亲友一个回应期限，避免关系默认替你拍板。'
    );
  } else if (overallStance === '主导者') {
    tips.push(
      `你施加的作用已超过承受（净立场差 ${round2(netGap)}）：`
      + '主导型关系容易变成负担，给关键关系留出独立空间，并把"我说了算"改成"我们各负责什么"，否则高输出会反噬为孤独。'
    );
  } else {
    tips.push(
      `当前收发基本平衡（L3 为平衡点，净立场差 ${round2(netGap)}）：`
      + '不必大改关系结构，把精力放在质量最高的 1–2 段关系上，把平衡变成高质量。'
    );
  }

  // 建议 4：补充操作性的一条
  const outTop = 我影响最大[0];
  if (unknownTypeCount > 0) {
    // 数据质量问题优先于一般建议，避免被 slice 截断
    tips.splice(2, 0, `有 ${unknownTypeCount} 段关系的类型不在关系类型表中（质量按 0 计），请把它们改成「父母/配偶/子女/兄弟姐妹/挚友/贵人/恩师/仇人」之一，否则这部分影响不会进入统计。`);
  }
  if (outTop) {
    tips.push(
      `你在「${outTop.类型}」类关系上输出最强（${outTop.影响}）：`
      + (outTop.影响 < 0
        ? '这段关系目前是消耗型的，降低投入频次或把它转成一次性的了断，比硬撑更省力。'
        : '这类关系值得投入，但注意别把"我在带对方"当成理所当然，给对方留出独立成长的余地。')
    );
  } else if (对我影响最大[0]) {
    tips.push(`你最该留意的是「${对我影响最大[0].类型}」类关系（影响 ${对我影响最大[0].影响}）：定期问一句"这段关系此刻还成立吗"，别让高影响力长期挂着。`);
  }

  if (unknownTypeCount > 0 && !tips.some(t => t.includes('不在关系类型表中'))) {
    tips.push(`有 ${unknownTypeCount} 段关系的类型不在关系类型表中（质量按 0 计），请把它们改成「父母/配偶/子女/兄弟姐妹/挚友/贵人/恩师/仇人」之一，否则这部分影响不会进入统计。`);
  }

  return tips.slice(0, 4);
}

/**
 * 各关系类型的具体调整建议
 * （方向中性，具体的主语由计算出的立场决定，避免建议与数据自相矛盾）
 */
const TYPE_ADVICE = {
  父母: '把"他们要我怎样"翻译成"我选择什么"，重大方向先自定再征求意见，别让这段关系默认替你拍板。',
  配偶: '沟通从"你总是/你从不"换成具体请求与边界，减少被动让步，同时保留自己的独处与主张。',
  子女: '别用成年人的结论替孩子定方向，给他们试错的空间，也别把自己的未竟之事压到他们身上。',
  兄弟姐妹: '把童年比较从关系里剥出来，各写一份各自负责的人生清单，减少重复的家庭叙事。',
  挚友: '把其中让你内耗的那部分挑出来谈一次，说清边界；可托付的部分保留，其余降频。',
  贵人: '趁影响力还在，把它升级成对等的合作或师徒，而不是长期单向受助。',
  恩师: '带着自己的判断去提问，继承之外也要长出你自己的解法，别停在复制。',
  仇人: '减少接触频次，或把这段关系转成一次性的复盘结论，别让对方继续定义你的情绪。'
};
