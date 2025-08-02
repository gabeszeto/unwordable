import React from 'react';
import '../perks.css';

export default function Components({ targetWord, used, setUsed }) {
  const handleClick = () => setUsed(true);

  const countVowels = (word) =>
    word.split('').filter((ch) => 'AEIOU'.includes(ch)).length;

  const vowelCount = countVowels(targetWord);
  const consonantCount = targetWord.length - vowelCount;

  return (
    <button className="perk-button" onClick={handleClick} disabled={used}>
      Components 🧪
      {used && (
        <div className="perk-result">
          Vowels: {vowelCount}, Consonants: {consonantCount}
        </div>
      )}
    </button>
  );
}
