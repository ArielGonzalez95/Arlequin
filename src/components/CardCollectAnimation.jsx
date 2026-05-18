import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './CardCollectAnimation.css';

const GATHER_DURATION = 420;
const GATHER_STAGGER  = 120;
const SHRINK_DURATION = 600;

function CardCollectAnimation({ isDarkMode, onCollectComplete }) {
  const gridRef     = useRef(null);
  const themeSuffix = isDarkMode ? 'dark' : 'clear';

  // half-step between cards in each axis — computed from the same layout used
  // by GridStage so the cards visually start at exactly the grid positions
  // they were at when the user clicked the escudo.
  const [offsets, setOffsets] = useState(null);
  // idle → gathering → shrinking → done
  const [phase, setPhase] = useState('idle');

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.grid-card');
    if (cards.length < 4) return;
    const r0 = cards[0].getBoundingClientRect();
    const r1 = cards[1].getBoundingClientRect();
    const r2 = cards[2].getBoundingClientRect();
    setOffsets({
      hw: (r1.left - r0.left) / 2,
      hh: (r2.top  - r0.top)  / 2,
    });
  }, []);

  // Sequence: idle → gathering → shrinking → onCollectComplete
  useEffect(() => {
    if (!offsets) return;
    let raf1, raf2, t1, t2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPhase('gathering');
        // Last card finishes at GATHER_DURATION + 3 * STAGGER; small buffer
        // before starting the shrink so the deck is fully formed.
        t1 = setTimeout(() => {
          setPhase('shrinking');
          t2 = setTimeout(onCollectComplete, SHRINK_DURATION + 50);
        }, GATHER_DURATION + GATHER_STAGGER * 3 + 50);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [offsets, onCollectComplete]);

  const getCardStyle = (index) => {
    if (!offsets) return { zIndex: 4 - index };
    const { hw, hh } = offsets;
    const dx = index % 2 === 0 ?  hw : -hw;
    const dy = index < 2        ?  hh : -hh;

    if (phase === 'idle') {
      // Mount-time: cards exactly where GridStage had them.
      return {
        transform: 'translate(0px, 0px) scale(1)',
        transition: 'none',
        zIndex: 4 - index,
      };
    }

    if (phase === 'gathering') {
      // Reverse stagger: card 3 (bottom-right) leaves first and lands at the
      // bottom of the deck; card 0 (top-left) leaves last and lands on top.
      // Same easing as the deal so the reverse feels symmetric.
      return {
        transform: `translateX(${dx}px) translateY(${dy}px) scale(1)`,
        transition: `transform ${GATHER_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${(3 - index) * GATHER_STAGGER}ms`,
        zIndex: 4 - index,
        willChange: 'transform',
      };
    }

    if (phase === 'shrinking') {
      // The full deck shrinks together at center → matches the Phase A grow
      // of CardDealAnimation in reverse, with a fade in the last 300 ms so
      // the deck disappears cleanly before the mask close animation runs.
      return {
        transform: `translateX(${dx}px) translateY(${dy}px) scale(0.05)`,
        opacity: 0,
        transition: `transform ${SHRINK_DURATION}ms cubic-bezier(0.55, 0, 0.67, 0.05),
                     opacity 300ms ease-in ${SHRINK_DURATION - 300}ms`,
        zIndex: 4 - index,
        willChange: 'transform, opacity',
      };
    }

    return { zIndex: 4 - index };
  };

  return (
    <div className={`grid-stage collect-animation-stage${isDarkMode ? ' dark' : ''}`}>
      <div className="cards-grid" ref={gridRef}>
        {[0, 1, 2, 3].map(index => (
          <button
            key={index}
            className="grid-card"
            style={getCardStyle(index)}
            tabIndex={-1}
          >
            <div className="card-back">
              <img
                src={`/Cartas/00000_arlequin_dorso_${themeSuffix}.avif`}
                alt=""
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CardCollectAnimation;
