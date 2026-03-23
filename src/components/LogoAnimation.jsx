import { useEffect, useRef, useState, useCallback } from 'react';
// Animation state is managed entirely by refs — no React state — so the RAF loop
// never restarts due to animation transitions, preventing mid-animation freezes.
import './LogoAnimation.css';

// Configurable logo size
const LOGO_SIZE = 500;

// Default card size for arlequin animation
const DEFAULT_CARD_WIDTH = 430;
const DEFAULT_CARD_HEIGHT = 600;
const CUERPO_MASCARA_FINAL_FRAME = 16;

// Estrellas — 178 frames (0-177)
// 0-71   : initial animation (plays once on hover)
// 72-177 : loop zone (loops continuously while hovered)
// File naming: frames 0-57 have no suffix, frames 58-177 have '_loop' suffix
const ESTRELLAS_INITIAL_END       = 71;
const ESTRELLAS_LOOP_START        = 72;
const ESTRELLAS_LOOP_END          = 177;
const ESTRELLAS_LOOP_FILE_START   = 58; // first frame whose filename has '_loop' suffix
const OPENING_FRAME_DURATION   = 35;
const CLOSING_FRAME_DURATION   = 35;
const ESTRELLAS_FRAME_DURATION = 40;
const ARLEQUIN_FRAME_DURATION  = 60;
const MOBILE_OPEN_HOLD_MS      = 4000; // time mask stays open on mobile before closing
const MOBILE_LOOP_PAUSE_MS     = 500;  // pause between close and next open on mobile

// Arlequin animation frames (unchanged)
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
  IDLE:     'idle',
  OPENING:  'opening',
  OPEN:     'open',
  CLOSING:  'closing',
  ARLEQUIN: 'arlequin',
};

// Isologo asset base paths (public folder, no spaces)
const ISOLOGO_BASE = {
  clear: {
    cuerpo:    '/NEW_arlequin_isologo_animado_en_partes_clear/NEW_arlequin_isologo_animado_en_partes_clear/animacion_isologo_cuerpo_clear/animacion_isologo_cuerpo_clear_',
    estrellas: '/NEW_arlequin_isologo_animado_en_partes_clear/NEW_arlequin_isologo_animado_en_partes_clear/animacion_isologo_estrellas_clear/animacion_isologo_estrellas_clear_',
    mascara:   '/NEW_arlequin_isologo_animado_en_partes_clear/NEW_arlequin_isologo_animado_en_partes_clear/animacion_isologo_mascara_clear/animacion_isologo_mascara_clear_',
  },
  dark: {
    cuerpo:    '/NEW_arlequin_isologo_animado_en_partes_dark/NEW_arlequin_isologo_animado_en_partes_dark/animacion_isologo_cuerpo_dark/animacion_isologo_cuerpo_dark_',
    estrellas: '/NEW_arlequin_isologo_animado_en_partes_dark/NEW_arlequin_isologo_animado_en_partes_dark/animacion_isologo_estrellas_dark/animacion_isologo_estrellas_dark_',
    mascara:   '/NEW_arlequin_isologo_animado_en_partes_dark/NEW_arlequin_isologo_animado_en_partes_dark/animacion_isologo_mascara_dark/animacion_isologo_mascara_dark_',
  },
};

// Load a contiguous range of numbered .avif frames into an array indexed by frame number.
// loopFileStart: frame index at which filenames gain a '_loop' suffix (optional).
function loadFrameRange(basePath, start, end, loopFileStart = Infinity) {
  const promises = [];
  for (let i = start; i <= end; i++) {
    const fileSuffix = i >= loopFileStart ? '_loop' : '';
    const src = `${basePath}${String(i).padStart(5, '0')}${fileSuffix}.avif`;
    promises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => resolve({ index: i, img, success: true });
      img.onerror = () => resolve({ index: i, img: null, success: false });
      img.src = src;
    }));
  }
  return Promise.all(promises).then((results) => {
    const arr = new Array(end - start + 1).fill(null);
    for (const r of results) {
      if (r.success) arr[r.index - start] = r.img;
    }
    return { arr, anySuccess: results.some(r => r.success) };
  });
}

function LogoAnimation({
  isDarkMode = true,
  onClick,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
  isShrinking = false,
  isHidden = false,
  isRestoring = false,
  onShrinkComplete,
  onRestoreComplete,
}) {
  const canvasRef = useRef(null);

  // Isologo image banks: { clear|dark: { cuerpo[], estrellas[], mascara[] } }
  const isologoImagesRef = useRef({
    clear: { cuerpo: [], estrellas: [], mascara: [] },
    dark:  { cuerpo: [], estrellas: [], mascara: [] },
  });

  // Arlequin image banks (unchanged)
  const arlequinImagesRef = useRef({
    clear: { frames: [], finalFrame: null },
    dark:  { frames: [], finalFrame: null },
  });

  const animationRef = useRef(null);

  // Frame tracking
  const cuerpoMascaraFrameRef = useRef(0);   // current cuerpo & mascara frame (0-16)
  const estrellasFrameRef     = useRef(0);   // current estrellas frame (0-177)
  const estrellasPhaseRef     = useRef('initial'); // 'initial' | 'loop'
  const arlequinFrameRef      = useRef(0);

  // Per-layer timing
  const lastCuerpoMascaraTimeRef = useRef(0);
  const lastEstrellasTimeRef     = useRef(0);

  const isArlequinCompleteRef = useRef(false);

  const isMobileRef        = useRef(false);
  const mobileLoopTimerRef = useRef(null);
  const prevAnimStateRef   = useRef(ANIMATION_STATE.IDLE);

  const [isLoaded, setIsLoaded]               = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  // Animation state and hover — pure refs, never trigger re-renders
  const animationStateRef = useRef(ANIMATION_STATE.IDLE);
  const hoveredRef        = useRef(false);
  const currentThemePrefix = isDarkMode ? 'dark' : 'clear';

  // Detect touch-only devices once on mount.
  // navigator.maxTouchPoints > 0 is the most reliable check on iOS Safari;
  // matchMedia('hover: none') can fail on some iOS versions.
  useEffect(() => {
    isMobileRef.current = navigator.maxTouchPoints > 0 && !window.matchMedia('(hover: hover)').matches;
  }, []);

  // ── Image preloading ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const allIsologo = {
        clear: { cuerpo: [], estrellas: [], mascara: [] },
        dark:  { cuerpo: [], estrellas: [], mascara: [] },
      };
      const allArlequin = {
        clear: { frames: [], finalFrame: null },
        dark:  { frames: [], finalFrame: null },
      };
      let hasAnySuccessfulLoad = false;

      for (const theme of ['clear', 'dark']) {
        const base = ISOLOGO_BASE[theme];

        // Load all 3 isologo layer sequences in parallel
        const [cuerpoRes, mascaraRes, estrellasRes] = await Promise.all([
          loadFrameRange(base.cuerpo,    0, CUERPO_MASCARA_FINAL_FRAME),
          loadFrameRange(base.mascara,   0, CUERPO_MASCARA_FINAL_FRAME),
          loadFrameRange(base.estrellas, 0, ESTRELLAS_LOOP_END, ESTRELLAS_LOOP_FILE_START),
        ]);

        allIsologo[theme].cuerpo    = cuerpoRes.arr;
        allIsologo[theme].mascara   = mascaraRes.arr;
        allIsologo[theme].estrellas = estrellasRes.arr;

        if (cuerpoRes.anySuccess || mascaraRes.anySuccess || estrellasRes.anySuccess) {
          hasAnySuccessfulLoad = true;
        }

        // Arlequin frames
        const frameList = theme === 'dark' ? ARLEQUIN_FRAMES_DARK : ARLEQUIN_FRAMES_CLEAR;
        const arlequinResults = await Promise.all(
          frameList.map(file => new Promise((resolve) => {
            const img = new Image();
            img.onload  = () => resolve({ img, success: true });
            img.onerror = () => resolve({ img: null, success: false });
            img.src = `/Cartas/${file}`;
          }))
        );
        allArlequin[theme].frames = arlequinResults.map(r => r.success ? r.img : null);

        const finalFile = theme === 'dark' ? ARLEQUIN_FINAL_FRAME_DARK : ARLEQUIN_FINAL_FRAME_CLEAR;
        const finalResult = await new Promise((resolve) => {
          const img = new Image();
          img.onload  = () => resolve({ img, success: true });
          img.onerror = () => resolve({ img: null, success: false });
          img.src = `/Cartas/${finalFile}`;
        });
        allArlequin[theme].finalFrame = finalResult.success ? finalResult.img : null;
      }

      isologoImagesRef.current = allIsologo;
      arlequinImagesRef.current = allArlequin;
      setIsLoaded(true);
      setShowPlaceholder(!hasAnySuccessfulLoad);
    };

    load();
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const dpr    = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    canvas.width        = Math.round(LOGO_SIZE * dpr);
    canvas.height       = Math.round(LOGO_SIZE * dpr);
    canvas.style.width  = `${LOGO_SIZE}px`;
    canvas.style.height = `${LOGO_SIZE}px`;
    ctx.scale(dpr, dpr);

    if (!isLoaded || showPlaceholder) {
      ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';

    // Draw the 3-layer isologo: cuerpo → estrellas → mascara
    // cuerpo and mascara share the same frame index.
    const drawIsologo = (cmFrame, starFrame) => {
      const imgs = isologoImagesRef.current[currentThemePrefix];
      ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
      const c = imgs.cuerpo[cmFrame];
      if (c) ctx.drawImage(c, 0, 0, LOGO_SIZE, LOGO_SIZE);
      const safeStarFrame = Math.max(0, Math.min(starFrame, imgs.estrellas.length - 1));
      const s = imgs.estrellas[safeStarFrame];
      if (s) ctx.drawImage(s, 0, 0, LOGO_SIZE, LOGO_SIZE);
      const m = imgs.mascara[cmFrame];
      if (m) ctx.drawImage(m, 0, 0, LOGO_SIZE, LOGO_SIZE);
    };

    // Draw arlequin card (centered in canvas)
    const drawArlequin = (frameIndex) => {
      const set = arlequinImagesRef.current[currentThemePrefix];
      const x   = (LOGO_SIZE - cardWidth)  / 2;
      const y   = (LOGO_SIZE - cardHeight) / 2;
      ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE);
      if (isArlequinCompleteRef.current) {
        if (set.finalFrame) ctx.drawImage(set.finalFrame, x, y, cardWidth, cardHeight);
      } else {
        const frame = set.frames[frameIndex];
        if (frame) ctx.drawImage(frame, x, y, cardWidth, cardHeight);
      }
    };

    // Initial draw for this effect run
    const initState = animationStateRef.current;
    if (initState === ANIMATION_STATE.ARLEQUIN) {
      drawArlequin(arlequinFrameRef.current);
    } else {
      drawIsologo(cuerpoMascaraFrameRef.current, estrellasFrameRef.current);
    }

    const animate = (timestamp) => {
      const state = animationStateRef.current; // always fresh — no closure staleness
      if (state === ANIMATION_STATE.ARLEQUIN) {
// ── Arlequin card animation ──────────────────────────────────────
        const elapsed = timestamp - lastCuerpoMascaraTimeRef.current;
        if (elapsed >= ARLEQUIN_FRAME_DURATION) {
          if (elapsed > ARLEQUIN_FRAME_DURATION * 4) {
            lastCuerpoMascaraTimeRef.current = timestamp - ARLEQUIN_FRAME_DURATION;
          }
          let frame = arlequinFrameRef.current;
          if (frame < ARLEQUIN_FRAME_COUNT - 1) {
            frame++;
          } else {
            isArlequinCompleteRef.current = true;
          }
          arlequinFrameRef.current = frame;
          lastCuerpoMascaraTimeRef.current = timestamp;
          drawArlequin(frame);
        }
      } else {
        // ── Isologo 3-layer animation ────────────────────────────────────
        let cmFrame   = cuerpoMascaraFrameRef.current;
        let starFrame = estrellasFrameRef.current;

               let resetStars = false;

        // Advance cuerpo & mascara
        const cmElapsed  = timestamp - lastCuerpoMascaraTimeRef.current;
        const cmDuration = state === ANIMATION_STATE.CLOSING
          ? CLOSING_FRAME_DURATION
          : OPENING_FRAME_DURATION;

        if (cmElapsed >= cmDuration) {
          if (cmElapsed > cmDuration * 4) {
            lastCuerpoMascaraTimeRef.current = timestamp - cmDuration;
          }

          switch (state) {
            case ANIMATION_STATE.OPENING:
              if (cmFrame < CUERPO_MASCARA_FINAL_FRAME) {
                cmFrame++;
              } else if (hoveredRef.current) {
                animationStateRef.current = ANIMATION_STATE.OPEN;
              } else {
                animationStateRef.current = ANIMATION_STATE.CLOSING;
              }
              break;

            case ANIMATION_STATE.OPEN:
              // Hold at final frame; check if hover ended
              if (!hoveredRef.current) {
                animationStateRef.current = ANIMATION_STATE.CLOSING;
              }
              break;

            case ANIMATION_STATE.CLOSING:
              if (cmFrame > 0) {
                cmFrame--;
              } else if (hoveredRef.current) {
                // Mascara fully closed but user is still hovering — reopen
                animationStateRef.current = ANIMATION_STATE.OPENING;
              } else {
                // Mascara fully closed — reset estrellas for next hover
                resetStars = true;
                estrellasFrameRef.current = 0;
                estrellasPhaseRef.current = 'initial';
                starFrame = 0;
                animationStateRef.current = ANIMATION_STATE.IDLE;
              }
              break;

            case ANIMATION_STATE.IDLE:
            default:
              cmFrame = 0;
              break;
          }

          cuerpoMascaraFrameRef.current = cmFrame;
          lastCuerpoMascaraTimeRef.current = timestamp;
        }

        // Advance estrellas only during active states
        if (!resetStars && (state === ANIMATION_STATE.OPENING || state === ANIMATION_STATE.OPEN || state === ANIMATION_STATE.CLOSING)) {
          const starElapsed = timestamp - lastEstrellasTimeRef.current;
          if (starElapsed >= ESTRELLAS_FRAME_DURATION) {
            if (starElapsed > ESTRELLAS_FRAME_DURATION * 4) {
              lastEstrellasTimeRef.current = timestamp - ESTRELLAS_FRAME_DURATION;
            }

            if (estrellasPhaseRef.current === 'initial') {
              starFrame = Math.min(starFrame + 1, ESTRELLAS_LOOP_END);
              if (starFrame > ESTRELLAS_INITIAL_END) {
                estrellasPhaseRef.current = 'loop';
              }
            } else {
              // Loop 72-177 continuously
              starFrame = ESTRELLAS_LOOP_START + ((starFrame - ESTRELLAS_LOOP_START + 1) % (ESTRELLAS_LOOP_END - ESTRELLAS_LOOP_START + 1));
            }
            // Clamp to valid range
            starFrame = Math.max(0, Math.min(starFrame, ESTRELLAS_LOOP_END));
            estrellasFrameRef.current = starFrame;
            lastEstrellasTimeRef.current = timestamp;
          }
        }

        drawIsologo(cuerpoMascaraFrameRef.current, estrellasFrameRef.current);
      }

      // ── Mobile auto-loop: detect state transitions ───────────────────────
      if (isMobileRef.current) {
        const cur = animationStateRef.current;
        if (cur !== prevAnimStateRef.current) {
          if (cur === ANIMATION_STATE.OPEN) {
            // Mask fully open — hold for 4s then close
            if (mobileLoopTimerRef.current) clearTimeout(mobileLoopTimerRef.current);
            mobileLoopTimerRef.current = setTimeout(() => {
              hoveredRef.current = false;
              if (animationStateRef.current === ANIMATION_STATE.OPEN) {
                animationStateRef.current = ANIMATION_STATE.CLOSING;
              }
            }, MOBILE_OPEN_HOLD_MS);
          } else if (cur === ANIMATION_STATE.IDLE) {
            // Mask fully closed — restart the loop after a short pause
            if (mobileLoopTimerRef.current) clearTimeout(mobileLoopTimerRef.current);
            mobileLoopTimerRef.current = setTimeout(() => {
              hoveredRef.current = true;
              animationStateRef.current = ANIMATION_STATE.OPENING;
            }, MOBILE_LOOP_PAUSE_MS);
          }
          prevAnimStateRef.current = cur;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // On mobile, kick off the first cycle (only if idle — avoids restart on re-renders)
    if (isMobileRef.current && animationStateRef.current === ANIMATION_STATE.IDLE) {
      hoveredRef.current = true;
      animationStateRef.current = ANIMATION_STATE.OPENING;
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mobileLoopTimerRef.current) {
        clearTimeout(mobileLoopTimerRef.current);
        mobileLoopTimerRef.current = null;
      }
    };
  }, [isLoaded, showPlaceholder, currentThemePrefix, cardWidth, cardHeight]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleClick();
  }, [handleClick]);

  const handleMouseMove = useCallback((event) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width  / 2;
    const dy = event.clientY - rect.top  - rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2;
    const isInside = (dx * dx + dy * dy) <= (radius * radius);

    if (isInside && !hoveredRef.current) {
      // Mouse entered the circular area — open
      hoveredRef.current = true;
      const cur = animationStateRef.current;
      if (cur === ANIMATION_STATE.IDLE || cur === ANIMATION_STATE.CLOSING) {
        animationStateRef.current = ANIMATION_STATE.OPENING;
      }
    }
    // No else: moving to the corner of the container does NOT close the animation.
    // Closing only happens via onMouseLeave (real container exit).
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Mouse entered the container — mark as potentially hovered
    // (actual OPENING is triggered by handleMouseMove once inside the circle)
    // If re-entering during CLOSING, restart immediately
    const cur = animationStateRef.current;
    if (cur === ANIMATION_STATE.CLOSING) {
      hoveredRef.current = true;
      animationStateRef.current = ANIMATION_STATE.OPENING;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Mouse left the container entirely — close
    hoveredRef.current = false;
    const cur = animationStateRef.current;
    if (cur === ANIMATION_STATE.OPENING || cur === ANIMATION_STATE.OPEN) {
      animationStateRef.current = ANIMATION_STATE.CLOSING;
    }
  }, []);

  // ── Shrink / restore callbacks ────────────────────────────────────────────
  useEffect(() => {
    if (isShrinking && onShrinkComplete) {
      const timer = setTimeout(() => onShrinkComplete(), 800);
      return () => clearTimeout(timer);
    }
  }, [isShrinking, onShrinkComplete]);

  useEffect(() => {
    if (isRestoring && onRestoreComplete) {
      const timer = setTimeout(() => onRestoreComplete(), 840);
      return () => clearTimeout(timer);
    }
  }, [isRestoring, onRestoreComplete]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`logo-container ${isShrinking ? 'shrunk' : ''} ${isRestoring ? 'restoring' : ''} ${isHidden ? 'hidden' : ''}`}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Logo"
      role="button"
      tabIndex={0}
    >
      <canvas ref={canvasRef} className="logo-canvas" />
    </div>
  );
}

export default LogoAnimation;
export { LOGO_SIZE };


