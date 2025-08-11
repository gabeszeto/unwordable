import React from 'react';
import './keyboardStyles.css';

const keyLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];
export default function Keyboard({ usedKeys, onKeyPress, keyzoneType, targetWord }) {
  const getKeyClass = (key) => usedKeys[key] || '';

  // Build a frequency map of target letters (A–Z only)
  const letterFreq = (targetWord || '')
    .toUpperCase()
    .split('')
    .filter(ch => ch >= 'A' && ch <= 'Z')
    .reduce((acc, ch) => {
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {});

  const zoneMap = {};
  const zoneCounts = {};
  const zoneKeys = {};

  keyLayout.forEach((row, rowIdx) => {
    row.forEach((key, colIdx) => {
      let zone = null;

      if (keyzoneType === 'row') {
        zone = `row-${rowIdx}`;
      } else if (keyzoneType === 'halves') {
        zone = `halves-${Math.floor((colIdx / row.length) * 2)}`;
      } else if (keyzoneType === 'grid') {
        const seg = Math.floor((colIdx / row.length) * 2);
        zone = `grid-${rowIdx * 2 + seg}`;
      }

      if (zone) {
        zoneMap[key] = zone;

        // ✅ add full frequency for this key (0 if not in word)
        const add = letterFreq[key] || 0;
        zoneCounts[zone] = (zoneCounts[zone] || 0) + add;

        if (!zoneKeys[zone]) zoneKeys[zone] = [];
        zoneKeys[zone].push({ key, row: rowIdx, col: colIdx });
      }
    });
  });

  const labelKeyMap = {};
  for (const zone in zoneKeys) {
    const keys = zoneKeys[zone];
    keys.sort((a, b) => a.row - b.row || b.col - a.col); // top-most, right-most
    labelKeyMap[keys[0].key] = zone;
  }

  return (
    <div className="keyboard">
      {keyLayout.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {i === 2 && (
            <button className="key special" onClick={() => onKeyPress('ENTER')}>
              Enter
            </button>
          )}

          {row.map((key) => {
            const zone = zoneMap[key];
            const zoneKeyClass = zone ? `keyzone keyzone-${zone}` : '';
            const keyClass = `key ${getKeyClass(key)} ${zoneKeyClass}`;
            const label = labelKeyMap[key] ? zoneCounts[zone] : null;

            return (
              <button key={key} className={keyClass} onClick={() => onKeyPress(key)}>
                {key}
                {label != null && <div className="zone-count">{label}</div>}
              </button>
            );
          })}

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
