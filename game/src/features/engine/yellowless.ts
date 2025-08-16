// yellowless.ts
import { seededBool } from './rng';

type Ctx = {
  round?: number; stage?: number;
  guessIndex: number;
  colAbs: number;
  targetWord: string; // UPPERCASE
  guess: string;      // UPPERCASE
};

// Returns true if this yellow should be HIDDEN
export function shouldHideYellow(ctx: Ctx, hideProb = 0.5) {
  const roundOrStage = (ctx.round ?? ctx.stage ?? 0);
  return seededBool(
    hideProb,
    'YL', roundOrStage, ctx.guessIndex, ctx.colAbs, ctx.targetWord, ctx.guess
  );
}
