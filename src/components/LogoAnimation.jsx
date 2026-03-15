import { useEffect, useRef, useState, useCallback } from 'react';
import './LogoAnimation.css';

// Configurable logo size
const LOGO_SIZE = 500;

// Default card size for arlequin animation
const DEFAULT_CARD_WIDTH = 430;
const DEFAULT_CARD_HEIGHT = 680;

// Animation frame configuration
const IDLE_FRAME = 0;
const OPENING_END_FRAME = 12;
const LOOP_START_FRAME = 13;
const LOOP_END_FRAME = 95;

// Frame durations for different states (ms per frame)
const OPENING_FRAME_DURATION = 35;
const LOOP_FRAME_DURATION = 55;
const CLOSING_FRAME_DURATION = 35;

const FRAME_WIDTH = 650;
const FRAME_HEIGHT = 650;

// Arlequin animation configuration
const ARLEQUIN_FRAME_DURATION = 60;

// Explicit frame sequence for arlequin animation (dark mode)
const ARLEQUIN_FRAMES_DARK = [
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

const ARLEQUIN_FINAL_FRAME_DARK = '00012_arlequin_frente_dark.avif';

// Explicit frame sequence for arlequin animation (clear mode)
const ARLEQUIN_FRAMES_CLEAR = [
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

const ARLEQUIN_FINAL_FRAME_CLEAR = '00012_arlequin_frente_clear.avif';

const ARLEQUIN_FRAME_COUNT = ARLEQUIN_FRAMES_DARK.length;

// Animation states
const ANIMATION_STATE = {
  IDLE: 'idle',
  OPENING: 'opening',
  LOOP: 'loop',
  CLOSING: 'closing',
  ARLEQUIN: 'arlequin'
};

function LogoAnimation({ isDarkMode = true, onClick, cardWidth = DEFAULT_CARD_WIDTH, cardHeight = DEFAULT_CARD_HEIGHT, isShrinking = false, isHidden = false, isRestoring = false, onShrinkComplete, onRestoreComplete }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ clear: [], dark: [] });
  const arlequinImagesRef = useRef({ clear: { frames: [], finalFrame: null }, dark: { frames: [], finalFrame: null } });
  const animationRef = useRef(null);
  const currentFrameRef = useRef(IDLE_FRAME);
  const lastFrameTimeRef = useRef(0);
  const lastRenderedFrameRef = useRef({ logo: IDLE_FRAME, arlequin: 0 });
  const isArlequinCompleteRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [animationState, setAnimationState] = useState(ANIMATION_STATE.IDLE);
  const [isHovered, setIsHovered] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const hoveredRef = useRef(false);

  // Get frame path based on theme
  const getFramePath = useCallback((theme) => {
    return theme === 'dark' ? '/isologo/isologo_dark_' : '/isologo/isologo_clear_';
  }, []);

  // Get current theme prefix
  const currentThemePrefix = isDarkMode ? 'dark' : 'clear';

  // Preload all logo frames and arlequin frames for both themes
  useEffect(() => {
    const loadImages = async () => {
      const themes = ['clear', 'dark'];
      const allImages = { clear: [], dark: [] };
      const arlequinImages = { clear: { frames: [], finalFrame: null }, dark: { frames: [], finalFrame: null } };
      let hasAnySuccessfulLoad = false;
      
      for (const theme of themes) {
        const framePath = getFramePath(theme);
        const imageArray = [];
        
        // Load logo frames 0-95
        const loadPromises = [];
        
        for (let i = 0; i <= LOOP_END_FRAME; i++) {
          const frameNumber = String(i).padStart(5, '0');
          const frameFile = `${framePath}${frameNumber}.avif`;
          
          const promise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ index: i, img, success: true });
            img.onerror = () => resolve({ index: i, img: null, success: false });
            img.src = frameFile;
          });
          loadPromises.push(promise);
        }
        
        const results = await Promise.all(loadPromises);
        
        // Check if any frame loaded successfully
        if (results.some(r => r.success)) {
          hasAnySuccessfulLoad = true;
        }
        
        // Fill in the image array
        for (let i = 0; i <= LOOP_END_FRAME; i++) {
          const result = results.find(r => r.index === i);
          imageArray[i] = (result && result.success) ? result.img : null;
        }
        
        allImages[theme] = imageArray;

        // Load arlequin animation frames using explicit frame list
        const frameList = theme === 'dark' ? ARLEQUIN_FRAMES_DARK : ARLEQUIN_FRAMES_CLEAR;
        const arlequinPromises = [];
        
        for (const frameFile of frameList) {
          const promise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ file: frameFile, img, success: true });
            img.onerror = () => resolve({ file: frameFile, img: null, success: false });
            img.src = `/Cartas/${frameFile}`;
          });
          arlequinPromises.push(promise);
        }

        const arlequinResults = await Promise.all(arlequinPromises);
        
        for (const result of arlequinResults) {
          arlequinImages[theme].frames.push(result.success ? result.img : null);
        }

        // Load final frozen frame (frente)
        const finalFrameFile = theme === 'dark' ? ARLEQUIN_FINAL_FRAME_DARK : ARLEQUIN_FINAL_FRAME_CLEAR;
        const finalPromise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ img, success: true });
          img.onerror = () => resolve({ img: null, success: false });
          img.src = `/Cartas/${finalFrameFile}`;
        });

        const finalResult = await finalPromise;
        arlequinImages[theme].finalFrame = finalResult.success ? finalResult.img : null;
      }
      
      imagesRef.current = allImages;
      arlequinImagesRef.current = arlequinImages;
      setIsLoaded(true);
      setShowPlaceholder(!hasAnySuccessfulLoad);
    };

  loadImages();
  }, [getFramePath]);

  // Handle hover state changes
  useEffect(() => {
    hoveredRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    lastFrameTimeRef.current = performance.now();
  }, [animationState]);

  // Get frame duration based on current state
  const getFrameDuration = useCallback((state) => {
    switch (state) {
      case ANIMATION_STATE.OPENING:
        return OPENING_FRAME_DURATION;
      case ANIMATION_STATE.LOOP:
        return LOOP_FRAME_DURATION;
      case ANIMATION_STATE.CLOSING:
        return CLOSING_FRAME_DURATION;
      case ANIMATION_STATE.ARLEQUIN:
        return ARLEQUIN_FRAME_DURATION;
      default:
        return LOOP_FRAME_DURATION;
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // If not loaded or showing placeholder, just return but render canvas
    const dpr = window.devicePixelRatio || 1;

    if (!isLoaded || showPlaceholder) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = Math.round(LOGO_SIZE * dpr);
      canvas.height = Math.round(LOGO_SIZE * dpr);
      canvas.style.width = `${LOGO_SIZE}px`;
      canvas.style.height = `${LOGO_SIZE}px`;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = Math.round(LOGO_SIZE * dpr);
    canvas.height = Math.round(LOGO_SIZE * dpr);
    canvas.style.width = `${LOGO_SIZE}px`;
    canvas.style.height = `${LOGO_SIZE}px`;
    ctx.scale(dpr, dpr);

    const drawLogoFrame = (frameIndex) => {
      const imageSet = imagesRef.current[currentThemePrefix];
      const frame = imageSet[frameIndex];
      const fallbackFrame = imageSet[lastRenderedFrameRef.current.logo];

      if (frame || fallbackFrame) {
        ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
        ctx.drawImage(frame || fallbackFrame, 0, 0, LOGO_SIZE, LOGO_SIZE);
        if (frame) {
          lastRenderedFrameRef.current.logo = frameIndex;
        }
      }
    };

    const drawArlequinFrame = (frameIndex) => {
      const arlequinSet = arlequinImagesRef.current[currentThemePrefix];
      
      // Calculate centered position for card (logical coords)
      const x = (LOGO_SIZE - cardWidth) / 2;
      const y = (LOGO_SIZE - cardHeight) / 2;

      // If animation is complete, draw final frame
      if (isArlequinCompleteRef.current) {
        const finalFrame = arlequinSet.finalFrame;
        if (finalFrame) {
          ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
          ctx.drawImage(finalFrame, x, y, cardWidth, cardHeight);
        }
        return;
      }

      // Draw animation frame (con fallback al último frame válido)
      const frame = arlequinSet.frames[frameIndex];
      const fallbackFrame = arlequinSet.frames[lastRenderedFrameRef.current.arlequin];
      if (frame || fallbackFrame) {
        ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
        ctx.drawImage(frame || fallbackFrame, x, y, cardWidth, cardHeight);
        if (frame) {
          lastRenderedFrameRef.current.arlequin = frameIndex;
        }
      }
    };

    // Draw initial frame
    if (animationState === ANIMATION_STATE.ARLEQUIN) {
      drawArlequinFrame(currentFrameRef.current);
    } else {
      drawLogoFrame(currentFrameRef.current);
    }

    const animate = (timestamp) => {
      const frameDuration = getFrameDuration(animationState);
      
      if (timestamp - lastFrameTimeRef.current >= frameDuration) {
        let nextFrame = currentFrameRef.current;
        
        // Handle arlequin animation
        if (animationState === ANIMATION_STATE.ARLEQUIN) {
          if (nextFrame < ARLEQUIN_FRAME_COUNT - 1) {
            nextFrame++;
          } else {
            isArlequinCompleteRef.current = true;
          }
        } else {
          // Handle logo animation states
          switch (animationState) {
            case ANIMATION_STATE.OPENING:
              if (nextFrame < OPENING_END_FRAME) {
                nextFrame++;
              } else if (hoveredRef.current) {
                nextFrame = LOOP_START_FRAME;
                setAnimationState(ANIMATION_STATE.LOOP);
              } else {
                nextFrame = OPENING_END_FRAME;
                setAnimationState(ANIMATION_STATE.CLOSING);
              }
              break;
              
            case ANIMATION_STATE.LOOP:
              if (!hoveredRef.current) {
                nextFrame = OPENING_END_FRAME;
                setAnimationState(ANIMATION_STATE.CLOSING);
              } else if (nextFrame < LOOP_END_FRAME) {
                nextFrame++;
              } else {
                nextFrame = LOOP_START_FRAME;
              }
              break;
              
            case ANIMATION_STATE.CLOSING:
              if (nextFrame > IDLE_FRAME) {
                nextFrame--;
              } else {
                setAnimationState(ANIMATION_STATE.IDLE);
                nextFrame = IDLE_FRAME;
              }
              break;
              
            case ANIMATION_STATE.IDLE:
            default:
              nextFrame = IDLE_FRAME;
              break;
          }
        }
        
        currentFrameRef.current = nextFrame;
        lastFrameTimeRef.current = timestamp;
        
        // Draw the appropriate frame
        if (animationState === ANIMATION_STATE.ARLEQUIN) {
          drawArlequinFrame(nextFrame);
        } else {
          drawLogoFrame(nextFrame);
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, animationState, showPlaceholder, getFrameDuration, currentThemePrefix, cardWidth, cardHeight]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleClick();
  }, [handleClick]);

  const handleMouseMove = useCallback((event) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();

    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2;

    const dx = localX - centerX;
    const dy = localY - centerY;
    const isInsideLogoArea = (dx * dx + dy * dy) <= (radius * radius);

    if (isInsideLogoArea) {
      setIsHovered(true);
      setAnimationState((prev) => {
        if (prev === ANIMATION_STATE.IDLE || prev === ANIMATION_STATE.CLOSING) {
          return ANIMATION_STATE.OPENING;
        }
        return prev;
      });
    } else {
      setIsHovered(false);
      setAnimationState((prev) => {
        if (prev === ANIMATION_STATE.OPENING || prev === ANIMATION_STATE.LOOP) {
          return ANIMATION_STATE.CLOSING;
        }
        return prev;
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setAnimationState((prev) => {
      if (prev === ANIMATION_STATE.OPENING || prev === ANIMATION_STATE.LOOP) {
        return ANIMATION_STATE.CLOSING;
      }
      return prev;
    });
  }, []);

  // Handle shrink animation
  useEffect(() => {
    if (isShrinking && onShrinkComplete) {
      // Wait for the shrink transition to complete (0.8s as defined in CSS)
      const timer = setTimeout(() => {
        onShrinkComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isShrinking, onShrinkComplete]);

  // Handle restore animation
  useEffect(() => {
    if (isRestoring && onRestoreComplete) {
      const timer = setTimeout(() => {
        onRestoreComplete();
      }, 840);
      return () => clearTimeout(timer);
    }
  }, [isRestoring, onRestoreComplete]);

  // Always render the canvas, even when loading
  return (
    <div
      className={`logo-container ${isShrinking ? 'shrunk' : ''} ${isRestoring ? 'restoring' : ''} ${isHidden ? 'hidden' : ''}`}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Logo"
      role="button"
      tabIndex={0}
    >
      <canvas
        ref={canvasRef}
        className="logo-canvas"
      />
    </div>
  );
}

export default LogoAnimation;
export { LOGO_SIZE };

