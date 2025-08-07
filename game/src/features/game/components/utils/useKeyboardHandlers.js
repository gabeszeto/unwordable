import { useCallback, useState, useEffect } from 'react';
import { usePerks } from '../../../../contexts/perks/PerksContext';

export default function useKeyboardHandlers({
    guesses,
    currentGuess,
    setCurrentGuess,
    setGuesses,
    targetWord,
    MAX_ROW_LENGTH,
    MAX_GUESSES,
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
    activeDebuffs,
    feedbackShownUpToRow,
    setFeedbackShownUpToRow,
    FEEDBACK_DELAY_THRESHOLD,
    goldenLieUsedPerRow,             // 👈 NEW
    goldenLieInjectedIndex
}) {
    const { jybrishActive, consumeJybrish } = usePerks();
    const [pendingUsedKeys, setPendingUsedKeys] = useState(null);

    // Determine if we should delay feedback
    const delayFeedback = activeDebuffs.includes('DelayedFeedback');
    const feedbackSuppressed = delayFeedback && guesses.length < FEEDBACK_DELAY_THRESHOLD;

    // Apply delayed feedback when threshold is passed
    useEffect(() => {
        if (feedbackShownUpToRow >= 1 && pendingUsedKeys) {
            setUsedKeys(prev => ({ ...prev, ...pendingUsedKeys }));
            setPendingUsedKeys(null);
        }
    }, [feedbackShownUpToRow, pendingUsedKeys, setUsedKeys]);

    const getPriority = (status) => {
        switch (status) {
            case 'correct':
                return 3;
            case 'present':
                return 2;
            case 'absent':
                return 1;
            default:
                return 0;
        }
    };

    // Grellow
    const isGrellowActive = activeDebuffs.includes('Grellow');

    const submitGuess = (guessStr, rowActiveIndices) => {
        const newGuesses = [...guesses, guessStr];
        setGuesses(newGuesses);
        setCurrentGuess(Array(MAX_ROW_LENGTH).fill(''));

        // Reveal previously delayed feedback now
        if (delayFeedback && newGuesses.length === FEEDBACK_DELAY_THRESHOLD) {
            setFeedbackShownUpToRow(1); // reveal feedback for row 0 and 1
        }

        const newUsed = { ...usedKeys };
        const correctWord = targetWord.toUpperCase();
        const isCorrect = guessStr === correctWord;
        let hasColor = false;

        // Handle correct guess
        if (isCorrect) {
            guessStr.split('').forEach(letter => {
                newUsed[letter] = 'correct';
            });
            hasColor = true;
        } else {
            // Apply key feedback unless suppressed
            rowActiveIndices.forEach((idx, i) => {
                const letter = guessStr[i];
                const targetChar = paddedTargetWord[idx];

                const isExact = letter === targetChar;
                const isBlurredGreen =
                    activeDebuffs.includes('BlurredVision') &&
                    [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
                        .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
                        .includes(letter);

                let rawStatus;

                if (isExact || isBlurredGreen) {
                    rawStatus = 'correct';
                    hasColor = true;
                } else if (paddedTargetWord.includes(letter)) {
                    rawStatus = 'present';
                    hasColor = true;
                } else {
                    rawStatus = 'absent';
                }

                // 👁 Grellow override (visual downgrade)
                let status = rawStatus;
                if (isGrellowActive && rawStatus === 'correct') {
                    status = 'present';
                }

                // 💛 Yellowless applies ONLY to raw present letters (not grellow-faked)
                if (rawStatus === 'present' && activeDebuffs.includes('Yellowless')) {
                    status = 'absent';
                }

                // Final: apply with priority
                if (!newUsed[letter] || getPriority(status) > getPriority(newUsed[letter])) {
                    newUsed[letter] = status;
                }
            });

        }

        // Handle Gray Reaper instant death
        if (activeDebuffs.includes('GrayReaper') && !hasColor) {
            setUsedKeys(newUsed);
            setIsGameOver(true);
            onRoundComplete(false, newGuesses, 'GrayReaper');
            return;
        }

        // Golden lie janky logic
        if (
            activeDebuffs.includes('GoldenLie') &&
            !goldenLieUsedPerRow.current.has(guesses.length)
        ) {
            const rowIndex = guesses.length;
            const eligibleIndices = [];

            for (let i = 0; i < rowActiveIndices.length; i++) {
                const idx = rowActiveIndices[i];
                const letter = guessStr[i];
                const targetChar = paddedTargetWord[idx];

                const isCorrect = letter === targetChar;
                const isPresent = paddedTargetWord.includes(letter);

                if (letter && !isCorrect && !isPresent) {
                    eligibleIndices.push(idx);
                }
            }

            if (eligibleIndices.length > 0) {
                const chosenIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
                const fakeLetter = guessStr[rowActiveIndices.indexOf(chosenIndex)];

                newUsed[fakeLetter] = 'present'; // lie

                goldenLieUsedPerRow.current.add(rowIndex);
                goldenLieInjectedIndex.current[rowIndex] = chosenIndex; // 👈 Store exactly which index is the lie
            }
            console.log('golden lie injected:', JSON.stringify(goldenLieInjectedIndex.current));

        }


        // Set key states — either now or after delay
        if (feedbackSuppressed) {
            setPendingUsedKeys(prev => {
                const merged = { ...(prev || {}) };

                for (const [letter, status] of Object.entries(newUsed)) {
                    const existing = merged[letter];

                    // If not set yet, or new status is stronger, update
                    if (!existing || getPriority(status) > getPriority(existing)) {
                        merged[letter] = status;
                    }
                }

                return merged;
            });
        } else {
            setUsedKeys(newUsed);
        }

        // Handle win/loss
        if (isCorrect) {
            setBouncingIndices([...rowActiveIndices]);
            setTimeout(() => setBouncingIndices([]), 1000);
            setIsGameOver(true);
            onRoundComplete(true, newGuesses);
        } else if (newGuesses.length >= MAX_GUESSES) {
            setIsGameOver(true);
            onRoundComplete(false, newGuesses);
        }

        setRevealedIndices([]);
    };

    useEffect(() => {
        console.log(pendingUsedKeys)
    }, [pendingUsedKeys])

    const handleKeyDown = useCallback(
        (e) => {
            const key = e.key.toUpperCase();
            const rowActiveIndices = getRowActiveIndices(guesses.length);

            if (guesses.length >= MAX_GUESSES) return; // Prevent extra guesses

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
        [guesses, currentGuess, revealedIndices, getRowActiveIndices]
    );

    return { handleKeyDown, submitGuess };
}
