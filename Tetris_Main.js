import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY = 0;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-400' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-400' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-400' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-400' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-400' }
};

const createBoard = () => Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY));

const getRandomTetromino = () => {
  const pieces = Object.keys(TETROMINOES);
  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
  return {
    shape: TETROMINOES[randomPiece].shape,
    color: TETROMINOES[randomPiece].color,
    x: Math.floor(BOARD_WIDTH / 2) - 1,
    y: 0
  };
};

const rotatePiece = (piece) => {
  const rotated = piece[0].map((_, i) => piece.map(row => row[i]).reverse());
  return rotated;
};

const Tetris = () => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(getRandomTetromino());
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const isValidMove = useCallback((piece, newX, newY, newShape = piece.shape) => {
    for (let y = 0; y < newShape.length; y++) {
      for (let x = 0; x < newShape[y].length; x++) {
        if (newShape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (boardY >= 0 && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  const placePiece = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });

    // Check for completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== EMPTY)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY));
        linesCleared++;
        y++; // Check the same line again
      }
    }

    if (linesCleared > 0) {
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level);
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);
    }

    setBoard(newBoard);
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomTetromino());

    // Check game over
    if (!isValidMove(nextPiece, nextPiece.x, nextPiece.y)) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, [board, currentPiece, nextPiece, lines, level, isValidMove]);

  const movePiece = useCallback((dx, dy) => {
    if (!gameStarted || gameOver) return;

    if (isValidMove(currentPiece, currentPiece.x + dx, currentPiece.y + dy)) {
      setCurrentPiece(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
    } else if (dy > 0) {
      placePiece();
    }
  }, [currentPiece, isValidMove, placePiece, gameStarted, gameOver]);

  const rotatePieceHandler = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const rotatedShape = rotatePiece(currentPiece.shape);
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
      setCurrentPiece(prev => ({
        ...prev,
        shape: rotatedShape
      }));
    }
  }, [currentPiece, isValidMove, gameStarted, gameOver]);

  const dropPiece = useCallback(() => {
    if (!gameStarted || gameOver) return;

    let newY = currentPiece.y;
    while (isValidMove(currentPiece, currentPiece.x, newY + 1)) {
      newY++;
    }
    setCurrentPiece(prev => ({ ...prev, y: newY }));
    setTimeout(placePiece, 50);
  }, [currentPiece, isValidMove, placePiece, gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotatePieceHandler();
          break;
        case 'Enter':
          e.preventDefault();
          dropPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePieceHandler, dropPiece, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      movePiece(0, 1);
    }, Math.max(50, 500 - level * 50));

    return () => clearInterval(interval);
  }, [movePiece, level, gameStarted, gameOver]);

  const startGame = () => {
    setBoard(createBoard());
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board
    if (currentPiece && gameStarted) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        });
      });
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-6 h-6 border border-gray-600 ${
              cell === EMPTY ? 'bg-gray-900' : cell
            }`}
          />
        ))}
      </div>
    ));
  };

  const renderNextPiece = () => {
    return nextPiece.shape.map((row, y) => (
      <div key={y} className="flex justify-center">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-4 h-4 border border-gray-700 ${
              cell ? nextPiece.color : 'bg-transparent border-transparent'
            }`}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <div className="flex gap-6">
        {/* Game Board */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-cyan-400">TETRIS</h1>
          <div className="bg-black p-2 border-2 border-gray-600">
            {renderBoard()}
          </div>
          
          {!gameStarted && !gameOver && (
            <button
              onClick={startGame}
              className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-black font-bold"
            >
              START GAME
            </button>
          )}
          
          {gameOver && (
            <div className="mt-4 text-center">
              <div className="text-red-400 text-xl font-bold mb-2">GAME OVER</div>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-black font-bold"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-6">
          {/* Score */}
          <div className="bg-gray-900 p-4 rounded border border-gray-600">
            <h2 className="text-lg font-bold mb-2 text-cyan-400">Score</h2>
            <div className="text-2xl font-mono">{score.toLocaleString()}</div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 p-4 rounded border border-gray-600">
            <h2 className="text-lg font-bold mb-2 text-cyan-400">Stats</h2>
            <div className="space-y-1">
              <div>Lines: {lines}</div>
              <div>Level: {level}</div>
            </div>
          </div>

          {/* Next Piece */}
          <div className="bg-gray-900 p-4 rounded border border-gray-600">
            <h2 className="text-lg font-bold mb-2 text-cyan-400">Next</h2>
            <div className="bg-black p-2 border border-gray-700">
              {renderNextPiece()}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-900 p-4 rounded border border-gray-600 text-sm">
            <h2 className="text-lg font-bold mb-2 text-cyan-400">Controls</h2>
            <div className="space-y-1">
              <div>← → Move</div>
              <div>↓ Soft Drop</div>
              <div>↑ / Space Rotate</div>
              <div>Enter Hard Drop</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris;