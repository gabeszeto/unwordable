// CorrectnessContext.jsx
import { createContext, useContext, useMemo, useState, useCallback } from 'react';

const CorrectnessContext = createContext();
export const useCorrectness = () => useContext(CorrectnessContext);

export function CorrectnessProvider({ children }) {
  const [trulyCorrectIndices, setTrulyCorrectIndices] = useState([]); // stays global (padded indices 0..6)
  const [revealedByRow, setRevealedByRow] = useState({});            // { [rowIndex]: number[] }

  const markAsTrulyCorrect = useCallback((index) => {
    setTrulyCorrectIndices(prev => (prev.includes(index) ? prev : [...prev, index]));
  }, []);

  // row-scoped reveal
  const revealIndexForRow = useCallback((rowIndex, index) => {
    setRevealedByRow(prev => {
      const row = prev[rowIndex] || [];
      if (row.includes(index)) return prev;
      return { ...prev, [rowIndex]: [...row, index] };
    });
  }, []);

  const getRevealedForRow = useCallback((rowIndex) => revealedByRow[rowIndex] || [], [revealedByRow]);

  const resetCorrectness = useCallback(() => {
    setTrulyCorrectIndices([]);
    setRevealedByRow({});
  }, []);

  // (unchanged) “unrevealed & not truly correct” in real slots [1..5]
  const getUnrevealedTrulyCorrectIndices = useCallback(() => {
    const realSlots = [1,2,3,4,5];
    return realSlots.filter(i => !trulyCorrectIndices.includes(i));
  }, [trulyCorrectIndices]);

  const value = useMemo(() => ({
    trulyCorrectIndices,
    // old global (if anything still uses it, you can drop later)
    revealedIndices: [],

    revealedByRow,
    getRevealedForRow,
    revealIndexForRow,

    markAsTrulyCorrect,
    resetCorrectness,
    getUnrevealedTrulyCorrectIndices,
  }), [
    trulyCorrectIndices,
    revealedByRow,
    getRevealedForRow,
    revealIndexForRow,
    markAsTrulyCorrect,
    resetCorrectness,
    getUnrevealedTrulyCorrectIndices,
  ]);

  return <CorrectnessContext.Provider value={value}>{children}</CorrectnessContext.Provider>;
}
