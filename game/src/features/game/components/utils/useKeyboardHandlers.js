// useKeyboardHandlers.js
import { useCallback } from 'react';
import { usePerks } from '../../../../contexts/perks/PerksContext';

export default function useKeyboardHandlers({
    guesses,
    currentGuess,
    setCurrentGuess,
    setGuesses,
    targetWord,
    MAX_ROW_LENGTH,
    WORD_LENGTH,
    paddedTargetWord,
    setShakeRow,
    setBouncingIndices,
    setIsGameOver,
    revealedIndices,
    setRevealedIndices,
    onRoundComplete,
    setUsedKeys,
    usedKeys,
    getRowActiveIndices,
    validWords,
    activeDebuffs
}) {
    const { jybrishActive, consumeJybrish } = usePerks();

    const submitGuess = (guessStr, rowActiveIndices) => {
        const newGuesses = [...guesses, guessStr];
        setGuesses(newGuesses);
        setCurrentGuess(Array(MAX_ROW_LENGTH).fill(''));

        const newUsed = { ...usedKeys };
        const correctWord = targetWord.toUpperCase();
        const isCorrect = guessStr === correctWord;
        let hasColor = false;

        if (isCorrect) {
            for (const letter of guessStr) {
                newUsed[letter] = 'correct';
            }
            hasColor = true;
        } else {
            rowActiveIndices.forEach((idx, i) => {
                const letter = guessStr[i];
                const targetChar = paddedTargetWord[idx];
              
                const isExact = letter === targetChar;
                const isBlurredGreen =
                  activeDebuffs.includes('BlurredVision') &&
                  [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
                    .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
                    .includes(letter);
              
                if (isExact || isBlurredGreen) {
                  newUsed[letter] = 'correct';
                  hasColor = true;
                } else if (paddedTargetWord.includes(letter)) {
                  if (newUsed[letter] !== 'correct') newUsed[letter] = 'present';
                  hasColor = true;
                } else {
                  if (!newUsed[letter]) newUsed[letter] = 'absent';
                }
              });
              
        }

        if (activeDebuffs.includes('GrayReaper') && !hasColor) {
            setUsedKeys(newUsed);
            setIsGameOver(true);
            onRoundComplete(false, newGuesses, 'GrayReaper');
            return;
        }

        console.log(newUsed)
        setUsedKeys(newUsed);

        if (isCorrect) {
            setBouncingIndices([...rowActiveIndices]);
            setTimeout(() => setBouncingIndices([]), 1000);
            setIsGameOver(true);
            onRoundComplete(true, newGuesses);
        } else if (newGuesses.length >= 6) {
            setIsGameOver(true);
            onRoundComplete(false, newGuesses);
        }

        setRevealedIndices([]);
    };


    const handleKeyDown = useCallback(
        (e) => {
            const key = e.key.toUpperCase();
            const rowActiveIndices = getRowActiveIndices(guesses.length);

            if (key === 'ENTER') {
                const guessStr = rowActiveIndices.map(i => currentGuess[i]).join('');
                const guessLen = guessStr.length;

                if (!validWords[guessLen].includes(guessStr)) {
                    if (jybrishActive) {
                        consumeJybrish(); // Consume the perk
                        console.log('Jybrish active — allowing invalid word.');
                    } else {
                        setShakeRow(true);
                        setTimeout(() => setShakeRow(false), 400);
                        return;
                    }
                }

                if (guessStr.length === rowActiveIndices.length && !rowActiveIndices.some(i => currentGuess[i] === '')) {
                    submitGuess(guessStr, rowActiveIndices);
                }
            } else if (key === 'BACKSPACE') {
                const updated = [...currentGuess];
                for (let i = rowActiveIndices.length - 1; i >= 0; i--) {
                    const idx = rowActiveIndices[i];
                    if (!revealedIndices.includes(idx) && updated[idx] !== '') {
                        updated[idx] = '';
                        break;
                    }
                }
                setCurrentGuess(updated);
            } else if (/^[A-Z]$/.test(key)) {
                const updated = [...currentGuess];
                for (let i = 0; i < rowActiveIndices.length; i++) {
                    const idx = rowActiveIndices[i];
                    if (!revealedIndices.includes(idx) && updated[idx] === '') {
                        updated[idx] = key;
                        break;
                    }
                }
                setCurrentGuess(updated);
            }
        },
        [guesses, currentGuess, revealedIndices]
    );

    return { handleKeyDown, submitGuess };
}
