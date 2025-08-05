import KeyzoneRow from './components/KeyzoneRow';
import KeyzoneSegment from './components/KeyzoneSegment';
import KeyzoneGrid from './components/KeyzoneGrid';
import Revelation from './components/Revelation';
import Anatomy from './components/Anatomy';
import Jybrish from './components/Jybrish';

export const perkRegistry = {
  Revelation: {
    name: "🔮 Revelation",
    description: "Reveals 1 correct letter in the right position.",
    cost: 6,
    weight: 2,
    component: Revelation,
  },
  Anatomy: {
    name: "🧪 Anatomy",
    description: "Tells you how many vowels and consonants are in the word.",
    cost: 3,
    weight: 5,
    component: Anatomy,
  },
  KeyzoneRow: {
    name: "KeyzoneRow",
    description: "Splits keyboard into rows and shows letter counts per row.",
    cost: 4,
    weight: 5,
    component: KeyzoneRow,
  },
  KeyzoneSegment: {
    name: "KeyzoneSegment",
    description: "Splits keyboard into vertical thirds and shows letter counts.",
    cost: 4,
    weight: 4,
    component: KeyzoneSegment,
  },
  KeyzoneGrid: {
    name: "KeyzoneGrid",
    description: "Splits keyboard into 6 zones and shows letter counts per zone.",
    cost: 9,
    weight: 1,
    component: KeyzoneGrid,
  },
  Jybrish: {
    name: "♒️ Jybrish",
    description: "For the next guess, the word doesn't have to be real.",
    cost: 6,
    weight: 2,
    component: Jybrish,
  }
};


// export const allPerks = {
//     // 🧠 Info
//     Revelation: {
//         name: "Divine Insight",
//         description: "Reveals 1 correct letter in the right position.",
//         rarity: "rare",
//     },
//     consensus: {
//         name: "Consensus",
//         description: "Shows simulated top 3 penultimate guesses.",
//         rarity: "basic",
//     },
//     Anatomy: {
//         name: "Anatomy",
//         description: "Tells you how many vowels and consonants are in the word.",
//         rarity: "basic",
//     },
//     keyRowRoulette: {
//         name: "Keyzones",
//         description: "Splits the keyboard into rows and shows how many letters are in each.",
//         rarity: "basic",
//     },
//     keySegmentRoulette: {
//         name: "Thirds",
//         description: "Splits the keyboard into vertical segments and shows how many letters are in each.",
//         rarity: "basic",
//     },
//     keyGridRoulette: {
//         name: "Gridlock",
//         description: "Splits keyboard into 9 zones and reveals how many letters are in each.",
//         rarity: "epic",
//     },
//     deadKeys: {
//         name: "Dead Keys",
//         description: "Reveals 2 letters that are not in the word.",
//         rarity: "basic",
//     },

//     // 🛠️ Utility
//     colorShift: {
//         name: "Color Shift",
//         description: "Randomly shuffles clue colors that can legally change.",
//         rarity: "rare",
//     },
//     stretch: {
//         name: "Stretch",
//         description: "Lets you guess a 6-letter word next turn.",
//         rarity: "rare",
//     },
//     echoTrail: {
//         name: "Echo Trail",
//         description: "Yellow tiles show arrows pointing toward the closest correct position.",
//         rarity: "rare",
//     },
//     barter: {
//         name: "Barter",
//         description: "Trade this with any other basic perk to get a random rare one.",
//         rarity: "basic",
//     },

//     // 🃏 Wild
//     borrowedTime: {
//         name: "Borrowed Time",
//         description: "Save a guess now to use in the next round.",
//         rarity: "rare",
//     },
//     babble: {
//         name: "Babble",
//         description: "For this round, guesses don’t have to be real words.",
//         rarity: "rare",
//     },
//     wager: {
//         name: "Wager",
//         description: "Bet 5 Gold that your next guess is correct. Win double or lose it all.",
//         rarity: "epic",
//     },
//     spectralGuess: {
//         name: "Spectral Guess",
//         description: "Make a guess that doesn’t use a turn, but gives slightly inaccurate clues.",
//         rarity: "epic",
//     },
// };

