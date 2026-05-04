import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { _dorsoCached } from './GridStage';
import './CardDealAnimation.css';

const GROW_DURATION = 600;
const FLY_DURATION  = 500;
const FLY_STAGGER   = 60;

function CardDealAnimation({ isDarkMode, onDealComplete }) {
  const gridRef     = useRef(null);
  const themeSuffix = isDarkMode ? 'dark' : 'clear';

  // half-step between cards in each axis — computed from DOM
  const [offsets, setOffsets] = useState(null);
  // init → growing → dealing
  const [phase, setPhase] = useState('init');

  // Mark _dorsoCached so GridStage mounts synchronously loaded (no flash)
  const handleImgLoad = () => { _dorsoCached[themeSuffix] = true; };

  // Measure card positions once after first layout
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.grid-card');
    if (cards.length < 4) return;
    const r0 = cards[0].getBoundingClientRect();
    const r1 = cards[1].getBoundingClientRect();
    const r2 = cards[2].getBoundingClientRect();
    setOffsets({
      hw: (r1.left - r0.left) / 2, // half horizontal step = (cardWidth + gap) / 2
      hh: (r2.top  - r0.top)  / 2, // half vertical step   = (cardHeight + gap) / 2
    });
  }, []);

  // Animation sequence: init → growing → dealing → onDealComplete
  useEffect(() => {
    if (!offsets) return;
    let raf1, raf2, t1, t2;
    // 2 RAFs: ensure init frame is painted before transition starts
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPhase('growing');
        t1 = setTimeout(() => {
          setPhase('dealing');
          // last card finishes at FLY_DURATION + stagger * 3; buffer = 80ms
          t2 = setTimeout(onDealComplete, FLY_DURATION + FLY_STAGGER * 3 + 80);
        }, GROW_DURATION + 50);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [offsets, onDealComplete]);

  const getCardStyle = (index) => {
    if (!offsets) return { opacity: 0 };
    const { hw, hh } = offsets;

    // Each card's offset to reach the grid center from its natural position:
    //   card 0 (top-left)     → translate(+hw, +hh)
    //   card 1 (top-right)    → translate(-hw, +hh)
    //   card 2 (bottom-left)  → translate(+hw, -hh)
    //   card 3 (bottom-right) → translate(-hw, -hh)
    const dx  = index % 2 === 0 ?  hw : -hw;
    const dy  = index < 2        ?  hh : -hh;
    const rot = index % 2 === 0 ? -8  :  8;  // arc direction

    if (phase === 'init') {
      return {
        opacity: 0,
        transform: `translateX(${dx}px) translateY(${dy}px) scale(0.05) rotate(0deg)`,
        transition: 'none',
        willChange: 'transform, opacity',
      };
    }

    if (phase === 'growing') {
      return {
        opacity: 1,
        transform: `translateX(${dx}px) translateY(${dy}px) scale(1) rotate(0deg)`,
        transition: `transform ${GROW_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1),
                     opacity 300ms ease-out`,
        willChange: 'transform, opacity',
      };
    }

    if (phase === 'dealing') {
      return {
        '--deal-dx':  `${dx}px`,
        '--deal-dy':  `${dy}px`,
        '--deal-rot': `${rot}deg`,
        animationName:           'deal-fly-out',
        animationDuration:       `${FLY_DURATION}ms`,
        animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        animationDelay:          `${index * FLY_STAGGER}ms`,
        animationFillMode:       'both',
        willChange:              'transform',
      };
    }

    return {};
  };

  return (
    <div className={`grid-stage deal-animation-stage${isDarkMode ? ' dark' : ''}`}>
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
                onLoad={index === 0 ? handleImgLoad : undefined}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CardDealAnimation;
