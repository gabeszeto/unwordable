import KeyzoneRow from './components/KeyzoneRow';
import KeyzoneHalves from './components/KeyzoneHalves';
import KeyzoneGrid from './components/KeyzoneGrid';
import Revelation from './components/Revelation';
import Anatomy from './components/Anatomy';
import Jybrish from './components/Jybrish';
import Sixer from './components/Sixer';
import DeadKeys from './components/DeadKeys';
import BorrowedTime from './components/BorrowedTime';
import Wager from './components/Wager';

export const perkRegistry = {
  Revelation: {
    name: "🔮 Revelation",
    description: "Reveals 1 correct letter in the right position.",
    cost: 5,
    weight: 3,
    component: Revelation,
  },
  Anatomy: {
    name: "🧪 Anatomy",
    description: "Tells you how many vowels and consonants are in the word.",
    cost: 3,
    weight: 4,
    component: Anatomy,
  },
  KeyzoneRow: {
    name: "↔️ Keyzones (Row)",
    description: "Splits keyboard into rows and shows letter counts per row.",
    weight: 5,
    component: KeyzoneRow,
  },
  KeyzoneHalves: {
    name: "½ Keyzones (Halves)",
    description: "Splits keyboard into two halves.",
    weight: 4,
    component: KeyzoneHalves,
  },
  KeyzoneGrid: {
    name: "#️⃣ Keyzones (Grid)",
    description: "Splits keyboard into 6 zones and shows letter counts per zone.",
    weight: 2,
    component: KeyzoneGrid,
  },
  Jybrish: {
    name: "♒️ Jybrish",
    description: "For the next guess, the word doesn't have to be real.",
    cost: 4,
    weight: 3,
    component: Jybrish,
  },
  Sixer: {
    name: "6️⃣ Sixer",
    description: "Lets you guess a 6-letter word next guess.",
    cost: 3,
    weight: 3,
    component: Sixer
  },
  DeadKeys: {
    name: "⬛️ Dead Keys",
    description: "Turns two white keys grey.",
    cost: 2,
    weight: 5,
    component: DeadKeys
  },
  BorrowedTime: {
    name: "⌛️ Borrowed Time",
    description: "Removes a guess from this round and adds it to the next round.",
    cost: 2,
    weight: 2,
    component: BorrowedTime
  },
  Wager: {
    name: "💸 Wager",
    description: "Wager 5 Cash on your next guess. Guess right to win 10, guess wrong and lose it all.",
    cost: 2,
    weight: 2,
    component: Wager
  },
};

// Milo's aid which gives a word which has 3 greens in the word if possible, if not, it does 2 greens and 2 yellows,