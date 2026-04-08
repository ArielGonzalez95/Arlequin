import { useEffect, useRef, useState } from 'react';
import './ThemeToggleStar.css';

const TOTAL_FRAMES = 191;
const FRAME_DURATION = 55;
const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;
const BUTTON_SIZE = 30;
const FRAME_PATH_CLEAR = '/estrellas/estrella_giro_clear_';
const FRAME_PATH_DARK = '/estrellas/estrella_giro_dark_';

function ThemeToggleStar({ isDarkMode, onToggle }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const animationRef = useRef(null);
  const currentFrameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Preload all star animation frames (both clear and dark versions)
  useEffect(() => {
    const loadImages = async () => {
      const clearPromises = [];
      const darkPromises = [];
      
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const frameNumber = String(i).padStart(5, '0');
        
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

  // Show tooltip on page load, hide after 10 seconds
  useEffect(() => {
    if (isLoaded) {
      setShowTooltip(true);
      
      // Hide after 10 seconds
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Animation loop
  useEffect(() => {
    if (!isLoaded) return;

    // Reset frame index when theme changes to ensure smooth transition
    currentFrameRef.current = 0;
    lastFrameTimeRef.current = 0;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get device pixel ratio for sharp rendering on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 58; // Match the CSS size
    
    // Set canvas internal resolution to match display size
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    
    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas on theme change
    ctx.clearRect(0, 0, displaySize, displaySize);

    const drawFrame = () => {
      // Select the correct frame set based on theme to maintain visual contrast
      // Light mode (light background): use dark star for contrast
      // Dark mode (dark background): use clear/light star for visibility
      const imageSet = isDarkMode ? imagesRef.current.clear : imagesRef.current.dark;
      const currentFrame = imageSet[currentFrameRef.current];
      
      if (currentFrame) {
        // Always clear before drawing to prevent overlap
        const starSize = displaySize + 2; // Slightly larger star for better balance
        ctx.clearRect(0, 0, displaySize, displaySize);
        ctx.drawImage(currentFrame, 0, 0, starSize, starSize);
      }
    };

    // Draw initial frame
    drawFrame();

    const animate = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= FRAME_DURATION) {
        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
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
  }, [isLoaded, isDarkMode]);

  const tooltipText = isDarkMode ? 'Modo claro' : 'Modo oscuro';

  return (
    <div className="theme-toggle-wrapper">
      <button 
        className={`theme-toggle ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
        onClick={onToggle}
        aria-label="Toggle theme"
      >
        <canvas ref={canvasRef} className="theme-toggle-canvas" />
      </button>
      
      {/* Tooltip - appears once on page load, stays 10 seconds, then disappears permanently */}
      {showTooltip && (
        <span className={`theme-tooltip ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
          {tooltipText}
        </span>
      )}
    </div>
  );
}

export default ThemeToggleStar;

