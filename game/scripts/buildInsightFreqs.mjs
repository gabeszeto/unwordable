import fs from 'node:fs/promises';

const INPUT_TXT = new URL('../src/assets/shuffled_real_wordles.txt', import.meta.url);
const OUTPUT_JSON = new URL('../src/assets/insightFreqs.json', import.meta.url);

// polite concurrency and backoff
const SLEEP_MS = 140;
const MAX_CONCURRENCY = 4;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFreq(word) {
  const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.json();

  // Find exact match by 'word'
  const hit = arr.find(x => (x.word || '').toUpperCase() === word.toUpperCase());
  if (!hit || !hit.tags) return 0;

  // tags may contain like "f:12.34"
  const fTag = hit.tags.find(t => t.startsWith('f:'));
  const freq = fTag ? parseFloat(fTag.slice(2)) : 0;
  return Number.isFinite(freq) ? freq : 0;
}

async function main() {
  const txt = await fs.readFile(INPUT_TXT, 'utf8');
  const words = txt.split('\n').map(w => w.trim()).filter(Boolean);

  const out = {};
  let i = 0;

  // simple concurrency pool
  async function worker(queue) {
    while (queue.length) {
      const w = queue.shift();
      try {
        const f = await fetchFreq(w);
        out[w.toUpperCase()] = f;
        console.log(`[${i}/${words.length}] ${w.toUpperCase()} → ${f}`);
      } catch (e) {
        // fallback 0 on failure
        out[w.toUpperCase()] = 0;
      }
      i++;
      if (i % MAX_CONCURRENCY === 0) await sleep(SLEEP_MS);
    }
  }

  const queue = [...words];
  const workers = Array.from({ length: MAX_CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${words.length} frequencies → ${OUTPUT_JSON.pathname}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
