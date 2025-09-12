# AI Agent Instructions for this Repo

Purpose: Quickly onboard AI coding agents to work productively in this Next.js + React (App Router) project and avoid common mistakes.

## Big picture
- Framework: Next.js 15 (App Router) with React 19, TypeScript strict, ESLint flat config.
- Two app trees exist: `app/` (active) and scaffolded `src/app/` (unused). The running UI mounts from `app/page.tsx` and uses `app/components/SnakeGame.tsx`.
- Styling: Tailwind CSS v4 via `src/app/globals.css`, but the currently active layout is `app/layout.tsx` which does NOT import globals. If you expect Tailwind utility classes to work globally, either import a CSS file in `app/layout.tsx` or render from `src/app` tree (see Pitfalls).
- Game: canvas-based Snake with keyboard controls, simple game loop with `setInterval` and custom drawing/interpolation.

## Key files
- `app/page.tsx`: root page mounting `<SnakeGame />`.
- `app/components/SnakeGame.tsx`: main game component, includes loop, input handling, drawing, abilities.
- `app/layout.tsx`: minimal HTML shell; consider importing global styles here if needed.
- `src/app/layout.tsx`, `src/app/globals.css`: default Next/Tailwind scaffold; currently not used by the active tree.
- `next.config.ts`: `reactStrictMode: false`.
- `eslint.config.mjs`: Flat config extending `next/core-web-vitals` and TS, with common ignores.
- `tsconfig.json`: paths alias `@/*` -> `src/*` (note: alias targets src tree, which is not currently the active router root).

## Run and build
- Dev: `npm run dev` (Next dev with Turbopack). Open http://localhost:3000.
- Build: `npm run build` (Turbopack) then `npm start`.
- Lint: `npm run lint`.

## Conventions and patterns
- App Router, client component: `SnakeGame.tsx` starts with `'use client'` and uses React hooks.
- State model in `SnakeGame.tsx`:
  - Core: `snake: Position[]`, `food: Position`, `direction: 'up'|'down'|'left'|'right'`, `score`, `gameOver`, `started`, `isPaused`.
  - Abilities: `abilityIndex` controls colors and rules (Traverseur, Double Score, Invincible, Rétrécissement).
  - Animation: `previousSnake`, `animationProgress`, `requestAnimationFrame` for interpolation; drawing uses canvas 2D API.
- Input: keydown listener on `document`. Starts only on arrow keys; T toggles pause, R resets.
- Game loop: `setInterval(updateGame, speed)`. Speed is fixed at 100ms; any change should keep cleanup to avoid multiple intervals.

## Important implementation notes
- Collision: Uses circle hitbox against walls and body; body collision can be disabled via Invincible ability.
- Walls: When ability is Traverseur, wrap-around is applied; otherwise `gameOver` is set.
- Apple color: Every 5th apple is yellow (`isYellowApple`), which cycles ability and changes scoring.
- Canvas size: responsive to window width (`0.9 * innerWidth`, max 400). Grid is fixed `20 x 20`.
- Drawing order: background gradient -> neon frame -> snake (head/body/tail with glow) -> spine stroke -> apple glow.

## Pitfalls and repo quirks
- Dual app trees: `app/` vs `src/app/`. The active pages/layout live under `app/`. Don’t edit `src/app/layout.tsx` expecting it to render unless you move/align the router root. If you want Tailwind/theme variables from `src/app/globals.css`, import a globals CSS in `app/layout.tsx`.
- TS path alias `@/*` points to `src/*`; avoid using it for files under `app/` unless you move code into `src/`.
- Strictness: TypeScript `strict` is enabled—prefer explicit types for state and functions.
- React Strict Mode is disabled in Next config—don’t rely on double-invocation behavior in dev.

## How to extend safely
- UI text/instructions: Update small UI labels directly in `SnakeGame.tsx` near the return block (score, pause, game over prompts).
- Controls: Adjust the key handling inside the keydown effect; remember to update dependency array when referencing new state.
- Speed/difficulty: Change the interval duration or introduce a `getSpeed(score)` helper and ensure the effect cleans up.
- Features: Add obstacles or high score with `localStorage` in client component only.

## Examples
- Add a high score:
  - On mount: `useEffect(() => setHighScore(Number(localStorage.getItem('snakeHighScore')||0)), [])`.
  - On score update: `if (score > highScore) localStorage.setItem('snakeHighScore', String(score))`.
- Prevent instant reverse direction: ignore setting direction if next is opposite and `snake.length > 1`.

## Agent etiquette for this repo
- When editing behavior, run dev server and visually verify canvas behavior if possible.
- Keep edits minimal and localized; avoid refactors that move between `app/` and `src/app/` unless asked.
- If adding Tailwind classes globally, ensure a global CSS is imported by `app/layout.tsx` or migrate to `src/app`.
