import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './boardStyles.css';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { usePerks } from '../../../contexts/perks/PerksContext';

const WORD_LENGTH = 5;
const MAX_ROW_LENGTH = 7;
const MAX_GUESSES = 6;

import useKeyboardHandlers from './utils/useKeyboardHandlers';

import fourLetterWords from '../../../assets/four-letter-words.txt?raw';
import fiveLetterWords from '../../../assets/five-letter-words.txt?raw';
import sixLetterWords from '../../../assets/six-letter-words.txt?raw';

const validWords = {
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
  onVirtualKey
}) {
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(Array(MAX_ROW_LENGTH).fill(''));
  const [shakeRow, setShakeRow] = useState(false);
  const [bouncingIndices, setBouncingIndices] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Local debuffs
  const { activeDebuffs } = useDebuffs();
  const isBlurredVisionActive = activeDebuffs.includes('BlurredVision');

  // Local Perks
  const { jybrishActive } = usePerks();

  const getActiveIndices = (len) => {
    const offset = Math.floor((MAX_ROW_LENGTH - len) / 2);
    return Array.from({ length: len }, (_, i) => i + offset);
  };

  const getRowActiveIndices = (rowIndex) => {
    const base = getActiveIndices(WORD_LENGTH);
    const shouldShorten = rowIndex === 0 && activeDebuffs.includes('FourSight');
    const blocked = shortenedBlockIndexRef.current;
    return shouldShorten && blocked !== null ? base.filter(i => i !== blocked) : base;
  };

  // Shortened word logic, active only on first row, and if debuff is active
  const shortenedBlockIndexRef = useRef(null);

  if (shortenedBlockIndexRef.current === null && activeDebuffs.includes('FourSight')) {
    shortenedBlockIndexRef.current = Math.random() < 0.5 ? 1 : 5;
  }

  const paddedTargetWord = useMemo(() => {
    const padded = Array(MAX_ROW_LENGTH).fill('');
    const offset = Math.floor((MAX_ROW_LENGTH - targetWord.length) / 2);
    targetWord.split('').forEach((char, i) => {
      padded[offset + i] = char;
    });
    return padded;
  }, [targetWord]);

  const { handleKeyDown } = useKeyboardHandlers({
    guesses,
    currentGuess,
    setCurrentGuess,
    setGuesses,
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
    if (paddedTargetWord.includes(letter)) return 'present';

    return 'absent';
  }

  const renderRow = (guessArray, rowIndex, isSubmitted) => {
    const rowActiveIndices = getRowActiveIndices(rowIndex);
    const cursorIndex = rowActiveIndices.find(i => guessArray[i] === '' && !revealedIndices.includes(i));

    const letters = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => {
      const letter = guessArray[i] || '';
      const isActive = rowActiveIndices.includes(i);
      const isBlockedSlot =
        rowIndex === 0 &&
        activeDebuffs.includes('ShortenedWord') &&
        shortenedBlockIndexRef.current === i;

      const displayLetter = !isSubmitted && revealedIndices.includes(i)
        ? paddedTargetWord[i]
        : letter;

      const shouldApplyFeedback = isSubmitted || revealedIndices.includes(i);
      let letterClass = shouldApplyFeedback
        ? getLetterClass(letter, i, !isSubmitted, rowActiveIndices)
        : '';

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
    const baseActiveIndices = getActiveIndices(WORD_LENGTH);
    const emptyCells = Array.from({ length: MAX_ROW_LENGTH }, (_, i) => (
      <div className={`letter ${!baseActiveIndices.includes(i) ? 'inactive' : ''}`} key={i}></div>
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

    const remaining = MAX_GUESSES - renderedRows.length;
    for (let i = 0; i < remaining; i++) {
      renderedRows.push(renderEmptyRow(i));
    }

    return renderedRows;
  }, [guesses, currentGuess, isGameOver, revealedIndices, shakeRow]);

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
      {/* <div className="devWord">{targetWord}</div> */}
      {jybrishActive && (
        <div className="jybrish-banner">
          Jybrish Activated
        </div>
      )}
    </div>
  );
}
