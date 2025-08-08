import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePerks } from '../../contexts/perks/PerksContext';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { perkRegistry } from '../perks/perkRegistry';

// small helper for roman numerals
const toRoman = (num) => {
    if (!num) return '';
    const map = [
        { v: 10, n: 'X' }, { v: 9, n: 'IX' },
        { v: 5, n: 'V' }, { v: 4, n: 'IV' },
        { v: 1, n: 'I' },
    ];
    let res = '', k = num;
    for (const { v, n } of map) while (k >= v) { res += n; k -= v; }
    return res;
};

export default function ShopInventoryPanel() {
    const { perks } = usePerks();                    // { PerkKey: qty }
    const { activeSkills } = useSkills();            // { SkillKey: level }

    // Track which items changed to play a pulse animation
    const [changedPerks, setChangedPerks] = useState(new Set());
    const [changedSkills, setChangedSkills] = useState(new Set());
    const prevPerksRef = useRef(perks);
    const prevSkillsRef = useRef(activeSkills);

    // Detect increases and set transient "changed" flags
    useEffect(() => {
        const nextChanged = new Set(changedPerks);
        for (const key of new Set([...Object.keys(perks), ...Object.keys(prevPerksRef.current || {})])) {
            const prev = prevPerksRef.current?.[key] || 0;
            const cur = perks?.[key] || 0;
            if (cur > prev) nextChanged.add(key);
        }
        if (nextChanged.size) {
            setChangedPerks(nextChanged);
            // clear after a moment
            const t = setTimeout(() => setChangedPerks(new Set()), 800);
            return () => clearTimeout(t);
        }
    }, [perks]); // eslint-disable-line

    useEffect(() => {
        const nextChanged = new Set(changedSkills);
        for (const key of new Set([...Object.keys(activeSkills), ...Object.keys(prevSkillsRef.current || {})])) {
            const prev = prevSkillsRef.current?.[key] || 0;
            const cur = activeSkills?.[key] || 0;
            if (cur > prev) nextChanged.add(key);
        }
        if (nextChanged.size) {
            setChangedSkills(nextChanged);
            const t = setTimeout(() => setChangedSkills(new Set()), 800);
            return () => clearTimeout(t);
        }
    }, [activeSkills]); // eslint-disable-line

    // update refs
    useEffect(() => { prevPerksRef.current = perks; }, [perks]);
    useEffect(() => { prevSkillsRef.current = activeSkills; }, [activeSkills]);

    const perkEntries = useMemo(
        () => Object.entries(perks || {}).filter(([, qty]) => qty > 0),
        [perks]
    );
    const skillEntries = useMemo(
        () => Object.entries(activeSkills || {}).filter(([, lvl]) => lvl > 0),
        [activeSkills]
    );

    return (
        <div className="shop-inventory-panel">
            <div className="yourInventory">Inventory</div>
            {/* Consumables */}
            <div className="inv-section">
                <div className="inv-title">Consumables</div>
                <div className="inv-grid">
                    {perkEntries.length === 0 ? (
                        <div className="inv-empty">None yet</div>
                    ) : (
                        perkEntries.map(([key, qty]) => {
                            const meta = perkRegistry[key] || {};
                            const label = meta?.name || key;
                            const changed = changedPerks.has(key);
                            return (
                                <button className={`inv-chip perk ${changed ? 'changed' : ''}`} key={`perk-${key}`}>
                                    {label} ×{qty}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Skills */}
            <div className="inv-section">
                <div className="inv-title">Skills</div>
                <div className="inv-grid">
                    {skillEntries.length === 0 ? (
                        <div className="inv-empty">None yet</div>
                    ) : (
                        skillEntries.map(([key, lvl]) => {
                            const changed = changedSkills.has(key);
                            return (
                                <button className={`inv-chip skill ${changed ? 'changed' : ''}`} key={`skill-${key}`}>
                                    {key} {lvl > 0 ? toRoman(lvl) : ''}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
