// src/features/engine/yellowless.ts
import { seededCoin50 } from './rng';

type Ctx = {
    round: number;          // 1-based round (you already have this)
    guessIndex: number;     // 0-based index in guesses array
    colAbs: number;         // absolute board column (e.g., 0..6)
    targetWord: string;     // uppercase
    guess: string;          // uppercase, for this row
};

// Returns true if this yellow should be hidden (become 'absent')
export function shouldHideYellow(ctx: Ctx) {
    // Prefix "YL" to isolate from other features’ seeds
    return seededCoin50(
        'YL',
        ctx.round,
        ctx.guessIndex,
        ctx.colAbs,
        ctx.targetWord,
        ctx.guess
    );
}
