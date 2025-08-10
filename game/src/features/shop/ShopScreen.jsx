import React, { useState, useEffect } from 'react';
import { useCash } from '../../contexts/cash/CashContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { usePerks } from '../../contexts/perks/PerksContext';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { useDebuffs } from '../../contexts/debuffs/DebuffsContext';

import { pickUniqueOffers, pickWeightedKeyzone } from './shopUtils'; // perks + skills
import ShopInventoryPanel from './ShopInventoryPanel';
import './shopStyles.css';

const keyzonePerkIds = ['KeyzoneRow', 'KeyzoneSegment', 'KeyzoneGrid'];

export default function ShopScreen() {
  const { cash, spendCash } = useCash();
  const { stage, advanceStage } = useLevel();
  const { addPerk } = usePerks();
  const { activeSkills, upgradeSkill } = useSkills();
  const { activeDebuffs, passiveDebuffs } = useDebuffs();

  const [offers, setOffers] = useState([]);
  const [purchasingId, setPurchasingId] = useState(null);
  const [boughtId, setBoughtId] = useState(null);
  const [cashDelta, setCashDelta] = useState(0);

  // NEW: track purchased choices for this shop screen (by type:id)
  const [purchasedSet, setPurchasedSet] = useState(() => new Set());

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cash]);

  // build offers on enter / stage change / skill changes
  const [shopVersion, setShopVersion] = useState(0);

  useEffect(() => {
    setOffers(pickUniqueOffers({
      count: 3,
      activeSkills,
      stage,
      debuffs: { activeDebuffs, passiveDebuffs } // 👈 pass through
    }));
    setPurchasedSet(new Set());
  }, [stage, shopVersion]);

  const handleBuy = async (offer) => {
    const { id, type, cost } = offer;
    const key = `${type}:${id}`;

    // already bought this choice?
    if (purchasedSet.has(key)) return;

    if (cash < cost || purchasingId) return;
    setPurchasingId(id);

    if (type === 'perk') {
      let awardedId = id;
      if (id === 'KeyzoneRoulette') {
        await new Promise((r) => setTimeout(r, 650));
        awardedId = pickWeightedKeyzone(keyzonePerkIds) || keyzonePerkIds[0];
        console.log(`[SHOP] You spun the roulette and got: ${awardedId}`);
      }
      addPerk(awardedId);
    } else if (type === 'skill') {
      upgradeSkill(id, 1);
    }

    spendCash(cost);
    setCashDelta(-cost);

    // mark this specific card as bought/locked
    setPurchasedSet(prev => new Set(prev).add(key));

    // visuals
    setBoughtId(key);
    setTimeout(() => setBoughtId(null), 700);
    setTimeout(() => setPurchasingId(null), 200);
  };

  // NEW: reroll button — costs 1 cash, refreshes offers and clears purchased locks
  const handleReroll = () => {
    if (purchasingId) return;
    if (cash < 1) return;

    spendCash(1);
    setCashDelta(-1);

    setPurchasedSet(new Set());
    setBoughtId(null);
    setPurchasingId(null);

    setShopVersion(v => v + 1); // 🔁 triggers the effect to rebuild offers
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
            key={cash + ':' + cashDelta}
            className={`cash-delta ${cashDelta < 0 ? 'neg' : 'pos'}`}
            onAnimationEnd={() => setCashDelta(0)}
          >
            {cashDelta > 0 ? `+${cashDelta}` : `${cashDelta}`}
          </span>
        )}
      </div>

      <div className="perk-options">
        {offers.map((offer) => {
          const { id, name, cost, description, type } = offer;
          const key = `${type}:${id}`;
          const affordable = cash >= cost;
          const isBuying = purchasingId === id;
          const isBought = boughtId === key;
          const isLocked = purchasedSet.has(key);

          return (
            <button
              type="button"
              key={key}
              className={[
                'perk-card',
                (!affordable || purchasingId === id || isLocked) ? 'is-disabled' : '',
                isBuying ? 'is-buying' : '',
                isBought ? 'is-bought' : '',
                id === 'KeyzoneRoulette' && isBuying ? 'is-spinning' : '',
                isLocked ? 'is-locked' : '',
              ].join(' ').trim()}
              onClick={() => affordable && !isLocked && handleBuy(offer)}
              disabled={!affordable || purchasingId === id || isLocked}
              aria-disabled={isLocked ? 'true' : undefined}
            >
              <div className="choiceTopPart">
                <div className="perk-name">
                  {id === 'KeyzoneRoulette' && purchasingId === id ? 'Spinning…' : name}
                  <span
                    className="offer-tag"
                    style={{
                      marginLeft: 8,
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      padding: '2px 6px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: type === 'skill' ? '#203245' : '#2a2a2a',
                    }}
                  >
                    {type === 'skill' ? 'Skill' : 'Consumable'}
                  </span>
                </div>
                <div className="perk-cost">💰 {cost}</div>
              </div>
              {description && <div className="perk-description">{description}</div>}

              {/* Bought check overlay */}
              <div className="perk-badge" aria-hidden={true}>
                ✓ Purchased
              </div>
            </button>
          );
        })}
      </div>

      {/* NEW: Reroll button */}
      <div className="shop-reroll">
        <button
          className="rerollButton"
          onClick={handleReroll}
          disabled={cash < 1 || !!purchasingId}
          title="Reroll shop (costs 1)"
        >
          ↻ Reroll -1
        </button>
      </div>

      <ShopInventoryPanel />

      <button className="nextButton" onClick={advanceStage}>
        Next →
      </button>
    </div>
  );
}
