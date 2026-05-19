'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Début du fade-out après 1.2s → laisse 0.5s pour la transition
    const fadeTimer = setTimeout(() => setVisible(false), 1200);
    // Appelle onDone après la fin du fade-out (1.2 + 500ms)
    const doneTimer = setTimeout(() => onDone(), 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c1a42',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <style>{`
        @keyframes ls-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ls-fadeUp-delay {
          0%,  30% { opacity: 0; transform: translateY(14px); }
          100%     { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ls-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes ls-glow-pulse {
          0%, 100% { text-shadow:
            0 0 8px  #39ff14,
            0 0 20px #39ff14,
            0 0 40px #39ff14; }
          50% { text-shadow:
            0 0 14px #39ff14,
            0 0 32px #39ff14,
            0 0 60px #39ff14; }
        }
      `}</style>

      {/* Titre principal "SNAKE" */}
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(3rem, 12vw, 7rem)',
          fontWeight: 800,
          letterSpacing: '0.15em',
          color: '#f0ecec',
          textShadow: `
            0 0 8px  #39ff14,
            0 0 22px #39ff14,
            0 0 45px #39ff14
          `,
          animation: 'ls-fadeUp 0.6s ease forwards, ls-glow-pulse 2s ease-in-out 0.6s infinite',
          fontFamily: 'Poppins, system-ui, Arial, sans-serif',
        }}
      >
        SNAKE
      </h1>

      {/* Sous-titre "GAME" */}
      <h2
        style={{
          margin: '0.15em 0 0',
          fontSize: 'clamp(1rem, 4.5vw, 2.2rem)',
          fontWeight: 600,
          letterSpacing: '0.55em',
          color: '#00e5ff',
          textShadow: `
            0 0 6px  #00e5ff,
            0 0 16px #00e5ff,
            0 0 35px #00e5ff
          `,
          animation: 'ls-fadeUp-delay 0.9s ease forwards',
          fontFamily: 'Poppins, system-ui, Arial, sans-serif',
        }}
      >
        GAME
      </h2>

      {/* Barre de progression */}
      <div
        style={{
          marginTop: 'clamp(2rem, 5vh, 3.5rem)',
          width: 'clamp(140px, 28vw, 240px)',
          height: '2px',
          borderRadius: '2px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #39ff14, #00e5ff)',
            boxShadow: '0 0 8px #39ff14, 0 0 14px #00e5ff',
            animation: 'ls-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        />
      </div>
    </div>
  );
}
