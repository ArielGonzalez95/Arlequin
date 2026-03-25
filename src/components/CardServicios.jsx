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
];

const CARD_FINAL_FRAME_CLEAR = '00012_arlequin_frente_clear_fija.avif';
const CARD_FINAL_FRAME_DARK   = '00012_arlequin_frente_dark_fija.avif';

const CARD_FRAME_DURATION = 40;
const CARD_WIDTH  = 550;
const CARD_HEIGHT = 680;

const _openCache  = {};
const _closeCache = {};

// ── 7 páginas de contenido ────────────────────────────────────────
const page1Lines = [
  { text: 'En Arlequín diseñamos y', indent: 0 },
  { text: 'desarrollamos páginas web', indent: 0 },
  { text: 'adaptadas a cada necesidad.', indent: 0 },
  { text: 'Nos especializamos en brindar', indent: 0 },
  { text: 'soluciones digitales claras,', indent: 0 },
  { text: 'funcionales y visualmente', indent: 0 },
  { text: 'atractivas.', indent: 0 },
  { text: 'Estas son algunas de las', indent: 0 },
  { text: 'páginas que podemos', indent: 0 },
  { text: 'crear para vos:', indent: 0 },
];

const page2Lines = [
  { text: 'Landing Page', diamond: true },
  { text: '(Página de aterrizaje)', centered: true },
  { text: '' },
  { text: 'Ideal para campañas,' },
  { text: 'lanzamientos, promociones' },
  { text: 'o un único servicio.' },
  { text: 'Rápida, directa y efectiva.' },
];

const page3Lines = [
  { text: 'Sitio personal o', diamond: true },
  { text: 'profesional', centered: true },
  { text: '' },
  { text: 'Mostrá quién sos, tu' },
  { text: 'experiencia, tu portfolio o' },
  { text: 'tus servicios como' },
  { text: 'freelancer, artista, médico,' },
  { text: 'etc.' },
];

const page4Lines = [
  { text: 'Página de turnos o', diamond: true },
  { text: 'reservas', centered: true },
  { text: '' },
  { text: 'Perfecta para peluquerías,' },
  { text: 'estudios, consultorios o' },
  { text: 'espacios de atención que' },
  { text: 'requieren gestión de citas.' },
];

const page5Lines = [
  { text: 'Sitio para negocios o', diamond: true },
  { text: 'emprendimientos', centered: true },
  { text: '' },
  { text: 'Mostrá tus productos o' },
  { text: 'servicios, sumá formularios' },
  { text: 'de contacto o consulta,' },
  { text: 'integrá redes sociales y' },
  { text: 'más.' },
];

const page6Lines = [
  { text: 'Sistemas de gestión', diamond: true },
  { text: 'a medida', centered: true },
  { text: '' },
  { text: 'Creamos plataformas para' },
  { text: 'administrar alquileres,' },
  { text: 'turnos, pagos o lo que' },
  { text: 'necesites, con acceso para' },
  { text: 'usuarios y administradores.' },
];

const page7Lines = [
  { text: 'Productos digitales', diamond: true },
  { text: 'propios (próximamente)', centered: true },
  { text: '' },
  { text: 'Plataformas listas para usar,' },
  { text: 'creadas por Arlequín,' },
  { text: 'disponibles con suscripción' },
  { text: 'mensual o anual.' },
];

const cardTexts = [page1Lines, page2Lines, page3Lines, page4Lines, page5Lines, page6Lines, page7Lines];

// ─────────────────────────────────────────────────────────────────
function CardServicios({ isDarkMode, onClose, fromGrid = false, preload = false }) {
  const canvasRef          = useRef(null);
  const imagesRef          = useRef([]);
  const closeImagesRef     = useRef([]);
  const animationRef       = useRef(null);
  const currentFrameRef    = useRef(0);
  const lastFrameTimeRef   = useRef(0);
  const isCompleteRef      = useRef(false);
  const closeFrameRef      = useRef(0);
  const lastCloseFrameTimeRef = useRef(0);
  const isLoadedRef        = useRef(false);

  const [isLoaded,          setIsLoaded]          = useState(false);
  const [canStartAnimation, setCanStartAnimation] = useState(false);
  const [showNavIcons,      setShowNavIcons]      = useState(false);
  const [currentCardIndex,  setCurrentCardIndex]  = useState(0);
  const [isClosing,         setIsClosing]         = useState(false);
  const [isScalingDown,     setIsScalingDown]     = useState(false);

  const themeSuffix  = isDarkMode ? 'dark' : 'clear';
  const cardFrames   = isDarkMode ? CARD_FRAMES_DARK   : CARD_FRAMES_CLEAR;
  const closeFrames  = isDarkMode ? CLOSE_FRAMES_DARK  : CLOSE_FRAMES_CLEAR;
  const cardFinalFrame = isDarkMode ? CARD_FINAL_FRAME_DARK : CARD_FINAL_FRAME_CLEAR;
  const totalFrames  = cardFrames.length;
  const isLastPage   = currentCardIndex === cardTexts.length - 1;

  const handleNextCard = () => {
    if (currentCardIndex < cardTexts.length - 1) setCurrentCardIndex(p => p + 1);
  };
  const handlePrevCard = () => {
    if (currentCardIndex > 0) setCurrentCardIndex(p => p - 1);
  };
  const handleClose = () => {
    if (isClosing) return;
    setShowNavIcons(false);
    setIsClosing(true);
  };

  // Start open animation
  useEffect(() => {
    if (!isLoaded) return;
    if (fromGrid) {
      setCanStartAnimation(true);
    } else {
      const t = setTimeout(() => setCanStartAnimation(true), 600);
      return () => clearTimeout(t);
    }
  }, [isLoaded, fromGrid]);

  // Preload all frames
  // On first load: triggers animation start via setIsLoaded(true)
  // On theme change: silently swaps image buffers without resetting animation state
  useEffect(() => {
    const wasLoaded = isLoadedRef.current;

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
          img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
          img.onerror = () => resolve(null);
          img.src = `/Cartas/${file}`;
        })
      );
      const closePromises = closeFrames.map(file =>
        new Promise(resolve => {
          const img = new Image();
          img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
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

  // Draw first frame when loaded
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);
    const first = imagesRef.current[0];
    if (first) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(first, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
  }, [isLoaded]);

  // Open animation loop
  useEffect(() => {
    if (!isLoaded || !canStartAnimation || isClosing) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const drawFrame = () => {
      if (isCompleteRef.current) {
        const final = imagesRef.current[totalFrames];
        if (final) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(final, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
        setShowNavIcons(true);
        return;
      }
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
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
    const ctx    = canvas.getContext('2d');
    closeFrameRef.current      = 0;
    lastCloseFrameTimeRef.current = 0;
    const frames = closeImagesRef.current;

    const animate = (timestamp) => {
      if (timestamp - lastCloseFrameTimeRef.current >= CARD_FRAME_DURATION) {
        const frame = frames[closeFrameRef.current];
        if (frame) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
        lastCloseFrameTimeRef.current += CARD_FRAME_DURATION;
        if (closeFrameRef.current < frames.length - 1) {
          closeFrameRef.current++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const frame0 = imagesRef.current[0];
          if (frame0) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame0, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
          setIsScalingDown(true);
          setTimeout(() => onClose(), 400);
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
      <button className="card-close-btn" onClick={handleClose} title="Cerrar">
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
            {cardTexts[currentCardIndex].map((line, i) => (
              <div
                key={i}
                className="card-text-line"
                style={{
                  paddingLeft: line.centered ? '22px' : undefined,
                  height: line.text === '' ? '14px' : undefined,
                }}
              >
                {line.diamond && (
                  <span style={{
                    display: 'inline-block',
                    width: '22px',
                    color: 'rgba(220, 50, 50, 0.68)',
                  }}>♦</span>
                )}
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
            title="Página siguiente"
            disabled={isLastPage}
            style={{ opacity: isLastPage ? 0.3 : 1, cursor: isLastPage ? 'default' : 'pointer' }}
          >
            <img src="/Cartas/arlequin_baraja_A_pieza_avanzar_web.avif" alt="Adelante" />
          </button>

          <div className="card-title-container">
            <h2 className={`card-title ${!isDarkMode ? 'card-title--clear' : ''}`}>
              Servicios
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

export default CardServicios;
