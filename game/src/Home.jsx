import React, { useState } from 'react';
import './homeStyles.css';
import './styles.css';
import PlayMenu from './components/home/PlayMenu';
import HowToPlayMenu from './components/home/HowToPlayMenu';

function Home() {
  const [currentMenu, setCurrentMenu] = useState(null); // 'play', 'howto', 'options', or null

  const homeButtons = ["Play", "How to Play", "Options"];

  const openPage = (button) => {
    const map = {
      'Play': 'play',
      'How to Play': 'howto',
      'Options': 'options',
    };
    setCurrentMenu(map[button]);
  };

  const goBack = () => setCurrentMenu(null);

  return (
    <div className="homeContainer">
      <div className="mainTitle">Unwordable</div>

      {!currentMenu && (
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
      )}

      {currentMenu === 'play' && (
        <PlayMenu
          hasOngoingGame={true}
        />
      )}

      {currentMenu === 'howto' && (
        <HowToPlayMenu />
      )
      }

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
