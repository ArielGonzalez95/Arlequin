import { useEffect, useRef, useState, useCallback } from 'react';
import './BackgroundAnimation.css';

const TOTAL_FRAMES = 191;
const FRAME_DURATION = 55; // ~18 FPS (slower, more ambient)
const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;
const MIN_STAR_SIZE = 60;
const MAX_STAR_SIZE = 120;
const FRAME_PATH_CLEAR = '/estrellas/estrella_giro_clear_';
const FRAME_PATH_DARK = '/estrellas/estrella_giro_dark_';

// Fixed star positions as [x%, y%] of viewport.
// Outer ring hugs the edges; inner diagonals fill the gap without reaching the logo/mask.
const STAR_POSITIONS_DESKTOP = [
  // Top edge
  [12,  8], [35,  5], [50,  6], [65,  5], [88,  8],
  // Left & right edges
  [ 4, 22], [96, 22],
  [ 4, 50], [96, 50],
  [ 4, 78], [96, 78],
  // Bottom edge
  [12, 92], [35, 95], [65, 95], [88, 92],
  // Inner diagonals — closer to center but clear of the logo (~250px radius)
  [28, 28], [72, 28],
  [28, 72], [72, 72],
];

// Mobile: avoid the button (top-left ~10% zone) and the logo (center circle).
// Stars live in the top-right corner, side edges, and bottom strip — 10 total.
const STAR_POSITIONS_MOBILE = [
  // Top — right side only (button is top-left)
  [65,  5], [90,  7],
  // Side edges (clear of logo center)
  [ 4, 38], [96, 32],
  [ 4, 62], [96, 68],
  // Bottom strip
  [ 8, 90], [35, 94],
  [65, 94], [92, 90],
];

function BackgroundAnimation({ isDarkMode = true }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const animationRef = useRef(null);
  const starsRef = useRef([]);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Build the star list from fixed percentage positions
  const generateStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width  / dpr;
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

  // Preload all images (both clear and dark versions)
  useEffect(() => {
    const loadImages = async () => {
      const clearPromises = [];
      const darkPromises = [];
      
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const frameNumber = String(i).padStart(5, '0');
        
        // Load clear version
        const clearPromise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            const placeholder = document.createElement('canvas');
            placeholder.width = FRAME_WIDTH;
            placeholder.height = FRAME_HEIGHT;
            resolve(placeholder);
          };
          img.src = `${FRAME_PATH_CLEAR}${frameNumber}.avif`;
        });
        clearPromises.push(clearPromise);

        // Load dark version
        const darkPromise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            const placeholder = document.createElement('canvas');
            placeholder.width = FRAME_WIDTH;
            placeholder.height = FRAME_HEIGHT;
            resolve(placeholder);
          };
          img.src = `${FRAME_PATH_DARK}${frameNumber}.avif`;
        });
        darkPromises.push(darkPromise);
      }

      const [clearImages, darkImages] = await Promise.all([
        Promise.all(clearPromises),
        Promise.all(darkPromises)
      ]);
      
      imagesRef.current = { clear: clearImages, dark: darkImages };
      setIsLoaded(true);
    };

    loadImages();
  }, []);

  // Handle canvas resize and regenerate stars
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        generateStars();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [generateStars]);

  // Reset frame timer when screen wakes up to prevent timestamp jump
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) lastFrameTimeRef.current = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Animation loop with Canvas - random star positions
  useEffect(() => {
    if (!isLoaded || imagesRef.current.clear.length === 0) return;

    const canvas = canvasRef.current;
    // alpha:false eliminates transparency compositing cost — safe because
    // drawStars always fills the entire canvas with a solid background color.
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

      const currentFrameIndex = currentFrameRef.current;
      const stars = starsRef.current;
      // Select image set based on theme
      const imageSet = isDarkMode ? imagesRef.current.clear : imagesRef.current.dark;

      // Draw each star at its random position
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        // Each star has its own frame offset for variety
        const frameIndex = (currentFrameIndex + star.frameOffset) % imageSet.length;
        const currentFrame = imageSet[frameIndex];
        
        if (currentFrame) {
          ctx.drawImage(
            currentFrame, 
            star.x, 
            star.y,
            star.size,
            star.size
          );
        }
      }
    };

    const animate = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
        lastFrameTimeRef.current = timestamp;
        drawStars();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Draw first frame immediately
    drawStars();
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, isDarkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="background-canvas"
    />
  );
}

export default BackgroundAnimation;

