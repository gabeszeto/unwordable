// ShopScreen.jsx
import React from 'react';
import './shopStyles.css';

function Shop({ gold, stage, goToNextStage }) {
  return (
    <div className="shop-screen">
      <div className="shop-header">
        <h2>Shop</h2>
        <p>Stage {stage} — Gold: 🪙 {gold}</p>
      </div>

      <div className="perk-list">
        <div className="perk-item">Perk 1</div>
        <div className="perk-item">Perk 2</div>
        <div className="perk-item">Perk 3</div>
        <div className="perk-item">Perk 4</div>
      </div>

      <button className="next-button" onClick={goToNextStage}>Next</button>
    </div>
  );
}

export default ShopScreen;
