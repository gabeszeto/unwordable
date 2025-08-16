// // src/lib/save.ts
// const SAVE_KEY = 'unwordable.save';

// export type RunStatsSave = {
//   guessesUsed: number;
//   perksUsed: number;
//   cashEarnt: number;
//   runStartedAt: number;
// };

// export type Save = {
//   // core
//   stage: number;
//   cash: number;
//   runStats: RunStatsSave;

//   // persisted slices
//   debuffPlan?: any;
//   perks?: Record<string, number>;
//   skills?: Record<string, number>;
//   passiveDebuffs?: Record<string, number>;
// };

// function blankRunStats(): RunStatsSave {
//   return { guessesUsed: 0, perksUsed: 0, cashEarnt: 0, runStartedAt: Date.now() };
// }

// function blankSave(): Save {
//   return {
//     stage: 0,
//     cash: 0,
//     runStats: blankRunStats(),
//     debuffPlan: {},
//     perks: {},
//     skills: {},
//     passiveDebuffs: {},
//   };
// }

// /** Coerce arbitrary JSON from storage into a valid Save object. */
// function normalize(raw: any): Save | null {
//   if (!raw || typeof raw !== 'object') return null;

//   const stage = Number(raw.stage ?? 0);
//   const cash = Number(raw.cash ?? 0);

//   const rs = raw.runStats ?? {};
//   const runStats: RunStatsSave = {
//     guessesUsed: Number(rs.guessesUsed ?? 0),
//     perksUsed: Number(rs.perksUsed ?? 0),
//     cashEarnt: Number(rs.cashEarnt ?? 0),
//     runStartedAt: Number(rs.runStartedAt ?? Date.now()),
//   };

//   const safeObj = (o: any) => (o && typeof o === 'object' ? o : {});
//   return {
//     stage: Number.isFinite(stage) ? stage : 0,
//     cash: Number.isFinite(cash) ? cash : 0,
//     runStats,
//     debuffPlan: raw.debuffPlan ?? {},
//     perks: safeObj(raw.perks),
//     skills: safeObj(raw.skills),
//     passiveDebuffs: safeObj(raw.passiveDebuffs),
//   };
// }

// export function loadSave(): Save | null {
//   try {
//     const rawJson = localStorage.getItem(SAVE_KEY);
//     if (!rawJson) return null;
//     const parsed = JSON.parse(rawJson);
//     return normalize(parsed);
//   } catch {
//     return null;
//   }
// }

// /**
//  * Persist a partial update.
//  * - Shallow-merge top-level fields
//  * - Deep-merge runStats only
//  */
// export function persistSave(patch: Partial<Save>, source = 'unknown') {
//   // console.log('[persistSave]', source, patch);
//   const cur = loadSave() ?? blankSave();

//   const next: Save = {
//     ...cur,
//     ...patch,
//     runStats: { ...cur.runStats, ...(patch.runStats ?? {}) },
//   };

//   localStorage.setItem(SAVE_KEY, JSON.stringify(next));
// }

// export function clearSave() {
//   localStorage.removeItem(SAVE_KEY);
// }

// export function hasOngoingRun(): boolean {
//   const s = loadSave();
//   return !!s && s.stage > 0; // adjust if stage 0 counts as “ongoing”
// }
// src/lib/save.ts
const SAVE_KEY = 'unwordable.save';

export type RunStatsSave = {
  guessesUsed: number;
  perksUsed: number;
  cashEarnt: number;
  runStartedAt: number;
};

/** ----- Board state (initial layout only; guesses can be added later) ----- */
export type BoardLayout = {
  shortenedFirstRow: number[];
  shiftedRow: number | null;
  shiftDir: number; // -1 | 0 | +1
};

export type LockedLetter = { index: number; letter: string };
export type LockedLetterByRow = Record<number, LockedLetter>;

export type BoardState = {
  layout: BoardLayout;
  rowsAfterDebuffs: number[][];
  lockedLetterByRow: LockedLetterByRow;
  maxGuesses: number;
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

  /** Per-stage board state (keys stored as strings in JSON) */
  boards?: Record<string, BoardState>;
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
    boards: {},
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

  // --- normalize BoardState ---
  const normalizeBoard = (b: any): BoardState | null => {
    if (!b || typeof b !== 'object') return null;

    const layoutRaw = b.layout ?? {};
    const shortenedFirstRow = Array.isArray(layoutRaw.shortenedFirstRow)
      ? layoutRaw.shortenedFirstRow.map((n: any) => Number(n)).filter(Number.isFinite)
      : [];
    const shiftedRow =
      layoutRaw.shiftedRow === null || layoutRaw.shiftedRow === undefined
        ? null
        : Number(layoutRaw.shiftedRow);
    const shiftDir = Number(layoutRaw.shiftDir ?? 0);

    const rowsAfterDebuffs = Array.isArray(b.rowsAfterDebuffs)
      ? b.rowsAfterDebuffs.map((row: any) =>
        Array.isArray(row)
          ? row.map((n: any) => Number(n)).filter(Number.isFinite)
          : []
      )
      : [];

    const lockedLetterByRowRaw = safeObj(b.lockedLetterByRow);
    const lockedLetterByRow: LockedLetterByRow = {};
    for (const k of Object.keys(lockedLetterByRowRaw)) {
      const rowIdx = Number(k);
      const v = lockedLetterByRowRaw[k];
      if (v && typeof v === 'object') {
        const index = Number(v.index);
        const letter = String(v.letter || '').toUpperCase();
        if (Number.isFinite(index) && letter) {
          lockedLetterByRow[rowIdx] = { index, letter };
        }
      }
    }

    const maxGuesses = Number(b.maxGuesses ?? 6);

    return {
      layout: {
        shortenedFirstRow,
        shiftedRow: Number.isFinite(shiftedRow) ? shiftedRow : null,
        shiftDir: Number.isFinite(shiftDir) ? shiftDir : 0,
      },
      rowsAfterDebuffs,
      lockedLetterByRow,
      maxGuesses: Number.isFinite(maxGuesses) ? maxGuesses : 6,
    };
  };

  const boardsRaw = safeObj(raw.boards);
  const boards: Record<string, BoardState> = {};
  for (const key of Object.keys(boardsRaw)) {
    const normalized = normalizeBoard(boardsRaw[key]);
    if (normalized) boards[key] = normalized;
  }

  return {
    stage: Number.isFinite(stage) ? stage : 0,
    cash: Number.isFinite(cash) ? cash : 0,
    runStats,
    debuffPlan: raw.debuffPlan ?? {},
    perks: safeObj(raw.perks),
    skills: safeObj(raw.skills),
    passiveDebuffs: safeObj(raw.passiveDebuffs),
    boards,
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

/** Allow passing partial board entries when patching */
type BoardsPatch = Record<string, Partial<BoardState>>;

type SavePatch = Partial<Omit<Save, 'boards' | 'runStats'>> & {
  runStats?: Partial<RunStatsSave>;
  boards?: BoardsPatch;
};

/**
 * Persist a partial update.
 * - Shallow-merge top-level fields
 * - Deep-merge runStats
 * - Per-stage shallow merge for boards (supports Partial<BoardState>)
 */
export function persistSave(patch: SavePatch, source = 'unknown') {
  // console.log('[persistSave]', source, patch);
  const cur = loadSave() ?? blankSave();

  // ⬇️ pull boards out so we don't spread a BoardsPatch into a Save
  const { boards: boardsPatch, runStats: runStatsPatch, ...rest } = patch;

  // build the non-board parts
  const next: Save = {
    ...cur,
    ...rest,
    runStats: { ...cur.runStats, ...(runStatsPatch ?? {}) },
    boards: cur.boards ?? {},
  };

  // merge boards separately, allowing partial entries
  if (boardsPatch) {
    const mergedBoards: Record<string, BoardState> = { ...(cur.boards ?? {}) };

    for (const [stageKey, boardPartial] of Object.entries(boardsPatch)) {
      const prev = mergedBoards[stageKey] ?? ({} as BoardState);
      mergedBoards[stageKey] = { ...prev, ...boardPartial } as BoardState;
    }

    next.boards = mergedBoards;
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function hasOngoingRun(): boolean {
  const s = loadSave();
  return !!s && s.stage > 0;
}

/** ---------- Board-specific helpers ---------- */

export function loadBoardState(stage: number | string): BoardState | null {
  const s = loadSave();
  if (!s?.boards) return null;
  const key = String(stage);
  return s.boards[key] ?? null;
}

export function replaceBoardState(
  stage: number | string,
  state: BoardState,
  source = 'replaceBoardState'
) {
  persistSave({ boards: { [String(stage)]: state } }, source);
}

export function patchBoardState(
  stage: number | string,
  patch: Partial<BoardState>,
  source = 'patchBoardState'
) {
  persistSave({ boards: { [String(stage)]: patch } }, source);
}

export function clearBoardState(
  stage: number | string,
  source = 'clearBoardState'
) {
  const cur = loadSave() ?? blankSave();
  const key = String(stage);
  if (!cur.boards || !(key in cur.boards)) return;
  const nextBoards = { ...cur.boards };
  delete nextBoards[key];
  // ok: BoardState is compatible with Partial<BoardState>
  persistSave({ boards: nextBoards as BoardsPatch }, source);
}
