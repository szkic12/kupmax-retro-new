import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './TetrisGame.module.scss';

// Konfiguracja gry
const BOARD_WIDTH = 16; // Zwiększono z 12
const BOARD_HEIGHT = 22;

// Definicje klocków (kształt i kolor)
const PENTOMINOES = {
  0: { shape: [[0]], color: 'transparent' },
  F: { shape: [[0, 1, 1], [1, 1, 0], [0, 1, 0]], color: '#C41E3A' },
  I: { shape: [[2, 2, 2, 2, 2]], color: '#00FFFF' },
  L: { shape: [[3, 0], [3, 0], [3, 0], [3, 3]], color: '#FFA500' },
  P: { shape: [[4, 4], [4, 4], [4, 0]], color: '#0000FF' },
  N: { shape: [[0, 5, 5], [5, 5, 0]], color: '#00FF00' },
  T: { shape: [[6, 6, 6], [0, 6, 0], [0, 6, 0]], color: '#800080' },
  U: { shape: [[7, 0, 7], [7, 7, 7]], color: '#FFFF00' },
  V: { shape: [[8, 0, 0], [8, 0, 0], [8, 8, 8]], color: '#FFC0CB' },
  W: { shape: [[9, 0, 0], [9, 9, 0], [0, 9, 9]], color: '#FFFFFF' },
  X: { shape: [[0, 10, 0], [10, 10, 10], [0, 10, 0]], color: '#A52A2A' },
  Y: { shape: [[0, 11], [11, 11], [0, 11]], color: '#808080' },
  Z: { shape: [[12, 12, 0], [0, 12, 0], [0, 12, 12]], color: '#32CD32' },
};

// Znaki ASCII do efektu "glitch"
const RETRO_CHARS = ['#', '*', '/', '\\', '$', '%', '&', '@', '?', '!', ':', ';', '=', '+', '-'];
const getRandomChar = () => RETRO_CHARS[Math.floor(Math.random() * RETRO_CHARS.length)];

// Tworzenie pustej planszy z obiektami
const createBoard = () =>
  Array.from(Array(BOARD_HEIGHT), () =>
    Array(BOARD_WIDTH).fill({ type: 0, char: null })
  );

// Generowanie losowego klocka z przypisanymi znakami
const PENTOMINO_KEYS = Object.keys(PENTOMINOES).filter(k => k !== '0');

// Generowanie losowego klocka (teraz pentomino)
const randomTetromino = () => {
  const key = PENTOMINO_KEYS[Math.floor(Math.random() * PENTOMINO_KEYS.length)];
  const proto = PENTOMINOES[key];
  const typeNumber = PENTOMINO_KEYS.indexOf(key) + 1;

  const charShape = proto.shape.map(row =>
    row.map(cell => {
      if (cell === 0) return 0;
      return { type: typeNumber, char: getRandomChar() };
    })
  );
  return { ...proto, shape: charShape };
};

const TetrisGame = ({ onGameComplete }) => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [discountCode, setDiscountCode] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const gameLoopRef = useRef(null);

  const fetchScores = useCallback(async () => {
    try {
      const response = await fetch('/api/tetris-scores');
      const data = await response.json();
      if (response.ok) {
        setHighScores(data.scores || []);
      } else {
        throw new Error(data.error || 'Failed to fetch scores');
      }
    } catch (error) {
      console.error("Failed to fetch high scores:", error.message);
      setHighScores([]); // Set to empty array on error to prevent crash
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const checkCollision = useCallback((piece, pos, gameBoard) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && gameBoard[newY][newX].type !== 0) return true;
        }
      }
    }
    return false;
  }, []);

  const spawnPiece = useCallback(() => {
    // Użyj nextPiece jako currentPiece, a wygeneruj nowy nextPiece
    const newPiece = nextPiece || randomTetromino();
    const startPos = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };

    if (checkCollision(newPiece, startPos, board)) {
      setGameOver(true);
      return;
    }
    setCurrentPiece(newPiece);
    setPosition(startPos);

    // Wygeneruj następny klocek
    setNextPiece(randomTetromino());
  }, [board, checkCollision, nextPiece]);

  const initGame = useCallback(() => {
    setBoard(createBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setDiscountCode(null);
    setGameStarted(true);
    setScoreSubmitted(false);
    setPlayerName('');
    setSubmissionError(null);
    setNextPiece(randomTetromino()); // Wygeneruj pierwszy nextPiece
    spawnPiece();
  }, [spawnPiece]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused) return;

    const newPos = { ...position, y: position.y + 1 };
    if (!checkCollision(currentPiece, newPos, board)) {
      setPosition(newPos);
    } else {
      const newBoard = board.map(row => [...row]);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0) newBoard[boardY][boardX] = cell;
          }
        });
      });

      let linesCleared = 0;
      for (let y = newBoard.length - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell.type !== 0)) {
          linesCleared++;
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill({ type: 0, char: null }));
          y++;
        }
      }

      if (linesCleared > 0) {
        setLines(prev => prev + linesCleared);
        setScore(prev => prev + linesCleared * 10 * level);
        setLevel(Math.floor((score + linesCleared * 10 * level) / 50) + 1);
      }

      setBoard(newBoard);
      spawnPiece();
    }
  }, [board, checkCollision, currentPiece, gameOver, isPaused, level, position, score, spawnPiece]);

  const move = useCallback((dir) => {
    if (gameOver || isPaused) return;
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentPiece, newPos, board)) {
      setPosition(newPos);
    }
  }, [board, checkCollision, currentPiece, gameOver, isPaused, position]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused) return;
    const rotated = JSON.parse(JSON.stringify(currentPiece)); // Deep copy
    rotated.shape = rotated.shape[0].map((_, i) => rotated.shape.map(row => row[i]).reverse());
    if (!checkCollision(rotated, position, board)) {
      setCurrentPiece(rotated);
    }
  }, [board, checkCollision, currentPiece, gameOver, isPaused, position]);

  const drop = useCallback(() => {
    if (gameOver || isPaused) return;
    let newPos = { ...position };
    while (!checkCollision(currentPiece, { ...newPos, y: newPos.y + 1 }, board)) {
      newPos.y++;
    }
    setPosition(newPos);
  }, [board, checkCollision, currentPiece, gameOver, isPaused, position]);

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || scoreSubmitted) return;

    setSubmissionError(null);
    setScoreSubmitted(true);

    try {
      const response = await fetch('/api/tetris-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName.trim(), score }),
      });

      const data = await response.json();

      if (response.ok) {
        setHighScores(data.scores || []);
      } else {
        throw new Error(data.error || 'Failed to save score');
      }
    } catch (error) {
      setSubmissionError(error.message || 'Failed to save score. Please try again.');
      setScoreSubmitted(false); // Allow retry
    }
  };

  useEffect(() => {
    if (score >= 500 && !discountCode) {
      const code = process.env.NEXT_PUBLIC_TETRIS_DISCOUNT_CODE || 'KUPMAX30OFF';
      setDiscountCode(code);

      // Wywołaj callback do parent component
      if (onGameComplete) {
        onGameComplete(code);
      }
    }
  }, [score, discountCode, onGameComplete]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;
      if (e.key === 'p') {
        setIsPaused(prev => !prev);
        return;
      }
      if (isPaused) return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();

      if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowDown') moveDown();
      else if (e.key === 'ArrowUp') rotate();
      else if (e.key === ' ') drop();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused, move, moveDown, rotate, drop]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = Math.max(200, 500 - (level - 1) * 20);
      gameLoopRef.current = setInterval(moveDown, speed);
      return () => clearInterval(gameLoopRef.current);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, isPaused, level, moveDown]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = cell;
            }
          }
        });
      });
    }
    return displayBoard;
  };

  return (
    <div className={styles.tetrisContainer}>
      {!gameStarted ? (
        <div className={styles.startScreen}>
          <div className={styles.startTitle}>PENTOMINO TETRIS</div>
          <button className={styles.startBtn} onClick={initGame}>▶ START GAME</button>
          <div className={styles.startInfo}>
            <h3>CEL: 500 PUNKTÓW = 30% RABATU!</h3>
            <p>Trudniejsza wersja Tetrisa z 12 unikalnymi klockami 5-blokowymi!</p>
            <p>◀ ▶ - RUCH, ⬆ - OBRÓT, ⬇ - PRZYSPIESZENIE, SPACJA - ZRZUT, P - PAUZA</p>
          </div>
          <div className={styles.scoreboard}>
            <h2>HIGH SCORES</h2>
            <ol>
              {Array.isArray(highScores) && highScores.slice(0, 10).map((s, i) => (
                <li key={`${i}-${s.name}-${s.score}`}><span>{s.name}</span><span>{s.score}</span></li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.gameInfo}>
            <div>SCORE: {score}</div>
            <div>LEVEL: {level}</div>
            <div>LINES: {lines}</div>
            {discountCode && <div className={styles.discountCode}>🎉 CODE: {discountCode}</div>}
          </div>

          {/* Next Piece Preview */}
          {nextPiece && (
            <div className={styles.nextPieceContainer}>
              <div className={styles.nextPieceTitle}>NEXT:</div>
              <div className={styles.nextPiecePreview}>
                {nextPiece.shape.map((row, y) => (
                  <div key={y} className={styles.nextPieceRow}>
                    {row.map((cell, x) => {
                      const type = cell.type || cell;
                      const char = cell.char;
                      const color = type !== 0 ? PENTOMINOES[PENTOMINO_KEYS[type - 1]]?.color || '#1a1a1a' : '#1a1a1a';
                      return (
                        <div
                          key={`${y}-${x}`}
                          className={styles.nextPieceCell}
                          style={{
                            backgroundColor: color,
                            color: 'white',
                            textShadow: `0 0 5px ${color}`,
                            width: '20px',
                            height: '20px',
                            border: type !== 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                          }}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.gameBoard}>
            {renderBoard().map((row, y) => (
              <div key={y} className={styles.boardRow}>
                {row.map((cell, x) => {
                  const type = cell.type;
                  const char = cell.char;
                  const color = type !== 0 ? PENTOMINOES[PENTOMINO_KEYS[type - 1]].color : '#1a1a1a';
                  return (
                    <div
                      key={`${y}-${x}`}
                      className={styles.boardCell}
                      style={{ backgroundColor: color, color: 'white', textShadow: `0 0 5px ${color}` }}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          <div className={styles.mobileControls}>
            <div className={styles.dPad}>
              <button onTouchStart={() => move(-1)} className={`${styles.dPadButton} ${styles.left}`}>◀</button>
              <button onTouchStart={() => move(1)} className={`${styles.dPadButton} ${styles.right}`}>▶</button>
              <button onTouchStart={moveDown} className={`${styles.dPadButton} ${styles.down}`}>▼</button>
            </div>
            <div className={styles.actionButtons}>
              <button onTouchStart={rotate} className={styles.actionButton}>ROTATE ↻</button>
              <button onTouchStart={drop} className={styles.actionButton}>DROP ⇩</button>
            </div>
          </div>

          {gameOver && (
            <div className={styles.gameOver}>
              <h2>GAME OVER</h2>

              <div className={styles.scoreboard} style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
                <h2>HIGH SCORES</h2>
                <ol>
                  {Array.isArray(highScores) && highScores.slice(0, 10).map((s, i) => (
                    <li key={`${i}-${s.name}-${s.score}`}><span>{s.name}</span><span>{s.score}</span></li>
                  ))}
                </ol>
              </div>

              {score > 0 && !scoreSubmitted ? (
                <form onSubmit={handleSubmitScore} className={styles.scoreForm}>
                  <input
                    type="text"
                    placeholder="ENTER YOUR NAME"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength="10"
                    required
                  />
                  <button type="submit">SAVE SCORE</button>
                  {submissionError && <p className={styles.errorText}>{submissionError}</p>}
                </form>
              ) : score > 0 ? (
                 <p>Your score has been submitted!</p>
              ) : null}

              <button onClick={initGame}>RESTART</button>
              {discountCode && <p className={styles.finalDiscount}>DISCOUNT CODE: {discountCode}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TetrisGame;