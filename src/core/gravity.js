import { EVENT_TYPES, RELATIONSHIP_TYPES } from './constants/events.js';
import { LIFE_INFLUENCE_SYSTEM } from './constants/influence.js';
import { LifeInfluenceAnalyzer } from './influence.js';

export function calculateEventGravity(event, currentAge) {
  const yearsAgo = currentAge - event.age;
  if (yearsAgo < 0) return 0;

  const eventType = EVENT_TYPES[event.type];
  if (!eventType) return 0;

  let mass = eventType.baseMass * (event.intensity || 1);

  if (eventType.duration === 'permanent') {
    mass *= Math.exp(-0.01 * yearsAgo);
  } else if (typeof eventType.duration === 'number') {
    if (yearsAgo > eventType.duration) {
      mass *= Math.exp(-0.1 * (yearsAgo - eventType.duration));
    }
  }

  return eventType.polarity === 'negative' ? -mass : mass;
}

/**
 * 关系引力：质量随时间衰减
 *
 * 衰减模型：
 *   · 指定 decayStart 时，超过该年龄按 decayRate 衰减
 *   · 未指定时，自关系开始年龄起按 decayRate 衰减
 *   · decayRate 为负 → 影响力随年岁增长（子女关系）
 *   · 关系状态：ended ×0.3、distant ×0.5
 */
export function calculateRelationshipGravity(rel, currentAge) {
  const relType = RELATIONSHIP_TYPES[rel.type];
  if (!relType) return 0;

  let mass = relType.maxMass * (rel.quality ?? 0.8);

  const startAge = rel.startAge ?? 0;
  const yearsKnown = Math.max(0, currentAge - startAge);
  const decayRate = relType.decayRate ?? 0;

  if (decayRate !== 0) {
    if (relType.decayStart != null && currentAge > relType.decayStart) {
      mass *= Math.exp(-decayRate * (currentAge - relType.decayStart));
    } else {
      mass *= Math.exp(-decayRate * yearsKnown);
    }
  }

  if (rel.status === 'ended') mass *= 0.3;
  else if (rel.status === 'distant') mass *= 0.5;

  return (relType.polarity === 'negative' || rel.type === '仇人') ? -mass : mass;
}

export function calculateGravityField(events, relationships, currentAge) {
  let positive = 0, negative = 0;
  const details = [];

  events.forEach(event => {
    const gravity = calculateEventGravity(event, currentAge);
    if (gravity > 0) positive += gravity;
    else negative += Math.abs(gravity);
    details.push({ type: 'event', name: event.name || event.type, gravity: gravity.toFixed(2), age: event.age });
  });

  relationships.forEach(rel => {
    const gravity = calculateRelationshipGravity(rel, currentAge);
    if (gravity > 0) positive += gravity;
    else negative += Math.abs(gravity);
    details.push({ type: 'relationship', name: rel.name || rel.type, gravity: gravity.toFixed(2) });
  });

  return {
    positive: positive.toFixed(2),
    negative: negative.toFixed(2),
    net: (positive - negative).toFixed(2),
    details: details.sort((a, b) => Math.abs(b.gravity) - Math.abs(a.gravity))
  };
}

export function calculateTrajectory(birthYear, awakenLevel, events, relationships, influence) {
  const currentYear = new Date().getFullYear();
  const trajectory = [];

  for (let age = 0; age <= 100; age += 5) {
    const year = birthYear + age;
    if (year > currentYear + 30) break;

    let baseScore = 50 + Math.sin(age / 10) * 10;

    // Use passed influence analyzer if available, otherwise simplified
    let relationBonus = 0;
    if (influence) { // If using new analyzer, we'd need to re-calc for age. 
      // For now, let's keep the trajectory simple or refactor later.
      // Actually, the simple trajectory used calculatePillarInfluence(age).
      // We should redefine calculatePillarInfluence to use the NEW system OR adapt trajectory.

      // ADAPTATION: Create a temporary analyzer for this age point
      // But we don't have pillars in this scope easily.
      // Let's keep the OLD calculatePillarInfluence for trajectory approx OR refactor.

      // BETTER: Rewrite calculatePillarInfluence to use the new LifeInfluenceAnalyzer logic
      // But LifeInfluenceAnalyzer needs 'pillars' and 'dayMaster'.
      // Trajectory needs to be updated in the MAIN component where we have pillars.
    }

    // Quick fix: Insert a simplified calculatePillarInfluence for trajectory usage ONLY,
    // OR update trajectory calculation in the main component.
    // I will include a self-contained calculatePillarInfluence here for compatibility.
    // Wait, I am replacing the old calculatePillarInfluence.

    // I will add a helper to simulate the old influence calc for trajectory using the new system constants
    const nodeKeys = Object.keys(LIFE_INFLUENCE_SYSTEM.relationNodes);
    let totalInf = 0;
    nodeKeys.forEach(key => {
      const node = LIFE_INFLUENCE_SYSTEM.relationNodes[key];
      const [start, end] = node.peakInfluence;
      const mid = (start + end) / 2;
      let inf = 0;
      if (age >= start && age <= end) {
        const sigma = (end - start) / 4;
        inf = node.massWeight * (0.6 + 0.4 * Math.exp(-Math.pow(age - mid, 2) / (2 * sigma * sigma)));
      } else if (age < start) {
        inf = node.massWeight * (0.3 + 0.3 * (age / start));
      } else {
        inf = node.massWeight * Math.max(0.2, 0.8 * Math.exp(-0.02 * (age - end)));
      }
      totalInf += inf;
    });
    relationBonus = (totalInf - 4) * 5; // Approx

    const gravityField = calculateGravityField(events, relationships, age);
    const eventBonus = parseFloat(gravityField.net) * 5;

    const awakenBonus = (awakenLevel - 2) * 8;

    const totalScore = Math.max(20, Math.min(95, baseScore + relationBonus + eventBonus + awakenBonus));

    trajectory.push({
      age, year,
      baseScore: baseScore.toFixed(1),
      relationBonus: relationBonus.toFixed(1),
      eventBonus: eventBonus.toFixed(1),
      awakenBonus: awakenBonus.toFixed(1),
      totalScore: totalScore.toFixed(1),
      isFuture: year > currentYear
    });
  }

  return trajectory;
}
