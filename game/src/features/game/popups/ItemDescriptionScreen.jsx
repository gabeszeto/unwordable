// src/features/infoscreen/ItemDescriptionScreen.jsx
import React from 'react';
import { getItemMeta } from '../../getItemMeta';
import './itemDescriptionStyles.css';

export default function ItemDescriptionScreen({ itemKey, onClose }) {
  const meta = getItemMeta(itemKey);
  if (!meta) return null;

  const { type, name, description, stackable, maxStacks, requires } = meta;

  return (
    <div className="item-modal-backdrop" onClick={onClose}>
      <div className="item-modal" onClick={(e) => e.stopPropagation()}>
        <header className="item-modal__header">
          <h3>{name}</h3>
          <span className="item-tag">{type}</span>
        </header>

        <div className="item-modal__body">
          <p className="item-desc">{description}</p>
          <ul className="item-meta">
            {stackable != null && <li>Stackable: {stackable ? 'Yes' : 'No'}</li>}
            {maxStacks != null && <li>Max stacks: {maxStacks}</li>}
            {requires && <li>Requires: {requires}</li>}
          </ul>
        </div>

        <footer className="item-modal__footer">
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
