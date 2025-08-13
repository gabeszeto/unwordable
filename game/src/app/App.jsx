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

import GameStageManager from '../features/GameStageManager';

// App.jsx (keep light)
export default function App() {
  return (
    <BrowserRouter>
      {/* Global providers only (e.g., ThemeProvider, AuthProvider) */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<GameProviders><GameStageManager /></GameProviders>} />
      </Routes>
    </BrowserRouter>
  );
}

// Bundle game-scoped providers so it's tidy
function GameProviders({ children }) {
  return (
    <LevelProvider>
      <DeathProvider>
        <RunStatsProvider>
          <DebuffsProvider>
            <PerksProvider>
              <CashProvider>
                <CorrectnessProvider>
                  {/* You can even move Skills/BoardHelper here if always needed */}
                  {children}
                </CorrectnessProvider>
              </CashProvider>
            </PerksProvider>
          </DebuffsProvider>
        </RunStatsProvider>
      </DeathProvider>
    </LevelProvider>
  );
}
