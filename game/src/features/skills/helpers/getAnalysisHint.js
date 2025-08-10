// src/features/skills/ui/helpers/getInsightHint.js
import zipfMap from '../../../assets/insightZipf.json' assert { type: 'json' };

// same hash function
function hash01(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 2 ** 32;
}

export function getAnalysisHint(word, level = 1) {
    if (!word || level <= 0) return null;
    const W = String(word).toUpperCase();

    const tries = simulateTriesGoofy(W);
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
    if (z >= 4.5) return " always uses it";
    if (z >= 3.5) return " often uses it";
    if (z >= 3) return " sometimes uses it";
    if (z >= 2.5) return " rarely uses it";
    return " never uses it";
}

// GOOFY ASS FUNCTION
const START1 = 'WORLD';
const START2 = 'PEATY';
const START_SET = new Set([...START1, ...START2]);
const SPICY = new Set(['J', 'Q', 'X', 'Z', 'V', 'K', 'W']);

// ---- TUNING KNOBS ----
const CFG = {
    base: 5.2,
    wGreen: 1.2,
    wYellow: 0.4,
    wCoverage: 0.2,
    pDouble: 0.6,
    pSpicy: 1.2,
    bonusNoGreens: 0.6,
    bonusLowCoverage2: 0.4,
    jitter: 0.25,
    clampMin: 3.0,
    clampMax: 6.8,
    dnfKickIn: 5.6,
    dnfScale: 0.35
};
// ----------------------

function feedback(guess, target) {
    const G = guess.toUpperCase(), T = target.toUpperCase();
    const used = Array(5).fill(false);
    let greens = 0, yellows = 0;
    for (let i = 0; i < 5; i++) {
        if (G[i] === T[i]) { greens++; used[i] = true; }
    }
    const rem = {};
    for (let i = 0; i < 5; i++) {
        if (!used[i]) rem[T[i]] = (rem[T[i]] || 0) + 1;
    }
    for (let i = 0; i < 5; i++) {
        if (G[i] !== T[i]) {
            const ch = G[i];
            if (rem[ch] > 0) { yellows++; rem[ch]--; }
        }
    }
    return { greens, yellows };
}

function hasDoubleLetter(word) {
    const s = new Set(word.toUpperCase());
    return s.size < 5;
}

function spicyOutsideStartersCount(word) {
    let c = 0;
    for (const ch of word.toUpperCase()) {
        if (SPICY.has(ch) && !START_SET.has(ch)) c++;
    }
    return c;
}

function unionCoverageDistinct(word) {
    const W = word.toUpperCase();
    const seenTarget = new Set(W);
    let covered = 0;
    for (const ch of seenTarget) if (START_SET.has(ch)) covered++;
    return covered;
}

export function simulateTriesGoofy(word) {
    const W = word.toUpperCase();
    if (W === START1) return 1;
    if (W === START2) return 2;

    const f1 = feedback(START1, W);
    const f2 = feedback(START2, W);

    const cov = unionCoverageDistinct(W);
    const dbl = hasDoubleLetter(W) ? 1 : 0;
    const spicyCnt = spicyOutsideStartersCount(W);

    let info =
        f1.greens * CFG.wGreen +
        f1.yellows * CFG.wYellow +
        f2.greens * CFG.wGreen +
        f2.yellows * CFG.wYellow +
        cov * CFG.wCoverage;

    let pain =
        dbl * CFG.pDouble +
        spicyCnt * (CFG.pSpicy * 0.9);

    if ((f1.greens + f2.greens) === 0) pain += CFG.bonusNoGreens;
    if (cov <= 2) pain += CFG.bonusLowCoverage2;

    let expected = CFG.base - info + pain;

    const r = hash01('goofy:' + W);
    expected += (r - 0.3) * CFG.jitter;

    if (expected < CFG.clampMin) expected = CFG.clampMin;
    if (expected > CFG.clampMax) expected = CFG.clampMax;

    if (expected > CFG.dnfKickIn) {
        const t = Math.min(1, (expected - CFG.dnfKickIn) / (CFG.clampMax - CFG.dnfKickIn));
        const dnfP = t * CFG.dnfScale;
        if (r < dnfP) return 7;
    }

    return Math.max(3, Math.min(6, Math.ceil(expected - 0.15)));
}
