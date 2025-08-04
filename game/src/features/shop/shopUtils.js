import { perkRegistry } from '../perks/perkRegistry';

const rarityWeights = {
  basic: 5,
  rare: 2,
  epic: 1,
};

// Optional: central cost mapping
export function getPerkCost(rarity) {
  switch (rarity) {
    case 'basic': return 3;
    case 'rare': return 6;
    case 'epic': return 11;
    default: return 3;
  }
}

// Keyzone perks that we want to hide from the shop
const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

// Virtual shop-only entry
const virtualShopEntries = {
  KeyzoneRoulette: {
    name: '🎰 Keyzone Roulette',
    cost: 5,
    isVirtual: true,
    description: 'Grants one of the Keyzone perks randomly.',
  }
};

// Weighted pool from real perkRegistry, excluding Keyzones
export function getWeightedPerkPool(registry = perkRegistry) {
  const pool = [];
  for (const [id, perk] of Object.entries(registry)) {
    if (keyzonePerkIds.includes(id)) continue;

    const weight = rarityWeights[perk.rarity] || 1;
    for (let i = 0; i < weight; i++) {
      pool.push(id);
    }
  }
  return pool;
}

// Final list of shop options (3 real, 1 roulette)
export function pickUniquePerks(registry = perkRegistry, count = 3) {
  let pool = getWeightedPerkPool(registry);
  const selected = new Set();

  while (selected.size < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const selectedId = pool[index];
    selected.add(selectedId);
    pool = pool.filter(id => id !== selectedId);
  }

  // Add KeyzoneRoulette manually
  selected.add('KeyzoneRoulette');

  return Array.from(selected).map(id => {
    if (virtualShopEntries[id]) {
      const entry = virtualShopEntries[id];
      return {
        id,
        name: entry.name,
        cost: entry.cost,
        isVirtual: true,
        description: entry.description,
      };
    } else {
      const perk = registry[id];
      return {
        id,
        name: perk.name,
        cost: getPerkCost(perk.rarity),
        isVirtual: false,
      };
    }
  });
}
