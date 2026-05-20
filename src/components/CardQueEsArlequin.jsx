import { useState, useEffect, useRef } from 'react';
import './CardQueEsArlequin.css';

// Open animation frames
const CARD_FRAMES_CLEAR = [
  '00000_arlequin_dorso_clear.avif',
  '00001_arlequin_dorso_clear.avif',
  '00002_arlequin_dorso_clear.avif',
  '00003_arlequin_dorso_clear.avif',
  '00004_arlequin_dorso_clear.avif',
  '00005_arlequin_dorso_clear.avif',
  '00006_arlequin_dorso_clear.avif',
  '00007_arlequin_frente_clear.avif',
  '00008_arlequin_frente_clear.avif',
  '00009_arlequin_frente_clear.avif',
  '00010_arlequin_frente_clear.avif',
  '00011_arlequin_frente_clear.avif',
  '00012_arlequin_frente_clear.avif',
];

const CARD_FRAMES_DARK = [
  '00000_arlequin_dorso_dark.avif',
  '00001_arlequin_dorso_dark.avif',
  '00002_arlequin_dorso_dark.avif',
  '00003_arlequin_dorso_dark.avif',
  '00004_arlequin_dorso_dark.avif',
  '00005_arlequin_dorso_dark.avif',
  '00006_arlequin_dorso_dark.avif',
  '00007_arlequin_frente_dark.avif',
  '00008_arlequin_frente_dark.avif',
  '00009_arlequin_frente_dark.avif',
  '00010_arlequin_frente_dark.avif',
  '00011_arlequin_frente_dark.avif',
  '00012_arlequin_frente_dark.avif',
];

// Close animation frames (frente matches theme, dorso always clear)
const CLOSE_FRAMES_CLEAR = [
  '00013_arlequin_frente_clear.avif',
  '00014_arlequin_frente_clear.avif',
  '00015_arlequin_frente_clear.avif',
  '00016_arlequin_frente_clear.avif',
  '00017_arlequin_frente_clear.avif',
  '00018_arlequin_frente_clear.avif',
  '00019_arlequin_dorso_clear.avif',
  '00020_arlequin_dorso_clear.avif',
  '00021_arlequin_dorso_clear.avif',
  '00022_arlequin_dorso_clear.avif',
  '00023_arlequin_dorso_clear.avif',
  '00000_arlequin_dorso_clear.avif',
];

const CLOSE_FRAMES_DARK = [
  '00013_arlequin_frente_dark.avif',
  '00014_arlequin_frente_dark.avif',
  '00015_arlequin_frente_dark.avif',
  '00016_arlequin_frente_dark.avif',
  '00017_arlequin_frente_dark.avif',
  '00018_arlequin_frente_dark.avif',
  '00019_arlequin_dorso_dark.avif',
  '00020_arlequin_dorso_dark.avif',
  '00021_arlequin_dorso_dark.avif',
  '00022_arlequin_dorso_dark.avif',
  '00023_arlequin_dorso_dark.avif',
  '00000_arlequin_dorso_dark.avif',
];

const CARD_FINAL_FRAME_CLEAR = '00012_arlequin_frente_clear_fija.avif';
const CARD_FINAL_FRAME_DARK = '00012_arlequin_frente_dark_fija.avif';

const CARD_FRAME_DURATION = 25;
const CARD_WIDTH = 550;
const CARD_HEIGHT = 680;

// DPR cap: 2 on desktop for crispness, 1.5 on mobile to cut the per-frame
// drawImage cost ~44%. The card is CSS-scaled below 1 on small screens so
// the visual hit is minor while old phones gain real headroom at 40 FPS.
const getDpr = () => Math.min(
  window.devicePixelRatio || 1,
  window.matchMedia('(max-width: 768px)').matches ? 1.5 : 2
);

// Module-level cache — persists across mounts so re-opens are instant
const _openCache  = {};
const _closeCache = {};

// Consolidates clearRect + drawImage so call sites stay one-liners.
const drawCardFrame = (ctx, frame, w, h) => {
  ctx.clearRect(0, 0, w, h);
  if (!frame) return;
  ctx.drawImage(frame, 0, 0, w, h);
};

const cardTexts = [
  [
    'Arlequín es una empresa enfocada en el diseño y desarrollo de soluciones digitales creativas.',
  ],
  [
    'Más que un nombre, Arlequín es un concepto. Representa al artista completo: alguien que combina distintas habilidades para crear, interpretar y resolver.',
  ],
  [
    'Esa visión define la forma en que se abordan los proyectos, integrando creatividad y técnica en cada etapa, desde la idea hasta su desarrollo, para transformarla en una solución bien pensada, bien diseñada y bien ejecutada.',
  ],
  [
    'Cada proyecto se aborda de forma integral, entendiendo el diseño no solo desde lo estético, sino también desde lo funcional. Cada solución busca responder a una necesidad real y generar una experiencia clara para quienes la utilizan.',
  ],
  [
    'Arlequín diseña y desarrolla sitios web funcionales, adaptables a todo tipo de dispositivos, pensados tanto para el cliente final como para quienes administran un negocio.',
  ],
  [
    'Se especializa en experiencia de usuario (UX), diseño visual (UI) y programación a medida, analizando cada necesidad para construir plataformas claras, intuitivas y efectivas.',
  ],
  [
    'Además, desarrolla productos propios, como sistemas de gestión y plataformas con funcionalidades específicas, que pueden ser utilizados por terceros a través de un modelo de suscripción.',
    '(PRÓXIMAMENTE)',
  ],
  [
    '¿Querés saber todo lo que Arlequín puede hacer por vos? Visitá la sección de Servicios y descubrí cada una de las soluciones que tenemos para ofrecerte.',
  ],
];

function CardQueEsArlequin({ isDarkMode, onClose, onCloseStart, fromGrid = false, preload = false, isLowEnd = false, prefersReducedMotion = false }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const closeImagesRef = useRef([]);
  const animationRef = useRef(null);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const isCompleteRef = useRef(false);
  const closeFrameRef = useRef(0);
  const lastCloseFrameTimeRef = useRef(0);
  const isLoadedRef = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [canStartAnimation, setCanStartAnimation] = useState(false);
  const [showNavIcons, setShowNavIcons] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isHidingUI, setIsHidingUI] = useState(false);
  const [isScalingDown, setIsScalingDown] = useState(false);

  const themeSuffix = isDarkMode ? 'dark' : 'clear';
  const cardFrames = isDarkMode ? CARD_FRAMES_DARK : CARD_FRAMES_CLEAR;
  const closeFrames = isDarkMode ? CLOSE_FRAMES_DARK : CLOSE_FRAMES_CLEAR;
  const cardFinalFrame = isDarkMode ? CARD_FINAL_FRAME_DARK : CARD_FINAL_FRAME_CLEAR;
  const totalFrames = cardFrames.length;
  const isLastPage = currentCardIndex === cardTexts.length - 1;

  const handleNextCard = () => {
    if (currentCardIndex < cardTexts.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) setCurrentCardIndex(prev => prev - 1);
  };

  const handleClose = () => {
    if (isClosing || isHidingUI) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsHidingUI(true);
    setShowNavIcons(false);
    if (onCloseStart) onCloseStart();
    setTimeout(() => {
      setIsClosing(true);
    }, 350);
  };

  // Start open animation: immediate if fromGrid, delayed otherwise
  useEffect(() => {
    if (isLoaded && !fromGrid) {
      const timer = setTimeout(() => setCanStartAnimation(true), 600);
      return () => clearTimeout(timer);
    }
    if (isLoaded && fromGrid) {
      setCanStartAnimation(true);
    }
  }, [isLoaded, fromGrid]);

  // Preload open + close frames
  // On first load: triggers animation start via setIsLoaded(true)
  // On theme change: silently swaps image buffers without resetting animation state
  useEffect(() => {
    const wasLoaded = isLoadedRef.current;

    const loadImages = async () => {
      const themeKey = isDarkMode ? 'dark' : 'clear';

      // Use cache if available — instant on re-open
      if (_openCache[themeKey]) {
        imagesRef.current = _openCache[themeKey];
        closeImagesRef.current = _closeCache[themeKey];
        if (!wasLoaded && !preload) {
          isLoadedRef.current = true;
          setIsLoaded(true);
        } else if (isCompleteRef.current && !preload) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          const finalFrame = _openCache[themeKey][_openCache[themeKey].length - 1];
          if (finalFrame) drawCardFrame(ctx, finalFrame, CARD_WIDTH, CARD_HEIGHT);
        }
        return;
      }

      const openPromises = [...cardFrames, cardFinalFrame].map(file =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
          img.onerror = () => resolve(null);
          img.src = `/Cartas/${file}`;
        })
      );

      const closePromises = closeFrames.map(file =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
          img.onerror = () => resolve(null);
          img.src = `/Cartas/${file}`;
        })
      );

      const [openResults, closeResults] = await Promise.all([
        Promise.all(openPromises),
        Promise.all(closePromises),
      ]);

      _openCache[themeKey]  = openResults;
      _closeCache[themeKey] = closeResults;
      imagesRef.current      = openResults;
      closeImagesRef.current = closeResults;

      if (!wasLoaded && !preload) {
        isLoadedRef.current = true;
        setIsLoaded(true);
      } else if (isCompleteRef.current && !preload) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const finalFrame = openResults[openResults.length - 1];
        if (finalFrame) drawCardFrame(ctx, finalFrame, CARD_WIDTH, CARD_HEIGHT);
      }
    };

    loadImages();
  }, [isDarkMode, preload]);

  // Draw first frame when loaded
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = getDpr();
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);
    const firstFrame = imagesRef.current[0];
    if (firstFrame) drawCardFrame(ctx, firstFrame, CARD_WIDTH, CARD_HEIGHT);
  }, [isLoaded]);

  // Open animation loop
  useEffect(() => {
    if (!isLoaded || !canStartAnimation || isClosing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = getDpr();
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const drawFrame = () => {
      if (isCompleteRef.current) {
        const finalFrame = imagesRef.current[totalFrames];
        if (finalFrame) drawCardFrame(ctx, finalFrame, CARD_WIDTH, CARD_HEIGHT);
        if (!isClosing) setShowNavIcons(true);
        return;
      }
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) drawCardFrame(ctx, frame, CARD_WIDTH, CARD_HEIGHT);
    };

    drawFrame();

    const handleVisibility = () => {
      if (!document.hidden) lastFrameTimeRef.current = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const animate = (timestamp) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= CARD_FRAME_DURATION) {
        lastFrameTimeRef.current = timestamp;

        if (!isCompleteRef.current) {
          if (currentFrameRef.current < totalFrames - 1) {
            currentFrameRef.current++;
          } else {
            isCompleteRef.current = true;
          }
          drawFrame();
        } else {
          drawFrame();
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoaded, canStartAnimation, totalFrames, isClosing]);

  // Close animation loop
  useEffect(() => {
    if (!isClosing || !isLoaded) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    closeFrameRef.current = 0;
    lastCloseFrameTimeRef.current = 0;
    canvas.style.transition = '';
    canvas.style.transform = '';
    const frames = closeImagesRef.current;

    const handleVisibility = () => {
      if (!document.hidden) lastCloseFrameTimeRef.current = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const animate = (timestamp) => {
      if (lastCloseFrameTimeRef.current === 0) {
        lastCloseFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - lastCloseFrameTimeRef.current;

      if (elapsed >= CARD_FRAME_DURATION) {
        lastCloseFrameTimeRef.current = timestamp;

        const frame = frames[closeFrameRef.current];
        if (frame) drawCardFrame(ctx, frame, CARD_WIDTH, CARD_HEIGHT);

        if (closeFrameRef.current < frames.length - 1) {
          closeFrameRef.current++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          {
            if (fromGrid) {
              // Quick scale-down + fade (200ms), then hand off to the
              // dorso bridge in ArlequinMaskSystem which shows a
              // grid-card-sized dorso before the deal animation starts.
              canvas.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in';
              setTimeout(() => {
                canvas.style.transform = 'translateZ(0) scale(0.1)';
                canvas.style.opacity = '0';
                setTimeout(() => onClose(), 200);
              }, 0);
            } else {
              setIsScalingDown(true);
              setTimeout(() => onClose(), 400);
            }
          }
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isClosing, isLoaded]);

  if (preload) return null;
  if (!isLoaded) return <div className="card-que-es-arlequin loading" />;

  return (
    <div className="card-que-es-arlequin">
      <button className={`card-close-btn${isHidingUI ? ' card-close-btn--hiding' : ''}`} onClick={handleClose} title="Cerrar">
        <img
          src={`/Cartas/arlequin_elemento_web_X_${themeSuffix === 'clear' ? 'clare' : themeSuffix}.avif`}
          alt="Cerrar"
          className="card-close-btn-img"
        />
      </button>

      <canvas
        ref={canvasRef}
        className={`card-canvas${isScalingDown ? ' card-canvas--exiting' : ''}${!isScalingDown && fromGrid ? ' card-canvas--open-from-collect' : ''}`}
      />

      {showNavIcons && (
        <div className="card-text-container">
          <div className={`card-text ${!isDarkMode ? 'card-text--clear' : ''}`}>
            {cardTexts[currentCardIndex].map((paragraph, index) => (
              <p key={index} className="card-text-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {showNavIcons && (
        <>
          <button
            className="card-nav-button card-nav-prev"
            onClick={handleNextCard}
            title="Página siguiente"
            disabled={isLastPage}
            style={{ opacity: isLastPage ? 0.3 : 1, cursor: isLastPage ? 'default' : 'pointer' }}
          >
            <img src="/Cartas/arlequin_baraja_A_pieza_avanzar_web.avif" alt="Adelante" />
          </button>

          <div className="card-title-container">
            <h2 className={`card-title ${!isDarkMode ? 'card-title--clear' : ''}`}>
              ¿Qué es Arlequín?
            </h2>
          </div>

          <button
            className="card-nav-button card-nav-next"
            onClick={handlePrevCard}
            title="Página anterior"
            disabled={currentCardIndex === 0}
            style={{ opacity: currentCardIndex === 0 ? 0.3 : 1, cursor: currentCardIndex === 0 ? 'default' : 'pointer' }}
          >
            <img src="/Cartas/arlequin_baraja_A_pieza_retroceder_web.avif" alt="Atrás" />
          </button>
        </>
      )}
    </div>
  );
}

export default CardQueEsArlequin;
