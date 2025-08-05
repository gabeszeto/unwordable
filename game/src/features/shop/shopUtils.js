import { perkRegistry } from '../perks/perkRegistry';

const rarityWeights = {
  basic: 5,
  rare: 2,
  epic: 1,
};

// Keyzone perks that we want to hide from the shop
const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

// Virtual shop-only entry
const virtualShopEntries = {
  KeyzoneRoulette: {
    name: '🎰 Keyzone Roulette',
    cost: 5,
    isVirtual: true,
    weight: 3,
    description: 'Grants one of the Keyzone perks randomly.',
  }
};

// Weighted pool from real perkRegistry, excluding Keyzones
export function getWeightedPerkPool(registry = perkRegistry, virtualEntries = virtualShopEntries) {
  const pool = [];

  // Real perks
  for (const [id, perk] of Object.entries(registry)) {
    if (keyzonePerkIds.includes(id)) continue;
    const weight = perk.weight ?? 1;
    for (let i = 0; i < weight; i++) {
      pool.push(id);
    }
  }

  // Virtual entries
  for (const [id, entry] of Object.entries(virtualEntries)) {
    const weight = entry.weight ?? 1;
    for (let i = 0; i < weight; i++) {
      pool.push(id);
    }
  }

  return pool;
}

export function pickUniquePerks(registry = perkRegistry, count = 3) {
  let pool = getWeightedPerkPool(registry, virtualShopEntries);
  const selected = new Set();

  while (selected.size < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const selectedId = pool[index];
    selected.add(selectedId);
    pool = pool.filter(id => id !== selectedId);
  }

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
        cost: perk.cost,
        isVirtual: false,
        description: perk.description
      };
    }
  });
}
