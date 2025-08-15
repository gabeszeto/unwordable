import '../styles.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../features/home/components/Home';

import { CashProvider } from '../contexts/cash/CashContext';
import { LevelProvider } from '../contexts/level/LevelContext';
import { PerksProvider } from '../contexts/perks/PerksContext';
import { DebuffsProvider } from '../contexts/debuffs/DebuffsContext';
import { DeathProvider } from '../contexts/death/DeathContext';
import { CorrectnessProvider } from '../contexts/CorrectnessContext';
import { RunStatsProvider } from '../contexts/RunStatsContext';
import { SkillsProvider } from '../contexts/skills/SkillsContext';

import GameStageManager from '../features/GameStageManager';
import GameSave from '../features/GameSave';

export default function App() {
  return (
    <BrowserRouter>
      <LevelProvider>
        <DeathProvider>
          <RunStatsProvider>
            <DebuffsProvider>
              <SkillsProvider>
                <PerksProvider>
                  <CashProvider>
                    <CorrectnessProvider>
                      <GameSave>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/play" element={<GameStageManager />} />
                        </Routes>
                      </GameSave>
                    </CorrectnessProvider>
                  </CashProvider>
                </PerksProvider>
              </SkillsProvider>
            </DebuffsProvider>
          </RunStatsProvider>
        </DeathProvider>
      </LevelProvider>
    </BrowserRouter>
  );
}
