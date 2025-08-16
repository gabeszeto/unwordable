import { useCallback, useState, useEffect } from 'react';
import { usePerks } from '../../../../contexts/perks/PerksContext';
import { useCorrectness } from '../../../../contexts/CorrectnessContext';
import { useCash } from '../../../../contexts/cash/CashContext';
import { useDebuffs } from '../../../../contexts/debuffs/DebuffsContext';
import { useRunStats } from '../../../../contexts/RunStatsContext';

import { shouldHideYellow } from '../../../engine/yellowless';
import { shouldHideYellowDebug } from '../../../engine/yellowlessDebug';
import { loadBoardState, patchBoardState } from '../../../save';

export default function useKeyboardHandlers({
    guesses,
    stage,
    currentGuess,
    setCurrentGuess,
    setGuesses,
    targetWord,
    maxGuesses,
    paddedTargetWord,
    setShakeRow,
    setBouncingIndices,
    setIsGameOver,
    onRoundComplete,
    setUsedKeys,
    usedKeys,
    getRowActiveIndices,
    validWords,
    feedbackShownUpToRow,
    setFeedbackShownUpToRow,
    FEEDBACK_DELAY_THRESHOLD,
    goldenLieUsedPerRow,
    goldenLieInjectedIndex,
    lockedLetterByRow,
    setGuessRanges,
    setSixerMeta,
    setSixerActiveIndices,
    sixerActiveIndices,
    paused
}) {
    const { jybrishActive, consumeJybrish } = usePerks();
    const {
        revealedIndices,
        markAsTrulyCorrect,
    } = useCorrectness();
    const { pendingWager, resolveWager } = useCash();
    const { passiveDebuffs, activeDebuffs } = useDebuffs();
    const { noteGuess } = useRunStats();

    const [pendingUsedKeys, setPendingUsedKeys] = useState(null);

    // Determine if we should delay feedback
    const delayFeedback = (passiveDebuffs.DelayedFeedback ?? 0) > 0
    const feedbackSuppressed = delayFeedback && guesses.length < FEEDBACK_DELAY_THRESHOLD;

    // Apply delayed feedback when threshold is passed
    useEffect(() => {
        if (feedbackShownUpToRow >= 1 && pendingUsedKeys) {
            // Merge locally
            setUsedKeys(prev => {
                const merged = { ...prev, ...pendingUsedKeys };
                // Persist merged to save
                const prevSaved = loadBoardState(stage)?.usedKeys || {};
                patchBoardState(stage, { usedKeys: { ...prevSaved, ...pendingUsedKeys } });
                return merged;
            });
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

    // Final row statuses (Wordle 2-pass + Grellow + Yellowless RNG)
    const computeFinalRowStatuses = (guessStr, rowActiveIndices, correctWord, guessIndex) => {
        const len = rowActiveIndices.length;

        // count target letters in the active slots only
        const remaining = {};
        for (let j = 0; j < len; j++) {
            const idx = rowActiveIndices[j];
            const t = paddedTargetWord[idx];
            remaining[t] = (remaining[t] || 0) + 1;
        }

        const raw = new Array(len).fill('absent');

        // pass 1: exacts (consume), blurred visual correct (no consume)
        for (let j = 0; j < len; j++) {
            const idx = rowActiveIndices[j];
            const letter = guessStr[j];
            if (!letter) continue;

            const targetChar = paddedTargetWord[idx];
            const isExact = letter === targetChar;
            const isBlurredGreen =
                activeDebuffs.includes('BlurredVision') &&
                [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
                    .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
                    .includes(letter);

            if (isExact) {
                raw[j] = 'correct';
                remaining[letter] = (remaining[letter] || 0) - 1;
            } else if (isBlurredGreen) {
                raw[j] = 'correct';
            }
        }

        // pass 2: presents (only while copies remain)
        for (let j = 0; j < len; j++) {
            if (raw[j] !== 'absent') continue;
            const letter = guessStr[j];
            if (!letter) continue;
            const left = remaining[letter] || 0;
            if (left > 0) {
                raw[j] = 'present';
                remaining[letter] = left - 1;
            }
        }

        // visual transforms
        const grellow = activeDebuffs.includes('Grellow');
        const yellowless = activeDebuffs.includes('Yellowless');

        const finalStatuses = raw.map((s, j) => {
            let v = s;
            if (grellow && v === 'correct') v = 'present';
            if (yellowless && s === 'present') {
                const hide = shouldHideYellow(
                    {
                        stage,
                        guessIndex,
                        colAbs: rowActiveIndices[j],
                        targetWord: correctWord,
                        guess: guessStr,
                    },
                    1 / 3 // 66.7% show as yellow, 33.3% hide → tweak as desired
                );
                v = hide ? 'absent' : 'present';
            }
            return v;
        });

        return finalStatuses;
    };

    const submitGuess = (guessStr, rowActiveIndices) => {
        const newGuesses = [...guesses, guessStr];
        setGuesses(newGuesses);
      
        // stats
        noteGuess(1);
      
        // keep per-row ranges and clear current row
        setGuessRanges(prev => [...prev, rowActiveIndices]);
        const cleared = [...currentGuess];
        rowActiveIndices.forEach(i => { cleared[i] = ''; });
        setCurrentGuess(cleared);
      
        // delayed feedback threshold
        if (delayFeedback && newGuesses.length === FEEDBACK_DELAY_THRESHOLD) {
          setFeedbackShownUpToRow(1);
        }
      
        const correctWord = targetWord.toUpperCase();
        const isCorrect = guessStr === correctWord;
        const guessIndex = newGuesses.length - 1;
      
        if (pendingWager) resolveWager(isCorrect);
      
        // start keyboard from prior state
        let newUsed = { ...usedKeys };
      
        // -------- 1) GOLDEN LIE: decide BEFORE computing finalStatuses --------
        if (
          activeDebuffs.includes('GoldenLie') &&
          !goldenLieUsedPerRow.current.has(guesses.length) // current row index
        ) {
          const rowIndex = guesses.length;
          const eligible = [];
          for (let i = 0; i < rowActiveIndices.length; i++) {
            const idx = rowActiveIndices[i];
            const letter = guessStr[i];
            const targetChar = paddedTargetWord[idx];
            const isExact = letter === targetChar;
            const isPresent = paddedTargetWord.includes(letter);
            if (letter && !isExact && !isPresent) eligible.push(idx);
          }
          if (eligible.length > 0) {
            const chosenIndexAbs = eligible[Math.floor(Math.random() * eligible.length)];
            const fakeLetter = guessStr[rowActiveIndices.indexOf(chosenIndexAbs)];
            // keyboard lie (visual)
            newUsed[fakeLetter] = 'present';
            goldenLieUsedPerRow.current.add(rowIndex);
            goldenLieInjectedIndex.current[rowIndex] = chosenIndexAbs;
          }
        }
      
        // -------- 2) TILE STATUSES for this row (single source of truth) --------
        let finalStatuses;
        if (isCorrect) {
          finalStatuses = rowActiveIndices.map(() => 'correct');
        } else {
          finalStatuses = computeFinalRowStatuses(
            guessStr,
            rowActiveIndices,
            correctWord,
            guessIndex
          );
          // If Golden Lie injected, force that absolute tile to 'present' if it was 'absent'
          if (
            activeDebuffs.includes('GoldenLie') &&
            goldenLieUsedPerRow.current.has(guesses.length)
          ) {
            const injectedAbs = goldenLieInjectedIndex.current?.[guesses.length];
            const j = rowActiveIndices.indexOf(injectedAbs);
            if (j !== -1 && finalStatuses[j] === 'absent') {
              finalStatuses[j] = 'present';
            }
          }
        }
      
        // Does this row have any color at all? (for Grey Reaper)
        const hasColor = finalStatuses.some(s => s === 'present' || s === 'correct');
      
        // -------- 3) KEYBOARD from tile statuses (with priority) --------
        const priority = (s) => (s === 'correct' ? 3 : s === 'present' ? 2 : s === 'absent' ? 1 : 0);
        for (let j = 0; j < rowActiveIndices.length; j++) {
          const letter = guessStr[j];
          if (!letter) continue;
          const status = finalStatuses[j];
          if (!newUsed[letter] || priority(status) > priority(newUsed[letter])) {
            newUsed[letter] = status;
          }
        }
      
        // -------- 4) Persist the guess record --------
        {
          const prev = loadBoardState(stage);
          const prevGuesses = prev?.guesses || [];
          patchBoardState(stage, {
            guesses: [
              ...prevGuesses,
              {
                word: guessStr,
                indices: rowActiveIndices.slice(),
                statuses: finalStatuses,
                lieIndexAbs:
                  activeDebuffs.includes('GoldenLie') &&
                  goldenLieUsedPerRow.current.has(guesses.length)
                    ? goldenLieInjectedIndex.current?.[guesses.length]
                    : undefined,
              },
            ],
          });
        }
      
        // -------- 5) Grey Reaper after we know hasColor ----------
        if (activeDebuffs.includes('GreyReaper') && !hasColor) {
          setUsedKeys(newUsed);
          setIsGameOver(true);
          onRoundComplete(false, newGuesses, 'GreyReaper', targetWord);
          return;
        }
      
        // -------- 6) usedKeys: delayed vs immediate ----------
        if (feedbackSuppressed) {
          setPendingUsedKeys(prev => {
            const merged = { ...(prev || {}) };
            for (const [letter, status] of Object.entries(newUsed)) {
              const existing = merged[letter];
              if (!existing || priority(status) > priority(existing)) {
                merged[letter] = status;
              }
            }
            return merged;
          });
        } else {
          setUsedKeys(newUsed);
          patchBoardState(stage, { usedKeys: newUsed });
        }
      
        // -------- 7) Win/Loss ----------
        if (isCorrect) {
          setBouncingIndices([...rowActiveIndices]);
          setTimeout(() => setBouncingIndices([]), 1000);
          setIsGameOver(true);
          onRoundComplete(true, newGuesses);
        } else if (newGuesses.length >= maxGuesses) {
          setIsGameOver(true);
          onRoundComplete(false, newGuesses, 'Out of guesses', targetWord);
        }
      
        // -------- 8) Sixer meta ----------
        if (sixerActiveIndices) {
          setSixerMeta(prev => [
            ...prev,
            { start: sixerActiveIndices[0], end: sixerActiveIndices[1] }
          ]);
          setSixerActiveIndices(null);
        } else {
          setSixerMeta(prev => [...prev, null]);
        }
      };
      

    const handleKeyDown = useCallback(
        (e) => {

            if (paused) { e.preventDefault(); return; }

            // Shift pressed then no input
            if (e.shiftKey) {
                e.preventDefault();
                return;
            }

            const key = e.key.toUpperCase();
            const rowActiveIndices = getRowActiveIndices(guesses.length);
            const locked = lockedLetterByRow?.current?.[guesses.length]; // 👈 Add this here

            if (guesses.length >= maxGuesses) return; // Prevent extra guesses

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

                    // skip locked always
                    if (locked && idx === locked.index) continue;

                    // skip empty slots
                    if (updated[idx] === '') continue;

                    // skip revealed: restore the true letter (safety) and keep going left
                    if (revealedIndices.includes(idx)) {
                        updated[idx] = paddedTargetWord[idx];
                        continue;
                    }

                    // normal deletable slot
                    updated[idx] = '';
                    break;
                }

                setCurrentGuess(updated);
            } else if (/^[A-Z]$/.test(key)) {
                const updated = [...currentGuess];

                for (let i = 0; i < rowActiveIndices.length; i++) {
                    const idx = rowActiveIndices[i];

                    // 👇 Skip locked index
                    if (locked && idx === locked.index) continue;

                    if (updated[idx] === '') {
                        if (revealedIndices.includes(idx)) {
                            // Always keep the revealed letter
                            updated[idx] = paddedTargetWord[idx];
                        } else {
                            updated[idx] = key;
                        }
                        break;
                    }
                }

                setCurrentGuess(updated);
            }

        },
        [paused, guesses, currentGuess, revealedIndices, getRowActiveIndices]
    );

    useEffect(() => {
        const rowIndex = guesses.length;
        const locked = lockedLetterByRow?.current?.[rowIndex];

        // Only inject if guess is empty and there's a locked letter
        if (
            locked &&
            currentGuess.every(c => c === '')
        ) {
            const updated = [...currentGuess];
            updated[locked.index] = locked.letter;
            setCurrentGuess(updated);
        }
    }, [guesses.length, currentGuess, lockedLetterByRow, setCurrentGuess]);

    return { handleKeyDown, submitGuess };
}
