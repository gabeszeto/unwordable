import React from 'react';
import './keyboardStyles.css';

const keyLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export default function Keyboard({ usedKeys, onKeyPress, keyzoneType, targetWord }) {
  const getKeyClass = (key) => usedKeys[key] || '';
  const targetLetters = new Set((targetWord || '').split(''));

  const zoneMap = {};
  const zoneCounts = {};
  const zoneKeys = {};

  // Assign keys to zones and count matching letters
  keyLayout.forEach((row, rowIdx) => {
    row.forEach((key, colIdx) => {
      let zone = null;

      if (keyzoneType === 'row') {
        zone = `row-${rowIdx}`;
      } else if (keyzoneType === 'segment') {
        zone = `segment-${Math.floor((colIdx / row.length) * 2)}`;
      } else if (keyzoneType === 'grid') {
        const seg = Math.floor((colIdx / row.length) * 2);
        zone = `grid-${rowIdx * 2 + seg}`;
      }

      if (zone) {
        zoneMap[key] = zone;
        zoneCounts[zone] = (zoneCounts[zone] || 0) + (targetLetters.has(key) ? 1 : 0);
        if (!zoneKeys[zone]) zoneKeys[zone] = [];
        zoneKeys[zone].push({ key, row: rowIdx, col: colIdx });
      }
    });
  });

  // Decide which key should show the label (top-right of each zone)
  const labelKeyMap = {};
  for (const zone in zoneKeys) {
    const keys = zoneKeys[zone];
    keys.sort((a, b) => a.row - b.row || b.col - a.col); // top-most, then right-most
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
            const keyClass = `key ${getKeyClass(key)} ${zoneKeyClass}`; const label = labelKeyMap[key] ? zoneCounts[zoneMap[key]] : null;

            return (
              <button
                key={key}
                className={keyClass}
                onClick={() => onKeyPress(key)}
              >
                {key}
                {label != null && (
                  <div className="zone-count">{label}</div>
                )}
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
