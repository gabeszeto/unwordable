import React, { useState } from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneGrid({ targetWord, onKBActivate }) {
  const { perks, usePerk } = usePerks();
  const [active, setActive] = useState(false);

  const handleClick = () => {
    if ((perks.keyzoneGrid || 0) === 0) return;
    setActive(true);
    usePerk('keyzoneGrid');
    onKBActivate?.('grid');
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={active}>
      🧩 Keyzones (Grid)
    </button>
  );
}
