import SnakeGame from './components/SnakeGame';
import styles from './page.module.css';

export default function Home() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-4 bg-blue-900">
      <main>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px 0' }}>Snake Game</h1>
        <div className={styles.row}>
          <div className={styles.gameLeft}>
            <SnakeGame />
          </div>
          <aside className={styles.asideRight} style={{ maxWidth: '380px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0', textAlign: 'left' }}>À propos</h2>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              Re salut, ici vous pouvez trouver le fameux jeu du Serpent aka The Snake Game.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              J'ai codé ce jeu en React mais d'une manière légèrement différente du reste du portfolio, pour m'entraîner
              et aussi pour éveiller ma curiosité. J'ai essayé d'être original en ajoutant des particularités telles que
              le fait de lui donner des pouvoirs à chaque pomme jaune mangée. Ainsi, chaque couleur possède une particularité :
            </p>
            <ul style={{ margin: '0 0 12px 16px', padding: 0, textAlign: 'left', listStyle: 'disc' }}>
              <li>En <span className={styles.colorVert}>vert</span>, il n'en a pas, c'est sa couleur de base.</li>
              <li>En <span className={styles.colorBleu}>bleu</span>, il peut traverser les murs.</li>
              <li>En <span className={styles.colorOrange}>orange</span>, ses scores sont doublés.</li>
              <li>En <span className={styles.colorMarron}>marron</span>, il peut traverser son corps sans se mordre.</li>
              <li>En <span className={styles.colorViolet}>violet</span>, il rétrécit de quelques cubes.</li>
            </ul>
            <p
              style={{
                margin: '0',
                textAlign: 'left',
                fontSize: '0.85em',
                lineHeight: 1.3,
                letterSpacing: '0.2px'
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>
                Si ça vous a plu n'hésitez pas à me le dire.
              </span>
              <br />
              Et si ça ne vous a pas plu dites-le moi quand même !
            </p>
          </aside>
        </div>
      </main>
    </section>
  );
}
