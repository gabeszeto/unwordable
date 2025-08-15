// ItemDescriptionScreen.jsx
import React, { useState, useMemo } from 'react';
// adjust this import to your path (you showed: src/registry/getItemMeta.ts)
import { getItemMeta } from '../../getItemMeta';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../../perks/usePerkActions';
import './popupScreenStyles.css';

import { X } from 'lucide-react'

export default function ItemDescriptionScreen({
  itemKey,
  runtime,  // e.g. { level, stacks, subtypeOverride } (from chip click)
  onClose,
}) {
  const meta = getItemMeta(itemKey);
  if (!meta) return null;

  const { type, name } = meta;
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();

  // ---- quantities / gating (perks only)
  const qty = type === 'perk' ? (perks?.[itemKey] || 0) : null;
  const [err, setErr] = useState(null);
  const canUse = useMemo(() => type === 'perk' && (qty ?? 0) > 0, [type, qty]);

  // ---- header badge
  const debuffSubtype = type === 'debuff'
    ? (runtime?.subtypeOverride || meta.subtype) // 'active' | 'passive'
    : null;

  const headerBadge =
    type === 'perk' ? 'Consumable'
      : type === 'skill' ? 'Skill'
        : debuffSubtype === 'passive' ? 'Passive Debuff'
          : 'Boss Debuff';

  // Perk: use meta.description directly
  // Debuff: use meta.description directly
  // Skill: prefer the description for the current level if provided via runtime.level
  let primaryDesc = meta.description || '';
  let auxRows = []; // extra metadata rows to show as <li> items

  if (type === 'skill') {
    const level = runtime?.level ?? 1;
    const levelMeta = Array.isArray(meta.levels)
      ? meta.levels.find((l) => l.level === level)
      : null;

    // If level-specific description exists, prefer it
    if (levelMeta?.description) primaryDesc = levelMeta.description;

    // UI rows for skills
    auxRows.push(`Level: ${level}`);
    // if (meta.maxLevel != null) auxRows.push(`Max level: ${meta.maxLevel}`);
    // if (levelMeta?.cost != null) auxRows.push(`Cost (this level): ${levelMeta.cost}`);
  }

  if (type === 'debuff') {
    // if (debuffSubtype) auxRows.push(`Subtype: ${debuffSubtype === 'passive' ? 'Passive' : 'Active'}`);
    if (meta.stackable != null) auxRows.push(`Stackable: ${meta.stackable ? 'Yes' : 'No'}`);
    if (meta.maxStacks != null) auxRows.push(`Max stacks: ${meta.maxStacks}`);
    if (runtime?.stacks > 1) auxRows.push(`Stacks: ${runtime.stacks}`);
    if (meta.requires) auxRows.push(`Requires: ${meta.requires}`);
    if (meta.upgradableTo) auxRows.push(`Upgrades to: ${meta.upgradableTo}`);
  }

  // if (type === 'perk') {
  //   if (meta.stackable != null) auxRows.push(`Stackable: ${meta.stackable ? 'Yes' : 'No'}`);
  //   if (meta.maxStacks != null) auxRows.push(`Max stacks: ${meta.maxStacks}`);
  //   if (meta.requires) auxRows.push(`Requires: ${meta.requires}`);
  //   // if (meta.cost != null) auxRows.push(`Cost: ${meta.cost}`);
  // }

  const handleUse = () => {
    if (!canUse) return;
    setErr(null);
    const res = runPerk(itemKey, runtime);
    if (res?.ok) onClose?.();
    else setErr(res?.error || 'Could not use this item');
  };

  return (
    <div className="popup-overlay" onClick={() => onClose?.()}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <X className="closeButton" onClick={() => onClose?.()}/>
        <div className="itemTopPart">
          <div className="itemName">
            {name}
            {type === 'perk' && (
              <span className="item-qty" style={{ marginLeft: 8, opacity: 0.9 }}>×{qty}</span>
            )}
          </div>
          <span className="itemPopup">{headerBadge}</span>
        </div>

        <div className="itemBodyText">
          {/* Skill/debuff runtime hints */}
          {/* {type === 'skill' && runtime?.level != null && (
            <div style={{ marginBottom: 6, opacity: 0.9 }}>
              Current Level: {toRoman(runtime.level) || runtime.level}
            </div>
          )} */}
          {type === 'debuff' && runtime?.stacks > 1 && (
            <div style={{ marginBottom: 6, opacity: 0.9 }}>
              Stacks: {runtime.stacks}
            </div>
          )}

          <p className="item-desc">{primaryDesc}</p>

          {auxRows.length > 0 && (
            <ul className="item-meta">
              {auxRows.map((row, i) => <li key={i}>{row}</li>)}
            </ul>
          )}

          {err && <div style={{ color: '#ff7b7b', marginTop: 8 }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {type === 'perk' && (
            <button className="useButton" onClick={handleUse} disabled={!canUse}>
              Use
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
