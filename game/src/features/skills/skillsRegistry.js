// src/features/skills/skillsRegistry.js

export const skillsRegistry = {
  LetterLens: {
    id: 'LetterLens',
    name: '🔎 Letter Lens',
    maxLevel: 2,
    shop: { minStage: 1, maxStage: 20 }, // optional; defaults applied if missing
    levels: [
      { level: 1, cost: 15, weight: 2, description: 'Reveal if first letter is vowel/consonant.' },
      { level: 2, cost: 20, weight: 1, description: 'Also reveal if last letter is vowel/consonant.' }
    ],
  },
  Repeater: {
    id: 'Repeater',
    name: '🔁 Repeater',
    maxLevel: 2,
    shop: { minStage: 1, maxStage: 20 },
    levels: [
      { level: 1, cost: 15, weight: 2, description: 'Tells if any letter repeats.' },
      { level: 2, cost: 10, weight: 2, description: 'Also tells how many letters repeat.' },
    ],
  },
  Analysis: {
    id: 'Analysis',
    name: '🧠 Analysis',
    maxLevel: 2,
    shop: { minStage: 1, maxStage: 20 },
    levels: [
      { level: 1, cost: 10, weight: 2, description: 'Shows how many tries Gabe took (simulated).' },
      { level: 2, cost: 12, weight: 1, description: 'Also shows if Gabe knows the word (manual or simulated).' },
    ],
  },
  // ...more skills
};