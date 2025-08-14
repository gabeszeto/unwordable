import React, { useState } from 'react';
import '../homeStyles.css';
import PlayMenu from './PlayMenu';
import HowToPlayMenu from './HowToPlayMenu';
import { hasOngoingRun } from '../../save'; // 👈 import the helper

function Home() {
  const [currentMenu, setCurrentMenu] = useState(null); // 'play', 'howto', 'options', or null
  const [menuOpening, setMenuOpening] = useState(false);

  const homeButtons = ["Play", "How to Play", "Options"];

  const openPage = (button) => {
    setMenuOpening(true);
    setTimeout(() => {
      setCurrentMenu({ Play: 'play', 'How to Play': 'howto', Options: 'options' }[button]);
      setMenuOpening(false);
    }, 1); // matches CSS transition
  };

  const goBack = () => setCurrentMenu(null);

  return (
    <div className={`homeContainer ${menuOpening ? 'menu-opening' : ''}`}>
      {!currentMenu && (
        <>
          <div className="mainTitle">Unwordable</div>

          <div className="homeButtons">
            {homeButtons.map((button, i) => (
              <div
                className="homeButton"
                key={i}
                onClick={(e) => {
                  e.currentTarget.blur(); // remove focus style
                  openPage(button);
                }}
              >
                {button}
              </div>
            ))}
          </div>
        </>
      )}

      {currentMenu === 'play' && (
        <PlayMenu
          hasOngoingGame={hasOngoingRun()} // 👈 now dynamic
        />
      )}

      {currentMenu === 'howto' && (
        <HowToPlayMenu />
      )}

      {/* Back button always rendered, but only visible when in submenu */}
      <div
        className="backButton persistent"
        onClick={currentMenu ? goBack : null}
        style={{ visibility: currentMenu ? 'visible' : 'hidden' }}
      >
        ← Back
      </div>
    </div>
  );
}

export default Home;
