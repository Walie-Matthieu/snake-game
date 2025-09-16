import SnakeGame from './components/SnakeGame';
import styles from './page.module.css';

export default function Home() {
  return (
    <main>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px 0' }}>Snake Game</h1>
      <div className={styles.row}>
        <div className={styles.gameLeft}>
          <SnakeGame />
        </div>
        <aside className={styles.asideRight}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>À propos</h2>
          <p style={{ margin: 0 }}>Texte à droite, séparé du jeu.</p>
          <p style={{ margin: 0 }}>Vous pouvez ajouter des instructions, des scores, ou d'autres informations ici.</p>
        </aside>
      </div>
    </main>
  );
}
