'use client';
import React, { useEffect, useRef, useState } from 'react';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20; // 20x20 cases
// const COLOR_TRANSITION_MS = 2500; // serpent (tête/corps) + trait dorsal (désactivé)
const FRAME_TRANSITION_MS = 3000;  // cadre (rebord néon) — ajustable séparément

/* === Clignotement cadre Game Over (uniquement) ===
   - GO_FLASH_COUNT : nombre de clignotements (ON rapides)
   - GO_FLASH_ON_MS : durée visible de chaque flash
   - GO_FLASH_PAUSE_MS : pause (cadre éteint) entre deux flash
   Après le dernier flash le cadre reste allumé définitivement. */
const GO_FLASH_COUNT = 3;
const GO_FLASH_ON_MS = 180;
const GO_FLASH_PAUSE_MS = 500;

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

export default function SnakeGame({
  onStateChange,
}: {
  onStateChange?: (s: { abilityIndex: number; abilityShift: boolean; gameOver: boolean; started: boolean }) => void;
}) {
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
  // ref pour éviter double-trigger du même shift + durée centralisée
  const lastShiftKeyRef = useRef<string | null>(null);
  const SHIFT_MS = 350; // durée du maintien du shift (ms)

  // nouvel état pour le décalage transitoire (utilisé pour l'UI parent)
  const [abilityShift, setAbilityShift] = useState<boolean>(false);

  // Couleurs affichées (interpolées)
  const [displayHeadColor, setDisplayHeadColor] = useState<string>(SNAKE_COLORS[0].head);
  const [displayBodyColor, setDisplayBodyColor] = useState<string>(SNAKE_COLORS[0].body);
  const [displayTraitColor, setDisplayTraitColor] = useState<string>('orange');
  const [displayAppleColor, setDisplayAppleColor] = useState<string>('red');
  const [displayFrameColor, setDisplayFrameColor] = useState<string>(SNAKE_COLORS[0].head);
  // + état pour la croix collision
  const [collisionMarker, setCollisionMarker] = useState<Position | null>(null);
  // --- états clignotement Game Over ---
  const [goFlashVisible, setGoFlashVisible] = useState(true);
  const [goFlashDone, setGoFlashDone] = useState(false);
  const colorAnimFrameRef = useRef<number | null>(null); // ← nouveau
  // const colorAnimAppleRef = useRef<number | null>(null);

  // Met à jour la taille du canvas selon la taille de la fenêtre
  useEffect(() => {
    function handleResize() {
      const size = Math.min(window.innerWidth * 0.9, 460); // taille du Canva, aka boite du Snake
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
    setAbilityIndex(0);
    setCollisionMarker(null); // reset croix
    setGoFlashVisible(true);
    setGoFlashDone(false);
    // s'assurer que le shift et la clef de déduplication sont réinitialisés
    setAbilityShift(false);
    lastShiftKeyRef.current = null;
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
      if (abilityIndex === 1) {
        // Traverseur : wrap-around
        if (head.x < 0) head.x = GRID_SIZE - 1;
        else if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        else if (head.y >= GRID_SIZE) head.y = 0;
      } else {
        setCollisionMarker(head); // mémorise position pour croix
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
      setCollisionMarker(head); // croix
      setGameOver(true);
      return;
    }

    setPreviousSnake(snake);
    setSnake(newSnake);
    setAnimationProgress(0);
    drawGame(newSnake, food);
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

  // notifie le parent à chaque changement pertinent
  useEffect(() => {
    onStateChange?.({ abilityIndex, abilityShift, gameOver, started });
  }, [abilityIndex, abilityShift, gameOver, started, onStateChange]);

  // Centralise le déclenchement du shift (évite double-trigger quand started et abilityIndex changent)
  useEffect(() => {
    if (!started || gameOver) return;
    const key = `${abilityIndex}:${started}`;
    if (lastShiftKeyRef.current === key) return;
    lastShiftKeyRef.current = key;
    setAbilityShift(true);
    const id = window.setTimeout(() => {
      setAbilityShift(false);
      lastShiftKeyRef.current = null;
    }, SHIFT_MS);
    return () => {
      window.clearTimeout(id);
      lastShiftKeyRef.current = null;
    };
  }, [abilityIndex, started, gameOver]);
  
  // À l'inverse, si on entre en Game Over, on s'assure que le shift est retiré
  // pour que la colonne "se range".
  useEffect(() => {
    if (gameOver) setAbilityShift(false);
  }, [gameOver]);

  // Couleur de la pomme sans transition (immédiate)
  useEffect(() => {
    setDisplayAppleColor(isYellowApple(score) ? 'yellow' : 'red');
  }, [score]);

  // Redessine après collision pour afficher la croix
  useEffect(() => {
    if (collisionMarker) {
      drawGame(snake, food);
    }
  }, [collisionMarker, gameOver]); 

  // Dessine aussi quand on passe en état gameOver (même sans collisionMarker futur)
  useEffect(() => {
    if (gameOver) drawGame(snake, food);
  }, [gameOver, snake, food]);

  // === Séquence clignotement cadre Game Over ===
  useEffect(() => {
    if (!gameOver) {
      // réinitialise si on relance une partie
      setGoFlashVisible(true);
      setGoFlashDone(false);
      return;
    }
    // lance la séquence uniquement à la transition vers gameOver
    let flashIndex = 0;
    let phase: 'on' | 'pause' = 'on';
    let last = performance.now();
    let raf: number;

    const loop = (now: number) => {
      if (!gameOver) return;               // sécurité
      if (goFlashDone) return;             // séquence terminée

      if (phase === 'on') {
        if (!goFlashVisible) setGoFlashVisible(true);
        if (now - last >= GO_FLASH_ON_MS) {
          if (flashIndex === GO_FLASH_COUNT - 1) {
            // dernier flash -> on fige allumé
            setGoFlashDone(true);
            setGoFlashVisible(true);
            return;
          } else {
            phase = 'pause';
            last = now;
            setGoFlashVisible(false);
          }
        }
      } else { // pause
        if (now - last >= GO_FLASH_PAUSE_MS) {
          flashIndex++;
            phase = 'on';
            last = now;
            setGoFlashVisible(true);
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameOver, goFlashDone]);

  function drawGame(snakeToDraw = snake, foodToDraw = food) {
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

    // === Cadre (normal ou Game Over clignotant) ===
    if (gameOver) {
      if (goFlashVisible || goFlashDone) {
        // même épaisseur que le cadre normal
        const outerLW = Math.max(3.0, cellSize * 0.75);
        const midLW   = Math.max(2.4, cellSize * 0.24);
        const coreLW  = Math.max(2.0, cellSize * 0.12);
        const EDGE_MARGIN = 0;
        const OUTSET_NUDGE = 1;
        const inset = EDGE_MARGIN + outerLW / 2 - OUTSET_NUDGE;

        const red = '#bd0716ff';
        const glow = '#97242dff';

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        ctx.strokeStyle = red;
        ctx.lineWidth = outerLW;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.35;
        ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

        ctx.lineWidth = midLW;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

        ctx.lineWidth = coreLW;
        ctx.shadowBlur = 3;
        ctx.globalAlpha = 1;
        ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

        ctx.restore();
      }
    } else {
      // Cadre néon normal (couleur serpent)
      const outerLW = Math.max(3.0, cellSize * 0.75);
      const midLW   = Math.max(2.4, cellSize * 0.24);
      const coreLW  = Math.max(2.0, cellSize * 0.12);
      const EDGE_MARGIN = 0;
      const OUTSET_NUDGE = 1;
      const inset = EDGE_MARGIN + outerLW / 2 - OUTSET_NUDGE;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      ctx.strokeStyle = displayFrameColor;
      ctx.lineWidth = outerLW;
      ctx.lineJoin = 'round';
      ctx.shadowColor = displayFrameColor;
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

      ctx.lineWidth = midLW;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(inset, inset, canvasSize - inset * 2, canvasSize - inset * 2);

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
      ctx.lineJoin = 'round';

      // Centres des segments
      const pts = interpolatedSnake.map(seg => ({
        x: seg.x * cellSize + cellSize / 2,
        y: seg.y * cellSize + cellSize / 2,
      }));

      // Seuil pour "casser" le chemin quand on détecte un wrap (saut trop grand)
      const BREAK_DIST = cellSize * 1.2;

      ctx.beginPath();
      // On part de la queue
      ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

      for (let i = pts.length - 2; i > 0; i--) {
        const prev = pts[i + 1]; // point précédent dans le chemin (plus proche de la queue)
        const curr = pts[i];

        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy);

        if (dist > BREAK_DIST) {
          // Grand saut (wrap) → on "casse" le trait et on recommence un sous-chemin
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(curr.x, curr.y);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
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

    // Croix rouge (collision)
    if (collisionMarker) {
      const cellSize = canvasSize / GRID_SIZE;
      const cx = collisionMarker.x * cellSize + cellSize / 2;
      const cy = collisionMarker.y * cellSize + cellSize / 2;
      const size = cellSize * 0.7; // taille de la croix
      const half = size / 2;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.strokeStyle = '#ff2d2d';
      ctx.lineWidth = Math.max(2, cellSize * 0.15);
      ctx.shadowColor = '#ff2d2d';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx - half, cy - half);
      ctx.lineTo(cx + half, cy + half);
      ctx.moveTo(cx + half, cy - half);
      ctx.lineTo(cx - half, cy + half);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Redessine à chaque changement de taille ou d'état (+ couleurs affichées)
  // Redessine à chaque changement y compris clignotement
  useEffect(() => {
    drawGame(snake, food);
  }, [
    canvasSize,
    snake,
    food,
    displayHeadColor,
    displayBodyColor,
    displayTraitColor,
    displayAppleColor,
    displayFrameColor,
    goFlashVisible,
    goFlashDone
  ]);

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

  // largeur fixe du panneau de contrôles (px) et gap entre canvas / panneau
  const CONTROL_WIDTH = 150; // largeur fixe du panneau de contrôles (px)
  const CONTAINER_GAP = 25; // espace entre canvas et panneau (px)
  const CONTROL_HEIGHT = 210; // hauteur fixe du panneau de contrôles (px)
  const KEY_GROUP_OFFSET_X = -0; // Déplace les touches horizontalement (+ droite / - gauche)
  const KEY_GROUP_OFFSET_Y = 21; // Déplace les touches verticalement (+ bas / - haut)
  
  // Décalage du panneau entier (colonne des touches)
  const PANEL_OFFSET_X = 20; // + droite / - gauche
  const PANEL_OFFSET_Y = 30; // + bas / - haut
  
  // detecte la largeur de la fenêtre pour décider du layout (évite wrap inattendu)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    function onResize() { setWindowWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // largeur minimale souhaitée pour le canvas quand la colonne est à droite
  const MIN_CANVAS_WIDTH = 240;
  // on place la colonne à droite seulement si la fenêtre peut contenir (canvas min + gap + control)
  const controlsAbsolute = windowWidth >= (MIN_CANVAS_WIDTH + CONTROL_WIDTH + CONTAINER_GAP);

  // container style: grid on desktop (fixed right column), column flow on mobile
  const containerStyleDesktop: React.CSSProperties = {
    display: 'grid',
    // première colonne = largeur actuelle du canvas (px), deuxième = panneau contrôles
    gridTemplateColumns: `${Math.round(canvasSize)}px ${CONTROL_WIDTH}px`,
    gap: CONTAINER_GAP,
    // largeur totale = canvas + gap + control ; allow it to grow up to viewport
    width: `${Math.round(canvasSize + CONTROL_WIDTH + CONTAINER_GAP)}px`,
    maxWidth: '100%',
    boxSizing: 'border-box',
    alignItems: 'start',
    minWidth: 0,
  };
  const containerStyleMobile: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: CONTAINER_GAP,
    width: '90vw',
    maxWidth: 400,
    boxSizing: 'border-box',
  };

  //  Déplace le Canvas
  const CANVAS_OFFSET_X = -50; // + droite / - gauche
  const CANVAS_OFFSET_Y = -80; // + bas / - haut

  // Offset dédié pour le texte des capacités
  const ABILITY_TEXT_OFFSET_X = -70; // + droite / - gauche
  const ABILITY_TEXT_OFFSET_Y = 0; // + bas / - haut

  // Offset pour le message "Appuie sur une flèche pour commencer"
  const START_HINT_OFFSET_X = 265; // + droite / - gauche
  const START_HINT_OFFSET_Y = -200; // + bas / - haut

  const canvasWrapperStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    transform: `translate(${CANVAS_OFFSET_X}px, ${CANVAS_OFFSET_Y}px)`,
    position: 'relative', // <- permet aux overlays position:absolute d'être centrés sur le canvas
  };

  // helper inline pour style des touches (défini avant le return pour éviter les erreurs)
  function keyStyle() {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
      height: 20,
      padding: '0 8px',
      borderRadius: 6,
      border: '1px solid rgba(255, 158, 105, 0.18)', // pink border
      background: 'rgba(18, 3, 5, 0)', // light pink background
      color: '#fff9fcff', // pink text
      fontWeight: 700,
      fontSize: 14,
      boxShadow: 'inset 0 -1px 0 rgba(243, 237, 237, 0.08)'
    } as React.CSSProperties;
  }
 
  // === Scoreboard minimal (MON | TON) ===
  const SCOREBOARD_OFFSET_X = 280; // + droite / - gauche
  const SCOREBOARD_OFFSET_Y = 0; // + bas / - haut
  const SCOREBOARD_SCALE = 1;    // 1 = 100%

  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const v = localStorage.getItem('snakeHighScore');
    return v ? Number(v) : 0;
  });
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', String(score));
    }
  }, [score, highScore]);

  return (
     <div className="flex flex-col items-center gap-4 w-full">
      {/* Scoreboard NBA-style simple */}
      <div
        style={{
          transform: `translate(${SCOREBOARD_OFFSET_X}px, ${SCOREBOARD_OFFSET_Y}px) scale(${SCOREBOARD_SCALE})`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          userSelect: 'none'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ffe9b6', textTransform: 'uppercase' }}>MON SCORE</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff' }}>{score}</div>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.75)', padding: '0 8px' }}>|</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ffe9b6', textTransform: 'uppercase' }}>TON SCORE</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff' }}>{highScore}</div>
        </div>
      </div>
      {/* Wrapper commun pour nom + description du pouvoir */}
      <div style={{
        transform: `translate(${CANVAS_OFFSET_X + ABILITY_TEXT_OFFSET_X}px, ${CANVAS_OFFSET_Y + ABILITY_TEXT_OFFSET_Y}px)`,
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Nom du pouvoir */}
        <span
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.04)',
            color: gameOver ? 'red' : displayHeadColor,
            fontWeight: 700,
            fontFamily: 'inherit',
            marginBottom: 8
          }}
        >
          {gameOver ? 'Perdu' : SNAKE_ABILITIES[abilityIndex].name}
        </span>

        {/* Description du pouvoir */}
        <div style={{
          fontSize: 12,
          color: '#b9bcc4',
          marginTop: 6
        }}>
          {SNAKE_ABILITIES[abilityIndex].description}
        </div>
      </div>

      {/* Container: canvas + contrôle — grid desktop (fixed panel), stacked mobile */}
      <div style={controlsAbsolute ? containerStyleDesktop : containerStyleMobile}>
        {/* canvas prend la première colonne (1fr) */}
        <div style={canvasWrapperStyle}>
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '1/1',
              display: 'block',
              boxSizing: 'border-box',
            }}
          />
          {/* Messages centrés dans le canvas */}
          {isPaused && !gameOver && ( 
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex: 20 }}>
              <strong>PAUSE</strong> 
              <span>Appuie sur T pour continuer</span>
            </div>
          )}
          {gameOver && (
            <div style={{ 
              position:'absolute', 
              inset:0, 
              display:'flex', 
              flexDirection:'column', 
              alignItems:'center', 
              justifyContent:'center',
              pointerEvents: 'none',
              zIndex: 20,
              transform: 'translate(5px, -20px)'
            }}>
              <div style={{ fontWeight: 800, fontSize: 32, color: '#ff5555', letterSpacing: 1 }}>Game Over!</div>
              <div style={{ marginTop: 10, fontSize: 14, color: '#d0d5dd' }}>Appuie sur R pour recommencer</div>
            </div>
          )}
          {!started && !gameOver && (
            <div style={{ 
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 20,
              transform: 'translate(0px, 0px)'  // Ajuste X,Y ici si besoin
            }}>
              <div>Appuie sur une flèche</div>
              <div>pour commencer</div>
            </div>
          )}
        </div>

        {/* ===================== CONTROLS PANEL START =====================
            Bloc de la colonne contenant les indications de touches (↑ ← ↓ →, T, R).
            Tu peux repérer / modifier ce bloc facilement entre les deux marqueurs.
         =============================================================== */}
        <div
          aria-hidden={false}
          style={{
            width: controlsAbsolute ? CONTROL_WIDTH : '100%',
            height: controlsAbsolute ? `${CONTROL_HEIGHT}px` : 'auto',
            transform: `translate(${PANEL_OFFSET_X}px, ${PANEL_OFFSET_Y}px)`,
            overflowY: controlsAbsolute ? 'auto' : 'visible',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            borderRadius: 14,
            // Glassmorphism
            background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))',
            border: '1px solid rgba(255,255,255,0.25)',
            boxSizing: 'border-box',
            justifyContent: 'start',
            backdropFilter: 'blur(14px) saturate(170%)',
            WebkitBackdropFilter: 'blur(14px) saturate(170%)',
            boxShadow:
              '0 8px 28px -6px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 2px rgba(255,255,255,0.25)',
            position: 'relative',
            overflow: 'hidden',
            // léger trait lumineux interne
            outline: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Groupe complet des touches (déplacé via KEY_GROUP_OFFSET_X/Y) */}
          <div
            style={{
              position: 'relative',
              transform: `translate(${KEY_GROUP_OFFSET_X}px, ${KEY_GROUP_OFFSET_Y}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {/* Flèches (layout clavier) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'auto auto',
                gap: 6,
                width: '100%',
                alignItems: 'center',
                justifyItems: 'center'
              }}
            >
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
                <kbd style={keyStyle()} aria-label="Flèche haut">↑</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <kbd style={keyStyle()} aria-label="Flèche gauche">←</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <kbd style={keyStyle()} aria-label="Flèche bas">↓</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <kbd style={keyStyle()} aria-label="Flèche droite">→</kbd>
              </div>
            </div>
            {/* T et R empilés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <kbd style={keyStyle()}>T</kbd>
                <span style={{ fontSize: 12 }}>Pause</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <kbd style={keyStyle()}>R</kbd>
                <span style={{ fontSize: 12 }}>Recommencer</span>
              </div>
            </div>
          </div>
        </div>
        {/* ====================== CONTROLS PANEL END ====================== */}
      </div>  {/* <-- fermeture du container grid/flex */}
    </div>
  );
}
