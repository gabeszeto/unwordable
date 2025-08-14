import { debuffRegistry } from './debuffRegistry';
import { pickWeightedDebuff } from './pickWeightedDebuff';

// Milestones per your spec
export const debuffMilestones = {
  passiveRounds: [1, 4, 7, 10],           // add one passive before these rounds
  activeRounds: { 3: 1, 6: 1, 9: 1, 10: 2 } // add this many actives on these rounds
};

export function generateDebuffPlan() {
  const plan = {};

  // persistent passives + counts across the whole run
  const passiveCounts = {};
  const persistentPassives = [];

  const passiveStackLimit = 3; // global default if a passive doesn't specify maxStacks

  const canAddPassive = (key) => {
    const def = debuffRegistry[key];
    if (!def || def.type !== 'passive') return false;

    // Hidden needs 'requires' already present in persistentPassives
    if (def.hidden && !def.requires) return false;
    if (def.requires && !persistentPassives.includes(def.requires)) return false;

    const count = passiveCounts[key] || 0;
    return def.stackable
      ? count < (def.maxStacks || passiveStackLimit)
      : count === 0;
  };

  const getFilteredPassivePool = () =>
    Object.entries(debuffRegistry).filter(([key, v]) => v.type === 'passive' && canAddPassive(key));

  // We’ll mutate this so actives don’t repeat across rounds
  const activePool = Object.entries(debuffRegistry).filter(([_, v]) => v.type === 'active');

  // Helpers for final-round mutual exclusion
  const MUTUAL_EXCLUSION = {
    Grellow: 'Yellowless',
    Yellowless: 'Grellow',
  };

  // 🔹 figure out “first” and “second” passive rounds from your milestones
  const passiveRoundsSorted = [...debuffMilestones.passiveRounds].sort((a, b) => a - b);
  const FIRST_PASSIVE_ROUND  = passiveRoundsSorted[0];        // usually 1
  const SECOND_PASSIVE_ROUND = passiveRoundsSorted[1] ?? null; // e.g. 4

  // 🔹 how much to bias CutShort on the second passive (tweak to taste)
  const CUTSHORT_SECOND_PASSIVE_PROB = 0.45; // 45% chance

  for (let round = 1; round <= 10; round++) {
    plan[round] = {
      passive: [...persistentPassives], // snapshot at the start of the round
      active: [],
    };

    // ----- PASSIVE SELECTION (before this round) -----
    if (debuffMilestones.passiveRounds.includes(round)) {
      let selected;

      // Round 10: prefer "CutShort" if we can still add a stack (existing rule)
      if (round === 10 && canAddPassive('CutShort')) {
        selected = 'CutShort';
      }
      // First passive may NOT be CutShort
      else if (round === FIRST_PASSIVE_ROUND) {
        const filtered = getFilteredPassivePool()
          .filter(([key]) => key !== 'CutShort');             // exclude CutShort
        if (filtered.length) {
          selected = pickWeightedDebuff(Object.fromEntries(filtered));
        } else {
          // no valid non-CutShort options → skip adding this round
          selected = null;
        }
      }
      // Second passive: bias toward CutShort
      else if (SECOND_PASSIVE_ROUND && round === SECOND_PASSIVE_ROUND) {
        if (canAddPassive('CutShort') && Math.random() < CUTSHORT_SECOND_PASSIVE_PROB) {
          selected = 'CutShort';
        } else {
          const filtered = getFilteredPassivePool();
          selected = pickWeightedDebuff(Object.fromEntries(filtered));
        }
      }
      // Normal selection
      else {
        const filtered = getFilteredPassivePool();
        selected = pickWeightedDebuff(Object.fromEntries(filtered));
      }

      if (selected) {
        const def = debuffRegistry[selected];
        const currentCount = passiveCounts[selected] || 0;

        // Handle upgradable passives (if you use this pattern)
        const upgrade = def.upgradableTo;
        if (upgrade && currentCount >= 1) {
          // replace existing with upgraded version
          const idx = persistentPassives.indexOf(selected);
          if (idx !== -1) {
            persistentPassives.splice(idx, 1, upgrade);
          } else {
            persistentPassives.push(upgrade);
          }
          passiveCounts[upgrade] = (passiveCounts[upgrade] || 0) + 1;
        } else {
          persistentPassives.push(selected);
          passiveCounts[selected] = currentCount + 1;
        }

        // reflect newly added passive in this round's plan
        plan[round].passive = [...persistentPassives];
      }
    }

    // ----- ACTIVE SELECTION (for this round only) -----
    const activeCount = debuffMilestones.activeRounds[round] || 0;
    if (activeCount > 0) {
      const poolMap = () => Object.fromEntries(activePool);

      for (let i = 0; i < activeCount; i++) {
        let selected = pickWeightedDebuff(poolMap());

        // Final round: enforce Grellow/Yellowless mutual exclusion
        if (round === 10 && selected) {
          const already = plan[round].active[0]; // only matters on second pick
          if (already && MUTUAL_EXCLUSION[already] === selected) {
            const filteredActivePool = activePool.filter(([key]) => key !== MUTUAL_EXCLUSION[already]);
            const filteredMap = Object.fromEntries(filteredActivePool);
            selected = pickWeightedDebuff(filteredMap);
          }
        }

        if (selected) {
          plan[round].active.push(selected);
          const idx = activePool.findIndex(([key]) => key === selected);
          if (idx !== -1) activePool.splice(idx, 1); // avoid repeats later
        }
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
