import DivineInsight from './components/DivineInsight';
import ComponentsPerk from './components/ComponentsPerk';

export const perkRegistry = {
    divineInsight: {
        component: DivineInsight,
        props: ['targetWord', 'revealedIndices', 'setRevealedIndices', 'used', 'setUsed', 'onUse']
    },
    components: {
        component: ComponentsPerk,
        props: ['targetWord', 'used', 'setUsed', 'onUse']
    },
    // more to come
};