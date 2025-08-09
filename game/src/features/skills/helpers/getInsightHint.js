// src/features/skills/ui/helpers/getInsightHint.js
import zipfMap from '../../../assets/insightZipf.json' assert { type: 'json' };
import overrides from '../../../assets/insightOverrides.json' assert { type: 'json' };

// same hash function
function hash01(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 2 ** 32;
}

export function getInsightHint(word, level = 1) {
    if (!word || level <= 0) return null;
    const W = String(word).toUpperCase();

    const ov = overrides?.[W];
    const tries = ov?.tries ?? simulateTriesGoofy(W);
    let usage;

    if (level >= 2) {
        const z = Number(zipfMap?.[W] || 0); // zipf value 1..7
        usage = {
            freq: z,
            label: classifyZipf(z)
        };
    }

    return { tries, usage };
}

function classifyZipf(z) {
    if (z >= 4.8) return "Gabe always uses this word";
    if (z >= 3.8) return "Gabe often uses this word";
    if (z >= 2.8) return "Gabe sometimes uses this word";
    if (z >= 2.2) return "Gabe rarely uses this word";
    return "Gabe never uses this word";
}

// GOOFY ASS FUNCTION
const START1 = 'WORLD';
const START2 = 'PEATY';
const START_SET = new Set([...START1, ...START2]);
const SPICY = new Set(['J', 'Q', 'X', 'Z', 'V', 'K', 'W']);

// ---- TUNING KNOBS ----
const CFG = {
    base: 5.2,              // ↑ makes everything harder
    wGreen: 1.2,            // ↓ reduces impact of greens
    wYellow: 0.4,          // ↓ reduces impact of yellows
    wCoverage: 0.2,         // ↓ reduces impact of letter coverage
    pDouble: 0.6,           // ↑ increases penalty for doubles
    pSpicy: 1.2,            // ↑ increases penalty for unseen spicy letters
    bonusNoGreens: 0.6,     // extra penalty if both openers give 0 greens total
    bonusLowCoverage2: 0.4, // penalty if distinct coverage <= 2
    jitter: 0.25,           // random wobble amplitude (±)
    clampMin: 3.0,          // ↑ minimum tries (except the special cases)
    clampMax: 6.8,          // max before DNF logic
    dnfKickIn: 5.6,         // expected above this → DNF starts being possible
    dnfScale: 0.35          // max DNF probability when very hard
};
// ----------------------

function feedback(guess, target) {
    const G = guess.toUpperCase(), T = target.toUpperCase();
    const used = Array(5).fill(false);
    let greens = 0, yellows = 0;
    for (let i = 0; i < 5; i++) { if (G[i] === T[i]) { greens++; used[i] = true; } }
    const rem = {};
    for (let i = 0; i < 5; i++) { if (!used[i]) rem[T[i]] = (rem[T[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) {
        if (G[i] !== T[i]) { const ch = G[i]; if (rem[ch] > 0) { yellows++; rem[ch]--; } }
    }
    return { greens, yellows };
}

function hasDoubleLetter(word) {
    const s = new Set(word.toUpperCase());
    return s.size < 5;
}
function spicyOutsideStartersCount(word) {
    let c = 0;
    for (const ch of word.toUpperCase()) if (SPICY.has(ch) && !START_SET.has(ch)) c++;
    return c; // count, not just boolean
}
function unionCoverageDistinct(word) {
    const W = word.toUpperCase();
    const seenTarget = new Set(W);
    let covered = 0;
    for (const ch of seenTarget) if (START_SET.has(ch)) covered++;
    return covered; // 0..5 distinct target letters covered by starters
}

export function simulateTriesGoofy(word) {
    const W = word.toUpperCase();
    if (W === START1) return 1;
    if (W === START2) return 2; // the only 2-try case

    const f1 = feedback(START1, W);
    const f2 = feedback(START2, W);

    const cov = unionCoverageDistinct(W);                  // 0..5
    const dbl = hasDoubleLetter(W) ? 1 : 0;                // 0/1
    const spicyCnt = spicyOutsideStartersCount(W);         // 0..n

    // info reduces expected tries
    let info =
        f1.greens * CFG.wGreen +
        f1.yellows * CFG.wYellow +
        f2.greens * CFG.wGreen +
        f2.yellows * CFG.wYellow +
        cov * CFG.wCoverage;

    // pain increases expected tries
    let pain =
        dbl * CFG.pDouble +
        spicyCnt * (CFG.pSpicy * 0.9); // scale per spicy char

    // guardrails: if both openers whiff on greens, add penalty
    if ((f1.greens + f2.greens) === 0) pain += CFG.bonusNoGreens;
    if (cov <= 2) pain += CFG.bonusLowCoverage2;

    // base – info + pain
    let expected = CFG.base - info + pain;

    // tiny stable jitter (bias slightly upward)
    const r = hash01('goofy:' + W);
    expected += (r - 0.3) * CFG.jitter; // center at 0.3 ⇒ skew higher

    // clamp hard (min 4 so it's rarer to see 3s)
    if (expected < CFG.clampMin) expected = CFG.clampMin;
    if (expected > CFG.clampMax) expected = CFG.clampMax;

    // DNF chance for hard ones
    if (expected > CFG.dnfKickIn) {
        const t = Math.min(1, (expected - CFG.dnfKickIn) / (CFG.clampMax - CFG.dnfKickIn));
        const dnfP = t * CFG.dnfScale; // up to ~CFG.dnfScale
        if (r < dnfP) return 7;
    }

    // round with upward bias
    return Math.max(3, Math.min(6, Math.ceil(expected - 0.15)));
}
