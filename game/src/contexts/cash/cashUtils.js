export function calculateRoundCash({
    guessesUsed,
    isBoss = false,
    activeDebuffs = [],
    passiveDebuffs = {},
    maxGuesses = 6
  }) {
    const base = 5
  
    const remainingGuessBonus = Math.max(maxGuesses - guessesUsed, 0);
  
    const activeBonus = (activeDebuffs?.length || 0) * 4;
  
    const passiveBonus = Object.keys(passiveDebuffs || {}).length * 2;
  
    return base + remainingGuessBonus + activeBonus + passiveBonus;
  }
  