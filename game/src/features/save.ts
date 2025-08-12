// single stable key
const SAVE_KEY = 'unwordable.save';

type SaveV1 = { version:1; stage:number; debuffPlan:any; runStartedAt?:number; };
type SaveV2 = { version:2; stage:number; debuffPlan:any; coins:number; runStartedAt?:number; };

function migrate(raw:any): SaveV2 | null {
  if (!raw || typeof raw !== 'object') return null;
  switch (raw.version) {
    case 2: return raw as SaveV2;
    case 1: return {
      version: 2,
      stage: raw.stage ?? 0,
      debuffPlan: raw.debuffPlan ?? {},
      coins: 0,                      // new default
      runStartedAt: raw.runStartedAt,
    };
    default: return null;            // unknown future version
  }
}

export function loadSave(): SaveV2 | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return migrate(raw);
  } catch { return null; }
}

export function persistSave(patch: Partial<SaveV2>) {
  const cur = loadSave() ?? { version:2, stage:0, debuffPlan:{}, coins:0 };
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...cur, ...patch }));
}
