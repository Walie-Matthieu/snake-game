'use client';

import { useRef, useState, useEffect } from 'react';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20; // 20x20 cases

const SNAKE_COLORS = [
  { head: 'green', body: '#3eb53eff' },        // Normal (vert)
  { head: '#0000ff', body: '#87ceeb' },        // Traverseur (bleu)
  { head: '#ff4500', body: '#ffa07a' },        // Double Score (orange)
  { head: '#8b4513', body: '#deb887' },        // Invincible (marron)
  { head: '#800080', body: '#da70d6' },        // Rétrécissement (violet)
];

const SNAKE_ABILITIES = [
  { name: "Normal", description: "Aucune capacité spéciale" },
  { name: "Traverseur", description: "Peut traverser les murs" },
  { name: "Double Score", description: "Chaque pomme vaut 2 points" },
  { name: "Invincible", description: "Peut traverser son corps" },
  { name: "Rétrécissement", description: "Se rétrécit automatiquement de moitié" },
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
  const [abilityIndex, setAbilityIndex] = useState<number>(0);

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
    setAbilityIndex(0); // <-- Avec ça pour revenir en mode Normal
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
  }, [started, snake.length, abilityIndex]);

  // Boucle du jeu
  useEffect(() => {
    if (!started || gameOver || isPaused) return;
    const speed = 100;
    const gameLoop = setInterval(updateGame, speed);
    return () => clearInterval(gameLoop);
  }, [snake, direction, started, gameOver, isPaused]);

  // Rétrécit automatiquement le serpent quand on passe en mode Rétrécissement
  useEffect(() => {
    if (abilityIndex === 4 && snake.length > 3) {
      const half = Math.ceil(snake.length / 2);
      setSnake(snake.slice(0, half));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abilityIndex]);

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

    // Gestion des bords selon le pouvoir Traverseur
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      if (abilityIndex === 1) { // Traverseur : wrap-around
        if (head.x < 0) head.x = GRID_SIZE - 1;
        else if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        else if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        setGameOver(true);
        return;
      }
    }

    newSnake.unshift(head);

    // Collision avec soi-même (sauf si Invincible)
    if (abilityIndex !== 3 && newSnake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) {
      setGameOver(true);
      return;
    }

    // === Correction ici ===
    const yellow = isYellowApple(score);

    // Collision avec la pomme (rouge ou jaune)
    if (head.x === food.x && head.y === food.y) {
      setFood(getRandomFoodPosition(newSnake));
      // Si c'est une pomme jaune, change le pouvoir
      if (yellow) {
        const nextAbility = (abilityIndex + 1) % SNAKE_ABILITIES.length;
        setAbilityIndex(nextAbility);
        if (abilityIndex === 2) { // Double Score
          setScore(prev => prev + 4); // 2 points × 2
        } else {
          setScore(prev => prev + 2); // 2 points normal
        }
      } else {
        if (abilityIndex === 2) { // Double Score
          setScore(prev => prev + 2); // 1 point × 2
        } else {
          setScore(prev => prev + 1); // 1 point normal
        }
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    drawGame(newSnake, food, yellow);
  }

  function drawGame(snakeToDraw = snake, foodToDraw = food, yellow = isYellowApple(score)) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvasSize / GRID_SIZE;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Fond dégradé néon
    ctx.save();
    const gradient = ctx.createRadialGradient(
      canvasSize / 2, canvasSize / 2, canvasSize * 0.1, // réduit le rayon du cercle intérieur
      canvasSize / 2, canvasSize / 2, canvasSize / 1.1
    );
    gradient.addColorStop(0, '#262a75ff'); // centre violet lumineux
    gradient.addColorStop(0.3, '#181825'); // sombre intermédiaire (position 0.3 au lieu de 0.5)
    gradient.addColorStop(1, '#0a0a1a'); // bord très sombre
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.restore();

    // Utilise la couleur du pouvoir actif
    const snakeColor = SNAKE_COLORS[abilityIndex];

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
    if (abilityIndex === 2 || abilityIndex === 3 || abilityIndex === 4) {
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

    // Draw apple (rouge ou jaune) en rond avec effet néon
    ctx.save();
    ctx.shadowColor = yellow ? 'yellow' : 'red';
    ctx.shadowBlur = 18;
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
    ctx.restore();
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
      <div className="text-lg font-bold text-green-700">
        Score : {score} | Pouvoir : {SNAKE_ABILITIES[abilityIndex].name}
      </div>
      <div className="text-sm text-gray-500 mb-2">
        {SNAKE_ABILITIES[abilityIndex].description}
      </div>
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
