import React, { useState } from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneRow({ targetWord, onKBActivate }) {
  const { perks, usePerk } = usePerks();
  const [active, setActive] = useState(false);

  const handleClick = () => {
    if ((perks.keyzoneRow || 0) === 0) return;
    setActive(true);
    usePerk('keyzoneRow');
    onKBActivate?.('row'); // Pass which segmentation to highlight
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={active}>
      🎲 Keyzones (Row)
    </button>
  );
}
