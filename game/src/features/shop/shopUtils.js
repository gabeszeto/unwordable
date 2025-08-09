// src/features/shop/shopUtils.js
import { perkRegistry } from '../perks/perkRegistry';
import { skillsRegistry } from '../skills/skillsRegistry';

// Keyzone perks we don't sell directly
const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

// Virtual shop-only entry
const virtualShopEntries = {
  KeyzoneRoulette: {
    name: '🎰 Keyzone Roulette',
    cost: 5,
    isVirtual: true,
    weight: 3,
    description: 'Grants one of the Keyzone perks randomly.',
    shop: { minStage: 1, maxStage: 20 },
  },
};

/* ----------------- helpers ----------------- */

const roman = (num) => {
  if (!num) return '';
  const pairs = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '', n = num;
  for (const [v, r] of pairs) while (n >= v) { out += r; n -= v; }
  return out;
};

// Get the next level meta for a skill given current level
// NOTE: weight now comes from the LEVEL, not the skill
export function getNextSkillLevelMeta(skillKey, currentLevel = 0) {
  const meta = skillsRegistry[skillKey];
  if (!meta) return null;

  const max = meta.maxLevel ?? (meta.levels?.length ?? 0);
  if (currentLevel >= max) return null;

  const nextIndex = currentLevel; // levels are 1-based; array is 0-based
  const levelMeta = meta.levels?.[nextIndex];
  if (!levelMeta) return null;

  return {
    key: skillKey,
    name: meta.name,
    level: levelMeta.level,
    cost: levelMeta.cost,
    description: levelMeta.description,
    weight: levelMeta.weight ?? 1, // <- per-level weight
    // stage defaults: 1..20 if not provided
    minStage: meta.shop?.minStage ?? 1,
    maxStage: meta.shop?.maxStage ?? 20,
  };
}

/* ----------------- pools ----------------- */

// Build weighted perk pool (including virtual entries)
function buildWeightedPerkPool(stage, debuffs) {
  const weighted = [];
  const hasCutShort = !!debuffs?.activeDebuffs?.includes?.('CutShort') ||
    (debuffs?.passiveDebuffs?.CutShort ?? 0) > 0;

  // Real perks (exclude keyzone direct)
  for (const [id, perk] of Object.entries(perkRegistry)) {
    if (keyzonePerkIds.includes(id)) continue;
    if (id === 'BorrowedTime' && !hasCutShort) continue;

    const minStage = perk.shop?.minStage ?? 1;
    const maxStage = perk.shop?.maxStage ?? 20;
    if (stage < minStage || stage > maxStage) continue;
    if (perk.hidden) continue;

    const weight = perk.weight ?? 1;
    for (let i = 0; i < weight; i++) {
      weighted.push({
        type: 'perk',
        id,
        name: perk.name,
        cost: perk.cost,
        description: perk.description,
        weight,
      });
    }
  }

  // Virtual entries
  for (const [id, entry] of Object.entries(virtualShopEntries)) {
    const minStage = entry.shop?.minStage ?? 1;
    const maxStage = entry.shop?.maxStage ?? 20;
    if (stage < minStage || stage > maxStage) continue;

    const weight = entry.weight ?? 1;
    for (let i = 0; i < weight; i++) {
      weighted.push({
        type: 'perk',
        id,
        name: entry.name,
        cost: entry.cost,
        description: entry.description,
        isVirtual: true,
        weight,
      });
    }
  }

  return weighted;
}

// Build weighted skill pool using player's current skill levels
function buildWeightedSkillPool(activeSkills, stage) {
  const weighted = [];

  for (const key of Object.keys(skillsRegistry)) {
    const lvl = activeSkills?.[key] ?? 0;
    const next = getNextSkillLevelMeta(key, lvl);
    if (!next) continue;

    if (stage < next.minStage || stage > next.maxStage) continue;

    // e.g., "Letter Lens II"
    const displayName = `${next.name} ${next.level > 1 ? roman(next.level) : ''}`.trim();
    const weight = next.weight ?? 1; // per-level weight
    for (let i = 0; i < weight; i++) {
      weighted.push({
        type: 'skill',
        id: key,
        name: displayName,
        cost: next.cost,
        description: next.description,
        level: next.level,
        weight,
      });
    }
  }

  return weighted;
}

export function pickWeightedKeyzone(perkIds = []) {
  // Build a weighted list from the registry
  const pool = [];
  for (const id of perkIds) {
    const perk = perkRegistry[id];
    if (!perk) continue;
    const w = Math.max(1, perk.weight ?? 1); // default 1, min 1
    for (let i = 0; i < w; i++) pool.push(id);
  }
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/* ----------------- unified picker ----------------- */

// Public API: pick from a unified pool
export function pickUniqueOffers({ count = 3, activeSkills = {}, stage = 1, debuffs = null }) {
  const perkPool = buildWeightedPerkPool(stage, debuffs);
  const skillPool = buildWeightedSkillPool(activeSkills, stage);
  const pool = [...perkPool, ...skillPool];

  if (pool.length === 0) return [];

  // Weighted pick without replacement by *id+type* uniqueness
  const selected = [];
  const seen = new Set();

  // Work on a copy
  const candidates = [...pool];

  while (selected.length < count && candidates.length > 0) {
    const totalW = candidates.reduce((s, o) => s + (o.weight || 1), 0);
    let r = Math.random() * totalW;
    let idx = 0;
    for (let j = 0; j < candidates.length; j++) {
      r -= (candidates[j].weight || 1);
      if (r <= 0) { idx = j; break; }
    }
    const choice = candidates[idx];
    const key = `${choice.type}:${choice.id}`;

    if (!seen.has(key)) {
      selected.push(choice);
      seen.add(key);
      // remove all with same id+type to avoid duplicates even with weight copies
      for (let k = candidates.length - 1; k >= 0; k--) {
        if (`${candidates[k].type}:${candidates[k].id}` === key) {
          candidates.splice(k, 1);
        }
      }
    } else {
      candidates.splice(idx, 1);
    }
  }

  return selected;
}
