// PlayMenu.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function PlayMenu({ hasOngoingGame, onSelect }) {
    const navigate = useNavigate();

    const playOptions = [
        { label: 'Daily', value: 'daily', active: true },
        { label: 'New Run', value: 'new', active: true },
        { label: 'Continue', value: 'continue', active: hasOngoingGame }
    ];

    const handleSelect = (value) => {
        if (value === 'daily') {
            navigate('/play');
        } else {
            return
        }
    };

    return (
        <div className="playMenu">
            <div className="homeButtons">
                {playOptions.map((opt, i) => (
                    <div
                        key={i}
                        className={`homeButton ${!opt.active ? 'disabled' : ''}`}
                        onClick={() => opt.active && handleSelect(opt.value)}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PlayMenu;
