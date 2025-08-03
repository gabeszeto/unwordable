import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Anatomy({
  targetWord,
  perkKey = 'Anatomy',
  usedPerks,
  markAsUsed,
  remaining
}) {
  const { perks } = usePerks();
  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const countVowels = (word) =>
    word.split('').filter((ch) => 'AEIOU'.includes(ch)).length;

  const vowelCount = countVowels(targetWord);
  const consonantCount = targetWord.length - vowelCount;

  const handleClick = () => {
    if (used || quantity <= 0) return;

    markAsUsed(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🧪 Anatomy ×{remaining}
      {used && (
        <div className="perk-result">
          Vowels: {vowelCount}, Consonants: {consonantCount}
        </div>
      )}
    </button>
  );
}
