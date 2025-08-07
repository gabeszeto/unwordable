import { createContext, useContext, useState, useEffect } from 'react';

const CorrectnessContext = createContext();

export const useCorrectness = () => useContext(CorrectnessContext);

export function CorrectnessProvider({ children }) {
  const [trulyCorrectIndices, setTrulyCorrectIndices] = useState([]);
  const [revealedIndices, setRevealedIndices] = useState([]);

  const markAsTrulyCorrect = (index) => {
    setTrulyCorrectIndices(prev => {
      if (!prev.includes(index)) {
        const updated = [...prev, index];
        console.log('Setting truly correct to', updated);
        return updated;
      }
      return prev;
    });
  };

  const revealIndex = (index) => {
    setRevealedIndices(prev => prev.includes(index) ? prev : [...prev, index]);
  };

  const resetCorrectness = () => {
    setTrulyCorrectIndices([]);
    setRevealedIndices([]);
  };

  const getUnrevealedTrulyCorrectIndices = (targetWord) => {
    return [...targetWord]
      .map((_, i) => i)
      .filter(i => !trulyCorrectIndices.includes(i) && !revealedIndices.includes(i));
  };

  return (
    <CorrectnessContext.Provider
      value={{
        trulyCorrectIndices,
        revealedIndices,
        markAsTrulyCorrect,
        revealIndex,
        resetCorrectness,
        getUnrevealedTrulyCorrectIndices,
      }}
    >
      {children}
    </CorrectnessContext.Provider>
  );
}
