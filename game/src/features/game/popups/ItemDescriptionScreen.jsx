// src/features/infoscreen/ItemDescriptionScreen.jsx
import React from 'react';
import { getItemMeta } from '../../getItemMeta';
import './popupScreenStyles.css';

export default function ItemDescriptionScreen({ itemKey, onClose }) {
    const meta = getItemMeta(itemKey);
    if (!meta) return null;

    const { type, name, description, stackable, maxStacks, requires } = meta;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <header className="itemTopPart">
                    <h3>{name}</h3>
                    <span className="itemPopup">
                        {type === 'skill' ? 'Skill' : 'Consumable'}
                    </span>
                </header>

                <div className="itemBodyText">
                    <p className="item-desc">{description}</p>
                    <ul className="item-meta">
                        {stackable != null && <li>Stackable: {stackable ? 'Yes' : 'No'}</li>}
                        {maxStacks != null && <li>Max stacks: {maxStacks}</li>}
                        {requires && <li>Requires: {requires}</li>}
                    </ul>
                </div>

                    <div className="itemCloseButton" onClick={onClose}>
                        ✕
                    </div>
            </div>
        </div>

    );
}
