// src/features/engine/rng.ts
// Deterministic PRNG from a string seed
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return h >>> 0;
    };
}

function mulberry32(a: number) {
    return () => {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Stable uniform [0,1)
export function stableRand01(...parts: (string | number | boolean)[]) {
    const seedStr = parts.join('|');
    const seed = xmur3(seedStr)();
    const rand = mulberry32(seed);
    return rand();
}

// 50% coin flip that’s stable for the same inputs
export function seededCoin50(...parts: (string | number | boolean)[]) {
    return stableRand01(...parts) < 0.5;
}
