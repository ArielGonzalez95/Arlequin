import { useEffect, useRef, useState, useCallback } from 'react';
import './BackgroundAnimation.css';

const TOTAL_FRAMES = 191;
const FRAME_DURATION = 55; // ~18 FPS
const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;
const MIN_STAR_SIZE = 60;
const MAX_STAR_SIZE = 120;
const FRAME_PATH_CLEAR = '/estrellas/estrella_giro_clear_';
const FRAME_PATH_DARK = '/estrellas/estrella_giro_dark_';

// Module-level cache — survives hot-reload remounts.
const _starCache = { clear: null, dark: null };

const STAR_POSITIONS_DESKTOP = [
  [12,  8], [35,  5], [50,  6], [65,  5], [88,  8],
  [ 4, 22], [96, 22],
  [ 4, 50], [96, 50],
  [ 4, 78], [96, 78],
  [12, 92], [35, 95], [65, 95], [88, 92],
  [28, 28], [72, 28],
  [28, 72], [72, 72],
];

const STAR_POSITIONS_MOBILE = [
  [65,  5], [90,  7],
  [ 4, 38], [96, 32],
  [ 4, 62], [96, 68],
  [ 8, 90], [35, 94],
  [65, 94], [92, 90],
];

function BackgroundAnimation({ isDarkMode = true, isLowEnd = false, prefersReducedMotion = false }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const animationRef = useRef(null);
  const starsRef = useRef([]);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(
    () => !!((_starCache.clear?.length) && (_starCache.dark?.length))
  );

  const generateStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const positions = isMobile ? STAR_POSITIONS_MOBILE : STAR_POSITIONS_DESKTOP;
    starsRef.current = positions.map(([xPct, yPct]) => ({
      x: (xPct / 100) * w,
      y: (yPct / 100) * h,
      size: MIN_STAR_SIZE + Math.random() * (MAX_STAR_SIZE - MIN_STAR_SIZE),
      frameOffset: Math.floor(Math.random() * TOTAL_FRAMES),
    }));
  }, []);

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
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      generateStars();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generateStars]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) lastFrameTimeRef.current = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!isLoaded || imagesRef.current.clear.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const drawStars = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const logicalW = canvas.width / dpr;
      const logicalH = canvas.height / dpr;
      ctx.fillStyle = isDarkMode ? '#000000' : '#ffffff';
      ctx.fillRect(0, 0, logicalW, logicalH);

      const idx = currentFrameRef.current;
      const imageSet = isDarkMode ? imagesRef.current.clear : imagesRef.current.dark;
      const stars = starsRef.current;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const frame = imageSet[(idx + star.frameOffset) % imageSet.length];
        if (frame) ctx.drawImage(frame, star.x, star.y, star.size, star.size);
      }
    };

    // Always draw one frame (static bg on low-end / reduced-motion)
    drawStars();

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isLowEnd || (isMobile && prefersReducedMotion)) return;

    const animate = (timestamp) => {
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;
      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
        lastFrameTimeRef.current = timestamp; // assign current tick — no jitter accumulation
        drawStars();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isLoaded, isDarkMode, isLowEnd, prefersReducedMotion]);

  return <canvas ref={canvasRef} className="background-canvas" />;
}

export default BackgroundAnimation;
