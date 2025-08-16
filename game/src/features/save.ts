// // src/lib/save.ts
// const SAVE_KEY = 'unwordable.save';

// export type RunStatsSave = {
//   guessesUsed: number;
//   perksUsed: number;
//   cashEarnt: number;
//   runStartedAt: number;
// };

// /** ----- Board state (initial layout only; guesses can be added later) ----- */
// export type BoardLayout = {
//   shortenedFirstRow: number[];
//   shiftedRow: number | null;
//   shiftDir: number; // -1 | 0 | +1
// };

// export type LockedLetter = { index: number; letter: string };
// export type LockedLetterByRow = Record<number, LockedLetter>;

// export type BoardState = {
//   layout: BoardLayout;
//   rowsAfterDebuffs: number[][];
//   lockedLetterByRow: LockedLetterByRow;
//   maxGuesses: number;
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

//   /** Per-stage board state (keys stored as strings in JSON) */
//   boards?: Record<string, BoardState>;

//   targets?: string[]
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
//     boards: {},
//     targets: []
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

//   // --- normalize BoardState ---
//   const normalizeBoard = (b: any): BoardState | null => {
//     if (!b || typeof b !== 'object') return null;

//     const layoutRaw = b.layout ?? {};
//     const shortenedFirstRow = Array.isArray(layoutRaw.shortenedFirstRow)
//       ? layoutRaw.shortenedFirstRow.map((n: any) => Number(n)).filter(Number.isFinite)
//       : [];
//     const shiftedRow =
//       layoutRaw.shiftedRow === null || layoutRaw.shiftedRow === undefined
//         ? null
//         : Number(layoutRaw.shiftedRow);
//     const shiftDir = Number(layoutRaw.shiftDir ?? 0);

//     const rowsAfterDebuffs = Array.isArray(b.rowsAfterDebuffs)
//       ? b.rowsAfterDebuffs.map((row: any) =>
//         Array.isArray(row)
//           ? row.map((n: any) => Number(n)).filter(Number.isFinite)
//           : []
//       )
//       : [];

//     const lockedLetterByRowRaw = safeObj(b.lockedLetterByRow);
//     const lockedLetterByRow: LockedLetterByRow = {};
//     for (const k of Object.keys(lockedLetterByRowRaw)) {
//       const rowIdx = Number(k);
//       const v = lockedLetterByRowRaw[k];
//       if (v && typeof v === 'object') {
//         const index = Number(v.index);
//         const letter = String(v.letter || '').toUpperCase();
//         if (Number.isFinite(index) && letter) {
//           lockedLetterByRow[rowIdx] = { index, letter };
//         }
//       }
//     }

//     const maxGuesses = Number(b.maxGuesses ?? 6);

//     return {
//       layout: {
//         shortenedFirstRow,
//         shiftedRow: Number.isFinite(shiftedRow) ? shiftedRow : null,
//         shiftDir: Number.isFinite(shiftDir) ? shiftDir : 0,
//       },
//       rowsAfterDebuffs,
//       lockedLetterByRow,
//       maxGuesses: Number.isFinite(maxGuesses) ? maxGuesses : 6,
//     };
//   };

//   const boardsRaw = safeObj(raw.boards);
//   const boards: Record<string, BoardState> = {};
//   for (const key of Object.keys(boardsRaw)) {
//     const normalized = normalizeBoard(boardsRaw[key]);
//     if (normalized) boards[key] = normalized;
//   }

//   const targets: string[] = Array.isArray(raw.targets)
//     ? raw.targets
//         .map((w: any) => String(w ?? '').trim().toUpperCase())
//         .filter(Boolean)
//     : [];

//   return {
//     stage: Number.isFinite(stage) ? stage : 0,
//     cash: Number.isFinite(cash) ? cash : 0,
//     runStats,
//     debuffPlan: raw.debuffPlan ?? {},
//     perks: safeObj(raw.perks),
//     skills: safeObj(raw.skills),
//     passiveDebuffs: safeObj(raw.passiveDebuffs),
//     boards,
//     targets,
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

// /** Allow passing partial board entries when patching */
// type BoardsPatch = Record<string, Partial<BoardState>>;

// type SavePatch = Partial<Omit<Save, 'boards' | 'runStats'>> & {
//   runStats?: Partial<RunStatsSave>;
//   boards?: BoardsPatch;
// };

// /**
//  * Persist a partial update.
//  * - Shallow-merge top-level fields
//  * - Deep-merge runStats
//  * - Per-stage shallow merge for boards (supports Partial<BoardState>)
//  */
// export function persistSave(patch: SavePatch, source = 'unknown') {
//   // console.log('[persistSave]', source, patch);
//   const cur = loadSave() ?? blankSave();

//   // ⬇️ pull boards out so we don't spread a BoardsPatch into a Save
//   const { boards: boardsPatch, runStats: runStatsPatch, ...rest } = patch;

//   // build the non-board parts
//   const next: Save = {
//     ...cur,
//     ...rest,
//     runStats: { ...cur.runStats, ...(runStatsPatch ?? {}) },
//     boards: cur.boards ?? {},
//   };

//   // merge boards separately, allowing partial entries
//   if (boardsPatch) {
//     const mergedBoards: Record<string, BoardState> = { ...(cur.boards ?? {}) };

//     for (const [stageKey, boardPartial] of Object.entries(boardsPatch)) {
//       const prev = mergedBoards[stageKey] ?? ({} as BoardState);
//       mergedBoards[stageKey] = { ...prev, ...boardPartial } as BoardState;
//     }

//     next.boards = mergedBoards;
//   }

//   localStorage.setItem(SAVE_KEY, JSON.stringify(next));
// }

// export function clearSave() {
//   localStorage.removeItem(SAVE_KEY);
// }

// export function hasOngoingRun(): boolean {
//   const s = loadSave();
//   return !!s && s.stage > 0;
// }

// /** ---------- Board-specific helpers ---------- */

// export function loadBoardState(stage: number | string): BoardState | null {
//   const s = loadSave();
//   if (!s?.boards) return null;
//   const key = String(stage);
//   return s.boards[key] ?? null;
// }

// export function replaceBoardState(
//   stage: number | string,
//   state: BoardState,
//   source = 'replaceBoardState'
// ) {
//   persistSave({ boards: { [String(stage)]: state } }, source);
// }

// export function patchBoardState(
//   stage: number | string,
//   patch: Partial<BoardState>,
//   source = 'patchBoardState'
// ) {
//   persistSave({ boards: { [String(stage)]: patch } }, source);
// }

// export function clearBoardState(
//   stage: number | string,
//   source = 'clearBoardState'
// ) {
//   const cur = loadSave() ?? blankSave();
//   const key = String(stage);
//   if (!cur.boards || !(key in cur.boards)) return;
//   const nextBoards = { ...cur.boards };
//   delete nextBoards[key];
//   // ok: BoardState is compatible with Partial<BoardState>
//   persistSave({ boards: nextBoards as BoardsPatch }, source);
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

type LetterStatus = 'absent' | 'present' | 'correct';
type GuessRecord = { word: string; indices: number[]; statuses: LetterStatus[]; lieIndexAbs?: number };


export type BoardState = {
  layout: BoardLayout;
  rowsAfterDebuffs: number[][];
  lockedLetterByRow: LockedLetterByRow;
  maxGuesses: number;
  guesses?: GuessRecord[];
  usedKeys?: Record<string, LetterStatus>;
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

  /** 10 targets for this run (UPPERCASE) */
  targets?: string[];
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
    targets: [],
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
        Array.isArray(row) ? row.map((n: any) => Number(n)).filter(Number.isFinite) : []
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
    // --- optional fields: guesses & usedKeys ---
    // LetterStatus whitelist
    const okStatus = new Set(['absent', 'present', 'correct']);

    let guesses: GuessRecord[] | undefined;
    if (Array.isArray(b.guesses)) {
      guesses = b.guesses
        .map((g: any) => {
          const word = String(g?.word ?? '').toUpperCase();
          const indices = Array.isArray(g?.indices)
            ? g.indices.map((n: any) => Number(n)).filter(Number.isFinite)
            : [];
          const statuses = Array.isArray(g?.statuses)
            ? g.statuses.map((s: any) => (okStatus.has(String(s)) ? String(s) : 'absent')) as LetterStatus[]
            : [];
          const lieIndexAbs =
            g?.lieIndexAbs === undefined || g?.lieIndexAbs === null
              ? undefined
              : Number(g.lieIndexAbs);
          return { word, indices, statuses, ...(Number.isFinite(lieIndexAbs) ? { lieIndexAbs } : {}) } as GuessRecord;
        })
        // sanity: keep only well-formed entries
        .filter((g: GuessRecord) => g.word && g.indices.length === g.statuses.length);
    }

    let usedKeys: Record<string, LetterStatus> | undefined;
    if (b.usedKeys && typeof b.usedKeys === 'object') {
      usedKeys = {};
      for (const [k, v] of Object.entries(b.usedKeys)) {
        const letter = String(k || '').toUpperCase();
        const status = String(v || '');
        if (letter && okStatus.has(status)) {
          usedKeys[letter] = status as LetterStatus;
        }
      }
    }

    return {
      layout: {
        shortenedFirstRow,
        shiftedRow: Number.isFinite(shiftedRow) ? shiftedRow : null,
        shiftDir: Number.isFinite(shiftDir) ? shiftDir : 0,
      },
      rowsAfterDebuffs,
      lockedLetterByRow,
      maxGuesses: Number.isFinite(maxGuesses) ? maxGuesses : 6,
      ...(guesses ? { guesses } : {}),
      ...(usedKeys ? { usedKeys } : {}),
    };
  };

  const boardsRaw = safeObj(raw.boards);
  const boards: Record<string, BoardState> = {};
  for (const key of Object.keys(boardsRaw)) {
    const normalized = normalizeBoard(boardsRaw[key]);
    if (normalized) boards[key] = normalized;
  }

  const targets: string[] = Array.isArray(raw.targets)
    ? raw.targets.map((w: any) => String(w ?? '').trim().toUpperCase())
    : [];

  return {
    stage: Number.isFinite(stage) ? stage : 0,
    cash: Number.isFinite(cash) ? cash : 0,
    runStats,
    debuffPlan: raw.debuffPlan ?? {},
    perks: safeObj(raw.perks),
    skills: safeObj(raw.skills),
    passiveDebuffs: safeObj(raw.passiveDebuffs),
    boards,
    targets,
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

export function clearBoardState(stage: number | string, source = 'clearBoardState') {
  const cur = loadSave() ?? blankSave();
  const key = String(stage);
  if (!cur.boards || !(key in cur.boards)) return;
  const nextBoards = { ...cur.boards };
  delete nextBoards[key];
  // ok: BoardState is compatible with Partial<BoardState>
  persistSave({ boards: nextBoards as BoardsPatch }, source);
}

/** ---------- Targets helpers ---------- */

/** Read the whole targets array (may be empty). */
export function loadTargets(): string[] {
  return loadSave()?.targets ?? [];
}

/** Replace the entire targets array. Values are uppercased + trimmed. */
export function replaceTargets(targets: string[], source = 'replaceTargets') {
  const cleaned = (targets || []).map((w) => String(w ?? '').trim().toUpperCase());
  persistSave({ targets: cleaned }, source);
}

/** Ensure a specific round (1..N) has a target; returns that target or null. */
export function getTargetForRound(round: number): string | null {
  if (!Number.isFinite(round) || round <= 0) return null;
  const arr = loadTargets();
  const v = arr[round - 1];
  return v && v.length ? v : null;
}

/** Convenience: translate a stage (even = game) to round index (1..10) and fetch. */
export function getTargetForStage(stage: number): string | null {
  // your app logic: round = stage/2 + 1
  const round = Math.floor(stage / 2) + 1;
  return getTargetForRound(round);
}

/** Set/overwrite the target for a given round (1..N). */
export function setTargetForRound(round: number, word: string, source = 'setTargetForRound') {
  if (!Number.isFinite(round) || round <= 0) return;
  const upper = String(word ?? '').trim().toUpperCase();
  if (!upper) return;

  const cur = loadTargets();
  const idx = round - 1;
  const next = cur.slice();
  // grow with empty placeholders if needed
  for (let i = next.length; i < idx; i++) next[i] = '';
  next[idx] = upper;
  replaceTargets(next, source);
}

/** Clear targets (rarely needed; restart usually replaces). */
export function clearTargets(source = 'clearTargets') {
  persistSave({ targets: [] }, source);
}
