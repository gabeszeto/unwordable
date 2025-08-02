import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../features/home/components/Home';

import { GoldProvider } from '../contexts/gold/GoldContext';
import { LevelProvider } from '../contexts/level/LevelContext';
import { PerksProvider } from '../contexts/perks/PerksContext';

import '../styles.css'
import GameStageManager from '../features/GameStageManager';

export default function App() {
  return (
    <LevelProvider>

      <PerksProvider>
        <GoldProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play" element={<GameStageManager />} />
            </Routes>
          </BrowserRouter>
        </GoldProvider>
      </PerksProvider>
    </LevelProvider>

  )
}