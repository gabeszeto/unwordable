// GameScreen.jsx
import React, { useState, useEffect } from 'react';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';

import { useCash } from '../../contexts/cash/CashContext.jsx';
import { calculateRoundCash } from '../../contexts/cash/cashUtils.js';
import { useLevel } from '../../contexts/level/LevelContext';
import { useDeath } from '../../contexts/death/DeathContext'
import { useDebuffs } from '../../contexts/debuffs/DebuffsContext.jsx';
import { useCorrectness } from '../../contexts/CorrectnessContext.jsx';
import { useSkills } from '../../contexts/skills/SkillsContext.jsx';

import PerkDisplay from './components/PerkDisplay.jsx';

import './gameScreenStyles.css';
import './popups/popupScreenStyles.css'

import HintInfoScreen from './popups/HintInfoScreen.jsx'

import shuffledWordles from '../../assets/shuffled_real_wordles.txt?raw';
import ItemDescriptionScreen from './popups/ItemDescriptionScreen.jsx';

// ⬇️ NEW: pretty names for chips (emoji etc.)
import { getItemMeta } from '../getItemMeta';

export default function GameScreen({paused}) {
  const { stage, setStage, advanceStage, isGameStage, bankGuess, consumeGuessBank } = useLevel();
  const [guesses, setGuesses] = useState([]);
  const { revealedIndices } = useCorrectness();
  const { setDeathInfo } = useDeath();
  const { cash, addCash } = useCash();
  const { activeDebuffs, passiveDebuffs } = useDebuffs();
  const { activeSkills } = useSkills()

  const BOSS_STAGES = [4, 10, 16, 18];

  const [usedKeys, setUsedKeys] = useState({});
  const [cashEarned, setCashEarned] = useState(0);
  const round = stage / 2 + 1;

  // Logic for cutshort and borrowedGuess
  const BASE_MAX_GUESSES = 6;
  const cutShortStacks = passiveDebuffs['CutShort'] || 0;

  // Saved time for next round
  const [maxGuesses, setMaxGuesses] = useState(BASE_MAX_GUESSES);

  // ⬇️ Recompute only when entering a GAME stage
  useEffect(() => {
    if (!isGameStage(stage)) return; // skip shop screens

    const base = BASE_MAX_GUESSES - cutShortStacks;
    const bank = consumeGuessBank();          // <-- pulls from LevelContext and resets to 0
    const applied = Math.max(2, Math.min(BASE_MAX_GUESSES, base + bank));
    setMaxGuesses(applied);
  }, [stage, cutShortStacks]);

  // OLD: perks open by setting just a key (keep this for PerkDisplay)
  const [itemDescriptionKey, setItemDescriptionKey] = useState(null);

  // NEW: chips open via a richer state so we can pass level/stacks/subtype
  const [inspectItem, setInspectItem] = useState(null);
  // { type: 'skill' | 'debuff', key: string, runtime?: any }

  const openItem = (type, key, runtime) => {
    setInspectItem({ type, key, runtime });
    // ensure perk modal (if any) is closed
    setItemDescriptionKey(null);
  };
  const closeInspectItem = () => setInspectItem(null);

  // Perk states
  const [usedPerks, setUsedPerks] = useState([]);

  // Sixer state for board ui
  const [sixerMode, setSixerMode] = useState(false)

  const isKeyzoneUsed = usedPerks.some((key) => key.startsWith('keyzone'));

  const markAsUsed = (key) => {
    setUsedPerks((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const resetUsedPerks = () => {
    setUsedPerks([]);
  };

  // KB and board logic for delayed feedback
  const [feedbackShownUpToRow, setFeedbackShownUpToRow] = useState(-1);

  // KB stuff
  const [keyzoneType, setKeyzoneType] = useState(null);
  const [keyzoneOverlayVisible, setKeyzoneOverlayVisible] = useState(false);

  // Perk Info stuff
  const [infoPerkKey, setInfoPerkKey] = useState(null); // e.g. "Anatomy"
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const allWords = shuffledWordles.split('\n').map(w => w.trim().toUpperCase());
  const [targetWords] = useState(() =>
    Array.from({ length: 10 }, () => allWords[Math.floor(Math.random() * allWords.length)])
  );

  const targetWord = targetWords[round - 1];
  // const targetWord = 'LEVEL'

  // perk stuff
  const sharedProps = {
    targetWord,
    onKBActivate: setKeyzoneType,
    revealedIndices,
    setInfoPerkKey,
    setSixerMode,
    guesses,
    usedKeys,
    setUsedKeys,
    maxGuesses,
    setMaxGuesses, // to decrement this round by 1
    bankGuessToNextRound: () => bankGuess(1, BASE_MAX_GUESSES), // <-- from context
    itemDescriptionKey,
    setItemDescriptionKey, // used by perk buttons to open the modal
    markAsUsed,
    setShowInfoPanel
  };

  const [virtualKeyHandler, setVirtualKeyHandler] = useState(null);
  const handleKeyPress = (key) => {
    if (virtualKeyHandler) virtualKeyHandler({ key });
  };

  // KB Shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShowInfoPanel(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setKeyzoneOverlayVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // a11y helper for chips
  const chipProps = (onActivate) => ({
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
    style: { cursor: 'pointer' },
  });

  const toRoman = (num) => {
    if (num <= 0) return '';
    const map = [
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    let result = '';
    for (const { value, numeral } of map) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  };

  return (
    <div className="game-screen">

      {/* passives and debuffs display */}
      <div className={`modifiersDisplay ${BOSS_STAGES.includes(stage) ? 'is-boss' : ''}`}>
        {(() => {
          const skillEntries = Object.entries(activeSkills || {}).filter(([, lvl]) => lvl > 0);
          const hasSkills = skillEntries.length > 0;
          const hasPassives = Object.keys(passiveDebuffs || {}).length > 0;
          const hasActives = (activeDebuffs || []).length > 0;
          const hasAny = hasSkills || hasPassives || hasActives;

          if (!hasAny) return <span className="mod-none">No modifiers... yet</span>;

          return (
            <>
              {/* GOOD: Skills (permanent upgrades) */}
              {hasSkills && (
                <div className="mod-group good" aria-label="Skills">
                  {skillEntries.map(([skillKey, level]) => {
                    const display = getItemMeta(skillKey)?.name || skillKey;
                    return (
                      <span
                        className="mod-chip good"
                        key={`skill-${skillKey}`}
                        {...chipProps(() => openItem('skill', skillKey, { level }))}
                      >
                        {display} {level > 1 ? toRoman(level) : ''}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* separator if both groups present */}
              {hasSkills && (hasPassives || hasActives) && <span className="mod-sep" aria-hidden="true" />}

              {/* BAD: Debuffs (passive + active) */}
              {(hasPassives || hasActives) && (
                <div className="mod-group bad" aria-label="Debuffs">
                  {/* passive debuffs */}
                  {Object.entries(passiveDebuffs || {}).map(([debuffKey, level]) => {
                    // hide NoFoureedom if NoThreedom exists
                    if (debuffKey === 'NoFoureedom' && passiveDebuffs['NoThreedom']) return null;
                    const isUpgrade = debuffKey === 'NoThreedom';
                    const display = getItemMeta(debuffKey)?.name || debuffKey;

                    return (
                      <span
                        className={`mod-chip bad passive ${isUpgrade ? 'mod-upgraded' : ''}`}
                        key={`passive-${debuffKey}`}
                        {...chipProps(() =>
                          openItem('debuff', debuffKey, {
                            stacks: level,               // shows "Stacks: n"
                            subtypeOverride: 'passive',  // ensures Passive badge
                          })
                        )}
                      >
                        {display}{level > 1 ? ` ${toRoman(level)}` : ''}
                      </span>
                    );
                  })}

                  {/* active debuffs */}
                  {activeDebuffs.map((debuffKey, i) => {
                    const display = getItemMeta(debuffKey)?.name || debuffKey;
                    return (
                      <span
                        className="mod-chip bad active"
                        key={`active-${debuffKey}-${i}`}
                        {...chipProps(() =>
                          openItem('debuff', debuffKey, { subtypeOverride: 'active' })
                        )}
                      >
                        {display}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      <Board
        key={round}
        onRoundComplete={async (success, guesses, deathReason, word) => {
          if (success) {
            const earned = calculateRoundCash({
              guessesUsed: guesses.length,
              isBoss: round % 3 === 0,
              activeDebuffs: activeDebuffs,
              passiveDebuffs: passiveDebuffs
            });
            addCash(earned);
            setCashEarned(earned);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            advanceStage();

            // Reset things
            resetUsedPerks();
            setUsedKeys({});
            setKeyzoneType(null);
            setKeyzoneOverlayVisible(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setDeathInfo({
              deathRound: round,
              reason: deathReason || 'Out of guesses',
              word: word
            });
            setStage(100);
          }
        }}
        guesses={guesses}
        setGuesses={setGuesses}
        setUsedKeys={setUsedKeys}
        usedKeys={usedKeys}
        targetWord={targetWord}
        onVirtualKey={setVirtualKeyHandler}
        cashEarned={cashEarned}
        feedbackShownUpToRow={feedbackShownUpToRow}
        setFeedbackShownUpToRow={setFeedbackShownUpToRow}
        setSixerMode={setSixerMode}
        sixerMode={sixerMode}
        maxGuesses={maxGuesses}
        stage={stage}
        paused={paused}
      />

      <div className="hud">
        <PerkDisplay
          usedPerks={usedPerks}
          sharedProps={sharedProps}
          isKeyzoneUsed={isKeyzoneUsed}
        />
      </div>

      <div className="gameButtons">
        {keyzoneType && (
          <button
            className={`gb-btn ${keyzoneOverlayVisible ? 'is-active' : ''}`}
            onClick={() => setKeyzoneOverlayVisible(v => !v)}
            title="Toggle keyzone overlay (O)"
          >
            <span className="gb-ico">🗺️</span>
            <span className="gb-label">{keyzoneOverlayVisible ? 'Overlay On' : 'Overlay Off'}</span>
            <kbd className="gb-kbd">Shift+O</kbd>
          </button>
        )}
        <button
          className={`gb-btn ${showInfoPanel ? 'is-active' : ''}`}
          onClick={() => setShowInfoPanel(p => !p)}
          title="Show hint/info (I)"
        >
          <span className="gb-ico">💡</span>
          <span className="gb-label">{showInfoPanel ? 'Hide Info' : 'Show Info'}</span>
          <kbd className="gb-kbd">Shift+I</kbd>
        </button>
      </div>

      <Keyboard
        usedKeys={usedKeys}
        onKeyPress={handleKeyPress}
        keyzoneType={keyzoneOverlayVisible ? keyzoneType : null}
        targetWord={targetWord}
        feedbackShownUpToRow={feedbackShownUpToRow}
      />

      {/* popups */}
      {showInfoPanel && (
        <div
          className="popup-overlay"
          onClick={() => {
            setShowInfoPanel(false);
          }}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing if clicking inside
          >
            <button
              className="popup-close"
              onClick={() => {
                setShowInfoPanel(false);
              }}
            >
              &times;
            </button>
            <HintInfoScreen perkKey={infoPerkKey} targetWord={targetWord} />
          </div>
        </div>
      )}

      {/* Perk-initiated item modal (kept as-is) */}
      {itemDescriptionKey && (
        <ItemDescriptionScreen
          itemKey={itemDescriptionKey}
          runtime={sharedProps}
          onClose={() => setItemDescriptionKey(null)}
        />
      )}

      {/* Chip-initiated item modal (skills/debuffs) */}
      {inspectItem && (
        <ItemDescriptionScreen
          itemKey={inspectItem.key}
          // merge shared controls with chip-specific runtime (level/stacks/subtype)
          runtime={{ ...sharedProps, ...(inspectItem.runtime || {}) }}
          onClose={closeInspectItem}
        />
      )}
    </div>
  );
}
