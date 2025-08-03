import React from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';
import { useLevel } from '../contexts/level/LevelContext';
import '../styles.css'

const FINAL_STAGE = 18;

export default function GameStageManager() {
  const { stage, advanceStage } = useLevel(); // ✅ From context

  if (stage > FINAL_STAGE) {
    return (
      <div className="end-screen">
        <h1>🏁 Game Over</h1>
        <p>You survived. Congrats.</p>
      </div>
    );
  }

  const isGameLevel = stage % 2 === 0;

  return isGameLevel ? (
    <GameScreen />
  ) : (
    <ShopScreen />
  );
}
