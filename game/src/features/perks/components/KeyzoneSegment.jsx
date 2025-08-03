import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneSegment({
  perkKey = 'KeyzoneSegment',
  onKBActivate,
  usedPerks,
  markAsUsed,
  remaining,
}) {
  const { perks } = usePerks();
  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;

  const handleClick = () => {
    if (used || quantity <= 0) return;
    if ((perks.KeyzoneSegment || 0) === 0) return;

    onKBActivate?.('segment');
    markAsUsed(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🎯 Keyzones (Segment) ×{remaining}
    </button>
  );
}
