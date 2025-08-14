// src/lib/save.ts
const SAVE_KEY = 'unwordable.save';

export type RunStatsSave = {
  guessesUsed: number;
  perksUsed: number;
  cashEarnt: number;
  runStartedAt: number;
};

export type SaveV3 = {
  version: 3;
  stage: number;
  cash: number;
  runStats: RunStatsSave;
};

/** Old shapes you had around; we’ll migrate them forward */
type SaveV1 = { version: 1; stage: number; debuffPlan: any; runStartedAt?: number };
type SaveV2 = { version: 2; stage: number; debuffPlan: any; coins: number; runStartedAt?: number };

function blankRunStats(): RunStatsSave {
  return { guessesUsed: 0, perksUsed: 0, cashEarnt: 0, runStartedAt: Date.now() };
}

function migrate(raw: any): SaveV3 | null {
  if (!raw || typeof raw !== 'object') return null;

  switch (raw.version) {
    case 3:
      return raw as SaveV3;

    case 2: {
      const v2 = raw as SaveV2;
      return {
        version: 3,
        stage: v2.stage ?? 0,
        cash: Number(v2.coins ?? 0),
        runStats: {
          ...blankRunStats(),
          runStartedAt: v2.runStartedAt ?? Date.now(),
        },
      };
    }

    case 1: {
      const v1 = raw as SaveV1;
      return {
        version: 3,
        stage: v1.stage ?? 0,
        cash: 0,
        runStats: {
          ...blankRunStats(),
          runStartedAt: v1.runStartedAt ?? Date.now(),
        },
      };
    }

    default:
      return null;
  }
}

export function loadSave(): SaveV3 | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return migrate(raw);
  } catch {
    return null;
  }
}

export function persistSave(patch: Partial<SaveV3>) {
  const cur: SaveV3 =
    loadSave() ?? { version: 3, stage: 0, cash: 0, runStats: blankRunStats() };
  const next: SaveV3 = {
    ...cur,
    ...patch,
    runStats: { ...cur.runStats, ...(patch.runStats ?? {}) },
    version: 3,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
