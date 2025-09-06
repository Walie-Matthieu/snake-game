import SnakeGame from './components/SnakeGame';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Snake Game</h1>
      <SnakeGame />
    </main>
  );
}
