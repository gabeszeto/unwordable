// src/features/perks/usePerkActions.js
import { usePerks } from '../../contexts/perks/PerksContext';
import { useDebuffs } from '../../contexts/debuffs/DebuffsContext';
import { useCash } from '../../contexts/cash/CashContext';
import { useCorrectness } from '../../contexts/CorrectnessContext';
import { useBoardHelper } from '../../contexts/BoardHelperContext';

/**
 * Centralized perk logic.
 * Call: runPerk(perkKey, runtime)
 *   - runtime is a bag of callbacks from GameScreen, e.g.:
 *     { markAsUsed, setInfoPerkKey }
 *
 * Returns: { ok: boolean, error?: string }
 * 
 */

// Helper for dead keys
function pickDeadLetters(targetWord, usedKeys, count = 2) {
    const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const set = new Set(String(targetWord || '').toUpperCase().split(''));
    const eligible = ALPH.filter(ch => !usedKeys?.[ch] && !set.has(ch));
    for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    return eligible.slice(0, count);
}

export function usePerkActions() {
    const { usePerk, activateJybrish, perks } = usePerks();
    const { passiveDebuffs } = useDebuffs();
    const { cash, pendingWager, placeWager, spendCash } = useCash();

    // Perk Tax logic
    const perkTaxStacks = passiveDebuffs['PerkTax'] || 0;
    const applyPerkTax = () => {
        if (perkTaxStacks > 0) spendCash(perkTaxStacks);
    };

    // Revelation logic
    const {
        revealIndexForRow,
        getUnrevealedTrulyCorrectIndices,
        getRevealedForRow,
    } = useCorrectness();
    const { getRowActiveIndices } = useBoardHelper();

    // one place to keep “consumption” side-effects consistent
    function consume(perkKey, runtime) {
        runtime?.markAsUsed?.(perkKey);  // updates usedPerks -> PerkDisplay “remaining”
        applyPerkTax();
        usePerk(perkKey);                // decrement inventory
    }

    function runPerk(perkKey, runtime = {}) {
        const qty = perks?.[perkKey] || 0;
        if (qty <= 0) return { ok: false, error: 'No copies left' };

        // Keyzone centraliser
        const runKeyzone = (mode) => {
            if (runtime?.isKeyzoneUsed) {
                return { ok: false, error: 'A Keyzone perk was already used this round' };
            }
            runtime?.onKBActivate?.(mode);
            consume(perkKey, runtime);
            return { ok: true };
        };

        switch (perkKey) {
            case 'Anatomy': {
                // open the hint panel for Anatomy
                consume(perkKey, runtime);

                runtime?.setInfoPerkKey?.('Anatomy');
                runtime?.setShowInfoPanel?.(true)

                return { ok: true };
            }

            case 'BorrowedTime': {
                const { guesses, maxGuesses, setMaxGuesses, bankGuessToNextRound } = runtime;

                const MIN_THIS_ROUND = 2;
                const guessesUsed = guesses?.length ?? 0;
                const guessesLeft = (maxGuesses ?? 0) - guessesUsed;

                // same safety rails as before
                if ((maxGuesses ?? 0) <= MIN_THIS_ROUND || guessesLeft <= 1) {
                    return { ok: false, error: "You can't spare a guess this round" };
                }

                // -1 this round (clamped)
                setMaxGuesses?.((prev) => Math.max(MIN_THIS_ROUND, prev - 1));

                // +1 banked for next round (your GameScreen caps at round start)
                bankGuessToNextRound?.();

                consume(perkKey, runtime);
                return { ok: true };
            }

            case 'DeadKeys': {
                const { targetWord, usedKeys, setUsedKeys } = runtime;
                if (!setUsedKeys) return { ok: false, error: 'Missing keyboard setters' };

                const picks = pickDeadLetters(targetWord, usedKeys, 2);
                if (!picks.length) return { ok: false, error: 'No eligible letters to gray out' };

                setUsedKeys(prev => {
                    const next = { ...prev };
                    for (const ch of picks) next[ch] = 'absent';
                    return next;
                });

                consume(perkKey, runtime);
                return { ok: true };
            }

            case 'Jybrish': {
                activateJybrish();        // toggle the perk effect
                consume(perkKey, runtime);
                return { ok: true };
            }

            case 'KeyzoneGrid':
                return runKeyzone('grid');
            case 'KeyzoneHalves':
                return runKeyzone('halves');
            case 'KeyzoneRow':
                return runKeyzone('row');

            case 'Revelation': {
                const { guesses } = runtime;
                const rowIndex = guesses?.length ?? 0;
                const allowed = getRowActiveIndices(rowIndex);
                if (!Array.isArray(allowed) || allowed.length === 0) {
                    return { ok: false, error: 'No slots available' };
                }

                const notTruly = getUnrevealedTrulyCorrectIndices();
                const already = new Set(getRevealedForRow(rowIndex));
                const candidates = allowed.filter(i => notTruly.includes(i) && !already.has(i));
                const fallback = allowed.filter(i => !already.has(i));
                const pool = candidates.length ? candidates : (fallback.length ? fallback : allowed);

                const pick = pool[Math.floor(Math.random() * pool.length)];
                revealIndexForRow(rowIndex, pick);

                consume(perkKey, runtime);
                return { ok: true };
            }

            case 'Sixer': {
                const { setSixerMode } = runtime;
                if (!setSixerMode) return { ok: false, error: 'Missing Sixer setter' };
                setSixerMode(true);
                consume(perkKey, runtime);
                return { ok: true };
            }

            case 'Wager': {
                const stake = 5;
                if (pendingWager) return { ok: false, error: 'Wager already active' };
                if (cash < stake) return { ok: false, error: 'Not enough cash' };
                const ok = placeWager({ stake, payout: stake });
                if (!ok) return { ok: false, error: 'Could not place wager' };
                consume(perkKey, runtime);
                return { ok: true };
            }

            default:
                return { ok: false, error: `Unsupported perk: ${perkKey}` };
        }
    }

    return { runPerk };
}
