import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CorrectnessContext = createContext();
export const useCorrectness = () => useContext(CorrectnessContext);

export function CorrectnessProvider({ children }) {
  // Start empty (no debug seeds)
  const [trulyCorrectIndices, setTrulyCorrectIndices] = useState([]);
  const [revealedIndices, setRevealedIndices] = useState([]);

  // Store PADDED board indices here (the same ones you compare against paddedTargetWord)
  const markAsTrulyCorrect = (index) => {
    if (index >= 1 && index <= 5) {
      setTrulyCorrectIndices(prev => {
        if (!prev.includes(index)) {
          const updated = [...prev, index];
          console.log('Setting truly correct to', updated);
          return updated;
        }
        return prev;
      });
    }
  };
  

  // Public API for revealing; don’t export the raw setter unless you really need it
  const revealIndex = useCallback((index) => {
    setRevealedIndices(prev => (prev.includes(index) ? prev : [...prev, index]));
  }, []);

  // Call this ONLY when a new round starts (not on every submit)
  const resetCorrectness = useCallback(() => {
    setTrulyCorrectIndices([]);
    setRevealedIndices([]);
  }, []);

  // Takes paddedTargetWord so we operate in the same index space
  const getUnrevealedTrulyCorrectIndices = () => {
    const realSlots = [1, 2, 3, 4, 5]; // actual target word columns
  
    return realSlots.filter(i =>
      !trulyCorrectIndices.includes(i) &&
      !revealedIndices.includes(i)
    );
  };

  const value = useMemo(() => ({
    trulyCorrectIndices,
    revealedIndices,
    markAsTrulyCorrect,
    revealIndex,
    resetCorrectness,
    getUnrevealedTrulyCorrectIndices,
  }), [
    trulyCorrectIndices,
    revealedIndices,
    markAsTrulyCorrect,
    revealIndex,
    resetCorrectness,
    getUnrevealedTrulyCorrectIndices,
  ]);

  return (
    <CorrectnessContext.Provider value={value}>
      {children}
    </CorrectnessContext.Provider>
  );
}
