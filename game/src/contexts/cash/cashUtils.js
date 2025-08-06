export function calculateRoundCash({ guessesUsed, isBoss = false }) {
    const base = isBoss ? 8 : 5;
    const remainingGuesses = Math.max(6 - guessesUsed, 0);
    return base + remainingGuesses;
}
