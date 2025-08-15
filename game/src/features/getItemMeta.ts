// src/registry/getItemMeta.ts
import { perkRegistry } from './perks/perkRegistry';
import { skillsRegistry } from './skills/skillsRegistry';
import { debuffRegistry } from './debuffs/debuffRegistry';

export type ItemKind = 'perk' | 'skill' | 'debuff';
export type DebuffSubtype = 'active' | 'passive';

export interface BaseMeta {
  key: string;
  type: ItemKind;            // 'perk' | 'skill' | 'debuff'
  name: string;
  description?: string;
}

export interface PerkMeta extends BaseMeta {
  type: 'perk';
  cost?: number;
  weight?: number;
  component?: any;           // React.ComponentType<any> if you want stricter typing
}

export interface SkillLevel {
  level: number;
  cost: number;
  weight: number;
  description: string;
}

export interface SkillMeta extends BaseMeta {
  type: 'skill';
  id: string;
  maxLevel: number;
  levels: SkillLevel[];
  shop?: { minStage: number; maxStage: number };
}

export interface DebuffMeta extends BaseMeta {
  type: 'debuff';
  subtype: DebuffSubtype;    // <-- mapped from registry.type
  weight?: number;
  hidden?: boolean;
  requires?: string;
  upgradableTo?: string;
  stackable?: boolean;
  maxStacks?: number;
}

export type AnyItemMeta = PerkMeta | SkillMeta | DebuffMeta;

export function getItemMeta(key: string): AnyItemMeta | null {
  if (perkRegistry[key]) {
    const meta = perkRegistry[key];
    return { type: 'perk', key, ...meta } as PerkMeta;
  }

  if (skillsRegistry[key]) {
    const meta = skillsRegistry[key];
    // meta already has id/maxLevel/levels/shop/name
    return { type: 'skill', key, ...meta } as SkillMeta;
  }

  if (debuffRegistry[key]) {
    const { type: subtype, ...rest } = debuffRegistry[key]; // map 'active'|'passive' -> subtype
    return { type: 'debuff', key, subtype, ...rest } as DebuffMeta;
  }

  return null;
}
