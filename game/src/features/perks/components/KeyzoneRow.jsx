import React, { useState } from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneRow({ perkKey = 'KeyzoneRow', onKBActivate, isKeyzoneUsed, markAsUsed, remaining }) {
  const { perks } = usePerks();
  const used = isKeyzoneUsed
  const quantity = perks[perkKey] || 0;

  const handleClick = () => {
    if (used || quantity <= 0) return;
    onKBActivate?.('row'); // Pass which segmentation to highlight
    markAsUsed(perkKey)
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      ↔️ Keyzones (Row) ×{remaining}
    </button>
  );
}
