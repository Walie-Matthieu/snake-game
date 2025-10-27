'use client';
import { useEffect, useState } from 'react';

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoints
  const isLargeDesktop = windowWidth >= 1440;
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  // Offsets pour Snake Game
  const gameOffsets = {
    scoreboard: {
      offsetY: isLargeDesktop ? 0 : isDesktop ? 10 : 20,
      scale: isLargeDesktop ? 1 : isDesktop ? 0.9 : 0.8,
      translateX: isLargeDesktop ? '110%' : isDesktop ? '95%' : '80%',
    },
    canvas: {
      offsetX: isLargeDesktop ? -40 : isDesktop ? -30 : 0,
      offsetY: isLargeDesktop ? 10 : isDesktop ? 20 : 30,
    },
    panel: {
      offsetX: isLargeDesktop ? 90 : isDesktop ? 60 : 20,
      offsetY: isLargeDesktop ? 120 : isDesktop ? 100 : 80,
    },
    abilityText: {
      offsetX: isLargeDesktop ? -70 : isDesktop ? -50 : -30,
      offsetY: 0,
    },
    control: {
      width: isLargeDesktop ? 150 : isDesktop ? 140 : 130,
      height: 210,
      gap: isLargeDesktop ? 25 : isDesktop ? 20 : 15,
    },
  };

  return {
    windowWidth,
    isLargeDesktop,
    isDesktop,
    isTablet,
    isMobile,
    gameOffsets,
  };
}