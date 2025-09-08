'use client';

import { useRef, useState, useEffect } from 'react';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20; // 20x20 cases

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<string>('right');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState<number>(400);
  const [score, setScore] = useState<number>(0); // 1. Ajout du score
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Met à jour la taille du canvas selon la taille de la fenêtre
  useEffect(() => {
    function handleResize() {
      const size = Math.min(window.innerWidth * 0.9, 400);
      setCanvasSize(size);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function resetGame() {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection('right');
    setGameOver(false);
    setStarted(false);
    setScore(0);
  }

  // Gestion des touches
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setIsPaused(prev => !prev);
        return;
      }
      if (!started) setStarted(true);
      switch (e.key) {
        case 'ArrowUp': setDirection('up'); break;
        case 'ArrowDown': setDirection('down'); break;
        case 'ArrowLeft': setDirection('left'); break;
        case 'ArrowRight': setDirection('right'); break;
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [started]);

  // Boucle du jeu
  useEffect(() => {
    if (!started || gameOver || isPaused) return;
    const gameLoop = setInterval(updateGame, 100);
    return () => clearInterval(gameLoop);
  }, [snake, direction, started, gameOver, isPaused]);

  function updateGame() {
    if (gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    // Collision avec la pomme (rouge ou jaune)
    if (head.x === food.x && head.y === food.y) {
      setFood(getRandomFoodPosition(newSnake));
      if (isYellowApple(score)) {
        setScore(prev => prev + 2);
      } else {
        setScore(prev => prev + 1);
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    drawGame(newSnake, food, isYellowApple(score));
  }

  function drawGame(snakeToDraw = snake, foodToDraw = food, yellow = isYellowApple(score)) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvasSize / GRID_SIZE;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw snake
    snakeToDraw.forEach((segment, idx) => {
      if (idx === 0) {
        ctx.fillStyle = 'green';
      } else {
        ctx.fillStyle = '#3eb53eff';
      }
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 2, cellSize - 2);
    });

    // Draw apple (rouge ou jaune)
    ctx.fillStyle = yellow ? 'yellow' : 'red';
    ctx.fillRect(foodToDraw.x * cellSize, foodToDraw.y * cellSize, cellSize - 2, cellSize - 2);
  }

  // Redessine à chaque changement de taille ou d'état
  useEffect(() => {
    drawGame(snake, food, isYellowApple(score));
  }, [canvasSize, snake, food, score]);

  function getRandomFoodPosition(snake: Position[]): Position {
    let newPos: Position;
    do {
      newPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snake.some(segment => segment.x === newPos.x && segment.y === newPos.y));
    return newPos;
  }

  function isYellowApple(score: number) {
    return (score + 1) % 5 === 0;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-lg font-bold text-green-700">Score : {score}</div>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ border: '2px solid black', width: '90vw', maxWidth: 400, height: 'auto', aspectRatio: '1/1' }}
      />
      {gameOver && (
        <div className="flex flex-col items-center">
          <div className="text-red-500">Game Over!</div>
          <div className="text-gray-500 mt-2">Appuie sur <b>R</b> pour recommencer</div>
        </div>
      )}
      {isPaused && !gameOver && (
        <div className="flex flex-col items-center">
          <div className="text-yellow-500 font-bold">PAUSE</div>
          <div className="text-gray-500 mt-2">Appuie sur <b>T</b> pour continuer</div>
        </div>
      )}
      {!started && !gameOver && (
        <div className="text-gray-500">Appuie sur une flèche pour commencer</div>
      )}
    </div>
  );
}
