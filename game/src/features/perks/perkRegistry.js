import KeyzoneRow from './components/KeyzoneRow';
import KeyzoneSegment from './components/KeyzoneSegment';
import KeyzoneGrid from './components/KeyzoneGrid';
import Revelation from './components/Revelation';
import Anatomy from './components/Anatomy';
import Jybrish from './components/Jybrish';
import Sixer from './components/Sixer';


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
    name: "↔️ Keyzones (Row)",
    description: "Splits keyboard into rows and shows letter counts per row.",
    cost: 4,
    weight: 5,
    component: KeyzoneRow,
  },
  KeyzoneSegment: {
    name: "↕️ Keyzones (Segment)",
    description: "Splits keyboard into vertical thirds and shows letter counts.",
    cost: 4,
    weight: 4,
    component: KeyzoneSegment,
  },
  KeyzoneGrid: {
    name: "#️⃣ Keyzones (Grid)",
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
  },
  Sixer: {
    name: "6️⃣ Sixer",
    description: "Lets you guess a 6-letter word next guess.",
    cost: 4,
    weight: 3,
    component: Sixer
  },
};


// export const allPerks = {
//     // 🧠 Info
//     consensus: {
//         name: "Consensus",
//         description: "Shows simulated top 3 penultimate guesses.",
//         rarity: "basic",
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
//    
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
//     wager: {
//         name: "Wager",
//         description: "Bet 5 cash that your next guess is correct. Win double or lose it all.",
//         rarity: "epic",
//     },
//     spectralGuess: {
//         name: "Spectral Guess",
//         description: "Make a guess that doesn’t use a turn, but gives slightly inaccurate clues.",
//         rarity: "epic",
//     },
// };

