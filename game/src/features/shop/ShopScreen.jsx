import React from 'react';
import { useGold } from '../../contexts/gold/GoldContext';
import { useLevel } from '../../contexts/level/LevelContext';

import './shopStyles.css';

export default function ShopScreen() {
  const { gold } = useGold();
  const { advanceStage } = useLevel();

  const placeholderPerks = ['Perk 1', 'Perk 2', 'Perk 3', 'Perk 4'];

  return (
    <div className="shop-container">
      <h2>🛒 Shop</h2>
      <p>Gold: 🪙 {gold}</p>
      <div className="perk-options">
        {placeholderPerks.map((perk, i) => (
          <div key={i} className="perk-card">
            {perk}
          </div>
        ))}
      </div>
      <button className="next-button" onClick={advanceStage}>
        Next →
      </button>
    </div>
  );
}
