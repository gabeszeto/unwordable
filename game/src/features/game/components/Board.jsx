import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './boardStyles.css';
import combinedWordList from '../../../assets/combined_wordlist.txt?raw';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const validWords = combinedWordList.split('\n').map(word => word.trim().toUpperCase());

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
  const [currentGuess, setCurrentGuess] = useState(Array(WORD_LENGTH).fill(''));

  // Animations
  const [shakeRow, setShakeRow] = useState(false);
  const [bouncingIndices, setBouncingIndices] = useState([]);

  const [isGameOver, setIsGameOver] = useState(false);

  // Debuff board logic
  const { activeDebuffs } = useDebuffs();

  // Blurred vision checker
  const isBlurredVisionActive = activeDebuffs.includes('BlurredVision');

  useEffect(() => {
    setCurrentGuess(prev => {
      const updated = [...prev];
      revealedIndices.forEach(i => updated[i] = targetWord[i]);
      return updated;
    });
  }, [revealedIndices, targetWord]);

  const handleKeyDown = useCallback((e) => {
    if (isGameOver) return;
    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
      const guessStr = currentGuess.join('');
      if (guessStr.length === WORD_LENGTH && !currentGuess.includes('')) {
        // if (!validWords.includes(guessStr)) {
        //   setShakeRow(true);
        //   setTimeout(() => setShakeRow(false), 400); // allow animation to run
        //   return;
        // }
        submitGuess(guessStr);
      }
    } else if (key === 'BACKSPACE') {
      const updated = [...currentGuess];
      for (let i = WORD_LENGTH - 1; i >= 0; i--) {
        if (!revealedIndices.includes(i) && updated[i] !== '') {
          updated[i] = '';
          break;
        }
      }
      setCurrentGuess(updated);
    } else if (/^[A-Z]$/.test(key)) {
      const updated = [...currentGuess];
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (!revealedIndices.includes(i) && updated[i] === '') {
          updated[i] = key;
          break;
        }
      }
      setCurrentGuess(updated);
    }
  }, [isGameOver, currentGuess, revealedIndices, targetWord, usedKeys]);

  const submitGuess = (guessStr) => {
    const newGuesses = [...guesses, guessStr];
    setGuesses(newGuesses);
    setCurrentGuess(Array(WORD_LENGTH).fill(''));

    const newUsed = { ...usedKeys };
    let hasColor = false;

    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guessStr[i];
      if (!targetWord.includes(letter)) {
        if (!newUsed[letter]) newUsed[letter] = 'absent';
      } else if (targetWord[i] === letter) {
        newUsed[letter] = 'correct';
        hasColor = true;
      } else {
        if (newUsed[letter] !== 'correct') newUsed[letter] = 'present';
        hasColor = true;
      }
    }

    // GrayReaper instant loss logic
    if (activeDebuffs.includes('GrayReaper') && !hasColor) {
      setUsedKeys(newUsed);
      setIsGameOver(true);
      onRoundComplete(false, newGuesses, 'GrayReaper'); // optional third param to tag reason
      return;
    }

    setUsedKeys(newUsed);

    if (guessStr === targetWord) {
      setBouncingIndices([0, 1, 2, 3, 4]); // mark all
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, isGameOver]);

  const getLetterClass = (letter, index, isCurrentRow) => {
    if (!letter) return '';

    // 1. Perk override — revealed letter
    if (revealedIndices.includes(index) && isCurrentRow) return 'correct';

    const targetChar = targetWord[index];
    const isExact = letter === targetChar;
    const isBlurredGreen =
      isBlurredVisionActive &&
      !isCurrentRow &&
      [targetChar.charCodeAt(0) - 1, targetChar.charCodeAt(0), targetChar.charCodeAt(0) + 1]
        .map(c => String.fromCharCode(Math.max(65, Math.min(90, c))))
        .includes(letter);

    if (isExact || isBlurredGreen) return 'correct';

    // 2. Yellow (only exact match elsewhere in wrong position)
    if (targetWord.includes(letter)) return 'present';

    return 'absent';
  };


  const renderRow = (guessArray, rowIndex, isSubmitted) => {
    const cursorIndex = guessArray.findIndex(
      (ch, i) => ch === '' && !revealedIndices.includes(i)
    );

    const letters = Array.from({ length: WORD_LENGTH }, (_, i) => {
      const letter = guessArray[i] || '';
      const displayLetter = !isSubmitted && revealedIndices.includes(i)
        ? targetWord[i]
        : letter;

      const shouldApplyFeedback = isSubmitted || revealedIndices.includes(i);

      let letterClass = shouldApplyFeedback
        ? getLetterClass(letter, i, isSubmitted === false)
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
          className={`letter ${letterClass} ${isCurrent ? 'current-input' : ''}`}
          key={i}
          style={
            bouncingIndices.includes(i) &&
              isSubmitted &&
              rowIndex === guesses.length - 1
              ? { animationDelay: `${i * 0.1}s` }
              : {}
          }        >
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
    const emptyCells = Array.from({ length: WORD_LENGTH }, (_, i) => (
      <div className="letter" key={i}></div>
    ));
    return <div className="guess-row" key={`empty-${rowIndex}`}>{emptyCells}</div>;
  };

  const rows = useMemo(() => {
    const renderedRows = [
      ...guesses.map((guessStr, i) => {
        const guessArray = guessStr.split('');
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
      <div className="devWord">{targetWord}</div>
    </div>
  );
}
