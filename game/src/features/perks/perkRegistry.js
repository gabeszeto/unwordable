import KeyzoneRow from './components/KeyzoneRow';
import KeyzoneSegment from './components/KeyzoneSegment';
import KeyzoneGrid from './components/KeyzoneGrid';
import Revelation from './components/Revelation';
import Anatomy from './components/Anatomy';
import Jybrish from './components/Jybrish';
import Sixer from './components/Sixer';
import DeadKeys from './components/DeadKeys';
import BorrowedTime from './components/BorrowedTime';


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
  DeadKeys: {
    name: "⬜️ Dead Keys",
    description: "Turns two white keys gray.",
    cost: 3,
    weight: 5,
    component: DeadKeys
  },
  BorrowedTime: {
    name: "⌛️ Borrowed Time",
    description: "Removes a guess from this round and adds it to the next round.",
    cost: 6,
    weight: 300,
    component: BorrowedTime
  },
};


// export const allPerks = {
//     // 🧠 Info
//     deadKeys: {
//         name: "Dead Keys",
//         description: "Reveals 2 letters that are not in the word.",
//         rarity: "basic",
//     },

//     // 🛠️ Utility
// Milos aid
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
//         description: "Remove a guess now to use in the next round.",
//         rarity: "rare",
//     },
//     wager: {
//         name: "Wager",
//         description: "Bet 5 cash that your next guess is correct. Win double or lose it all.",
//         rarity: "epic",
//     },
// };

