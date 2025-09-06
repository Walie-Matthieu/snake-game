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
  }

  // Gestion des touches
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
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
    if (!started || gameOver) return;
    const gameLoop = setInterval(updateGame, 100);
    return () => clearInterval(gameLoop);
  }, [snake, direction, started, gameOver]);

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

    if (head.x === food.x && head.y === food.y) {
      setFood({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      });
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    drawGame(newSnake, food);
  }

  function drawGame(snakeToDraw = snake, foodToDraw = food) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvasSize / GRID_SIZE;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw snake
    ctx.fillStyle = 'green';
    snakeToDraw.forEach(segment => {
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 2, cellSize - 2);
    });

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(foodToDraw.x * cellSize, foodToDraw.y * cellSize, cellSize - 2, cellSize - 2);
  }

  // Redessine à chaque changement de taille ou d'état
  useEffect(() => {
    drawGame();
  }, [canvasSize, snake, food]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ border: '2px solid black', width: '90vw', maxWidth: 400, height: 'auto', aspectRatio: '1/1' }}
      />
      {gameOver && <div className="text-red-500">Game Over!</div>}
      {!started && <div className="text-gray-500">Appuie sur une flèche pour commencer</div>}
    </div>
  );
}
