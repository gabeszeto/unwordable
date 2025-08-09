export function getRepeaterHint(word, level) {
    if (!word || !level) return null;
  
    const letters = String(word).toUpperCase().replace(/[^A-Z]/g, '').split('');
    if (!letters.length) return null;
  
    // count frequencies
    const freq = new Map();
    for (const ch of letters) freq.set(ch, (freq.get(ch) || 0) + 1);
  
    const distinctRepeats = Array.from(freq.values()).filter(c => c > 1).length;
    const anyRepeat = distinctRepeats > 0;
  
    const res = {};
    if (level >= 1) res.anyRepeat = anyRepeat;
    if (level >= 2) res.repeatDistinctCount = distinctRepeats;
  
    // if L1 says "no repeats", L2 adds no extra value
    if (level >= 2 && !anyRepeat) res.repeatDistinctCount = 0;
  
    return Object.keys(res).length ? res : null;
  }
  