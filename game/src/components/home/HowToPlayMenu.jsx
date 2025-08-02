import React from 'react';

function HowToPlayMenu({ onBack }) {
  return (
    <div className="playMenu">
      <div className="howToText">
        <p>This is like Wordle, but crazy.</p>

        <p>You go through 10 levels. Each level is a 5-letter word you have to guess.</p>

        <p>Some levels are regular, but every three rounds, there's a boss which messes with the rules, making your life more difficult.</p>

        <p>To help you out, you can use perks which give you little boosts. These are bought with gold from beating levels and can be spent between rounds.</p>

        <p>If you run out of guesses, the run ends. If you beat all 10? You're <strong>Unwordable</strong>.</p>
      </div>
    </div>
  );
}

export default HowToPlayMenu;
