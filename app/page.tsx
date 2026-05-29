'use client';
import React, { useState, useCallback } from 'react';
import SnakeGame from './components/SnakeGame';
import LoadingScreen from './components/LoadingScreen';
import styles from './page.module.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [abilityIndex, setAbilityIndex] = useState<number>(0);
  const [abilityShift, setAbilityShift] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  const handleSnakeState = useCallback((s: { abilityIndex: number; abilityShift: boolean; gameOver: boolean; started?: boolean }) => {
    setAbilityIndex(s.abilityIndex);
    setAbilityShift(s.abilityShift);
    setGameOver(s.gameOver);
    // mettre à jour démarrage du jeu
    if (typeof s.started === 'boolean') setStarted(s.started);
  }, []);

  const content = language === 'fr'
    ? {
        aboutTitle: 'À propos',
        intro1: 'Re salut, ici vous pouvez trouver le fameux jeu du Serpent aka The Snake Game.',
        intro2:
          "J'ai codé ce jeu en React, mais d'une manière légèrement différente du reste du portfolio, pour m'entraîner et aussi pour éveiller ma curiosité. J'ai essayé d'être original en ajoutant des particularités telles que le fait de lui donner des pouvoirs à chaque pomme jaune mangée. Ainsi, chaque couleur possède une particularité :",
        outro1: "Si ça vous a plu n'hésitez pas à me le dire.",
        outro2: "Et si ça ne vous a pas plu dites-le moi quand même !",
        lines: [
          { word: 'vert', cls: styles.colorVert, text: 'En ', rest: " , il n'en a pas, c'est sa couleur de base." },
          { word: 'bleu', cls: styles.colorBleu, text: 'En ', rest: ' , il peut traverser les murs.' },
          { word: 'orange', cls: styles.colorOrange, text: 'En ', rest: ' , ses scores sont doublés.' },
          { word: 'marron', cls: styles.colorMarron, text: 'En ', rest: ' , il peut traverser son corps sans se mordre.' },
          { word: 'violet', cls: styles.colorViolet, text: 'En ', rest: ' , il rétrécit de quelques cubes.' },
        ],
      }
    : {
        aboutTitle: 'About',
        intro1: 'Hey again, here you can find the famous Snake game, aka The Snake Game.',
        intro2:
          "I coded this game in React in a slightly different way from the rest of my portfolio, to practice and also to satisfy my curiosity. I tried to make it original by adding special features, like giving it a power each time a yellow apple is eaten. So each color has its own trait:",
        outro1: 'If you liked it, feel free to tell me.',
        outro2: "And if you didn't like it, tell me anyway!",
        lines: [
          { word: 'green', cls: styles.colorVert, text: 'In ', rest: ', it has no special power, this is its base color.' },
          { word: 'blue', cls: styles.colorBleu, text: 'In ', rest: ', it can pass through walls.' },
          { word: 'orange', cls: styles.colorOrange, text: 'In ', rest: ', its score gains are doubled.' },
          { word: 'brown', cls: styles.colorMarron, text: 'In ', rest: ', it can pass through its body without biting itself.' },
          { word: 'purple', cls: styles.colorViolet, text: 'In ', rest: ', it shrinks by a few cubes.' },
        ],
      };

  const renderIntro2 = () => {
    const breakMarkers =
      language === 'fr'
        ? ["J'ai essayé d'être original", 'Ainsi, chaque couleur']
        : ['I tried to make it original', 'So each color'];

    const nodes: React.ReactNode[] = [];
    let remainingText = content.intro2;
    let foundBreak = false;

    breakMarkers.forEach((marker, index) => {
      const breakIndex = remainingText.indexOf(marker);
      if (breakIndex === -1) return;

      foundBreak = true;
      nodes.push(remainingText.slice(0, breakIndex).trimEnd());
      nodes.push(<br key={`intro2-break-${index}`} />);
      remainingText = remainingText.slice(breakIndex);
    });

    if (!foundBreak) return content.intro2;

    nodes.push(remainingText);
    return <>{nodes}</>;
  };

  const paragraphLangClass = language === 'fr' ? styles.lastParagraphFr : styles.lastParagraphEn;

  const renderLastParagraph = (extraClass: string) => (
    <p className={`${styles.lastParagraph} ${paragraphLangClass} ${extraClass}`}>
      <span className={styles.noWrap}>
        {content.outro1}
      </span>
      <br />
      <span className={`${styles.pasPluLine} ${styles.noWrap}`}>
        {content.outro2}
      </span>
    </p>
  );

  
  return (
    <>
      {isLoading && <LoadingScreen onDone={() => setIsLoading(false)} />}
    <section className={styles.page}>
      <main className={styles.main}>
        <div className={styles.row}>
          <div
            className={styles.gameLeft}
          >
            <SnakeGame onStateChange={handleSnakeState} language={language} onLanguageChange={setLanguage} />
          </div>
          <aside
            className={styles.asideRight}
          >
            <div className={styles.languageSwitcher}>
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: language === 'fr' ? '1px solid #ffe9b6' : '1px solid rgba(255,255,255,0.25)',
                  background: language === 'fr' ? 'rgba(255,233,182,0.14)' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                aria-label="Français"
                title="Français"
              >
                <img
                  src="https://flagcdn.com/fr.svg"
                  alt="Drapeau français"
                  width={20}
                  height={14}
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 14,
                    borderRadius: 2,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.25) inset',
                  }}
                />
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: language === 'en' ? '1px solid #ffe9b6' : '1px solid rgba(255,255,255,0.25)',
                  background: language === 'en' ? 'rgba(255,233,182,0.14)' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                aria-label="English"
                title="English"
              >
                <img
                  src="https://flagcdn.com/gb.svg"
                  alt="UK flag"
                  width={20}
                  height={14}
                  style={{
                    display: 'inline-block',
                    width: 20,
                    height: 14,
                    borderRadius: 2,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.25) inset',
                  }}
                />
              </button>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0', textAlign: 'left' }}>{content.aboutTitle}</h2>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              {content.intro1}
            </p>
            <p style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
              {renderIntro2()}
            </p>

            <h3 className={styles.pouvoirTitle}></h3>

            {/* Wrapper avec classe pour contrôler toutes les lignes ensemble */}
            <div className={`${styles.powerLinesWrapper} ${language === 'fr' ? styles.powerLinesWrapperFr : styles.powerLinesWrapperEn}`}>
              <ul style={{ margin: '0 0 12px 0', padding: 0, textAlign: 'left', listStyle: 'none' }}>
                {content.lines.map((l, i) => {
                  const active = !gameOver && i === abilityIndex && started;
                  const translate = active ? (abilityShift ? '-0.75rem' : '-0.5rem') : '0rem';
                  return (
                    <li key={i} style={{ margin: '6px 0' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          transform: `translateX(${translate})`,
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

            {renderLastParagraph(styles.lastParagraphInAside)}
          </aside>
        </div>
        {renderLastParagraph(styles.lastParagraphDesktop)}
      </main>
      </section>
    </>
  );
}
