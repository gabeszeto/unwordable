import React, { useState } from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneSegment({ targetWord, onKBActivate }) {
  const { perks, usePerk } = usePerks();
  const [active, setActive] = useState(false);

  const handleClick = () => {
    if ((perks.keyzoneSegment || 0) === 0) return;
    setActive(true);
    usePerk('keyzoneSegment');
    onKBActivate?.('segment');
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={active}>
      🎯 Keyzones (Segment)
    </button>
  );
}
