import { useEffect, useRef, useState } from 'react';
import './ThemeToggleStar.css';

const TOTAL_FRAMES = 191;
const FRAME_DURATION = 55;
const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;
const FRAME_PATH_CLEAR = '/estrellas/estrella_giro_clear_';
const FRAME_PATH_DARK = '/estrellas/estrella_giro_dark_';

// Module-level cache — shares loaded images with BackgroundAnimation if mounted first.
const _starCache = { clear: null, dark: null };

function ThemeToggleStar({ isDarkMode, onToggle, isLowEnd = false }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const animationRef = useRef(null);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(
    () => !!((_starCache.clear?.length) && (_starCache.dark?.length))
  );
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (_starCache.clear?.length && _starCache.dark?.length) {
      imagesRef.current = { clear: _starCache.clear, dark: _starCache.dark };
      setIsLoaded(true);
      return;
    }

    const loadSet = (basePath) =>
      Promise.all(
        Array.from({ length: TOTAL_FRAMES }, (_, i) => {
          const num = String(i).padStart(5, '0');
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
              img.decode().then(() => resolve(img)).catch(() => resolve(img));
            img.onerror = () => {
              const ph = document.createElement('canvas');
              ph.width = FRAME_WIDTH;
              ph.height = FRAME_HEIGHT;
              resolve(ph);
            };
            img.src = `${basePath}${num}.avif`;
          });
        })
      );

    Promise.all([loadSet(FRAME_PATH_CLEAR), loadSet(FRAME_PATH_DARK)]).then(
      ([clearImages, darkImages]) => {
        _starCache.clear = clearImages;
        _starCache.dark = darkImages;
        imagesRef.current = { clear: clearImages, dark: darkImages };
        setIsLoaded(true);
      }
    );
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    currentFrameRef.current = 0;
    lastFrameTimeRef.current = 0;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 58;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, displaySize, displaySize);

    const drawFrame = () => {
      const imageSet = isDarkMode ? imagesRef.current.clear : imagesRef.current.dark;
      const frame = imageSet[currentFrameRef.current];
      if (frame) {
        ctx.clearRect(0, 0, displaySize, displaySize);
        ctx.drawImage(frame, 0, 0, displaySize + 2, displaySize + 2);
      }
    };

    drawFrame();

    if (isLowEnd) return;

    const handleVisibility = () => {
      if (!document.hidden) lastFrameTimeRef.current = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const animate = (timestamp) => {
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;
      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
        lastFrameTimeRef.current = timestamp;
        drawFrame();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isLoaded, isDarkMode, isLowEnd]);

  const tooltipText = isDarkMode ? 'Modo claro' : 'Modo oscuro';

  return (
    <div className="theme-toggle-wrapper">
      <button
        className={`theme-toggle ${isDarkMode ? 'dark-mode' : 'light-mode'}${isLowEnd ? ' no-pulse' : ''}`}
        onClick={onToggle}
        aria-label="Toggle theme"
      >
        <canvas ref={canvasRef} className="theme-toggle-canvas" />
      </button>
      {showTooltip && (
        <span className={`theme-tooltip ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          {tooltipText}
        </span>
      )}
    </div>
  );
}

export default ThemeToggleStar;
