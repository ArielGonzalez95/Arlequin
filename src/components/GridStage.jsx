import { useState, useEffect, useRef, useCallback } from 'react';
import './GridStage.css';

const CARD_LABELS = ['¿Qué es Arlequín?', '¿Quiénes somos?', 'Servicios', 'Contacto'];

// Module-level cache: true once dorso image has been loaded per theme.
// Allows synchronous isLoaded=true on re-mount (no flash).
const _dorsoCached = {};

function GridStage({ onCardClick, onCardPreClick, onExpandStart, onDealComplete, isDarkMode, dealKey = 0 }) {
  const themeSuffix = isDarkMode ? 'dark' : 'clear';

  // Synchronous init: if already cached, skip loading state entirely
  const [isLoaded, setIsLoaded] = useState(() => !!_dorsoCached[themeSuffix]);
  const [selectedCard, setSelectedCard] = useState(null);
  // idle → stacking → expanding → complete
  const [clickPhase, setClickPhase] = useState('idle');
  // stacked → dealing → idle  |  restoring → undealing → idle
  const [dealPhase, setDealPhase] = useState('stacked');

  // Translation + scale to move selected card to viewport center at component size
  const [expandTransform, setExpandTransform] = useState({ tx: 0, ty: 0, scale: 2 });

  // Dynamic step sizes measured from DOM
  const [colStep, setColStep] = useState(227);
  const [rowStep, setRowStep] = useState(304);
  const gridRef = useRef(null);
  const dealTimerRef = useRef(null);
  const prevDealKeyRef = useRef(null); // null = not yet initialized

  // Refs to store the last expand state for reverse (close) animation
  const lastSelectedRef = useRef(null);
  const lastExpandRef = useRef({ tx: 0, ty: 0, scale: 2 });

  // Load dorso image; mark cache so future mounts skip the async wait
  useEffect(() => {
    if (_dorsoCached[themeSuffix]) {
      setIsLoaded(true);
      return;
    }
    const img = new Image();
    img.onload = () => {
      _dorsoCached[themeSuffix] = true;
      setIsLoaded(true);
    };
    img.src = `/Cartas/00000_arlequin_dorso_${themeSuffix}.avif`;
  }, [themeSuffix]);

  // Shared deal sequence: stacked → (2 RAFs) → dealing → (700ms) → idle
  // reverse=true: restoring → (2 RAFs) → undealing → (700ms) → idle
  const runDeal = useCallback((reverse = false) => {
    if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
    setClickPhase('idle');

    if (reverse && lastSelectedRef.current !== null) {
      // Snap cards to their "just before close" positions, then animate back to grid
      const snapSelected = lastSelectedRef.current;
      const snapExpand = { ...lastExpandRef.current };

      setSelectedCard(snapSelected);
      setExpandTransform(snapExpand);
      setDealPhase('restoring');

      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setDealPhase('undealing');
          dealTimerRef.current = setTimeout(() => {
            dealTimerRef.current = null;
            lastSelectedRef.current = null;
            setSelectedCard(null);
            setDealPhase('idle');
            if (onDealComplete) onDealComplete();
          }, 700);
        });
      });

      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        if (dealTimerRef.current) { clearTimeout(dealTimerRef.current); dealTimerRef.current = null; }
      };
    }

    // Normal deal: stack all cards at grid center, then deal out
    setSelectedCard(null);
    setDealPhase('stacked');

    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setDealPhase('dealing');
        dealTimerRef.current = setTimeout(() => {
          dealTimerRef.current = null;
          setDealPhase('idle');
          if (onDealComplete) onDealComplete();
        }, 700);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (dealTimerRef.current) { clearTimeout(dealTimerRef.current); dealTimerRef.current = null; }
    };
  }, [onDealComplete]);

  // Initial deal animation on first load
  useEffect(() => {
    if (!isLoaded) return;
    return runDeal(false);
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-deal when dealKey increments (returning from a card detail)
  useEffect(() => {
    if (prevDealKeyRef.current === null) {
      prevDealKeyRef.current = dealKey; // initialise without running
      return;
    }
    if (dealKey === prevDealKeyRef.current) return;
    prevDealKeyRef.current = dealKey;
    if (!isLoaded) return;
    return runDeal(true); // reverse: card flies back to slot, others fan out
  }, [dealKey, isLoaded, runDeal]);

  // Measure actual card positions ONLY when cards are in their natural grid positions
  // (dealPhase === 'idle'). Measuring while stacked gives colStep ≈ 0 and breaks animations.
  useEffect(() => {
    if (dealPhase !== 'idle' || !gridRef.current) return;

    const measure = () => {
      const cards = gridRef.current.querySelectorAll('.grid-card');
      if (cards.length < 4) return;
      const r0 = cards[0].getBoundingClientRect();
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();
      setColStep(r1.left - r0.left);
      setRowStep(r2.top - r0.top);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [dealPhase]);

  const handleCardClick = (index) => {
    if (clickPhase !== 'idle' || dealPhase !== 'idle') return;

    // Measure selected card position to calculate translation to viewport center
    const cards = gridRef.current.querySelectorAll('.grid-card');
    const cardEl = cards[index];
    const rect = cardEl.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const vpCenterX = window.innerWidth / 2;
    const vpCenterY = window.innerHeight / 2;

    // Scale needed to go from grid card width to component canvas width
    // On mobile use 85% of viewport width to avoid overflowing the screen
    const targetWidth = window.innerWidth <= 500
      ? window.innerWidth * 0.85
      : 390;
    const scaleToComponent = targetWidth / rect.width;

    const transform = {
      tx: vpCenterX - cardCenterX,
      ty: vpCenterY - cardCenterY,
      scale: scaleToComponent,
    };

    // Store for reverse (close) animation
    lastSelectedRef.current = index;
    lastExpandRef.current = transform;

    if (onCardPreClick) onCardPreClick(index + 1);
    if (onExpandStart) onExpandStart();

    setSelectedCard(index);
    setExpandTransform(transform);
    setClickPhase('stacking');

    // After all cards stack, expand selected to center at component size
    setTimeout(() => {
      setClickPhase('expanding');
      setTimeout(() => {
        setClickPhase('complete');
        onCardClick(index + 1);
      }, 320);
    }, 850);
  };

  const getCardStyle = (index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    // ── Entry deal animation ──────────────────────────────────────
    if (dealPhase === 'stacked') {
      const dx = (0.5 - col) * colStep;
      const dy = (0.5 - row) * rowStep;
      return {
        transform: `translate(${dx}px, ${dy}px) scale(0.88)`,
        transition: 'none',
        zIndex: 5,
      };
    }

    if (dealPhase === 'dealing') {
      return {
        transform: 'translate(0px, 0px) scale(1)',
        transition: `transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 120}ms`,
        zIndex: 4 - index,
      };
    }

    // ── Reverse close animation ───────────────────────────────────
    if ((dealPhase === 'restoring' || dealPhase === 'undealing') && selectedCard !== null) {
      const isSelected = index === selectedCard;
      const selCol = selectedCard % 2;
      const selRow = Math.floor(selectedCard / 2);
      const nonSelected = [0, 1, 2, 3].filter(i => i !== selectedCard);
      const orderIndex = nonSelected.indexOf(index);

      if (dealPhase === 'restoring') {
        if (isSelected) {
          // Snap selected card to viewport center (where it was when card detail opened)
          const { tx, ty, scale } = expandTransform;
          return {
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            zIndex: 15,
            transition: 'none',
          };
        }
        // Snap non-selected cards to stacked position behind selected (invisible)
        const dx = (selCol - col) * colStep;
        const dy = (selRow - row) * rowStep;
        const deckOffset = (2 - orderIndex) * 3;
        return {
          transform: `translate(${dx + deckOffset}px, ${dy + deckOffset}px) scale(0.93)`,
          zIndex: orderIndex + 1,
          opacity: 0,
          transition: 'none',
        };
      }

      // dealPhase === 'undealing': animate everyone back to grid positions
      if (isSelected) {
        return {
          transform: 'translate(0px, 0px) scale(1)',
          zIndex: 10,
          transition: 'transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        };
      }
      const delay = orderIndex * 120;
      return {
        transform: 'translate(0px, 0px) scale(1)',
        zIndex: 4 - orderIndex,
        opacity: 1,
        transition: `transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms, opacity 0.3s ease-out ${delay}ms`,
      };
    }

    // ── Click animation ───────────────────────────────────────────
    if (clickPhase !== 'idle' && selectedCard !== null) {
      const isSelected = index === selectedCard;
      const selCol = selectedCard % 2;
      const selRow = Math.floor(selectedCard / 2);

      if (isSelected) {
        if (clickPhase === 'expanding' || clickPhase === 'complete') {
          // Move to viewport center at component canvas size
          const { tx, ty, scale } = expandTransform;
          return {
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            zIndex: 15,
            transition: 'transform 0.32s ease-out',
          };
        }
        // stacking phase: slight forward pop only
        return {
          transform: 'scale(1.15)',
          zIndex: 10,
          transition: 'transform 0.2s ease-out',
        };
      }

      // Non-selected: stack behind selected with stagger
      const nonSelected = [0, 1, 2, 3].filter(i => i !== selectedCard);
      const orderIndex = nonSelected.indexOf(index);
      const dx = (selCol - col) * colStep;
      const dy = (selRow - row) * rowStep;
      const delay = 80 + orderIndex * 150;
      const deckOffset = (2 - orderIndex) * 3;
      const zIndex = (orderIndex + 1) * 2;

      // During expanding/complete: hide stacked cards behind the selected one
      if (clickPhase === 'expanding' || clickPhase === 'complete') {
        return {
          transform: `translate(${dx + deckOffset}px, ${dy + deckOffset}px) scale(0.93)`,
          zIndex,
          opacity: 0,
          transition: 'opacity 0.15s ease-out',
        };
      }

      return {
        transform: `translate(${dx + deckOffset}px, ${dy + deckOffset}px) scale(0.93)`,
        zIndex,
        opacity: 0.85,
        transition: `transform 0.45s ease-in ${delay}ms, opacity 0.45s ease-in ${delay}ms`,
      };
    }

    return {};
  };

  if (!isLoaded) return <div className="grid-stage loading" />;

  return (
    <div className={`grid-stage${isDarkMode ? ' dark' : ''}`}>
      <div className="cards-grid" ref={gridRef}>
        {CARD_LABELS.map((label, index) => (
          <button
            key={index}
            className="grid-card"
            style={getCardStyle(index)}
            onClick={() => handleCardClick(index)}
            disabled={clickPhase !== 'idle' || dealPhase !== 'idle'}
          >
            <div className="card-back">
              <img
                src={`/Cartas/00000_arlequin_dorso_${themeSuffix}.avif`}
                alt={`Card ${index + 1}`}
              />
              {dealPhase === 'idle' && clickPhase === 'idle' && (
                <div className="card-text-overlay">
                  {index === 0 && <><div>¿Qué es</div><div>Arlequín?</div></>}
                  {index === 1 && <><div>¿Quiénes</div><div>somos?</div></>}
                  {index === 2 && <div>Servicios</div>}
                  {index === 3 && <div>Contacto</div>}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default GridStage;
