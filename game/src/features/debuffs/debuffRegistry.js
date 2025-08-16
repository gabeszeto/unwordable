export const debuffRegistry = {
  // 🔥 ACTIVE DEBUFFS
  Grellow: {
    type: 'active',
    name: 'Grellow',
    description: `Green tiles will show up as yellow instead.`,
    weight: 1,
  },
  Yellowless: {
    type: 'active',
    name: 'Yellowless',
    description: "Correct letters in the wrong place have a 1/3 chance to not show up as yellow.",
    weight: 1,
  },
  GreyReaper: {
    type: 'active',
    name: 'Grey Reaper',
    description: 'Guessing a word with no colors ends your run instantly.',
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
    description: 'Each guess will have an extra fake yellow tile if there is space.',
    weight: 1,
  },

  // 💤 PASSIVE DEBUFFS 
  DelayedFeedback: {
    type: 'passive',
    name: 'Delayed Feedback',
    description: 'There is no visual feedback until after your first 2 guesses.',
    weight: 1,
  },
  LetterLock: {
    type: 'passive',
    name: 'Locked Letter',
    description: 'A random letter is locked into a specific position in one of your first three guesses.',
    weight: 2,
  },
  ShiftedGuess: {
    type: 'passive',
    name: 'Shifted Guess',
    description: 'One of your first three guesses is shifted left or right.',
    weight: 2,
  },
  NoFoureedom: {
    type: 'passive',
    name: 'NoFoureedom',
    description: 'Your first guess must be a 4-letter word.',
    weight: 2,
    upgradableTo: 'NoThreedom', // 💡 new field
  },
  NoThreedom: {
    type: 'passive',
    name: 'NoThreedom',
    description: 'Your first guess must be a 3-letter word. Brutal.',
    weight: 1,
    hidden: true,
    requires: 'NoFoureedom' // 💡 only eligible if this is already picked
  },
  CutShort: {
    type: 'passive',
    name: 'Cut Short',
    description: 'You have 1 less guess.',
    weight: 1,
    maxStacks: 2,
    stackable: true
  },
  PerkTax: {
    type: 'passive',
    name: 'Perk Tax',
    description: 'Using a perk costs +1 cash.',
    weight: 1,
    maxStacks: 3,
    stackable: true
  },
};
