import React, { createContext, useContext, useState } from 'react';

const PerksContext = createContext();

export const PerksProvider = ({ children }) => {
    const [perks, setPerks] = useState({
        Revelation: 1,
        Anatomy: 1,
        KeyzoneRow: 1,
        KeyzoneSegment: 1,
        KeyzoneGrid: 1,
        Jybrish: 1
    });

    // Perk states
    const [jybrishActive, setJybrishActive] = useState(false);

    const activateJybrish = () => setJybrishActive(true);
    const consumeJybrish = () => setJybrishActive(false);

    const addPerk = (perkName) => {
        setPerks(prev => ({
            ...prev,
            [perkName]: (prev[perkName] || 0) + 1
        }));
    };


    const usePerk = (perkName) => {
        setPerks(prev => {
            const current = prev[perkName] || 0;
            console.log(`[usePerk] ${perkName} before: ${current}, after: ${Math.max(current - 1, 0)}`);
            return {
                ...prev,
                [perkName]: Math.max(current - 1, 0),
            };
        });
    };


    return (
        <PerksContext.Provider value={{ perks, addPerk, usePerk, jybrishActive, activateJybrish, consumeJybrish }}>
            {children}
        </PerksContext.Provider>
    );
};

export const usePerks = () => useContext(PerksContext);
