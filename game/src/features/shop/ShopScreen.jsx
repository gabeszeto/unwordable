import React from 'react';
import { useGold } from '../../contexts/gold/GoldContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { usePerks } from '../../contexts/perks/PerksContext';

import './shopStyles.css';

export default function ShopScreen() {
  const { gold, spendGold } = useGold();
  const { advanceStage } = useLevel();
  const { perks, addPerk } = usePerks();

  const perksForSale = [
    { id: 'Revelation', name: '🔮 Divine Insight', cost: 1 },
    { id: 'Anatomy', name: '🧪 Components', cost: 1 },
    { id: 'placeholder3', name: '🚧 Perk 3 (coming soon)', cost: 999 },
    { id: 'placeholder4', name: '🚧 Perk 4 (coming soon)', cost: 999 },
  ];

  const handleBuy = (perkId, cost) => {
    if (gold >= cost) {
      console.log(`[SHOP] Buying perk: ${perkId}`);
      spendGold(cost);
      addPerk(perkId);
      console.log(`[SHOP] Current perks:`, perks);
    }
  };

  return (
    <div className="shop-container">
      <h2>🛒 Shop</h2>
      <p>Gold: 🪙 {gold}</p>

      <div className="perk-options">
        {perksForSale.map(({ id, name, cost }) => (
          <div key={id} className="perk-card">
            <span className="perk-name">{name}</span>
            <span className="perk-cost">🪙 {cost}</span>
            <button
              className="buy-button"
              disabled={gold < cost}
              onClick={() => handleBuy(id, cost)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      <button className="next-button" onClick={advanceStage}>
        Next →
      </button>
    </div>
  );
}
