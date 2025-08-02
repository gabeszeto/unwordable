import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../features/home/components/Home';
import GameScreen from '../features/game/GameScreen';
import { GoldProvider } from '../contexts/gold/GoldContext';

import '../styles.css'

export default function App() {
  return (
    <GoldProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<GameScreen />} />
        </Routes>
      </BrowserRouter>
    </GoldProvider>
  )
}