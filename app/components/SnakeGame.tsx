'use client';

import { useRef, useState, useEffect } from 'react';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20; // 20x20 cases
const COLOR_TRANSITION_MS = 2500; // serpent (tête/corps) + trait dorsal
const FRAME_TRANSITION_MS = 3000;  // cadre (rebord néon) — ajustable séparément

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

// Helpers couleurs (parse + lerp + easing)
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6); // ignore alpha #RRGGBBAA
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}
const NAME_TO_HEX: Record<string, string> = {
  green: '#008000',
  yellow: '#ffff00',
  orange: '#ffa500',
  red: '#ff0000',
  blue: '#0000ff',
  brown: '#8b4513',
  purple: '#800080',
};
function parseColorToRgb(c: string): [number, number, number] {
  if (c.startsWith('#')) return hexToRgb(c);
  const hex = NAME_TO_HEX[c.toLowerCase()];
  return hex ? hexToRgb(hex) : [0, 0, 0];
}
function rgbToCss([r, g, b]: [number, number, number]) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOutQuad(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

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
  const [previousSnake, setPreviousSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [animationProgress, setAnimationProgress] = useState(1);
  const animationRef = useRef<number | null>(null);

  // Couleurs affichées (interpolées)
  const [displayHeadColor, setDisplayHeadColor] = useState<string>(SNAKE_COLORS[0].head);
  const [displayBodyColor, setDisplayBodyColor] = useState<string>(SNAKE_COLORS[0].body);
  const [displayTraitColor, setDisplayTraitColor] = useState<string>('orange');
  const [displayAppleColor, setDisplayAppleColor] = useState<string>('red');
  const [displayFrameColor, setDisplayFrameColor] = useState<string>(SNAKE_COLORS[0].head); // ← nouveau

  const colorAnimHBRef = useRef<number | null>(null);
  const colorAnimTraitRef = useRef<number | null>(null);
  const colorAnimFrameRef = useRef<number | null>(null); // ← nouveau
  // const colorAnimAppleRef = useRef<number | null>(null);

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
    setPreviousSnake([{ x: 10, y: 10 }]); // reset interp
    setAnimationProgress(1);               // animation terminée
    setFood({ x: 5, y: 5 });
    setDirection('right');
    setGameOver(false);
    setStarted(false);
    setScore(0);
    setAbilityIndex(0); // Normal
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

  // Ajuste la fonction de collision avec le corps
  function isHeadCollidingWithBody(head: Position, body: Position[], cellSize: number) {
    const radius = (cellSize - 2) / 2 * 0.7; // Réduit la zone de collision à 70%
    return body.some(seg => {
      const dx = (head.x - seg.x) * cellSize;
      const dy = (head.y - seg.y) * cellSize;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < radius * 2; // Collision plus précise
    });
  }

  function updateGame() {
    if (gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    // Calcule la nouvelle position de la tête
    switch (direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // Collision avec les murs (hitbox circulaire)
    const cellSize = canvasSize / GRID_SIZE;
    const radius = (cellSize - 2) / 2 * 0.7; // Réduit la zone de collision à 70%
    const headPx = {
      x: head.x * cellSize + cellSize / 2,
      y: head.y * cellSize + cellSize / 2
    };
    // Collision avec les murs plus précise
    if (
      headPx.x - radius < 0 ||
      headPx.x + radius > canvasSize ||
      headPx.y - radius < 0 ||
      headPx.y + radius > canvasSize
    ) {
      if (abilityIndex === 1) { // Traverseur : wrap-around
        if (head.x < 0) head.x = GRID_SIZE - 1;
        else if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        else if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        setAnimationProgress(1);
        setGameOver(true);
        return;
      }
    }

    newSnake.unshift(head);

    // === Collision avec la pomme (rouge ou jaune)
    const yellow = isYellowApple(score);
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

    // === Collision avec soi-même (après éventuel pop), sauf si Invincible
    if (
      abilityIndex !== 3 &&
      isHeadCollidingWithBody(head, newSnake.slice(1), canvasSize / GRID_SIZE)
    ) {
      setGameOver(true);
      return;
    }

    setPreviousSnake(snake);
    setSnake(newSnake);
    setAnimationProgress(0);
    drawGame(newSnake, food, yellow);
  }

  useEffect(() => {
    if (animationProgress < 1) {
      const animate = () => {
        setAnimationProgress(prev => {
          const next = Math.min(prev + 0.15, 1);
          if (next < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
          return next;
        });
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
  }, [animationProgress]);

  // Transition douce des couleurs tête/corps quand le pouvoir change
  // [TRANSITION SERPENT DÉSACTIVÉE] — Animation commentée ci-dessus.
  // Mise à jour immédiate des couleurs tête/corps (pas de transition)
  useEffect(() => {
    const target = SNAKE_COLORS[abilityIndex];
    setDisplayHeadColor(target.head);
    setDisplayBodyColor(target.body);
  }, [abilityIndex]);

  // Transition douce du trait dorsal (orange <-> jaune) selon le pouvoir
  // [TRANSITION TRAIT DORSAL DÉSACTIVÉE] — Animation commentée ci-dessus.
  // Mise à jour immédiate du trait dorsal (pas de transition)
  useEffect(() => {
    setDisplayTraitColor(abilityIndex === 0 ? 'orange' : 'yellow');
  }, [abilityIndex]);

  // Transition douce du cadre (indépendante du serpent)
  useEffect(() => {
    const toHead = parseColorToRgb(SNAKE_COLORS[abilityIndex].head);
    const from = parseColorToRgb(displayFrameColor);
    const DURATION = FRAME_TRANSITION_MS;
    let start: number | null = null;
    if (colorAnimFrameRef.current) cancelAnimationFrame(colorAnimFrameRef.current);

    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / DURATION);
      const e = easeInOutQuad(t);
      setDisplayFrameColor(rgbToCss([
        lerp(from[0], toHead[0], e),
        lerp(from[1], toHead[1], e),
        lerp(from[2], toHead[2], e),
      ] as [number, number, number]));
      if (t < 1) colorAnimFrameRef.current = requestAnimationFrame(step);
    };
    colorAnimFrameRef.current = requestAnimationFrame(step);
    return () => { if (colorAnimFrameRef.current) cancelAnimationFrame(colorAnimFrameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abilityIndex]);

  // Couleur de la pomme sans transition (immédiate)
  useEffect(() => {
    setDisplayAppleColor(isYellowApple(score) ? 'yellow' : 'red');
  }, [score]);

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
      canvasSize / 2, canvasSize / 2, canvasSize * 0.05, // centre lumineux plus petit
      canvasSize / 2, canvasSize / 2, canvasSize / 1.1
    );
    gradient.addColorStop(0, '#282842ff'); // centre violet lumineux
    gradient.addColorStop(0.2, '#020207ff'); // sombre intermédiaire plus tôt
    gradient.addColorStop(1, '#0a0a1a'); // bord très sombre
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.restore();

    // Utilise les couleurs interpolées (pouvoir actif)
    const snakeColor = {
      head: displayHeadColor,
      body: displayBodyColor,
    };

    // Cadre néon à l'intérieur, couleur selon le serpent (triple passe)
    {
      const cellSize = canvasSize / GRID_SIZE;

      // Épaisseurs x2 (inchangées)
      const outerLW = Math.max(3.0, cellSize * 0.75);
      const midLW   = Math.max(2.4, cellSize * 0.24);
      const coreLW  = Math.max(2.0, cellSize * 0.12);

      const EDGE_MARGIN = 0;
      const OUTSET_NUDGE = 1;
      const inset = EDGE_MARGIN + outerLW / 2 - OUTSET_NUDGE;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Halo externe
      ctx.strokeStyle = displayFrameColor;   // ← cadre utilise sa propre couleur/interpolation
      ctx.lineWidth = outerLW;
      ctx.lineJoin = 'round';
      ctx.shadowColor = displayFrameColor;
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

      // Halo intermédiaire
      ctx.lineWidth = midLW;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

      // Ligne centrale
      ctx.lineWidth = coreLW;
      ctx.shadowBlur = 3;
      ctx.globalAlpha = 1;
      ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

      ctx.restore();
    }

    // Interpolation pour animation fluide
    const interpolatedSnake = snakeToDraw.map((segment, i) => {
      if (previousSnake.length <= i || animationProgress === 1) return segment;
      return {
        x: previousSnake[i].x + (segment.x - previousSnake[i].x) * animationProgress,
        y: previousSnake[i].y + (segment.y - previousSnake[i].y) * animationProgress
      };
    });

    // Draw snake avec les nouvelles couleurs
    interpolatedSnake.forEach((segment, idx) => {
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

    // === TRAIT ORANGE OU JAUNE SUR LE DOS DU SERPENT (interpolé) ===
    const traitColor = displayTraitColor; // ← remplace la logique conditionnelle
    if (interpolatedSnake.length > 1) {
      ctx.save();
      ctx.strokeStyle = traitColor;
      ctx.lineWidth = Math.max(2, cellSize * 0.18);
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Commence au dernier segment
      ctx.moveTo(
        interpolatedSnake[interpolatedSnake.length - 1].x * cellSize + cellSize / 2,
        interpolatedSnake[interpolatedSnake.length - 1].y * cellSize + cellSize / 2
      );
      // Remonte jusqu'au deuxième segment (juste avant la tête)
      for (let i = interpolatedSnake.length - 2; i > 0; i--) {
        ctx.lineTo(
          interpolatedSnake[i].x * cellSize + cellSize / 2,
          interpolatedSnake[i].y * cellSize + cellSize / 2
        );
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw apple (couleur interpolée rouge/jaune) en rond avec effet néon
    ctx.save();
    ctx.shadowColor = displayAppleColor; // ← interpolé
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(
      foodToDraw.x * cellSize + cellSize / 2,
      foodToDraw.y * cellSize + cellSize / 2,
      (cellSize - 2) / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = displayAppleColor; // ← interpolé
    ctx.fill();
    ctx.restore();
  }

  // Redessine à chaque changement de taille ou d'état (+ couleurs affichées)
  useEffect(() => {
    drawGame(snake, food, isYellowApple(score));
  }, [canvasSize, snake, food, score, displayHeadColor, displayBodyColor, displayTraitColor, displayAppleColor, displayFrameColor]);

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
        style={{ /* border: '2px solid black', */ width: '90vw', maxWidth: 400, height: 'auto', aspectRatio: '1/1' }}
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
