// contexts/BoardHelperContext.jsx
import { createContext, useContext, useState } from "react";

const BoardHelperContext = createContext();

export function BoardHelperProvider({ children }) {
  // rowsAfterDebuffs[guessIndex] = array of column indices active for that guess
  const [rowsAfterDebuffs, setRowsAfterDebuffs] = useState([]);

  const value = {
    rowsAfterDebuffs,
    setRowsAfterDebuffs,
    getRowActiveIndices: (rowIndex) => rowsAfterDebuffs[rowIndex] || []
  };

  return (
    <BoardHelperContext.Provider value={value}>
      {children}
    </BoardHelperContext.Provider>
  );
}

export function useBoardHelper() {
  return useContext(BoardHelperContext);
}
