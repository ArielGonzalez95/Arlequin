import { useState, useEffect, useRef } from 'react';
import './CardStage.css';

// Card animation frame constants - Clear theme (frames 00000 to 00012)
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

// Card animation frame constants - Dark theme (frames 00000 to 00012)
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

const CARD_FINAL_FRAME_CLEAR = '00012_arlequin_frente_clear_fija.avif';
const CARD_FINAL_FRAME_DARK = '00012_arlequin_frente_dark_fija.avif';

const CARD_FRAME_DURATION = 25;
const CARD_WIDTH = 550;
const CARD_HEIGHT = 680;

// Final frame dimensions (separate from canvas/animation)
const FINAL_FRAME_WIDTH = 350;
const FINAL_FRAME_HEIGHT = 480;

// Text content for each page - each line is an array element
// Page 1 (original page 3) - 8 lines
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

// Page 2 - 8 lines
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

// Page 3 (original page 1) - 10 lines
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

function CardStage({ onClose, isDarkMode }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const animationRef = useRef(null);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const isCompleteRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canStartAnimation, setCanStartAnimation] = useState(false);
  const [showNavIcons, setShowNavIcons] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const themeSuffix = isDarkMode ? 'dark' : 'clear';
  const cardFrames = isDarkMode ? CARD_FRAMES_DARK : CARD_FRAMES_CLEAR;
  const cardFinalFrame = isDarkMode ? CARD_FINAL_FRAME_DARK : CARD_FINAL_FRAME_CLEAR;
  const totalFrames = cardFrames.length;
  const isLastPage = currentCardIndex === cardTexts.length - 1;

  // Handle next card navigation
  const handleNextCard = () => {
    if (currentCardIndex < cardTexts.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  // Handle previous card navigation
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  // Delay card animation until scale animation completes
  useEffect(() => {
    if (isLoaded) {
      // Wait for scale animation to complete (600ms)
      const timer = setTimeout(() => {
        setCanStartAnimation(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Preload card images
  useEffect(() => {
    const loadImages = async () => {
      const promises = [];
      
      for (const frameFile of cardFrames) {
        const promise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ file: frameFile, img, success: true });
          img.onerror = () => resolve({ file: frameFile, img: null, success: false });
          img.src = `/Cartas/${frameFile}`;
        });
        promises.push(promise);
      }

      // Also load final frame
      const finalPromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ file: cardFinalFrame, img, success: true });
        img.onerror = () => resolve({ file: cardFinalFrame, img: null, success: false });
        img.src = `/Cartas/${cardFinalFrame}`;
      });
      promises.push(finalPromise);

      const results = await Promise.all(promises);
      
      // Store all frames (including final at the end)
      imagesRef.current = results.map(r => r.success ? r.img : null);
      setIsLoaded(true);
    };

    loadImages();
  }, [cardFrames, cardFinalFrame]);

  // Initialize canvas and show first frame when loaded
  useEffect(() => {
    if (!isLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    // Draw first frame (card back) immediately
    const firstFrame = imagesRef.current[0];
    if (firstFrame) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(firstFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
  }, [isLoaded]);

  // Animation loop
  useEffect(() => {
    if (!isLoaded || !canStartAnimation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const drawFrame = () => {
      // If complete, draw final frame with same dimensions as animation
      if (isCompleteRef.current) {
        const finalFrame = imagesRef.current[totalFrames];
        if (finalFrame) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
        // Show navigation icons when animation is complete
        setShowNavIcons(true);
        return;
      }

      // Draw current animation frame
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
      }
    };

    // Draw initial frame
    drawFrame();

    const animate = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= CARD_FRAME_DURATION) {
        if (currentFrameRef.current < totalFrames - 1) {
          currentFrameRef.current++;
        } else {
          isCompleteRef.current = true;
        }
        lastFrameTimeRef.current = timestamp;
        drawFrame();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, canStartAnimation, totalFrames]);

  return (
    <div className="card-stage">
      <button className="close-btn" onClick={onClose} title="Cerrar">
        <img 
          src={`/Cartas/arlequin_elemento_web_X_${themeSuffix === 'clear' ? 'clare' : themeSuffix}.avif`} 
          alt="Cerrar"
          className="close-btn-img"
        />
      </button>
      <canvas ref={canvasRef} className="card-canvas" />
      
      {/* Card text content */}
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
      
      {/* Navigation icons shown when animation is complete */}
      {showNavIcons && (
        <>
          {/* Back button (at top) - goes to next page */}
          <button 
            className="card-nav-button card-nav-prev" 
            onClick={handleNextCard}
            title="Página siguiente"
            disabled={isLastPage}
            style={{ opacity: isLastPage ? 0.3 : 1, cursor: isLastPage ? 'default' : 'pointer' }}
          >
            <img 
              src={`/Cartas/arlequin_baraja_A_pieza_avanzar_web.avif`} 
              alt="Adelante"
            />
          </button>
          
          {/* Title "¿QUÉ ES ARLEQUÍN?" after the advance button */}
          <div className="card-title-container">
            <h2 className={`card-title ${!isDarkMode ? 'card-title--clear' : ''}`}>
              ¿Qué es Arlequín?
            </h2>
          </div>
          
          {/* Next button (at bottom) - goes to previous page */}
          <button 
            className="card-nav-button card-nav-next" 
            onClick={handlePrevCard}
            title="Página anterior"
            disabled={currentCardIndex === 0}
            style={{ opacity: currentCardIndex === 0 ? 0.3 : 1, cursor: currentCardIndex === 0 ? 'default' : 'pointer' }}
          >
            <img 
              src={`/Cartas/arlequin_baraja_A_pieza_retroceder_web.avif`} 
              alt="Atrás"
            />
          </button>
        </>
      )}
    </div>
  );
}

export default CardStage;

