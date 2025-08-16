import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './boardStyles.css';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCorrectness } from '../../../contexts/CorrectnessContext';
import { useBoardHelper } from '../../../contexts/BoardHelperContext';

import {
  loadBoardState,
  replaceBoardState,
  patchBoardState,
} from '../../save';

const WORD_LENGTH = 5;
const MAX_ROW_LENGTH = 7;

import useKeyboardHandlers from './utils/useKeyboardHandlers';

import { shouldHideYellow } from '../../engine/yellowless';
import { shouldHideYellowDebug } from '../../engine/yellowlessDebug';
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
  paused,
  runId
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

  const [savedGuessRecords, setSavedGuessRecords] = useState([]);

  // Local debuffs
  const { activeDebuffs, passiveDebuffs } = useDebuffs();

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

  // NEW CHUNKY USEEFFECT
  useEffect(() => {
    setBoardInitialized(false);
    setRowsAfterDebuffs([]);
    lockedLetterByRow.current = {};
    goldenLieUsedPerRow.current = new Set();
    goldenLieInjectedIndex.current = {};


    const hasNo3 = !!passiveDebuffs?.NoThreedom;
    const hasNo4 = !!passiveDebuffs?.NoFoureedom;
    const hasShift = (passiveDebuffs?.ShiftedGuess || 0) > 0;
    const hasLock = (passiveDebuffs?.LetterLock || 0) > 0;

    // ---- 1) Try to restore from save for this stage
    const saved = loadBoardState(stage);
    const savedOK = (() => {
      if (!saved) return false;
      // If runId exists in both, they must match
      if (saved.runId && runId && saved.runId !== runId) return false;
      
      // Shape checks: first-row length must match debuffs
      const expectedFirstLen = 5 - (hasNo3 ? 2 : hasNo4 ? 1 : 0);
      const savedFirstLen =
        Array.isArray(saved.rowsAfterDebuffs?.[0])
          ? saved.rowsAfterDebuffs[0].length
          : Array.isArray(saved.layout?.shortenedFirstRow)
            ? saved.layout.shortenedFirstRow.length
            : 5;
      if (savedFirstLen !== expectedFirstLen) return false;

      // ShiftedGuess: require shiftedRow + shiftDir if active; require none if inactive
      const savedHasShift =
        Number.isFinite(saved.layout?.shiftedRow) && (saved.layout?.shiftDir === -1 || saved.layout?.shiftDir === 1);
      if (hasShift !== savedHasShift) return false;

      // LetterLock presence/shape must match
      const locksObj = saved.lockedLetterByRow || {};
      const savedHasAnyLock = Object.keys(locksObj).length > 0;
      if (hasLock !== savedHasAnyLock) return false;

      if (hasLock) {
        // at least one valid lock: row in 0..2, index inside that row, letter A-Z
        const rows = Array.isArray(saved.rowsAfterDebuffs) ? saved.rowsAfterDebuffs : [];
        const okLock = Object.entries(locksObj).some(([rowStr, lock]) => {
          const r = Number(rowStr);
          if (!Number.isFinite(r) || r < 0 || r > 2) return false;
          const rowIndices = Array.isArray(rows[r]) ? rows[r] : [];
          const idxOK = Number.isFinite(lock?.index) && rowIndices.includes(lock.index);
          const letterOK = typeof lock?.letter === 'string' && /^[A-Z]$/.test(lock.letter);
          return idxOK && letterOK;
        });
        if (!okLock) return false;
        return true;

      }
    })();

    if (savedOK) {
      // hydrate layout + rows
      const { layout, rowsAfterDebuffs: rows, lockedLetterByRow: locks, maxGuesses: savedMax } = saved;

      layoutRef.current = layout || { shortenedFirstRow: [], shiftedRow: null, shiftDir: 0 };
      setRowsAfterDebuffs(Array.isArray(rows) ? rows : []);

      lockedLetterByRow.current = locks || {};

      const savedRows = Array.isArray(saved.guesses) ? saved.guesses : [];
      setSavedGuessRecords(savedRows);
      if (savedRows.length) {
        // fill the props from parent via setters
        setGuesses(savedRows.map(g => g.word));
        setGuessRanges(savedRows.map(g => g.indices));
        setSixerMeta(new Array(savedRows.length).fill(null));
      }

      // seed empty current row using the saved first row
      const firstRow = (rows && rows[0]) || [];
      const next = Array(MAX_ROW_LENGTH).fill('');
      firstRow.forEach(i => { next[i] = ''; });
      setCurrentGuess(next);

      // (optional) align max guesses to save; if you prefer prop to win, delete this
      // if (typeof savedMax === 'number' && savedMax !== maxGuesses) {
      //   setMaxGuesses(savedMax); // only if you own this state here
      // }

      setBoardInitialized(true);

      console.log('same run')
      return; // ✅ restored; stop here
    }

    // ---- 2) Otherwise compute fresh and persist

    // ----- compute shortened first row
    const firstRowBase = baseIndices(WORD_LENGTH, MAX_ROW_LENGTH);
    let shortenedFirstRow = firstRowBase;
    if (hasNo3) {
      shortenedFirstRow = firstRowBase.filter(i => i !== 1 && i !== 5);
    } else if (hasNo4) {
      const block = Math.random() < 0.5 ? 1 : 5;
      shortenedFirstRow = firstRowBase.filter(i => i !== block);
    }

    // ----- choose shifted row + dir once
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

    setSavedGuessRecords([]);
    setBoardInitialized(true);

    // ---- persist the initial layout for this stage
    replaceBoardState(stage, {
      runId,
      layout: layoutRef.current,
      rowsAfterDebuffs: rows,
      lockedLetterByRow: lockedLetterByRow.current,
      maxGuesses,
    }, 'board-initialized');

    console.log('new run')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    runId,
    stage,
    passiveDebuffs?.NoThreedom,
    passiveDebuffs?.NoFoureedom,
    passiveDebuffs?.ShiftedGuess,
    passiveDebuffs?.LetterLock,
  ]);


  useEffect(() => {
    const s = loadBoardState(stage);
    setSavedGuessRecords(
      s && (!runId || !s.runId || s.runId === runId) && Array.isArray(s.guesses) ? s.guesses : []
    );
  }, [runId, stage, guesses.length]);

  // Rebuild rows if borrowed time
  useEffect(() => {
    if (!layoutRef.current) return;
    const rows = [];
    for (let r = 0; r < maxGuesses; r++) rows.push(buildRowIndices(r, layoutRef.current));
    setRowsAfterDebuffs(rows);

    // keep save in sync
    patchBoardState(stage, {
      rowsAfterDebuffs: rows,
      maxGuesses,
    }, 'board-rebuild-maxGuesses');
  }, [maxGuesses, setRowsAfterDebuffs, stage]);



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
    stage,
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

  // Put this near the component, above renderRow (has access to paddedTargetWord & activeDebuffs)
  const computeRowVisualStatuses = (guessStr, rowActiveIndices, activeDebuffs, paddedTargetWord, rowIndex) => {
    const len = rowActiveIndices.length;

    // Count target letters for just this row's slots
    const remaining = {};
    for (let i = 0; i < len; i++) {
      const idx = rowActiveIndices[i];
      const t = paddedTargetWord[idx];
      remaining[t] = (remaining[t] || 0) + 1;
    }

    const raw = new Array(len).fill('absent');

    // Pass 1: mark true exacts (consume), blurred-correct (do NOT consume)
    for (let i = 0; i < len; i++) {
      const idx = rowActiveIndices[i];
      const letter = guessStr[i];
      if (!letter) continue;

      const targetChar = paddedTargetWord[idx];
      const isExact = letter === targetChar;

      const isBlurredGreen =
        activeDebuffs.includes('BlurredVision') &&
        [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
          .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
          .includes(letter);

      if (isExact) {
        raw[i] = 'correct';
        remaining[letter] = (remaining[letter] || 0) - 1; // consume a real copy
      } else if (isBlurredGreen) {
        raw[i] = 'correct'; // visual only, don't consume
      }
    }

    // Pass 2: award presents only if target still has copies left
    for (let i = 0; i < len; i++) {
      if (raw[i] !== 'absent') continue;
      const letter = guessStr[i];
      if (!letter) continue;

      if ((remaining[letter] || 0) > 0) {
        raw[i] = 'present';
        remaining[letter] = remaining[letter] - 1;
      }
    }

    // Visual transforms
    const grellow = activeDebuffs.includes('Grellow');
    const yellowless = activeDebuffs.includes('Yellowless');

    const visual = raw.map((s, j) => {
      let v = s;
      if (grellow && v === 'correct') v = 'present';

      if (yellowless && s === 'present') {
        const hide = shouldHideYellow({
          // Use the SAME field here as in submitGuess (round or stage)
          stage,                     // or stage — just be consistent
          guessIndex: rowIndex,      // submitted row index
          colAbs: rowActiveIndices[j],
          targetWord: targetWord.toUpperCase(),
          guess: guessStr,           // this is already the row's guess letters
        }, 1 / 3);
        v = hide ? 'absent' : 'present';
      }
      return v;
    });

    // Map back to board indices for easy lookup when rendering
    const byBoardIndex = {};
    for (let i = 0; i < len; i++) {
      byBoardIndex[rowActiveIndices[i]] = visual[i];
    }
    return byBoardIndex;
  };


  const renderRow = (
    guessArray,
    rowIndex,
    isSubmitted,
    forcedActiveIndices = null,
    sixerThisRow = null
  ) => {
    const rowActiveIndices = forcedActiveIndices || getRowActiveIndices(rowIndex);

    let savedStatusesByBoardIndex = null;
    if (isSubmitted) {
      const rec = savedGuessRecords[rowIndex];
      if (rec && Array.isArray(rec.indices) && Array.isArray(rec.statuses)) {
        savedStatusesByBoardIndex = {};
        for (let k = 0; k < rec.indices.length; k++) {
          savedStatusesByBoardIndex[rec.indices[k]] = rec.statuses[k];
        }
      }
    }

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

    // --- NEW: precompute this row's visual statuses (Wordle 2-pass + debuffs) ---
    const rowStatusesByBoardIndex = computeRowVisualStatuses(
      guessStr,
      rowActiveIndices,
      activeDebuffs,
      paddedTargetWord,
      rowIndex
    );

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

      if (shouldApplyFeedback && isActive) {
        if (overrideAllCorrect) {
          letterClass = 'correct'; // Boss override
        } else {
          // Use our computed statuses for this row
          // letterClass = rowStatusesByBoardIndex[i] || 'absent';

          if (isSubmitted && savedStatusesByBoardIndex) {
            letterClass = savedStatusesByBoardIndex[i] ?? 'absent';
          } else {
            letterClass = rowStatusesByBoardIndex[i] || 'absent';
          }


          // If this tile was revealed for THIS row, force green when editing this row
          if (!isSubmitted && rowReveals.includes(i)) {
            letterClass = 'correct';
          }

          // if (activeDebuffs.includes('GoldenLie') && goldenLieUsedPerRow.current.has(rowIndex)) {
          //   const injectedIdx = goldenLieInjectedIndex.current?.[rowIndex];
          //   if (injectedIdx === i) {
          //     letterClass = 'present';
          //   }
          // }
          if (!savedStatusesByBoardIndex &&
            activeDebuffs.includes('GoldenLie') &&
            goldenLieUsedPerRow.current.has(rowIndex)) {
            const injectedIdx = goldenLieInjectedIndex.current?.[rowIndex];
            if (injectedIdx === i) letterClass = 'present';
          }

          // Grellow downgrade is already applied inside computeRowVisualStatuses,
          // but keep this in case you sometimes want to force it at render time.
          // if (activeDebuffs.includes('Grellow') && letterClass === 'correct') {
          //   letterClass = 'present';
          // }

          if (!savedStatusesByBoardIndex &&
            activeDebuffs.includes('Grellow') &&
            letterClass === 'correct') {
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
    runId,
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
