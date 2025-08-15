import React from 'react';

function HowToPlayMenu({ onBack }) {
  return (
    <div className="playMenu">
      <div className="howToText">
        <p>
          Survive <strong>10 levels</strong>. In each level, you must correctly guess a 5-letter word. <strong>Debuffs</strong> pile on as you go so it keeps getting tougher in the most fun (painful?) way.
        </p>
        <p>Beat a level to earn <strong>cash</strong> to buy <strong>consumables</strong> and <strong>skills</strong> which help you along the way.</p>

        <p>If you die on any level, the run ends. Clear them all and you're <strong>Unwordable</strong>.</p>
      </div>
    </div>
  );
}

export default HowToPlayMenu;
