import React, { useState, useEffect } from 'react';
import { useCash } from '../../contexts/cash/CashContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { usePerks } from '../../contexts/perks/PerksContext';
import { pickUniquePerks } from './shopUtils';

import ShopInventoryPanel from './ShopInventoryPanel';
import './shopStyles.css';

const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

export default function ShopScreen() {
  const { cash, spendCash } = useCash();
  const { stage, advanceStage } = useLevel();
  const { addPerk } = usePerks();

  const [perksForSale, setPerksForSale] = useState([]);
  const [purchasingId, setPurchasingId] = useState(null);
  const [boughtId, setBoughtId] = useState(null);
  const [cashDelta, setCashDelta] = useState(0);

  // animated cash display
  const [displayCash, setDisplayCash] = useState(cash);
  useEffect(() => {
    const start = displayCash;
    const end = cash;
    const duration = 400;
    const t0 = performance.now();

    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      setDisplayCash(Math.round(start + (end - start) * k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cash]); // eslint-disable-line

  useEffect(() => {
    setPerksForSale(pickUniquePerks());
  }, [stage]);

  const handleBuy = async (perkId, cost) => {
    if (cash < cost || purchasingId) return;

    setPurchasingId(perkId);

    // Keyzone roulette reveal
    let awardedId = perkId;
    if (perkId === 'KeyzoneRoulette') {
      // tiny fake spin delay
      await new Promise(r => setTimeout(r, 650));
      awardedId = keyzonePerkIds[Math.floor(Math.random() * keyzonePerkIds.length)];
      console.log(`[SHOP] You spun the roulette and got: ${awardedId}`);
    }

    addPerk(awardedId);
    spendCash(cost);
    setCashDelta(-cost);

    // pop + checkmark states
    setBoughtId(perkId);
    setTimeout(() => setBoughtId(null), 700);
    setTimeout(() => setPurchasingId(null), 200);
  };

  return (
    <div className="shop-container">
      <h2>🛒 Shop</h2>

      {/* Cash display with animated number + floating delta */}
      <div className="cash-display">
        <span className="cash-emoji">💰</span>
        <span className="cash-amount">{displayCash}</span>
        {!!cashDelta && (
          <span
            key={cash + ':' + cashDelta} // re-trigger animation on change
            className={`cash-delta ${cashDelta < 0 ? 'neg' : 'pos'}`}
            onAnimationEnd={() => setCashDelta(0)}
          >
            {cashDelta > 0 ? `+${cashDelta}` : `${cashDelta}`}
          </span>
        )}
      </div>

      <div className="perk-options">
        {perksForSale.map(({ id, name, cost, description }) => {
          const affordable = cash >= cost;
          const isBuying = purchasingId === id;
          const isBought = boughtId === id;

          return (
            <button
              type="button"
              key={id}
              className={[
                'perk-card',
                !affordable ? 'is-disabled' : '',
                isBuying ? 'is-buying' : '',
                isBought ? 'is-bought' : '',
                id === 'KeyzoneRoulette' && isBuying ? 'is-spinning' : '',
              ].join(' ').trim()}
              onClick={() => affordable && handleBuy(id, cost)}
              disabled={!affordable || purchasingId === id}
            >
              <div className="choiceTopPart">
                <div className="perk-name">
                  {id === 'KeyzoneRoulette' && purchasingId === id ? 'Spinning…' : name}
                </div>
                <div className="perk-cost">💰 {cost}</div>
              </div>
              {description && <div className="perk-description">{description}</div>}

              {/* Bought check overlay */}
              <div className="perk-badge" aria-hidden={true}>✓ Purchased</div>
            </button>
          );
        })}
      </div>

      <ShopInventoryPanel />

      <button className="nextButton" onClick={advanceStage}>
        Next →
      </button>
    </div>
  );
}
