import React, { useState, useEffect } from 'react';
import { useCash } from '../../contexts/cash/CashContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { usePerks } from '../../contexts/perks/PerksContext';

import { pickUniquePerks } from './shopUtils';

import './shopStyles.css';

const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

export default function ShopScreen() {
  const { cash, spendCash } = useCash();
  const { stage, advanceStage } = useLevel();
  const { addPerk } = usePerks();

  const [perksForSale, setPerksForSale] = useState([]);

  useEffect(() => {
    setPerksForSale(pickUniquePerks());
  }, [stage]);

  const handleBuy = (perkId, cost) => {
    if (cash < cost) return;

    if (perkId === 'KeyzoneRoulette') {
      // Randomly select one Keyzone perk
      const randomId = keyzonePerkIds[Math.floor(Math.random() * keyzonePerkIds.length)];
      console.log(`[SHOP] You spun the roulette and got: ${randomId}`);
      addPerk(randomId);
    } else {
      addPerk(perkId);
    }

    spendCash(cost);
    console.log(`[SHOP] Bought: ${perkId}`);
  };

  return (
    <div className="shop-container">
      <h2>🛒 Shop</h2>
      <p>Cash: 💰 {cash}</p>

      <div className="perk-options">
        {perksForSale.map(({ id, name, cost, isVirtual, description }) => (
          <div key={id} className="perk-card" onClick={() => handleBuy(id, cost)}>
            <div className="choiceTopPart">
              <div className="perk-name">{name}</div>
              <div className="perk-cost">💰 {cost}</div>
            </div>
            {description && <div className="perk-description">{description}</div>}
          </div>
        ))}
      </div>

      <button className="nextButton" onClick={advanceStage}>
        Next →
      </button>
    </div>
  );
}
