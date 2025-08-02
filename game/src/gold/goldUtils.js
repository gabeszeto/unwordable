export function calculateRoundGold({ guessesUsed, isBoss = false }) {
    const base = isBoss ? 5 : 2;
    const remainingGuesses = Math.max(6 - guessesUsed, 0);
    return base + remainingGuesses;
}
