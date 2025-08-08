export function getLetterLensHint(word, level) {
    if (!word || !level) return null;
    const isVowel = (ch) => 'AEIOU'.includes((ch || '').toUpperCase());
    const first = word[0];
    const last = word[word.length - 1];

    const res = {};
    if (level >= 1 && first) res.first = isVowel(first) ? 'vowel' : 'consonant';
    if (level >= 2 && last) res.last = isVowel(last) ? 'vowel' : 'consonant';
    return Object.keys(res).length ? res : null;
}