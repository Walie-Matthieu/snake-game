This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# snake-game

Next.js (App Router) + TypeScript snake game (canvas-based).

## Quick start

Install and run dev server:
```bash
npm install
npm run dev
# open http://localhost:3000
```

Build / production:
```bash
npm run build
npm start
```

Lint:
```bash
npm run lint
```

## Project layout (important files)
- `app/` — active App Router pages and components (this app uses `app/page.tsx`).
- `app/components/SnakeGame.tsx` — main client component: canvas, game loop, input,sizing  logic.
- `app/page.module.css` — CSS + media queries for layout and responsive tweaks.
- `src/app/` — scaffolded tree with Tailwind; not used by the active router.
- `next.config.ts`, `tsconfig.json`, `package.json`, etc.

## How sizing works (short)
- Visual block (container + displayed canvas size) is controlled by CSS (`.gameLeft`, media queries in `app/page.module.css`).
- Canvas internal resolution (pixels used for drawing, collisions, grid) is set in JS inside `app/components/SnakeGame.tsx` via `getCanvasSizeForWidth()` — this sets the canvas `width`/`height` attributes.
- CSS can change the visual size (may blur if internal resolution differs). To avoid blurring keep CSS visual size and JS canvas size synchronized.

## How to change the game block size on mobile
Two approaches:

1. CSS-only (visual size)
   - Edit the final occurrence of the media query for your target range in `app/page.module.css` (there are duplicate queries; the last one wins).
   - Set `.gameLeft { width: /* value */ !important }` and `.gameLeft canvas { width: 100% !important; aspect-ratio: 1/1 }`.
   - Hard reload (Ctrl+F5).

2. JS (internal resolution — recommended to keep crisp)
   - Open `app/components/SnakeGame.tsx`.
   - Edit `getCanvasSizeForWidth(w: number): number` and change the `return` value used for the target width range (e.g. `if (w >= 391) return 340;`).
   - Save and hard reload.

If you want both crisp rendering and consistent visual size, change both the CSS override (visual) and the JS `getCanvasSizeForWidth` (internal).

## Common pitfalls
- There are duplicated media queries (e.g. multiple `@media (min-width: 391px) and (max-width: 414px)`). Remove duplicates or place your override at the very end so it takes precedence.
- `src/app/` contains Tailwind globals but the active `app/layout.tsx` does not import them. If you rely on Tailwind, import globals in `app/layout.tsx` or use the `src/app` tree.
- Canvas resolution must be changed in JS to affect collision/grids. CSS alone only affects display.

## Debug tips
- Check CSS variables:
```js
getComputedStyle(document.documentElement).getPropertyValue('--game-block-size')
```
- Inspect the canvas element to see its `width` and `height` attributes (these come from JS).
- If styles not applying, search for duplicate media queries and ensure your override is last. Clear cache and restart dev server if needed:
```bash
# on Windows (PowerShell)
rmdir /s /q .next
npm run dev
```

## Contributing / Notes
- Keep edits minimal and local to `app/` unless you intentionally migrate to `src/app/`.
- TypeScript is strict; prefer explicit types.
- React Strict Mode is disabled in `next.config.ts`; behavior in dev may differ from strict-mode expectations.

---
