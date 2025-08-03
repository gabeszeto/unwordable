import React, { createContext, useContext, useState } from 'react';

const PerksContext = createContext();

export const PerksProvider = ({ children }) => {
    const [perks, setPerks] = useState({
        Revelation: 2,
        Anatomy: 2,
        keyzoneRow: 2,
        keyzoneSegment: 2,
        keyzoneGrid: 2,
    });
    console.log(perks)


    const addPerk = (perkName) => {
        setPerks(prev => ({
            ...prev,
            [perkName]: (prev[perkName] || 0) + 1
        }));
    };


    const usePerk = (perkName) => {
        setPerks(prev => ({
            ...prev,
            [perkName]: Math.max((prev[perkName] || 0) - 1, 0)
        }));
    };


    return (
        <PerksContext.Provider value={{ perks, addPerk, usePerk }}>
            {children}
        </PerksContext.Provider>
    );
};

export const usePerks = () => useContext(PerksContext);
