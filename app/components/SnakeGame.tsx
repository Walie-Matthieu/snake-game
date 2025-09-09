'use client';

import { useRef, useState, useEffect } from 'react';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20; // 20x20 cases

const SNAKE_COLORS = [
  { head: 'green', body: '#3eb53eff' },        // Couleurs de base
  { head: '#800080', body: '#da70d6' },        // Violet/Orchidée
  { head: '#0000ff', body: '#87ceeb' },        // Bleu/Bleu ciel
  { head: '#ff4500', body: '#ffa07a' },        // Orange/Saumon
  { head: '#8b4513', body: '#deb887' },        // Marron/Beige
];

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
      // Démarre seulement si une flèche est pressée
      if (!started) {
        switch (e.key) {
          case 'ArrowUp':
            setDirection('up');
            setStarted(true);
            break;
          case 'ArrowDown':
            setDirection('down');
            setStarted(true);
            break;
          case 'ArrowLeft':
            setDirection('left');
            setStarted(true);
            break;
          case 'ArrowRight':
            setDirection('right');
            setStarted(true);
            break;
          default:
            // Ignore toute autre touche avant le démarrage
            return;
        }
        return;
      }
      // Si le jeu est déjà démarré, on gère les flèches normalement
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

    // Choisis la couleur basée sur le nombre de pommes jaunes mangées
    const colorIndex = Math.floor(score / 5) % SNAKE_COLORS.length;
    const snakeColor = SNAKE_COLORS[colorIndex];

    // Draw snake avec les nouvelles couleurs
    snakeToDraw.forEach((segment, idx) => {
      // Définir la couleur de glow selon la couleur du segment
      ctx.save();
      ctx.shadowColor = idx === 0 ? snakeColor.head : snakeColor.body;
      ctx.shadowBlur = 18; // Ajuste l'intensité du glow ici

      if (idx === 0) {
        // Tête ronde
        ctx.fillStyle = snakeColor.head;
        const cx = segment.x * cellSize + cellSize / 2;
        const cy = segment.y * cellSize + cellSize / 2;
        const r = (cellSize - 2) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Bec/pointe directionnelle
        ctx.fillStyle = snakeColor.head;
        let tip: [number, number], base1: [number, number], base2: [number, number];
        const becLength = r * 1.70;
        const becWidth = r * 1.70;
        switch (direction) {
          case 'up':
            tip = [cx, cy - r - becLength / 2];
            base1 = [cx - becWidth / 2, cy - r / 2];
            base2 = [cx + becWidth / 2, cy - r / 2];
            break;
          case 'down':
            tip = [cx, cy + r + becLength / 2];
            base1 = [cx - becWidth / 2, cy + r / 2];
            base2 = [cx + becWidth / 2, cy + r / 2];
            break;
          case 'left':
            tip = [cx - r - becLength / 2, cy];
            base1 = [cx - r / 2, cy - becWidth / 2];
            base2 = [cx - r / 2, cy + becWidth / 2];
            break;
          case 'right':
          default:
            tip = [cx + r + becLength / 2, cy];
            base1 = [cx + r / 2, cy - becWidth / 2];
            base2 = [cx + r / 2, cy + becWidth / 2];
            break;
        }
        ctx.beginPath();
        ctx.moveTo(tip[0], tip[1]);
        ctx.lineTo(base1[0], base1[1]);
        ctx.lineTo(base2[0], base2[1]);
        ctx.closePath();
        ctx.fill();
      }
      // Queue (dernier segment)
      else if (idx === snakeToDraw.length - 1 && snakeToDraw.length > 1) {
        // Détermine la direction de la queue
        const prev = snakeToDraw[idx - 1];
        const tail = segment;
        let tailDir: string = 'right';
        if (prev.x < tail.x) tailDir = 'right';
        else if (prev.x > tail.x) tailDir = 'left';
        else if (prev.y < tail.y) tailDir = 'down';
        else if (prev.y > tail.y) tailDir = 'up';

        // Pentagone orienté
        ctx.fillStyle = snakeColor.body;
        let cx = tail.x * cellSize + cellSize / 2;
        let cy = tail.y * cellSize + cellSize / 2;
        const r = cellSize * 0.5; // pentagone un peu plus grand
        // Décalage pour rapprocher le pentagone du segment précédent
        const offset = cellSize * 0.18;
        switch (tailDir) {
          case 'up': cy += offset; break;
          case 'down': cy -= offset; break;
          case 'left': cx += offset; break;
          case 'right': default: cx -= offset; break;
        }

        // Calcul l'angle de rotation selon la direction
        let angle = 0;
        const pentagonOffset = (3 * Math.PI) / 2 + Math.PI; // inversé à l'opposé
        switch (tailDir) {
          case 'up': angle = -Math.PI / 2 + pentagonOffset; break;
          case 'down': angle = Math.PI / 2 + pentagonOffset; break;
          case 'left': angle = Math.PI + pentagonOffset; break;
          case 'right': default: angle = 0 + pentagonOffset; break;
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.beginPath();
        // Pointe (apex)
        ctx.moveTo(0, -r);
        // Sommet latéral gauche (rapproché)
        const sideAngle = Math.PI / 5.5; // diminue pour rapprocher (ex: 5.5 < 5)
        ctx.lineTo(-Math.sin(sideAngle) * r * 0.7, -Math.cos(sideAngle) * r * 0.9);
        // Coin de base gauche
        ctx.lineTo(-r, r * 0.6);
        // Coin de base droit
        ctx.lineTo(r, r * 0.6);
        // Sommet latéral droit (rapproché)
        ctx.lineTo(Math.sin(sideAngle) * r * 0.7, -Math.cos(sideAngle) * r * 0.9);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
      // Corps classique
      else {
        ctx.fillStyle = snakeColor.body;
        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 2, cellSize - 2);
      }
      ctx.restore();
    });

    // === TRAIT ORANGE OU JAUNE SUR LE DOS DU SERPENT ===
    let traitColor = 'orange';
    if (colorIndex === 2 || colorIndex === 3 || colorIndex === 4) {
      traitColor = 'yellow';
    }
    if (snakeToDraw.length > 1) {
      ctx.save();
      ctx.strokeStyle = traitColor;
      ctx.lineWidth = Math.max(2, cellSize * 0.18); // épaisseur du trait
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Commence au centre de la tête
      ctx.moveTo(
        snakeToDraw[0].x * cellSize + cellSize / 2,
        snakeToDraw[0].y * cellSize + cellSize / 2
      );
      // Passe par chaque segment
      for (let i = 1; i < snakeToDraw.length; i++) {
        ctx.lineTo(
          snakeToDraw[i].x * cellSize + cellSize / 2,
          snakeToDraw[i].y * cellSize + cellSize / 2
        );
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw apple (rouge ou jaune) en rond
    ctx.beginPath();
    ctx.arc(
      foodToDraw.x * cellSize + cellSize / 2,
      foodToDraw.y * cellSize + cellSize / 2,
      (cellSize - 2) / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = yellow ? 'yellow' : 'red';
    ctx.fill();
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
