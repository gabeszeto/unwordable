// src/registry/getItemMeta.ts
import { perkRegistry } from './perks/perkRegistry';
import { skillsRegistry } from './skills/skillsRegistry';
import { debuffRegistry } from './debuffs/debuffRegistry';

export function getItemMeta(key: string) {
  if (perkRegistry[key])   return { type: 'perk',   key, ...perkRegistry[key] };
  if (skillsRegistry[key])  return { type: 'skill',  key, ...skillsRegistry[key] };
  if (debuffRegistry[key]) return { type: 'debuff', key, ...debuffRegistry[key] };
  return null;
}
