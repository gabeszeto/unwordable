import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeath } from '../../contexts/death/DeathContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { useCash } from '../../contexts/cash/CashContext';

export default function DeathScreen() {
    const navigate = useNavigate();
    const { deathRound, reason, setDeathInfo } = useDeath();

    const { resetLevel } = useLevel();
    const { resetCash } = useCash();

    const displayReason = {
        'GrayReaper': 'The Gray Reaper claimed your soul.',
        'Out of guesses': 'You ran out of guesses.',
    }[reason] || 'You perished...';

    return (
        <div className="death-screen">
            <h1>💀 You Died</h1>
            <p>You reached <strong>Round {deathRound}</strong>.</p>
            <p>{displayReason}</p>

            <div onClick={() => {
                resetLevel();
                resetCash();
                setDeathInfo({ deathRound: 0, reason: null });
                navigate('/');
            }}>
                Back to Menu
            </div>
        </div>
    );
}
