import './hintInfoStyles.css'

export default function AnatomyInfo({ targetWord }) {
    const countVowels = (word) =>
        word.split('').filter((ch) => 'AEIOU'.includes(ch)).length;

    const vowelCount = countVowels(targetWord);
    const consonantCount = targetWord.length - vowelCount;

    return (
        <div className="hintInformation">
            <h3>🧪 Anatomy Breakdown</h3>
            <div className="hintInfoText">Vowels: {vowelCount}</div>
            <div className="hintInfoText">Consonants: {consonantCount}</div>
        </div>
    );
}
