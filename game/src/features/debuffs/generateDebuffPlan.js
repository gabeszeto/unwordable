import { debuffRegistry } from './debuffRegistry';
import { pickWeightedDebuff } from './pickWeightedDebuff';
import { debuffMilestones } from './debuffConfig';

export function generateDebuffPlan() {
  const plan = {};

  const passiveCounts = {};
  const passiveStackLimit = 3;
  const persistentPassives = [];

  // Build passive pool with conditional filters
  const getFilteredPassivePool = () =>
    Object.entries(debuffRegistry)
      .filter(([key, v]) => {
        if (v.type !== 'passive') return false;

        const count = passiveCounts[key] || 0;

        // Don't include hidden unless it has a valid 'requires' met
        if (v.hidden && !v.requires) return false;

        // If it has a requirement (like an upgrade), skip if not unlocked yet
        if (v.requires && !persistentPassives.includes(v.requires)) return false;

        // Stackable logic
        return v.stackable
          ? count < (v.maxStacks || passiveStackLimit)
          : count === 0;
      });

  const activePool = Object.entries(debuffRegistry)
    .filter(([_, v]) => v.type === 'active');

  for (let round = 1; round <= 10; round++) {
    plan[round] = {
      passive: [...persistentPassives],
      active: []
    };

    // Passive debuff selection
    if (debuffMilestones.passiveRounds.includes(round)) {
      const filtered = getFilteredPassivePool();
      const selected = pickWeightedDebuff(Object.fromEntries(filtered));

      if (selected) {
        const def = debuffRegistry[selected];
        const currentCount = passiveCounts[selected] || 0;

        const upgrade = def.upgradableTo;

        if (upgrade && currentCount >= 1) {
          // Upgrade: replace existing with upgraded version
          const index = persistentPassives.indexOf(selected);
          if (index !== -1) {
            persistentPassives.splice(index, 1, upgrade);
          } else {
            persistentPassives.push(upgrade);
          }
          passiveCounts[upgrade] = (passiveCounts[upgrade] || 0) + 1;
        } else {
          // Normal stack or first-time
          persistentPassives.push(selected);
          passiveCounts[selected] = currentCount + 1;
        }

        plan[round].passive = [...persistentPassives];
      }
    }

    // Active debuffs: fresh each time
    const activeCount = debuffMilestones.activeRounds[round] || 0;
    for (let i = 0; i < activeCount; i++) {
      const activePoolMap = Object.fromEntries(activePool);
      const selected = pickWeightedDebuff(activePoolMap);

      if (selected) {
        plan[round].active.push(selected);

        // ❌ Remove selected active debuff from the pool permanently
        const indexToRemove = activePool.findIndex(([key]) => key === selected);
        if (indexToRemove !== -1) activePool.splice(indexToRemove, 1);
      }
    }
  }

  return plan;
}


export function generateDebugDebuffPlan({
  forcePassive = {},
  forceActive = [],
} = {}) {
  const plan = generateDebuffPlan();

  for (let round = 1; round <= 3; round++) {
    const entry = plan[round];

    // NEW: Add passive debuffs with stacking
    Object.entries(forcePassive).forEach(([debuff, count]) => {
      for (let i = 0; i < count; i++) {
        entry.passive.push(debuff);
      }
    });

    // Force up to 2 unique active debuffs
    forceActive.slice(0, 2).forEach((debuff) => {
      if (!entry.active.includes(debuff)) {
        entry.active.push(debuff);
      }
    });
  }

  return plan;
}
