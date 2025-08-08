import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './boardStyles.css';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCorrectness } from '../../../contexts/CorrectnessContext';
import { useBoardHelper } from '../../../contexts/BoardHelperContext';

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
  guesses,
  setGuesses,
  onRoundComplete,
  setUsedKeys,
  usedKeys,
  targetWord,
  onVirtualKey,
  feedbackShownUpToRow,
  setFeedbackShownUpToRow,
  setSixerMode,
  sixerMode
}) {
  const [guessRanges, setGuessRanges] = useState([]);
  const { revealedIndices } = useCorrectness();
  const { setRowsAfterDebuffs, rowsAfterDebuffs, getRowActiveIndices: getRowFromHelper } = useBoardHelper();

  const [currentGuess, setCurrentGuess] = useState(Array(MAX_ROW_LENGTH).fill(''));
  const [shakeRow, setShakeRow] = useState(false);
  const [bouncingIndices, setBouncingIndices] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  const [boardInitialized, setBoardInitialized] = useState(false);

  // Local debuffs
  const { activeDebuffs, passiveDebuffs } = useDebuffs();
  const isBlurredVisionActive = activeDebuffs.includes('BlurredVision');
  const isGrellowActive = activeDebuffs.includes('Grellow');

  // GoldenLie
  const goldenLieUsedPerRow = useRef(new Set());
  const goldenLieInjectedIndex = useRef({});

  // Delayed feedback
  const isFeedbackDelayActive = activeDebuffs.includes('DelayedFeedback');
  const FEEDBACK_DELAY_THRESHOLD = 2; // First 2 guesses are delayed

  const baseIndices = (len, maxLen) => {
    const offset = Math.floor((maxLen - len) / 2);
    return Array.from({ length: len }, (_, i) => i + offset);
  };

  // Initial render logic
  const shiftedGuessRowRef = useRef(null);
  const shiftDirectionRef = useRef(null);
  const lockedLetterByRow = useRef({});
  const [letterLocked, setLetterLocked] = useState(false)

  // Cut Short logic
  const cutShortStacks = passiveDebuffs['CutShort'] || 0;
  const MAX_GUESSES = Math.max(1, BASE_GUESSES - cutShortStacks);

  // Local Perks
  const { jybrishActive } = usePerks();
  const [sixerActiveIndices, setSixerActiveIndices] = useState(null);
  const [sixerMeta, setSixerMeta] = useState([]); // e.g. [{ start: 0 }, null, { start: 1 }, ...]


  // Grab row indices
  const getRowIndicesSafe = useCallback((rowIndex) => {
    return (rowsAfterDebuffs?.[rowIndex] && rowsAfterDebuffs[rowIndex].length)
      ? rowsAfterDebuffs[rowIndex]
      : baseIndices(WORD_LENGTH, MAX_ROW_LENGTH); // fallback only if init hasn’t landed
  }, [rowsAfterDebuffs]);

  const getRowActiveIndices = useCallback((rowIndex) => {
    const base = getRowIndicesSafe(rowIndex);
    // Overlay Sixer only on the *current* editing row
    if (sixerActiveIndices && rowIndex === guesses.length) {
      return Array.from({ length: 6 }, (_, k) => sixerActiveIndices[0] + k);
    }
    return base;
  }, [getRowIndicesSafe, sixerActiveIndices, guesses.length]);

  // THE CHUNKY USEEFFECT FOR INITIAL RENDER BIG BIGBIG
  useEffect(() => {
    // reset per-round stuff
    setBoardInitialized(false);
    setRowsAfterDebuffs([]);
    lockedLetterByRow.current = {};
    // (optional) also clear per-row metadata:
    // setSixerMeta([]); setGuessRanges([]);

    // ----- Step 1: first-row shortening (NoThreedom / NoFoureedom)
    const firstRowBase = baseIndices(WORD_LENGTH, MAX_ROW_LENGTH); // [1..5]
    let shortenedFirstRow = firstRowBase;
    if ('NoThreedom' in passiveDebuffs) {
      shortenedFirstRow = firstRowBase.filter(i => i !== 1 && i !== 5); // [2,3,4]
    } else if ('NoFoureedom' in passiveDebuffs) {
      const block = Math.random() < 0.5 ? 1 : 5;
      shortenedFirstRow = firstRowBase.filter(i => i !== block);        // [2..5] or [1..4]
    }

    // ----- Step 2: ShiftedGuess (choose one row & a direction)
    const shiftActive = (passiveDebuffs['ShiftedGuess'] || 0) > 0;
    if (shiftActive) {
      shiftedGuessRowRef.current = Math.random() < 0.5 ? 1 : 2;      shiftDirectionRef.current = Math.random() < 0.5 ? -1 : +1;  // -1 or +1
    } else {
      shiftedGuessRowRef.current = null;
      shiftDirectionRef.current = null;
    }

    // helper to apply shift (bounded by board)
    const applyShift = (indices, rowIndex) => {
      if (shiftedGuessRowRef.current !== rowIndex || shiftDirectionRef.current == null) return indices;
      const dir = shiftDirectionRef.current;
      return indices.map(i => i + dir).filter(i => i >= 0 && i < MAX_ROW_LENGTH);
    };

    // ----- Step 3: compute all rows after debuffs (no Sixer overlay here)
    const rows = [];
    for (let row = 0; row < MAX_GUESSES; row++) {
      let indices = baseIndices(WORD_LENGTH, MAX_ROW_LENGTH);
      if (row === 0) indices = shortenedFirstRow;       // first-row shorten
      indices = applyShift(indices, row);               // maybe shifted
      rows.push(indices);
    }

    setRowsAfterDebuffs(rows);

    // ----- Step 4: seed LetterLock using the final rows
    if ('LetterLock' in passiveDebuffs) {
      const topLetters = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
      const eligibleRows = [0, 1, 2];
      const lockRow = eligibleRows[Math.floor(Math.random() * eligibleRows.length)];
      const allowed = rows[lockRow] ?? [];
      if (allowed.length) {
        // if you want to avoid already revealed cells, do it here (optional)
        const pool = allowed; // or: allowed.filter(i => !revealedIndices.includes(i))
        const lockIndex = pool[Math.floor(Math.random() * pool.length)];
        const lockLetter = topLetters[Math.floor(Math.random() * topLetters.length)];
        lockedLetterByRow.current[lockRow] = { index: lockIndex, letter: lockLetter };
        setLetterLocked(true);
      }
    }

    // ----- Step 5: seed the current guess row NOW that rows are final
    {
      const firstRow = rows[0] ?? [];
      const next = Array(MAX_ROW_LENGTH).fill('');
      // touch only playable slots (clarity; all others stay '')
      firstRow.forEach(i => { next[i] = ''; });
      setCurrentGuess(next);
    }

    // ----- Step 6: mark board ready
    setBoardInitialized(true);
  }, [
    passiveDebuffs,     // shape/flags that change round layout
    MAX_GUESSES,
    MAX_ROW_LENGTH,
    WORD_LENGTH
  ]);

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
    goldenLieInjectedIndex,
    lockedLetterByRow,
    setGuessRanges,
    sixerActiveIndices,
    setSixerActiveIndices,
    setSixerMeta
  });

  // Revelation logic
  useEffect(() => {
    if (!paddedTargetWord) return;

    setCurrentGuess(prev => {
      const updated = [...prev];
      revealedIndices.forEach(i => {
        updated[i] = paddedTargetWord[i];
      });
      return updated;
    });
  }, [revealedIndices, paddedTargetWord]);

  useEffect(() => {
    if (!boardInitialized) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardInitialized, handleKeyDown]);

  const getLetterClass = (letter, index, isCurrentRow, rowActiveIndices, rowIndex) => {
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

    // 🎯 Yellowless override
    if (isPresent && activeDebuffs.includes('Yellowless')) {
      return 'absent';
    }

    if (isPresent) return 'present';

    // Golden Lie
    if (
      activeDebuffs.includes('GoldenLie') &&
      goldenLieUsedPerRow.current.has(rowIndex)
    ) {
      const injectedIdx = goldenLieInjectedIndex.current?.[rowIndex];

      if (injectedIdx === index) {
        return 'present'; // This letter is the fake yellow
      }
    }

    return 'absent';
  };


  const renderRow = (
    guessArray,
    rowIndex,
    isSubmitted,
    forcedActiveIndices = null,
    sixerThisRow = null
  ) => {
    const rowActiveIndices = forcedActiveIndices || getRowActiveIndices(rowIndex);
    const cursorIndex = rowActiveIndices.find(i => guessArray[i] === '' && !revealedIndices.includes(i));

    // Sixer
    const isCurrentGuessRow = rowIndex === guesses.length;

    const isSixerSelectable =
      isCurrentGuessRow && sixerMode && sixerActiveIndices === null;

    // Normal
    const guessStr = rowActiveIndices.map(i => guessArray[i]).join('');
    const overrideAllCorrect = isSubmitted && isCorrectGuess(guessStr);

    const letters = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => {
      const letter = guessArray[i] || '';
      const isActive = rowActiveIndices.includes(i);

      let displayLetter = letter;

      // Show locked letter in correct position on the right row
      if (!isSubmitted && lockedLetterByRow.current[rowIndex]) {
        const { index: lockedIndex, letter: lockedChar } = lockedLetterByRow.current[rowIndex];
        if (i === lockedIndex) {
          displayLetter = lockedChar;
        }
      }


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
          letterClass = getLetterClass(letter, i, !isSubmitted, rowActiveIndices, rowIndex);

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
      const isSixerSelectableTile = isSixerSelectable && (i === 0 || i === 6);
      const sixerData = sixerMeta[rowIndex];
      const isSixerLockedVisual = sixerData
        ? i >= sixerData.start && i <= sixerData.end
        : false;
      return (
        <div
          className={`
        letter 
        ${letterClass} 
        ${isCurrent ? 'current-input' : ''} 
        ${!isActive ? 'inactive' : ''} 
        ${isSixerSelectableTile ? 'sixer-entry' : ''}
        ${isSixerLockedVisual ? 'sixer-locked' : ''}

      `}
          key={i}
          style={
            bouncingIndices.includes(i) &&
              isSubmitted &&
              rowIndex === guesses.length - 1
              ? { animationDelay: `${i * 0.1}s` }
              : {}
          }
          onClick={() => {
            console.log('clicked button')
            console.log(`is sixer selectable: ${isSixerSelectable}, number is ${i}`)
            if (isSixerSelectableTile) {
              const start = i === 0 ? 0 : 1;
              const end = start + 5;
              console.log('clickingclack')
              setSixerActiveIndices([start, end]);
              setSixerMode(false);
            }
          }}
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

    const locked = lockedLetterByRow.current?.[rowIndex];

    const emptyCells = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => {
      const isLocked = locked?.index === i;
      const letter = isLocked ? locked.letter : '';

      return (
        <div
          className={`letter ${!rowActiveIndices.includes(i) ? 'inactive' : ''} ${isLocked ? 'locked' : ''}`}
          key={i}
        >
          {letter}
        </div>
      );
    });

    return <div className="guess-row" key={`empty-${rowIndex}`}>{emptyCells}</div>;
  };


  const rows = useMemo(() => {
    const renderedRows = [
      ...guesses.map((guessStr, i) => {
        const guessArray = Array(MAX_ROW_LENGTH).fill('');
        const rowActiveIndices = guessRanges[i] || getRowActiveIndices(i);
        rowActiveIndices.forEach((idx, j) => {
          guessArray[idx] = guessStr[j];
        });

        const sixerThisRow = sixerMeta[i]; // e.g. { start: 0 } or null

        return renderRow(guessArray, i, true, rowActiveIndices, sixerThisRow);
      })
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
  }, [
    guesses,
    currentGuess,
    isGameOver,
    revealedIndices,
    shakeRow,
    sixerMode,
    sixerMeta,
    MAX_GUESSES,
    getRowActiveIndices
  ]);

  useEffect(() => {
    if (typeof onVirtualKey === 'function') {
      onVirtualKey(() => handleKeyDown);
    }
  }, [handleKeyDown]);

  if (!boardInitialized) {
    return (
      <div className="board-container">
        <div className="board" />
      </div>
    );
  }

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
