import GrayReaper from './GrayReaper';
import BlurredVision from './BlurredVision';
// import future debuffs here

export const debuffRegistry = {
  GrayReaper: {
    name: 'Gray Reaper',
    description: 'Guessing a word with no colors ends your run instantly.',
    component: GrayReaper, // optional, if you need a visual effect or rule hook
    weight: 0
  },
  BlurredVision: {
    name: 'Blurred Vision',
    description: 'Letters one step away from the correct letter will also appear green. (But yellows remain sharp — only exact letters out of place count.)',
    component: BlurredVision, // optional visual influence on feedback
    weight: 1
  },
};
