export const debuffRegistry = {
  // 🔥 ACTIVE DEBUFFS — applied only in boss levels
  Grellow: {
    type: 'active',
    name: 'Grellow',
    description: 'Green tiles are replaced with yellow. You’ll never know what’s correct.',
    weight: 1,
  },
  Yellowless: {
    type: 'active',
    name: 'Yellow-less',
    description: "Correct letters in the wrong place won't show up yellow.",
    weight: 1,
  },
  FeedbackDelay: {
    type: 'active',
    name: 'Feedback Delay',
    description: 'No feedback until after your first 2 guesses.',
    weight: 1,
  },
  BlurredVision: {
    type: 'active',
    name: 'Blurred Vision',
    description: 'Letters ±1 away from the correct letter show as green too.',
    weight: 1,
  },
  GoldenLie: {
    type: 'active',
    name: 'Golden Lie',
    description: 'Each guess will have an extra fake yellow tile.',
    weight: 1,
  },

  // 💤 PASSIVE DEBUFFS — applied randomly to spice up non-boss levels
  GrayReaper: {
    type: 'passive',
    name: 'Gray Reaper',
    description: 'Guessing a word with no colors ends your run instantly.',
    weight: 1,
  },
  LetterLock: {
    type: 'passive',
    name: 'Locked Letter',
    description: 'A random letter is locked into a specific position in one of your first three guesses.',
    weight: 1,
  },
  ShiftedGuess: {
    type: 'passive',
    name: 'Shifted Guess',
    description: 'One of your first three guesses is shifted left or right.',
    weight: 1,
  },
  FourSight: {
    type: 'passive',
    name: 'Foursight',
    description: 'Your first guess must be a 4-letter word.',
    weight: 1,
  },
  NoThreedom: {
    type: 'passive',
    name: 'No Threedom',
    description: 'Your first guess must be a 3-letter word. Brutal.',
    hidden: true, // optional: don’t show in perk selection if it's an upgrade
  },
  CutShort: {
    type: 'passive',
    name: 'Cut Short',
    description: 'You have 1 less guess.',
    weight: 1,
    maxStacks: 3
  },
  PerkTax: {
    type: 'passive',
    name: 'Perk Tax',
    description: 'Using a perk costs +1 gold.',
    weight: 1,
    maxStacks: 2
  },
};
