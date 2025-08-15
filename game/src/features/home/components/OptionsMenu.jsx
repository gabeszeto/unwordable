// src/features/home/components/OptionsMenu.jsx
import React from 'react';
import ThemeToggle from '../../ThemeToggle'; // ← adjust path if yours is elsewhere
import '../homeStyles.css'

function OptionsMenu() {
  return (
    <div className="optionsMenu">
      <div className="optionsRow">
        <div className="optionName">
          Theme
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default OptionsMenu;
