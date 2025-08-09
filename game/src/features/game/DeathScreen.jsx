import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeath } from '../../contexts/death/DeathContext';
import { useLevel } from '../../contexts/level/LevelContext';
import { useCash } from '../../contexts/cash/CashContext';

import './deathScreenStyles.css'

export default function DeathScreen() {
    const navigate = useNavigate();
    const { deathRound, reason, word, setDeathInfo } = useDeath();

    const { resetLevel } = useLevel();
    const { resetCash } = useCash();

    const displayReason = {
        'GreyReaper': 'The Gray Reaper claimed your soul.',
        'Out of guesses': 'You ran out of guesses.',
    }[reason] || 'You perished...';

    return (
        <div className="death-screen">
            <h1>💀 You Died</h1>
            <p>You reached <strong>Round {deathRound}</strong>.</p>
            <p>{displayReason}</p>
            <p>The word was {word}</p>
            <div onClick={() => {
                resetLevel();
                resetCash();
                setDeathInfo({ deathRound: 0, reason: null, word: '' });
                navigate('/');
            }}>
                Back to Menu
            </div>
        </div>
    );
}
