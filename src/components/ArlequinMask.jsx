import { useEffect, useRef, useState } from 'react';
import './ArlequinMask.css';

// Reads --mask-open-distance CSS variable (defined in breakpoints.css).
// Returns a pixel number; falls back to 230 if variable is missing.
function getOpenDistance() {
  return parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--mask-open-distance')
      .trim()
  ) || 224;
}

// Hook para calcular las posiciones basadas en el tamaño del contenedor
// Así la animación tendrá la misma proporción relativa en desktop y mobile
function useMaskPositions() {
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    const updatePositions = () => {
      const isMobile = window.innerWidth <= 600;
      // Open distance is responsive via CSS variable in breakpoints.css.
      // This re-reads on every resize so it stays in sync with media queries.
      const openDist = getOpenDistance();

      if (isMobile) {
        setPositions({
          OFFSCREEN: { left: 'translateX(-300px)', right: 'translateX(300px)' },
          CLOSED:    { left: 'translateX(17px)',    right: 'translateX(-20px)' },
          OPEN:      { left: `translateX(-${openDist}px)`, right: `translateX(${openDist}px)` }
        });
      } else {
        setPositions({
          OFFSCREEN: { left: 'translateX(-1000px)', right: 'translateX(1000px)' },
          CLOSED:    { left: 'translateX(-9px)',     right: 'translateX(5px)' },
          OPEN:      { left: `translateX(-${openDist}px)`, right: `translateX(${openDist}px)` }
        });
      }
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, []);

  return positions;
}

function ArlequinMask({ isDarkMode, phase, onTransitionEnd }) {
  const themeSuffix = isDarkMode ? 'dark' : 'clear';
  const maskPositions = useMaskPositions();
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  
  // Valores por defecto para cada fase (mientras se cargan las posiciones)
  const defaultTransforms = {
    // Fase home - máscara fuera de pantalla
    OFFSCREEN: { left: 'translateX(-1000px)', right: 'translateX(1000px)' },
    // Fase logoShrinking/maskClosing/reverseClosing - máscara cerrada
    CLOSED:    { left: 'translateX(-9px)',    right: 'translateX(5px)' },
    // Fase maskOpening/contentVisible - máscara abierta
    OPEN:     { left: 'translateX(-224px)', right: 'translateX(224px)' }
  };
  
  const positions = maskPositions || defaultTransforms;
  
  // Determinar la posición objetivo basada en la fase
  const getTargetTransforms = (currentPhase) => {
    switch (currentPhase) {
      case 'maskClosing':
      case 'reverseClosing':
        return positions.CLOSED;
      case 'maskOpening':
      case 'contentVisible':
        return positions.OPEN;
      case 'home':
      case 'reverseOpening':
      default:
        return positions.OFFSCREEN;
    }
  };
  
  // En el primer render con fase no-home, iniciar animación desde OFFSCREEN
  useEffect(() => {
    if (phase !== 'home' && !hasAnimatedIn) {
      // Iniciar desde OFFSCREEN para que haya transición
      setHasAnimatedIn(true);
    }
    if (phase === 'home') {
      setHasAnimatedIn(false);
    }
  }, [phase, hasAnimatedIn]);
  
  // Si es el primer render (no ha animado), usar OFFSCREEN
  const transforms = hasAnimatedIn 
    ? getTargetTransforms(phase)
    : positions.OFFSCREEN;

  const isLoading = phase === 'home';
  const isVisible = !isLoading;

  const className = [
    'arlequin-mask',
    isVisible ? 'visible' : '',
    isLoading ? 'loading' : ''
  ].filter(Boolean).join(' ');

  const hasNotifiedPhaseRef = useRef(false);

  useEffect(() => {
    hasNotifiedPhaseRef.current = false;
  }, [phase]);

  const handleTransitionEnd = (e) => {
    const prop = e?.propertyName;
    if (prop !== 'transform' && prop !== '-webkit-transform') return;
    if (!onTransitionEnd) return;

    // Handle all mask transition phases
    if (phase === 'maskOpening' || phase === 'maskClosing' || phase === 'reverseClosing' || phase === 'reverseOpening') {
      if (!hasNotifiedPhaseRef.current) {
        hasNotifiedPhaseRef.current = true;
        onTransitionEnd();
      }
    }
  };

  useEffect(() => {
    // Advance immediately from logoShrinking -> maskClosing once logo shrink starts.
    // This avoids waiting for a transform transition that doesn't occur on mask in this phase.
    if (phase === 'logoShrinking' && !hasNotifiedPhaseRef.current && onTransitionEnd) {
      hasNotifiedPhaseRef.current = true;
      // Use setTimeout to avoid re-render loop and ensure state update
      const timer = setTimeout(() => {
        onTransitionEnd();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [phase, onTransitionEnd]);

  useEffect(() => {
    // Fallback timer for maskClosing and maskOpening: on mobile CSS transitions
    // may never fire transitionend (React can collapse both renders into one browser
    // paint, skipping the transition entirely). If transitionend hasn't advanced the
    // phase within 950ms, force the advance here.
    if ((phase === 'maskClosing' || phase === 'maskOpening') && onTransitionEnd) {
      const timer = setTimeout(() => {
        if (!hasNotifiedPhaseRef.current) {
          hasNotifiedPhaseRef.current = true;
          onTransitionEnd();
        }
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [phase, onTransitionEnd]);

  return (
    <div className={className}>
      <div
        className="mask-half mask-left"
        style={{ transform: transforms.left }}
        onTransitionEnd={handleTransitionEnd}
      >
        <img
          src={`/Cartas/arlequin_mask_1_transition_${themeSuffix}.avif`}
          alt="Mask left"
        />
      </div>
      <div
        className="mask-half mask-right"
        style={{ transform: transforms.right }}
      >
        <img
          src={`/Cartas/arlequin_mask_2_transition_${themeSuffix}.avif`}
          alt="Mask right"
        />
      </div>
    </div>
  );
}

export default ArlequinMask;

