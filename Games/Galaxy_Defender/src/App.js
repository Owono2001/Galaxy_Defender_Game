// App.js
import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const GalaxyDefender = () => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [lasers, setLasers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [combo, setCombo] = useState(1);
  const gameAreaRef = useRef(null);
  const comboTimeout = useRef(null);

  const spawnEnemy = () => {
    const newEnemy = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: -10,
      type: Math.random() < 0.2 ? 'BOSS' : 'NORMAL',
      speed: Math.random() * 3 + 1
    };
    setEnemies(prev => [...prev, newEnemy]);
  };

  const fireLaser = (e) => {
    if (!gameActive) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    
    setLasers(prev => [...prev, {
      id: Date.now(),
      x,
      y: 90
    }]);
  };

  const checkCollisions = useCallback(() => {
    enemies.forEach(enemy => {
      lasers.forEach(laser => {
        const distance = Math.sqrt(
          Math.pow(enemy.x - laser.x, 2) +
          Math.pow(enemy.y - laser.y, 2)
        );
        
        if (distance < 8) {
          setScore(s => s + (100 * combo * (enemy.type === 'BOSS' ? 5 : 1)));
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
          setLasers(prev => prev.filter(l => l.id !== laser.id));
          
          if (Math.random() < 0.3) {
            setPowerUps(prev => [...prev, {
              id: Date.now(),
              x: enemy.x,
              y: enemy.y,
              type: ['SHIELD', 'COMBO', 'RAPID'][Math.floor(Math.random() * 3)]
            }]);
          }
          
          setCombo(c => {
            clearTimeout(comboTimeout.current);
            comboTimeout.current = setTimeout(() => setCombo(1), 3000);
            return c + 1;
          });
        }
      });
  
      if (enemy.y > 95) {
        setLives(prev => prev - (enemy.type === 'BOSS' ? 2 : 1));
        setEnemies(prev => prev.filter(e => e.id !== enemy.id));
      }
    });
  }, [enemies, lasers, combo]);  // Add dependencies here

  const moveElements = () => {
    setEnemies(prev => prev.map(enemy => ({
      ...enemy,
      y: enemy.y + enemy.speed
    })));

    setLasers(prev => prev.map(laser => ({
      ...laser,
      y: laser.y - 8
    })).filter(laser => laser.y > 0));

    setPowerUps(prev => prev.map(pu => ({
      ...pu,
      y: pu.y + 2
    })).filter(pu => pu.y < 100));
  };

  // Then update your useEffect:
useEffect(() => {
  if (!gameActive || lives <= 0) {
    if (lives <= 0) {
      const currentHighScore = localStorage.getItem('galaxyHighScore') || 0;
      if (score > currentHighScore) {
        localStorage.setItem('galaxyHighScore', score);
      }
    }
    return;
  }

    const gameLoop = setInterval(() => {
      if (Math.random() < 0.15) spawnEnemy();
      moveElements();
      checkCollisions();
    }, 50);
  
    return () => clearInterval(gameLoop);
  }, [gameActive, enemies, lasers, lives, checkCollisions, score]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setLives(5);
    setEnemies([]);
    setLasers([]);
    setPowerUps([]);
    setCombo(1);
  };

  const handleGameOver = () => {
    setGameActive(false);
  };

  useEffect(() => {
    if (lives <= 0 && gameActive) {
      handleGameOver();
    }
  }, [lives, gameActive]);

  return (
    <div className="container">
      <div className="hud">
        <div>🔥 Lives: {lives}</div>
        <div>⭐ Score: {score}</div>
        <div>💥 Combo: x{combo}</div>
        <div>🏆 High Score: {localStorage.getItem('galaxyHighScore') || 0}</div>
      </div>

      <div 
        ref={gameAreaRef}
        className="game-area" 
        onClick={fireLaser}
      >
        {lasers.map(laser => (
          <div
            key={laser.id}
            className="laser"
            style={{ left: `${laser.x}%`, top: `${laser.y}%` }}
          />
        ))}

        {enemies.map(enemy => (
          <div
            key={enemy.id}
            className={`enemy ${enemy.type.toLowerCase()}`}
            style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
          >
            {enemy.type === 'BOSS' ? '👾' : '👽'}
          </div>
        ))}

        {powerUps.map(pu => (
          <div
            key={pu.id}
            className={`power-up ${pu.type.toLowerCase()}`}
            style={{ left: `${pu.x}%`, top: `${pu.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setPowerUps(prev => prev.filter(p => p.id !== pu.id));
              if (pu.type === 'SHIELD') setLives(p => p + 2);
              if (pu.type === 'COMBO') setCombo(p => p + 2);
              if (pu.type === 'RAPID') setLasers(prev => [...prev, 
                { id: Date.now(), x: pu.x - 5, y: pu.y },
                { id: Date.now() + 1, x: pu.x + 5, y: pu.y }
              ]);
            }}
          >
            {pu.type === 'SHIELD' ? '🛡️' : pu.type === 'COMBO' ? '💥' : '⚡'}
          </div>
        ))}

{!gameActive && (
          <div className="start-screen">
            {lives <= 0 && (
              <div className="game-over">
                <h2>GAME OVER</h2>
                <div className="final-score">
                  Final Score: {score}
                </div>
              </div>
            )}
            
            <button onClick={startGame}>
              {lives <= 0 ? 'PLAY AGAIN' : 'START GAME'}
            </button>

            {lives > 0 && (
              <div className="instructions">
                Tap to shoot! <br/>
                Hit enemies, collect power-ups <br/>
                Don't let them reach Earth!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalaxyDefender;