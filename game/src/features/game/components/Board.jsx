import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './boardStyles.css';
import combinedWordList from '../../../assets/combined_wordlist.txt?raw';

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
  const [isGameOver, setIsGameOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
        if (!validWords.includes(guessStr)) {
          setStatusMessage('Not a valid word.');
          return;
        }
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
      setStatusMessage('');
    }
  }, [isGameOver, currentGuess, revealedIndices, targetWord, usedKeys]);

  const submitGuess = (guessStr) => {
    const newGuesses = [...guesses, guessStr];
    setGuesses(newGuesses);
    setCurrentGuess(Array(WORD_LENGTH).fill(''));

    const newUsed = { ...usedKeys };
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guessStr[i];
      if (!targetWord.includes(letter)) {
        if (!newUsed[letter]) newUsed[letter] = 'absent';
      } else if (targetWord[i] === letter) {
        newUsed[letter] = 'correct';
      } else if (newUsed[letter] !== 'correct') {
        newUsed[letter] = 'present';
      }
    }

    setUsedKeys(newUsed);

    if (guessStr === targetWord) {
      setIsGameOver(true);
      setStatusMessage('Correct!');
      onRoundComplete(true, newGuesses);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setIsGameOver(true);
      setStatusMessage(`Out of guesses! The word was ${targetWord}`);
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
    if (isCurrentRow && revealedIndices.includes(index)) return 'correct';
    if (!targetWord.includes(letter)) return 'absent';
    if (targetWord[index] === letter) return 'correct';
    return 'present';
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
      const letterClass = shouldApplyFeedback
        ? getLetterClass(letter, i, isSubmitted === false)
        : '';
      const isCurrent = !isSubmitted && i === cursorIndex;

      return (
        <div
          className={`letter ${letterClass} ${isCurrent ? 'current-input' : ''}`}
          key={i}
        >
          {displayLetter}
        </div>
      );
    });

    return <div className="guess-row" key={rowIndex}>{letters}</div>;
  };

  const renderEmptyRow = (rowIndex) => {
    const emptyCells = Array.from({ length: WORD_LENGTH }, (_, i) => (
      <div className="letter" key={i}></div>
    ));
    return <div className="guess-row" key={`empty-${rowIndex}`}>{emptyCells}</div>;
  };

  const shouldRenderInputRow = !isGameOver;

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
  }, [guesses, currentGuess, isGameOver, revealedIndices]);

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
      <div className="status-message">
        {statusMessage || 'Type to guess...'}
      </div>
    </div>
  );
}
