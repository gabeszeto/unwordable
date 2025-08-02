import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import GameScreen from './GameScreen';
import { GoldProvider } from './gold/GoldContext';

import './styles.css'

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