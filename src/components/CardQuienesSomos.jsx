import { useState, useEffect, useRef } from 'react';
import './CardQueEsArlequin.css';
import './CardQuienesSomos.css';

// Dark mode: dorso_dark + frente_dark (todo dark)
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

// Clear mode: dorso_clear + frente_clear
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

const CARD_FINAL_FRAME_DARK  = '00012_arlequin_frente_dark_fija.avif';
const CARD_FINAL_FRAME_CLEAR = '00012_arlequin_frente_clear_fija.avif';

// Close animation: frente → dorso (theme-matched)
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

const CARD_FRAME_DURATION = 25;
const CARD_WIDTH = 550;
const CARD_HEIGHT = 680;

const _openCache  = {};
const _closeCache = {};

// 4 pages: 0-1 photos, 2-3 text
const PAGES = [
  {
    type: 'image',
    src: '/Cartas/arlequin_quienes_somos_lucas_web.avif',
    alt: 'Lucas',
    name: 'LUCAS REMENTERIA',
    role: 'Creativo y analítico',
    title: 'El diseñador',
    emoji: '🧠',
  },
  {
    type: 'image',
    src: '/Cartas/arlequin_quienes_somos_ariel.avif',
    alt: 'Ariel',
    name: 'Ariel González',
    role: 'Lógico y preciso',
    title: 'El programador',
    emoji: '🫀',
  },
  {
    type: 'text',
    lines: [
      { text: 'Traé tu idea,', indent: 0 },
      { text: 'tu diamante en bruto.', indent: 0 },
      { text: 'Nosotros lo pulimos', indent: 0 },
      { text: 'para hacerlo brillar.', indent: 0 },
      { text: '', indent: 0 },
      { text: '♦️  ✨', indent: 0 },
    ],
  },
];

function CardQuienesSomos({ isDarkMode, onClose, onCloseStart, fromGrid = false, preload = false }) {
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
  const [showContent, setShowContent] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isHidingUI, setIsHidingUI] = useState(false);
  const [isScalingDown, setIsScalingDown] = useState(false);

  // Animation frames follow the theme; fixed final frame is always dark
  const cardFrames     = isDarkMode ? CARD_FRAMES_DARK : CARD_FRAMES_CLEAR;
  const cardFinalFrame = CARD_FINAL_FRAME_DARK;
  const totalFrames    = cardFrames.length;
  const currentPage = PAGES[currentPageIndex];
  const isLastPage = currentPageIndex === PAGES.length - 1;

  const handleNextPage = () => {
    if (currentPageIndex < PAGES.length - 1) setCurrentPageIndex(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
  };

  const handleClose = () => {
    if (isClosing || isHidingUI) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsHidingUI(true);
    setShowContent(false);
    if (onCloseStart) onCloseStart();
    setTimeout(() => {
      setIsClosing(true);
    }, 350);
  };

  // Start open animation: immediate if fromGrid, delayed otherwise
  useEffect(() => {
    if (!isLoaded) return;
    if (fromGrid) {
      setCanStartAnimation(true);
    } else {
      const timer = setTimeout(() => setCanStartAnimation(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, fromGrid]);

  // Preload open + close frames
  // On first load: triggers animation start via setIsLoaded(true)
  // On theme change: silently swaps image buffers without resetting animation state
  useEffect(() => {
    const wasLoaded = isLoadedRef.current;
    const themeCloseFrames = isDarkMode ? CLOSE_FRAMES_DARK : CLOSE_FRAMES_CLEAR;

    const loadImages = async () => {
      const themeKey = isDarkMode ? 'dark' : 'clear';

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

      const closePromises = themeCloseFrames.map(file =>
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

      _openCache[themeKey]   = openResults;
      _closeCache[themeKey]  = closeResults;
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

  // Draw first frame
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
        if (!isClosing) setShowContent(true);
        return;
      }
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) {
        ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
        ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      }
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
        if (frame) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }

        if (closeFrameRef.current < frames.length - 1) {
          closeFrameRef.current++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          if (fromGrid) {
            // Fade canvas out and fire onClose immediately — the parent keeps
            // this component in the DOM (linger) while CardDealAnimation mounts
            // behind it, so the deal starts under the fading canvas with no gap.
            canvas.style.transition = 'opacity 0.3s ease-out';
            canvas.style.opacity = '0';
            onClose();
          } else {
            setIsScalingDown(true);
            setTimeout(() => onClose(), 400);
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
          src={`/Cartas/arlequin_elemento_web_X_${isDarkMode ? 'dark' : 'clare'}.avif`}
          alt="Cerrar"
          className="card-close-btn-img"
        />
      </button>

      <canvas
        ref={canvasRef}
        className={`card-canvas${isScalingDown ? ' card-canvas--exiting' : ''}`}
        style={{ ...(!isScalingDown && fromGrid ? { animation: 'none' } : {}), position: 'relative', zIndex: 1 }}
      />

      {showContent && (
        <>
          {/* Title - always white (card background is always dark) */}
          <div className="card-title-container">
            <h2 className="card-title">
              ¿Quiénes somos?
            </h2>
          </div>

          {/* Page content */}
          {currentPage.type === 'image' ? (
            <>
              <div className="quienes-somos-photo-wrapper">
                <img
                  src={currentPage.src}
                  alt={currentPage.alt}
                  className="quienes-somos-photo"
                />
              </div>
              <div
                className="quienes-somos-caption"
                style={currentPageIndex === 1 ? { top: '395px' } : undefined}
              >
                <p
                  className="quienes-somos-name"
                  style={currentPageIndex === 1 ? { fontSize: '27px' } : undefined}
                >
                  {currentPage.name}
                </p>
                <p className="quienes-somos-role">{currentPage.role}</p>
                <p className="quienes-somos-title">{currentPage.title}</p>
                {currentPage.emoji && <p className="quienes-somos-emoji">{currentPage.emoji}</p>}
              </div>
            </>
          ) : (
            <div className="card-text-container">
              {/* Always white text since card background is always dark */}
              <div className="card-text quienes-somos-card-text">
                {currentPage.lines.map((line, index) => (
                  <div key={index} className="card-text-line" style={{ marginRight: line.indent + 'px' }}>
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="card-nav-button card-nav-prev"
            onClick={handleNextPage}
            title="Página siguiente"
            disabled={isLastPage}
            style={{ opacity: isLastPage ? 0.3 : 1, cursor: isLastPage ? 'default' : 'pointer' }}
          >
            <img src="/Cartas/arlequin_baraja_A_pieza_avanzar_web.avif" alt="Adelante" />
          </button>

          <button
            className="card-nav-button card-nav-next"
            onClick={handlePrevPage}
            title="Página anterior"
            disabled={currentPageIndex === 0}
            style={{ opacity: currentPageIndex === 0 ? 0.3 : 1, cursor: currentPageIndex === 0 ? 'default' : 'pointer' }}
          >
            <img src="/Cartas/arlequin_baraja_A_pieza_retroceder_web.avif" alt="Atrás" />
          </button>
        </>
      )}
    </div>
  );
}

export default CardQuienesSomos;
