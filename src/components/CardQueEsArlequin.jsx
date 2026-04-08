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

const CARD_FRAME_DURATION = 40;
const CARD_WIDTH = 550;
const CARD_HEIGHT = 680;

// Module-level cache — persists across mounts so re-opens are instant
const _openCache  = {};
const _closeCache = {};

const page3Lines = [
  { text: '', indent: 0 },
  { text: '', indent: 0 },
  { text: 'Además, desarrollamos', indent: 0 },
  { text: 'productos propios, como,', indent: 0 },
  { text: 'sistemas de gestión y', indent: 0 },
  { text: 'páginas con funcionalidades', indent: 0 },
  { text: 'específicas, que podrán ser', indent: 0 },
  { text: 'utilizados por otros a través', indent: 0 },
  { text: 'de un modelo de suscripción.', indent: 0 },
  { text: '(PRÓXIMAMENTE)', indent: 12 },
];

const page2Lines = [
  { text: '', indent: 0 },
  { text: '', indent: 0 },
  { text: 'Nos especializamos en', indent: 0 },
  { text: 'experiencia de usuario', indent: 0 },
  { text: '(UX), diseño visual (UI)', indent: 0 },
  { text: 'y programación a medida.', indent: 0 },
  { text: 'Analizamos las necesidades', indent: 0 },
  { text: 'de cada cliente y', indent: 0 },
  { text: 'construimos plataformas', indent: 0 },
  { text: 'claras, intuitivas y efectivas.', indent: 0 },
];

const page1Lines = [
  { text: 'Arlequín es una marca', indent: 0 },
  { text: 'enfocada en brindar', indent: 0 },
  { text: 'soluciones digitales.', indent: 0 },
  { text: 'Diseñamos y desarrollamos', indent: 0 },
  { text: 'sitios web funcionales,', indent: 0 },
  { text: 'adaptables a todo tipo de', indent: 0 },
  { text: 'dispositivos, pensados tanto', indent: 0 },
  { text: 'para el cliente final como', indent: 0 },
  { text: 'para quien administra el', indent: 0 },
  { text: 'negocio.', indent: 0 },
];

const cardTexts = [page1Lines, page2Lines, page3Lines];

function CardQueEsArlequin({ isDarkMode, onClose, onCloseStart, onGoToContact, fromGrid = false, preload = false }) {
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
  const goingToContactRef = useRef(false);

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
    } else if (onGoToContact) {
      goingToContactRef.current = true;
      setShowNavIcons(false);
      setIsClosing(true);
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
          if (finalFrame) {
            ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
            ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
          }
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
        if (finalFrame) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
      }
    };

    loadImages();
  }, [isDarkMode, preload]);

  // Draw first frame when loaded
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);
    const firstFrame = imagesRef.current[0];
    if (firstFrame) {
      ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
      ctx.drawImage(firstFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
  }, [isLoaded]);

  // Open animation loop
  useEffect(() => {
    if (!isLoaded || !canStartAnimation || isClosing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const drawFrame = () => {
      if (isCompleteRef.current) {
        const finalFrame = imagesRef.current[totalFrames];
        if (finalFrame) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
        if (!isClosing) setShowNavIcons(true);
        return;
      }
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) {
        ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
        ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      }
    };

    drawFrame();

    const animate = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= CARD_FRAME_DURATION) {
        if (currentFrameRef.current < totalFrames - 1) {
          currentFrameRef.current++;
        } else {
          isCompleteRef.current = true;
        }
        lastFrameTimeRef.current += CARD_FRAME_DURATION;
        drawFrame();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
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

    const animate = (timestamp) => {
      if (lastCloseFrameTimeRef.current === 0) {
        lastCloseFrameTimeRef.current = timestamp - CARD_FRAME_DURATION;
      }
      if (timestamp - lastCloseFrameTimeRef.current >= CARD_FRAME_DURATION) {
        const frame = frames[closeFrameRef.current];
        if (frame) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
        lastCloseFrameTimeRef.current += CARD_FRAME_DURATION;
        if (closeFrameRef.current < frames.length - 1) {
          closeFrameRef.current++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          if (goingToContactRef.current) {
            goingToContactRef.current = false;
            if (onGoToContact) onGoToContact();
          } else {
            // Last frame is 00000 — scale down instantly then hand off to grid
            const _tw = window.innerWidth <= 500 ? window.innerWidth * 0.85 : 390; const _sx = (_tw / CARD_WIDTH).toFixed(4); const _sy = ((_tw * 4 / 3) / CARD_HEIGHT).toFixed(4); canvas.style.transform = `scaleX(${_sx}) scaleY(${_sy})`;
            if (fromGrid) {
              setTimeout(() => onClose(), 150);
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
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
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
        className={`card-canvas${isScalingDown ? ' card-canvas--exiting' : ''}`}
        style={!isScalingDown && fromGrid ? { animation: 'none' } : undefined}
      />

      {showNavIcons && (
        <div className="card-text-container">
          <div className={`card-text ${!isDarkMode ? 'card-text--clear' : ''}`}>
            {cardTexts[currentCardIndex].map((line, index) => (
              <div key={index} className="card-text-line" style={{ marginRight: line.indent + 'px' }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {showNavIcons && (
        <>
          <button
            className="card-nav-button card-nav-prev"
            onClick={handleNextCard}
            title={isLastPage ? 'Contacto' : 'Página siguiente'}
            style={{ opacity: 1, cursor: 'pointer' }}
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
