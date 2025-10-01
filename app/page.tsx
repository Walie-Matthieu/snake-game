'use client';
import React, { useState, useCallback } from 'react';
import SnakeGame from './components/SnakeGame';
import styles from './page.module.css';

export default function Home() {
  const [abilityIndex, setAbilityIndex] = useState<number>(0);
  const [abilityShift, setAbilityShift] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);

  const handleSnakeState = useCallback((s: { abilityIndex: number; abilityShift: boolean; gameOver: boolean }) => {
    setAbilityIndex(s.abilityIndex);
    setAbilityShift(s.abilityShift);
    setGameOver(s.gameOver);
    // mettre à jour démarrage du jeu
    if (typeof (s as any).started === 'boolean') setStarted((s as any).started);
  }, []);

  const lines = [
    { word: 'vert', cls: styles.colorVert, text: "En ", rest: " , il n'en a pas, c'est sa couleur de base." },
    { word: 'bleu', cls: styles.colorBleu, text: "En ", rest: " , il peut traverser les murs." },
    { word: 'orange', cls: styles.colorOrange, text: "En ", rest: " , ses scores sont doublés." },
    { word: 'marron', cls: styles.colorMarron, text: "En ", rest: " , il peut traverser son corps sans se mordre." },
    { word: 'violet', cls: styles.colorViolet, text: "En ", rest: " , il rétrécit de quelques cubes." },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center text-center px-4 bg-blue-900">
      <main>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px 0' }}>Snake Game</h1>
        <div className={styles.row}>
          <div className={styles.gameLeft}>
            <SnakeGame onStateChange={handleSnakeState} />
          </div>
          <aside className={styles.asideRight}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0', textAlign: 'left' }}>À propos</h2>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              Re salut, ici vous pouvez trouver le fameux jeu du Serpent aka The Snake Game.
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              J'ai codé ce jeu en React mais d'une manière légèrement différente du reste du portfolio, pour m'entraîner
              et aussi pour éveiller ma curiosité. J'ai essayé d'être original en ajoutant des particularités telles que
              le fait de lui donner des pouvoirs à chaque pomme jaune mangée. Ainsi, chaque couleur possède une particularité :
            </p>

            <h3 className={styles.pouvoirTitle}></h3>

            {/* Wrapper avec classe pour contrôler toutes les lignes ensemble */}
            <div className={styles.powerLinesWrapper}>
              <ul style={{ margin: '0 0 12px 0', padding: 0, textAlign: 'left', listStyle: 'none' }}>
                {lines.map((l, i) => {
                  const active = !gameOver && i === abilityIndex && started;
                  const translate = active ? (abilityShift ? -12 : -8) : 0;
                  return (
                    <li key={i} style={{ margin: '6px 0' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          transform: `translateX(${translate}px)`,
                          transition: 'transform 220ms ease',
                        }}
                      >
                        <span>{l.text}</span>
                        <span className={l.cls} style={{ fontWeight: 600 }}>{l.word}</span>
                        <span>{l.rest}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className={styles.lastParagraph}>
              <span className={styles.noWrap}>
                Si ça vous a plu n'hésitez pas à me le dire.
              </span>
              <br />
              <span className={`${styles.pasPluLine} ${styles.noWrap}`}>
                Et si ça ne vous a pas plu dites-le moi quand même !
              </span>
            </p>
          </aside>
        </div>
      </main>
    </section>
  );
}
