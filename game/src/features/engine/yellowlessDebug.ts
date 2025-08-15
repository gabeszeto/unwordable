// features/engine/yellowlessDebug.ts
import { shouldHideYellow } from './yellowless';

type Ctx = {
  round?: number;
  stage?: number;
  guessIndex: number;
  colAbs: number;
  targetWord: string; // UPPERCASE
  guess: string;      // UPPERCASE
};

function ylKey(ctx: Ctx) {

  const r = ctx.round ?? ctx.stage ?? 'NA';
  return `YL|${r}|${ctx.guessIndex}|${ctx.colAbs}|${ctx.targetWord}|${ctx.guess}`;
}


const store =
  typeof window !== 'undefined'
    ? ((window as any).__YL_DEBUG ||= new Map<string, boolean>())
    : new Map<string, boolean>();

export function shouldHideYellowDebug(ctx: Ctx, site: 'submit' | 'render') {
  const key = ylKey(ctx);
  const res = shouldHideYellow(ctx as any);
  const prev = store.get(key);

  if (prev !== undefined && prev !== res) {
    console.error('[YL] MISMATCH', { key, prev, res, site });
  } else {
    console.debug('[YL]', site, key, res);
  }
  store.set(key, res);
  return res;
}
