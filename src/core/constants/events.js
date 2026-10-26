
export const EVENT_TYPES = {
  婚姻: { baseMass: 2.0, duration: 'permanent', category: '关系', polarity: 'positive', emoji: '💍' },
  子女出生: { baseMass: 1.8, duration: 'permanent', category: '关系', polarity: 'positive', emoji: '👶' },
  事业突破: { baseMass: 1.5, duration: 10, category: '成就', polarity: 'positive', emoji: '🚀' },
  贵人相助: { baseMass: 1.3, duration: 5, category: '关系', polarity: 'positive', emoji: '🤝' },
  学业成就: { baseMass: 1.2, duration: 'permanent', category: '成就', polarity: 'positive', emoji: '🎓' },
  财富积累: { baseMass: 1.4, duration: 'permanent', category: '成就', polarity: 'positive', emoji: '💰' },
  健康恢复: { baseMass: 1.0, duration: 5, category: '健康', polarity: 'positive', emoji: '💪' },
  觉醒时刻: { baseMass: 2.5, duration: 'permanent', category: '内在', polarity: 'positive', emoji: '✨' },
  离婚: { baseMass: 1.8, duration: 10, category: '关系', polarity: 'negative', emoji: '💔' },
  丧亲: { baseMass: 2.0, duration: 'permanent', category: '关系', polarity: 'negative', emoji: '🕯️' },
  事业挫折: { baseMass: 1.4, duration: 5, category: '成就', polarity: 'negative', emoji: '📉' },
  重大疾病: { baseMass: 1.6, duration: 'varies', category: '健康', polarity: 'negative', emoji: '🏥' },
  财务危机: { baseMass: 1.3, duration: 5, category: '成就', polarity: 'negative', emoji: '💸' },
  搬迁: { baseMass: 0.8, duration: 5, category: '环境', polarity: 'neutral', emoji: '🏠' },
  转行: { baseMass: 1.2, duration: 5, category: '成就', polarity: 'neutral', emoji: '🔄' },
};

/**
 * 关系类型表
 *
 * maxMass   关系的引力质量上限
 * decayStart 超过该年龄后开始衰减（null = 自关系开始年龄起衰减）
 * decayRate  年衰减率；负值代表影响力随年岁增长
 * polarity  极性；negative 的关系产生负引力
 */
export const RELATIONSHIP_TYPES = {
  父母: { maxMass: 2.0, category: '血缘', emoji: '👨‍👩‍👦', decayStart: 18, decayRate: 0.02 },
  配偶: { maxMass: 2.5, category: '核心', emoji: '💑', decayStart: null, decayRate: 0 },
  子女: { maxMass: 2.0, category: '血缘', emoji: '👶', decayStart: null, decayRate: -0.01 },
  兄弟姐妹: { maxMass: 1.2, category: '血缘', emoji: '👫', decayStart: 25, decayRate: 0.03 },
  挚友: { maxMass: 1.5, category: '情感', emoji: '🤗', decayStart: null, decayRate: 0.01 },
  贵人: { maxMass: 1.8, category: '命定', emoji: '⭐', decayStart: null, decayRate: 0.05 },
  恩师: { maxMass: 1.6, category: '传承', emoji: '👨‍🏫', decayStart: null, decayRate: 0.02 },
  仇人: { maxMass: 1.5, category: '冲突', emoji: '⚔️', decayStart: null, decayRate: 0.03, polarity: 'negative' },
};
