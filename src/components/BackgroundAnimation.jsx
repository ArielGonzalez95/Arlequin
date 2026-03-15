import { useEffect, useRef, useState, useCallback } from 'react';
import './BackgroundAnimation.css';

const TOTAL_FRAMES = 191;
const FRAME_DURATION = 55; // ~18 FPS (slower, more ambient)
const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;
const MIN_STAR_SIZE = 60;
const MAX_STAR_SIZE = 120;
const STAR_COUNT = 20;
const SAFE_ZONE_RADIUS = 80; // Protected area around button
const BUTTON_POSITION = { x: 45, y: 45 }; // Button center position
const FRAME_PATH_CLEAR = '/estrellas/estrella_giro_clear_';
const FRAME_PATH_DARK = '/estrellas/estrella_giro_dark_';

function BackgroundAnimation({ isDarkMode = true }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const animationRef = useRef(null);
  const starsRef = useRef([]);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate distance between two points
  const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Generate random star positions avoiding the button area
  const generateStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    // Generate fixed number of stars avoiding button area
    const stars = [];
    let attempts = 0;
    const maxAttempts = 1000;

    while (stars.length < STAR_COUNT && attempts < maxAttempts) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      
      // Check if star is outside the safe zone around the button
      const distanceToButton = getDistance(x, y, BUTTON_POSITION.x, BUTTON_POSITION.y);
      
      if (distanceToButton > SAFE_ZONE_RADIUS) {
        stars.push({
          x,
          y,
          size: MIN_STAR_SIZE + Math.random() * (MAX_STAR_SIZE - MIN_STAR_SIZE),
          frameOffset: Math.floor(Math.random() * TOTAL_FRAMES)
        });
      }
      
      attempts++;
    }

    starsRef.current = stars;
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

  // Animation loop with Canvas - random star positions
  useEffect(() => {
    if (!isLoaded || imagesRef.current.clear.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

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

