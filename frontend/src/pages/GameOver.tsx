import React from 'react';
import { useLocation } from 'react-router-dom';
import './GameOver.css'; // Import CSS for styling

const GameOver = () => {
  const location = useLocation();
  const { winner } = location.state || { winner: 'Unknown' };

  const winningAddress = '0x75fa7ad29a5fac9a01fbe13c65e8837e937f1a67589aaed4dd3d670c20aabe74';

  return (
    <div className="game-over-container">
      <div className="game-over-card">
        <h1 className="game-over-title">🎉 Game Over 🎉</h1>
        <h2 className="game-over-winner">Winner: <span>{winner}</span></h2>
        <p className="winning-address">The winning amount 0.00328 sui has been sent to: <span>{winningAddress}</span></p>
      </div>
    </div>
  );
};

export default GameOver;