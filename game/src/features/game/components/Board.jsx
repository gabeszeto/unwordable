import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './boardStyles.css';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { usePerks } from '../../../contexts/perks/PerksContext';

const WORD_LENGTH = 5;
const MAX_ROW_LENGTH = 7;
const BASE_GUESSES = 6;

import useKeyboardHandlers from './utils/useKeyboardHandlers';

import threeLetterWords from '../../../assets/three-letter-words.txt?raw';
import fourLetterWords from '../../../assets/four-letter-words.txt?raw';
import fiveLetterWords from '../../../assets/five-letter-words.txt?raw';
import sixLetterWords from '../../../assets/six-letter-words.txt?raw';

const validWords = {
  3: threeLetterWords.split('\n').map(w => w.trim().toUpperCase()),
  4: fourLetterWords.split('\n').map(w => w.trim().toUpperCase()),
  5: fiveLetterWords.split('\n').map(w => w.trim().toUpperCase()),
  6: sixLetterWords.split('\n').map(w => w.trim().toUpperCase())
};

export default function Board({
  onRoundComplete,
  setUsedKeys,
  usedKeys,
  targetWord,
  revealedIndices,
  setRevealedIndices,
  onVirtualKey,
  feedbackShownUpToRow,
  setFeedbackShownUpToRow
}) {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(Array(MAX_ROW_LENGTH).fill(''));
  const [shakeRow, setShakeRow] = useState(false);
  const [bouncingIndices, setBouncingIndices] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Local debuffs
  const { activeDebuffs, passiveDebuffs } = useDebuffs();
  const isBlurredVisionActive = activeDebuffs.includes('BlurredVision');
  const isGrellowActive = activeDebuffs.includes('Grellow');

  // Delayed feedback
  const isFeedbackDelayActive = activeDebuffs.includes('DelayedFeedback');
  const FEEDBACK_DELAY_THRESHOLD = 2; // First 2 guesses are delayed

  // Shortened word logic, active only on first row, and if debuff is active
  const [shortenedBlockIndices, setShortenedBlockIndices] = useState([]);

  const getActiveIndices = (len) => {
    const offset = Math.floor((MAX_ROW_LENGTH - len) / 2);
    return Array.from({ length: len }, (_, i) => i + offset);
  };

  useEffect(() => {
    if (shortenedBlockIndices.length === 0) {
      if ('NoThreedom' in passiveDebuffs) {
        setShortenedBlockIndices([1, 5]);
      } else if ('NoFoureedom' in passiveDebuffs) {
        const blockIndex = Math.random() < 0.5 ? 1 : 5;
        setShortenedBlockIndices([blockIndex]);
      }
    }
  }, [passiveDebuffs, shortenedBlockIndices]);

  // ShiftedGuess debuff logic
  const isShiftedGuessActive = passiveDebuffs['ShiftedGuess'] > 0;
  const shiftedGuessRowRef = useRef(null); // Which row to shift (0–2)
  const shiftDirectionRef = useRef(null);
  const [shiftInitialized, setShiftInitialized] = useState(false);

  // Shift init here
  useEffect(() => {
    if (
      isShiftedGuessActive &&
      shiftedGuessRowRef.current === null &&
      shiftDirectionRef.current === null
    ) {
      shiftedGuessRowRef.current = Math.floor(Math.random() * 3); // 0–2
      shiftDirectionRef.current = Math.random() < 0.5 ? -1 : 1;
      setShiftInitialized(true); // force re-render
    }
  }, [isShiftedGuessActive]);

  useEffect(() => {
    if (!isGameOver && guesses.length === 0 && shiftInitialized) {
      const activeIndices = getRowActiveIndices(0); // first row
      const newGuess = Array(MAX_ROW_LENGTH).fill('');
      activeIndices.forEach((i) => {
        newGuess[i] = '';
      });
      setCurrentGuess(newGuess);
    }
  }, [shiftInitialized, shortenedBlockIndices]);

  // Local Perks
  const { jybrishActive } = usePerks();

  // Cut Short logic
  const cutShortStacks = passiveDebuffs['CutShort'] || 0;
  const MAX_GUESSES = Math.max(1, BASE_GUESSES - cutShortStacks);

  function getFinalRowIndices({
    rowIndex,
    wordLength,
    maxRowLength,
    passiveDebuffs,
    shiftedGuessRow,
    shiftDirection,
    shortenedBlockIndices
  }) {
    let indices = getActiveIndices(wordLength); // Only needs wordLength because getActiveIndices is already scoped to maxRowLength

    // Step 1: Apply FourSight (shortening first row)
    if (rowIndex === 0 && 'NoFoureedom' in passiveDebuffs && shortenedBlockIndices != null) {
      indices = indices.filter(i => !shortenedBlockIndices.includes(i));
    }

    // Step 2: Apply ShiftedGuess (only for 1 row)
    if (shiftedGuessRow === rowIndex && shiftDirection != null) {
      indices = indices.map(i => i + shiftDirection).filter(i => i >= 0 && i < maxRowLength);
    }

    return indices;
  }


  const getRowActiveIndices = useCallback((rowIndex) => {
    return getFinalRowIndices({
      rowIndex,
      wordLength: WORD_LENGTH,
      maxRowLength: MAX_ROW_LENGTH,
      passiveDebuffs,
      shortenedBlockIndices,
      shiftedGuessRow: shiftedGuessRowRef.current,
      shiftDirection: shiftDirectionRef.current
    });
  }, [passiveDebuffs, shortenedBlockIndices]);

  const paddedTargetWord = useMemo(() => {
    const padded = Array(MAX_ROW_LENGTH).fill('');
    const offset = Math.floor((MAX_ROW_LENGTH - targetWord.length) / 2);
    targetWord.split('').forEach((char, i) => {
      padded[offset + i] = char;
    });
    return padded;
  }, [targetWord]);

  // Helper to get correct guess
  const isCorrectGuess = (guessStr) => {
    return guessStr === targetWord.toUpperCase();
  };

  const { handleKeyDown } = useKeyboardHandlers({
    guesses,
    currentGuess,
    setCurrentGuess,
    setGuesses,
    targetWord,
    MAX_ROW_LENGTH,
    MAX_GUESSES,
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
    activeDebuffs,
    feedbackShownUpToRow,
    setFeedbackShownUpToRow,
    FEEDBACK_DELAY_THRESHOLD
  });

  // Revelation logic
  useEffect(() => {
    setCurrentGuess(prev => {
      const updated = [...prev];
      revealedIndices.forEach(i => updated[i] = paddedTargetWord[i]);
      return updated;
    });
  }, [revealedIndices, targetWord]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getLetterClass = (letter, index, isCurrentRow, rowActiveIndices) => {
    if (!letter || !rowActiveIndices.includes(index)) return '';

    if (revealedIndices.includes(index) && isCurrentRow) return 'correct';

    const targetChar = paddedTargetWord[index];
    const isExact = letter === targetChar;
    const isBlurredGreen =
      isBlurredVisionActive &&
      !isCurrentRow &&
      [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
        .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
        .includes(letter);

    if (isExact || isBlurredGreen) return 'correct';

    const isPresent = paddedTargetWord.includes(letter);

    // 🎯 Yellowless logic override
    if (isPresent && activeDebuffs.includes('Yellowless')) {
      return 'absent';
    }

    if (isPresent) return 'present';

    return 'absent';
  };


  const renderRow = (guessArray, rowIndex, isSubmitted) => {
    const rowActiveIndices = getRowActiveIndices(rowIndex);
    const cursorIndex = rowActiveIndices.find(i => guessArray[i] === '' && !revealedIndices.includes(i));

    const guessStr = rowActiveIndices.map(i => guessArray[i]).join('');
    const overrideAllCorrect = isSubmitted && isCorrectGuess(guessStr);

    const letters = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => {
      const letter = guessArray[i] || '';
      const isActive = rowActiveIndices.includes(i);
      const isBlockedSlot =
        rowIndex === 0 &&
        'NoFoureedom' in passiveDebuffs &&
        shortenedBlockIndices.includes(i) &&
        !getRowActiveIndices(rowIndex).includes(i);

      const displayLetter = !isSubmitted && revealedIndices.includes(i)
        ? paddedTargetWord[i]
        : letter;

      const feedbackSuppressed =
        isFeedbackDelayActive &&
        rowIndex <= 1 &&
        rowIndex > feedbackShownUpToRow;

      const shouldApplyFeedback = (isSubmitted || revealedIndices.includes(i)) && !feedbackSuppressed;

      let letterClass = '';

      if (shouldApplyFeedback) {
        if (overrideAllCorrect && isActive) {
          letterClass = 'correct'; // Boss override
        } else {
          letterClass = getLetterClass(letter, i, !isSubmitted, rowActiveIndices);

          // 👇 Override green with yellow if Grellow is active
          if (isGrellowActive && letterClass === 'correct') {
            letterClass = 'present';
          }
        }
      }

      if (
        bouncingIndices.includes(i) &&
        isSubmitted &&
        rowIndex === guesses.length - 1
      ) {
        letterClass += ' bounce';
      }

      const isCurrent = !isSubmitted && i === cursorIndex;

      return (
        <div
          className={`
            letter 
            ${letterClass} 
            ${isCurrent ? 'current-input' : ''} 
            ${!isActive ? 'inactive' : ''} 
            ${isBlockedSlot ? 'blocked' : ''}
          `}
          key={i}
          style={
            bouncingIndices.includes(i) &&
              isSubmitted &&
              rowIndex === guesses.length - 1
              ? { animationDelay: `${i * 0.1}s` }
              : {}
          }
        >
          {displayLetter}
        </div>
      );
    });

    return (
      <div
        className={`guess-row ${!isSubmitted && rowIndex === guesses.length && shakeRow ? 'shake' : ''}`}
        key={rowIndex}
      >
        {letters}
      </div>
    );
  };


  const renderEmptyRow = (rowIndex) => {
    const rowActiveIndices = getRowActiveIndices(rowIndex);
    const emptyCells = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => (
      <div
        className={`letter ${!rowActiveIndices.includes(i) ? 'inactive' : ''}`}
        key={i}
      />
    ));
    return <div className="guess-row" key={`empty-${rowIndex}`}>{emptyCells}</div>;
  };

  const rows = useMemo(() => {
    const renderedRows = [
      ...guesses.map((guessStr, i) => {
        const guessArray = Array(MAX_ROW_LENGTH).fill('');
        const rowActiveIndices = getRowActiveIndices(i);
        rowActiveIndices.forEach((idx, j) => {
          guessArray[idx] = guessStr[j];
        });
        return renderRow(guessArray, i, true);
      }),
    ];

    if (!isGameOver) {
      renderedRows.push(renderRow(currentGuess, guesses.length, false));
    }

    const totalRows = isGameOver ? guesses.length : guesses.length + 1;
    const remaining = MAX_GUESSES - totalRows;

    for (let i = 0; i < remaining; i++) {
      const globalRowIndex = totalRows + i;
      renderedRows.push(renderEmptyRow(globalRowIndex));
    }

    return renderedRows;
  }, [guesses, currentGuess, isGameOver, revealedIndices, shakeRow, shortenedBlockIndices, shiftInitialized, MAX_GUESSES]);

  useEffect(() => {
    if (typeof onVirtualKey === 'function') {
      onVirtualKey(() => handleKeyDown);
    }
  }, [handleKeyDown]);

  return (
    <div className="board-container">
      <div className="board">
        {rows}
      </div>
      <div className="devWord">{targetWord}</div>
      {jybrishActive && (
        <div className="jybrish-banner">
          Jybrish Activated
        </div>
      )}
    </div>
  );
}
