export default function AnatomyInfo({ targetWord }) {
    const countVowels = (word) =>
        word.split('').filter((ch) => 'AEIOU'.includes(ch)).length;

    const vowelCount = countVowels(targetWord);
    const consonantCount = targetWord.length - vowelCount;

    return (
        <div className="hintInfoText">
            <div><strong>Anatomy Breakdown: </strong>Vowels: {vowelCount} · Consonants: {consonantCount}</div>
        </div>
    );
}
