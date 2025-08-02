import React, { useState } from 'react';
import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function ComponentsPerk({ targetWord }) {
  const { perks, usePerk } = usePerks();
  const [used, setUsed] = useState(false);

  const countVowels = (word) =>
    word.split('').filter((ch) => 'AEIOU'.includes(ch)).length;

  const vowelCount = countVowels(targetWord);
  const consonantCount = targetWord.length - vowelCount;

  const handleClick = () => {
    if ((perks.components || 0) === 0 || used) return;
    setUsed(true);
    usePerk('components')
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || (perks.components || 0) === 0}>
      Components 🧪
      {used && (
        <div className="perk-result">
          Vowels: {vowelCount}, Consonants: {consonantCount}
        </div>
      )}
    </button>
  );
}
