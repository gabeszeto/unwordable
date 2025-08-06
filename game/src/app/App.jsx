import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../features/home/components/Home';

import { CashProvider } from '../contexts/cash/CashContext';
import { LevelProvider } from '../contexts/level/LevelContext';
import { PerksProvider } from '../contexts/perks/PerksContext';
import { DebuffsProvider } from '../contexts/debuffs/DebuffsContext';

import '../styles.css'
import GameStageManager from '../features/GameStageManager';
import { DeathProvider } from '../contexts/death/DeathContext';

export default function App() {
  return (
    <LevelProvider>
      <DeathProvider>
        <DebuffsProvider>
          <PerksProvider>
            <CashProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/play" element={<GameStageManager />} />
                </Routes>
              </BrowserRouter>
            </CashProvider>
          </PerksProvider>
        </DebuffsProvider>
      </DeathProvider>
    </LevelProvider>

  )
}