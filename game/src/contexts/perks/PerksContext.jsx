import React, { createContext, useContext, useState } from 'react';

const PerksContext = createContext();

export const PerksProvider = ({ children }) => {
    const [perks, setPerks] = useState({
        Revelation: 0,
        Anatomy: 0,
        KeyzoneRow: 0,
        KeyzoneSegment: 0,
        KeyzoneGrid: 0,
    });
    console.log(perks)


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
        <PerksContext.Provider value={{ perks, addPerk, usePerk }}>
            {children}
        </PerksContext.Provider>
    );
};

export const usePerks = () => useContext(PerksContext);
