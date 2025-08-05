import { debuffRegistry } from './debuffRegistry';
import { pickWeightedDebuff } from './pickWeightedDebuff';
import { debuffMilestones } from './debuffConfig';

export function generateDebuffPlan() {
  const plan = {};

  const passivePool = Object.entries(debuffRegistry)
    .filter(([_, v]) => v.type === 'passive');
  const activePool = Object.entries(debuffRegistry)
    .filter(([_, v]) => v.type === 'active');

  const passiveCounts = {};
  const passiveStackLimit = 3;
  const persistentPassives = [];

  for (let round = 1; round <= 10; round++) {
    plan[round] = {
      passive: [...persistentPassives],
      active: []
    };

    // Passive debuffs: add one more if this round is a milestone
    if (debuffMilestones.passiveRounds.includes(round)) {
      const filtered = passivePool.filter(([key, v]) => {
        const count = passiveCounts[key] || 0;
        return v.stackable ? count < (v.maxStacks || passiveStackLimit) : count === 0;
      });

      const selected = pickWeightedDebuff(Object.fromEntries(filtered));
      if (selected) {
        persistentPassives.push(selected);
        passiveCounts[selected] = (passiveCounts[selected] || 0) + 1;
        plan[round].passive = [...persistentPassives];
      }
    }

    // Active debuffs: fresh ones every time
    const activeCount = debuffMilestones.activeRounds[round] || 0;
    for (let i = 0; i < activeCount; i++) {
      const selected = pickWeightedDebuff(Object.fromEntries(activePool));
      if (selected) {
        plan[round].active.push(selected);
      }
    }
  }

  return plan;
}
