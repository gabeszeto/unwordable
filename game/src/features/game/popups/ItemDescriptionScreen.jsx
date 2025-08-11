// ItemDescriptionScreen.jsx
import React, { useState, useMemo } from 'react';
import { getItemMeta } from '../../getItemMeta';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../../perks/usePerkActions';  // ⬅️ import this
import './popupScreenStyles.css';

export default function ItemDescriptionScreen({ itemKey, runtime, onClose }) {
  const meta = getItemMeta(itemKey);
  if (!meta) return null;

  const { type, name, description, stackable, maxStacks, requires } = meta;
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();               // ⬅️ get runner

  const qty = type === 'perk' ? (perks?.[itemKey] || 0) : null;
  const [err, setErr] = useState(null);
  const canUse = useMemo(() => type === 'perk' && (qty ?? 0) > 0, [type, qty]);

  const handleUse = () => {
    setErr(null);
    const res = runPerk(itemKey, runtime);
  
    if (res?.ok) {
      onClose?.();
    } else {
      setErr(res?.error || 'Could not use this item');
    }
  };
  

  return (
    <div className="popup-overlay" onClick={() => onClose?.()}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <header className="itemTopPart">
          <div className="itemName">
            {name}
            {type === 'perk' && (
              <span className="item-qty" style={{ marginLeft: 8, opacity: .9 }}>×{qty}</span>
            )}
          </div>
          <span className="itemPopup">{type === 'skill' ? 'Skill' : 'Consumable'}</span>
        </header>

        <div className="itemBodyText">
          <p className="item-desc">{description}</p>
          <ul className="item-meta">
            {stackable != null && <li>Stackable: {stackable ? 'Yes' : 'No'}</li>}
            {maxStacks != null && <li>Max stacks: {maxStacks}</li>}
            {requires && <li>Requires: {requires}</li>}
          </ul>
          {err && <div style={{ color: '#ff7b7b', marginTop: 8 }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {type === 'perk' && (
            <div className="useButton" onClick={handleUse} disabled={!canUse} >
              Use
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
