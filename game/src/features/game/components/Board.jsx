import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './boardStyles.css';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCorrectness } from '../../../contexts/CorrectnessContext';
import { useBoardHelper } from '../../../contexts/BoardHelperContext';

const WORD_LENGTH = 5;
const MAX_ROW_LENGTH = 7;

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
  sixerMode,
  maxGuesses,
  stage,
  paused
}) {
  const [guessRanges, setGuessRanges] = useState([]);
  const { revealedIndices, getRevealedForRow } = useCorrectness();
  const { setRowsAfterDebuffs, rowsAfterDebuffs, getRowActiveIndices: getRowFromHelper } = useBoardHelper();

  const [currentGuess, setCurrentGuess] = useState(Array(MAX_ROW_LENGTH).fill(''));
  const [shakeRow, setShakeRow] = useState(false);
  const [bouncingIndices, setBouncingIndices] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  const layoutRef = useRef(null);
  const [boardInitialized, setBoardInitialized] = useState(false);

  // Local debuffs
  const { activeDebuffs, passiveDebuffs } = useDebuffs();
  const isBlurredVisionActive = activeDebuffs.includes('BlurredVision');
  const isGrellowActive = activeDebuffs.includes('Grellow');

  // GoldenLie
  const goldenLieUsedPerRow = useRef(new Set());
  const goldenLieInjectedIndex = useRef({});

  // Delayed feedback
  const isFeedbackDelayActive = (passiveDebuffs.DelayedFeedback ?? 0) > 0;
  const FEEDBACK_DELAY_THRESHOLD = 2; // First 2 guesses are delayed

  const baseIndices = (len, maxLen) => {
    const offset = Math.floor((maxLen - len) / 2);
    return Array.from({ length: len }, (_, i) => i + offset);
  };

  function buildRowIndices(rowIndex, params) {
    const { shortenedFirstRow, shiftedRow, shiftDir } = params;
    let indices = baseIndices(WORD_LENGTH, MAX_ROW_LENGTH);
    if (rowIndex === 0) indices = shortenedFirstRow;
    if (shiftedRow === rowIndex && shiftDir !== 0) {
      indices = indices.map(i => i + shiftDir).filter(i => i >= 0 && i < MAX_ROW_LENGTH);
    }
    return indices;
  }

  // Initial render logic
  const lockedLetterByRow = useRef({});

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
    setBoardInitialized(false);
    setRowsAfterDebuffs([]);
    lockedLetterByRow.current = {};
    goldenLieUsedPerRow.current = new Set();
    goldenLieInjectedIndex.current = {};

    // ----- compute shortened first row
    const firstRowBase = baseIndices(WORD_LENGTH, MAX_ROW_LENGTH);
    let shortenedFirstRow = firstRowBase;
    const hasNo3 = !!passiveDebuffs?.NoThreedom;
    const hasNo4 = !!passiveDebuffs?.NoFoureedom;
    if (hasNo3) {
      shortenedFirstRow = firstRowBase.filter(i => i !== 1 && i !== 5);
    } else if (hasNo4) {
      const block = Math.random() < 0.5 ? 1 : 5;
      shortenedFirstRow = firstRowBase.filter(i => i !== block);
    }

    // ----- choose shifted row + dir once
    const hasShift = (passiveDebuffs?.ShiftedGuess || 0) > 0;
    const shiftedRow = hasShift ? (Math.random() < 0.5 ? 1 : 2) : null;
    const shiftDir = hasShift ? (Math.random() < 0.5 ? -1 : +1) : 0;

    // stash params for this round
    layoutRef.current = { shortenedFirstRow, shiftedRow, shiftDir };

    // build rows for current maxGuesses with the frozen params
    const rows = [];
    for (let r = 0; r < maxGuesses; r++) rows.push(buildRowIndices(r, layoutRef.current));
    setRowsAfterDebuffs(rows);

    // ----- seed LetterLock once (uses the frozen rows)
    if ((passiveDebuffs?.LetterLock ?? 0) > 0) {
      const topLetters = ['E', 'A', 'R', 'I', 'O', 'T', 'N', 'S', 'L', 'C'];
      const eligibleRows = [0, 1, 2].filter(r => r < rows.length);
      if (eligibleRows.length) {
        const lockRow = eligibleRows[Math.floor(Math.random() * eligibleRows.length)];
        const allowed = rows[lockRow] ?? [];
        if (allowed.length) {
          const lockIndex = allowed[Math.floor(Math.random() * allowed.length)];
          const lockLetter = topLetters[Math.floor(Math.random() * topLetters.length)];
          lockedLetterByRow.current[lockRow] = { index: lockIndex, letter: lockLetter };
        }
      }
    }

    // seed current guess row using frozen first row
    const firstRow = rows[0] ?? [];
    const next = Array(MAX_ROW_LENGTH).fill('');
    firstRow.forEach(i => { next[i] = ''; });
    setCurrentGuess(next);

    setBoardInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stage,
    passiveDebuffs?.NoThreedom,
    passiveDebuffs?.NoFoureedom,
    passiveDebuffs?.ShiftedGuess,
    passiveDebuffs?.LetterLock,
  ]);

  // Rebuild rows if borrowed time
  useEffect(() => {
    if (!layoutRef.current) return;
    const rows = [];
    for (let r = 0; r < maxGuesses; r++) rows.push(buildRowIndices(r, layoutRef.current));
    setRowsAfterDebuffs(rows);
  }, [maxGuesses, setRowsAfterDebuffs]);


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
    maxGuesses,
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
    setSixerMeta,
    paused
  });

  // Revelation logic
  useEffect(() => {
    if (!boardInitialized) return;
    const rowIndex = guesses.length; // current row only
    const rowReveals = getRevealedForRow(rowIndex);

    setCurrentGuess(prev => {
      const updated = [...prev];
      rowReveals.forEach(i => { updated[i] = paddedTargetWord[i]; });
      return updated;
    });
  }, [boardInitialized, guesses.length, getRevealedForRow, paddedTargetWord]);

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

    // 🔒 use row-scoped revelations
    const rowReveals = getRevealedForRow(rowIndex);

    // caret: first empty, non-revealed slot in THIS row
    const cursorIndex = rowActiveIndices.find(
      i => guessArray[i] === '' && !rowReveals.includes(i)
    );

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
      if (!isSubmitted) {
        if (rowReveals.includes(i)) {
          // force the real target letter when revealed
          displayLetter = paddedTargetWord[i];
        } else if (lockedLetterByRow.current[rowIndex]?.index === i) {
          // only show the lock if the cell is NOT revealed
          displayLetter = lockedLetterByRow.current[rowIndex].letter;
        }
      }

      const feedbackSuppressed =
        isFeedbackDelayActive &&
        rowIndex <= 1 &&
        rowIndex > feedbackShownUpToRow;

      // 👇 consider revealed-for-this-row as “feedback should show”
      const isSuppressed = feedbackSuppressed && !overrideAllCorrect;

      // ✅ show feedback if submitted, revealed-for-this-row, or override
      const shouldApplyFeedback =
        (isSubmitted || rowReveals.includes(i) || overrideAllCorrect) && !isSuppressed;
      let letterClass = '';

      if (shouldApplyFeedback) {
        if (overrideAllCorrect && isActive) {
          letterClass = 'correct'; // Boss override
        } else {
          letterClass = getLetterClass(displayLetter, i, !isSubmitted, rowActiveIndices, rowIndex);

          // If this tile was revealed for THIS row, force green when editing this row
          if (!isSubmitted && rowReveals.includes(i)) {
            letterClass = 'correct';
          }

          // 👁 Grellow downgrade
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
            if (isSixerSelectableTile) {
              const start = i === 0 ? 0 : 1;
              const end = start + 5;
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


  const renderEmptyRow = (rowIndex, forceInactive = false) => {
    const rowActiveIndices = getRowActiveIndices(rowIndex);
    const locked = lockedLetterByRow.current?.[rowIndex];
  
    const emptyCells = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => {
      const isLocked = !forceInactive && locked?.index === i; // no locks when forced inactive
      const letter = isLocked ? locked.letter : '';
  
      const inactiveClass = forceInactive
        ? 'inactive'
        : (!rowActiveIndices.includes(i) ? 'inactive' : '');
  
      return (
        <div
          className={`letter ${inactiveClass} ${isLocked ? 'locked' : ''}`}
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
  
        const sixerThisRow = sixerMeta[i];
        return renderRow(guessArray, i, true, rowActiveIndices, sixerThisRow);
      })
    ];
  
    // current editing row (if not game over)
    if (!isGameOver) {
      renderedRows.push(renderRow(currentGuess, guesses.length, false));
    }
  
    const totalRowsRendered = isGameOver ? guesses.length : guesses.length + 1;
  
    // First: normal empty rows up to maxGuesses
    for (let r = totalRowsRendered; r < Math.min(maxGuesses, 6); r++) {
      renderedRows.push(renderEmptyRow(r, /*forceInactive*/ false));
    }
  
    // Then: force inactive rows to fill to 6 rows
    for (let r = Math.max(totalRowsRendered, maxGuesses); r < 6; r++) {
      renderedRows.push(renderEmptyRow(r, /*forceInactive*/ true));
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
    maxGuesses,
    getRowActiveIndices,
    guessRanges
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
