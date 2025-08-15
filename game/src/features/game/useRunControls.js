// src/features/run/useRunControls.js
import { useNavigate } from 'react-router-dom';
import { clearSave } from '../save';           // adjust path
import { useLevel } from '../../contexts/level/LevelContext';
import { useRunStats } from '../../contexts/RunStatsContext';
import { useDebuffs } from '../../contexts/debuffs/DebuffsContext';
import { useCorrectness } from '../../contexts/CorrectnessContext';
import { useCash } from '../../contexts/cash/CashContext';
import { usePerks } from '../../contexts/perks/PerksContext';
import { generateDebuffPlan, generateDebugDebuffPlan } from '../debuffs/generateDebuffPlan';
import { useSkills } from '../../contexts/skills/SkillsContext';
const STARTING_CASH = Number(import.meta.env.VITE_STARTING_CASH ?? 10);

export function useRunControls() {
    const navigate = useNavigate();
    const { resetLevel } = useLevel();
    const { resetRunStats } = useRunStats();
    const { setDebuffPlan, resetDebuffsCompletely } = useDebuffs();
    const { resetCorrectness } = useCorrectness();
    const { resetCash, addCash } = useCash();
    const { resetPerks } = usePerks();
    const { resetSkills} = useSkills();

    /** Core reset used by both Start New + Restart */
    const resetAll = () => {
        resetRunStats();

        resetLevel();
        resetDebuffsCompletely();
        // const plan = generateDebuffPlan();
        const plan = generateDebugDebuffPlan({
            forcePassive: {},
            forceActive: ['Yellowless', 'GoldenLie']
        })
        setDebuffPlan(plan);
        resetCorrectness();
        resetPerks();
        resetSkills();
        resetCash();
        if (STARTING_CASH > 0) addCash(STARTING_CASH);
    };


    /** From menus: wipe save, reset, then go to /play */
    const startNewRun = (to = '/play') => {
        clearSave();
        resetAll();
        navigate(to);
    };

    /**
     * From in-game: reset run without navigating.
     * Accepts an optional callback to clear local timers (pause/etc.).
     */
    const restartRunInGame = (opts = {}) => {
        const { onResetLocalTimers } = opts;
        onResetLocalTimers?.(); // let caller clear pause refs
        clearSave();
        resetAll();
    };

    return { startNewRun, restartRunInGame };
}

