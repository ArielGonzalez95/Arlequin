import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { _dorsoCached } from './GridStage';
import './CardDealAnimation.css';

const GROW_DURATION = 600;
const FLY_DURATION  = 420;
const FLY_STAGGER   = 120;

function CardDealAnimation({ isDarkMode, onDealComplete, skipGrow = false }) {
  const gridRef     = useRef(null);
  const themeSuffix = isDarkMode ? 'dark' : 'clear';

  // half-step between cards in each axis — computed from DOM
  const [offsets, setOffsets] = useState(null);
  // init → growing → dealing
  // When skipGrow is true (close-from-card handoff), we start at 'growing-end'
  // so the deck is already at full grid size and visible at center, then go
  // straight to the deal — avoids the "card shrinks to nothing then grows
  // back" effect when returning from a card detail.
  const [phase, setPhase] = useState(skipGrow ? 'growing-end' : 'init');

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

  // Animation sequence:
  //   Normal mount  : init → growing → dealing → onDealComplete
  //   skipGrow mount: growing-end → dealing → onDealComplete (no shrink/grow)
  useEffect(() => {
    if (!offsets) return;
    let raf1, raf2, t1, t2;

    if (skipGrow) {
      // 2 RAFs so the painted "growing-end" frame is visible before the
      // dealing transition starts (otherwise the browser may collapse the
      // two state changes into the same paint and the cards skip the deck).
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setPhase('dealing');
          t2 = setTimeout(onDealComplete, FLY_DURATION + FLY_STAGGER * 3 + 80);
        });
      });
    } else {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setPhase('growing');
          t1 = setTimeout(() => {
            setPhase('dealing');
            t2 = setTimeout(onDealComplete, FLY_DURATION + FLY_STAGGER * 3 + 80);
          }, GROW_DURATION + 50);
        });
      });
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [offsets, onDealComplete, skipGrow]);

  const getCardStyle = (index) => {
    if (!offsets) return { opacity: 0 };
    const { hw, hh } = offsets;

    // Each card's offset to reach the grid center from its natural position:
    //   card 0 (top-left)     → translate(+hw, +hh)
    //   card 1 (top-right)    → translate(-hw, +hh)
    //   card 2 (bottom-left)  → translate(+hw, -hh)
    //   card 3 (bottom-right) → translate(-hw, -hh)
    const dx = index % 2 === 0 ?  hw : -hw;
    const dy = index < 2        ?  hh : -hh;

    if (phase === 'init') {
      return {
        opacity: 0,
        transform: `translateX(${dx}px) translateY(${dy}px) scale(0.05)`,
        transition: 'none',
        zIndex: 4 - index,
        willChange: 'transform, opacity',
      };
    }

    if (phase === 'growing') {
      // All 4 cards stacked at center, growing together → visually appears as a
      // single card emerging at full size. zIndex keeps card 0 on top of the deck.
      return {
        opacity: 1,
        transform: `translateX(${dx}px) translateY(${dy}px) scale(1)`,
        transition: `transform ${GROW_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1),
                     opacity 300ms ease-out`,
        zIndex: 4 - index,
        willChange: 'transform, opacity',
      };
    }

    if (phase === 'growing-end') {
      // skipGrow: deck already at full size at center, no transition. Used when
      // CardDealAnimation mounts to pick up from a card-detail close — the
      // detail canvas has just finished its flip-to-dorso and shrunk to grid
      // size at center, so we mount in that exact state.
      return {
        opacity: 1,
        transform: `translateX(${dx}px) translateY(${dy}px) scale(1)`,
        transition: 'none',
        zIndex: 4 - index,
        willChange: 'transform',
      };
    }

    if (phase === 'dealing') {
      // OLD style: cards leave the stack one by one with 120 ms stagger, no arc.
      // Card 0 (top of stack) flies first; card 3 (bottom) flies last and lands
      // last. Matches the original GridStage runDeal(false) cadence the user
      // preferred — feels like an actual deal rather than a fan.
      return {
        transform: 'translate(0px, 0px) scale(1)',
        transition: `transform ${FLY_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * FLY_STAGGER}ms`,
        zIndex: 4 - index,
        willChange: 'transform',
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
