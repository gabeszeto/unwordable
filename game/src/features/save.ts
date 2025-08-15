// src/lib/save.ts
const SAVE_KEY = 'unwordable.save';

export type RunStatsSave = {
  guessesUsed: number;
  perksUsed: number;
  cashEarnt: number;
  runStartedAt: number;
};

export type Save = {
  // core
  stage: number;
  cash: number;
  runStats: RunStatsSave;

  // persisted slices
  debuffPlan?: any;
  perks?: Record<string, number>;
  skills?: Record<string, number>;
  passiveDebuffs?: Record<string, number>;
};

function blankRunStats(): RunStatsSave {
  return { guessesUsed: 0, perksUsed: 0, cashEarnt: 0, runStartedAt: Date.now() };
}

function blankSave(): Save {
  return {
    stage: 0,
    cash: 0,
    runStats: blankRunStats(),
    debuffPlan: {},
    perks: {},
    skills: {},
    passiveDebuffs: {},
  };
}

/** Coerce arbitrary JSON from storage into a valid Save object. */
function normalize(raw: any): Save | null {
  if (!raw || typeof raw !== 'object') return null;

  const stage = Number(raw.stage ?? 0);
  const cash = Number(raw.cash ?? 0);

  const rs = raw.runStats ?? {};
  const runStats: RunStatsSave = {
    guessesUsed: Number(rs.guessesUsed ?? 0),
    perksUsed: Number(rs.perksUsed ?? 0),
    cashEarnt: Number(rs.cashEarnt ?? 0),
    runStartedAt: Number(rs.runStartedAt ?? Date.now()),
  };

  const safeObj = (o: any) => (o && typeof o === 'object' ? o : {});
  return {
    stage: Number.isFinite(stage) ? stage : 0,
    cash: Number.isFinite(cash) ? cash : 0,
    runStats,
    debuffPlan: raw.debuffPlan ?? {},
    perks: safeObj(raw.perks),
    skills: safeObj(raw.skills),
    passiveDebuffs: safeObj(raw.passiveDebuffs),
  };
}

export function loadSave(): Save | null {
  try {
    const rawJson = localStorage.getItem(SAVE_KEY);
    if (!rawJson) return null;
    const parsed = JSON.parse(rawJson);
    return normalize(parsed);
  } catch {
    return null;
  }
}

/**
 * Persist a partial update.
 * - Shallow-merge top-level fields
 * - Deep-merge runStats only
 */
export function persistSave(patch: Partial<Save>, source = 'unknown') {
  // console.log('[persistSave]', source, patch);
  const cur = loadSave() ?? blankSave();

  const next: Save = {
    ...cur,
    ...patch,
    runStats: { ...cur.runStats, ...(patch.runStats ?? {}) },
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasOngoingRun(): boolean {
  const s = loadSave();
  return !!s && s.stage > 0; // adjust if stage 0 counts as “ongoing”
}
