// keyboard.jsx
import React, { useEffect, useState } from 'react';
import './keyboardStyles.css';

const keyLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export default function Keyboard({ usedKeys, onKeyPress }) {
  const getKeyClass = (key) => {
    return usedKeys[key] || ''; // could be '', 'correct', 'present', or 'absent'
  };

  return (
    <div className="keyboard">
      {keyLayout.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {i === 2 && (
            <button className="key special" onClick={() => onKeyPress('ENTER')}>Enter</button>
          )}
          {row.map((key) => (
            <button
              key={key}
              className={`key ${getKeyClass(key)}`}
              onClick={() => onKeyPress(key)}
            >
              {key}
            </button>
          ))}
          {i === 2 && (
            <button className="key special" onClick={() => onKeyPress('Backspace')}>
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
