// src/features/Popup.jsx
import React from 'react';
import './popupScreenStyles.css';

export default function Popup({ children, onClose }) {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  );
}
