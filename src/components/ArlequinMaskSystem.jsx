import { useState, useEffect, useCallback, useRef } from 'react';
import ArlequinMask from './ArlequinMask';
import ArlequinEscudo from './ArlequinEscudo';
import QuestionStage from './QuestionStage';
import CardStage from './CardStage';
import GridStage from './GridStage';
import CardDealAnimation from './CardDealAnimation';
import CardCollectAnimation from './CardCollectAnimation';
import CardQueEsArlequin from './CardQueEsArlequin';
import CardQuienesSomos from './CardQuienesSomos';
import CardServicios from './CardServicios';
import CardContacto from './CardContacto';
import './ArlequinMaskSystem.css';

// Animation stages
const STAGES = {
  NONE: 'none',
  MASK_SHOWING: 'mask_showing',
  QUESTION: 'question',
  CARD: 'card',
  DEALING: 'dealing',       // CardDealAnimation phase before grid is stable
  GRID: 'grid',
  CARD_DETAIL: 'card_detail',
  COLLECTING: 'collecting'  // CardCollectAnimation runs before mask closes back to home
};

// Map card index to component
const CARD_COMPONENTS = {
  1: CardQueEsArlequin,
  2: CardQuienesSomos,
  3: CardServicios,
  4: CardContacto
};

function ArlequinMaskSystem({
  isDarkMode,
  phase,
  onReset,
  onMaskTransitionEnd,
  onRequestMaskAnimation,
  isLowEnd = false,
  prefersReducedMotion = false
}) {
  const [stage, setStage] = useState(STAGES.NONE);
  const [selectedCard, setSelectedCard] = useState(null);
  const [dealLingerVisible, setDealLingerVisible] = useState(false);
  const dealLingerTimerRef = useRef(null);
  const [dealMode, setDealMode] = useState('initial');
  const [cardFromGrid, setCardFromGrid] = useState(false);
  const [isShrinkingOut, setIsShrinkingOut] = useState(false);
  const [preloadCard, setPreloadCard] = useState(null);
  const [isCardExpanding, setIsCardExpanding] = useState(false);
  const [dealKey, setDealKey] = useState(0);
  // 'close': collect → mask close (escudo click).
  // 'openCard': collect → open card detail (grid card click).
  const [collectPurpose, setCollectPurpose] = useState('close');
  // Dorso bridge: small grid-card-sized dorso shown at center during the
  // gap between close animation end and CDA deck becoming visible.
  const [dorsoBridgeVisible, setDorsoBridgeVisible] = useState(false);
  const [dorsoBridgeFading, setDorsoBridgeFading] = useState(false);
  const dorsoBridgeTimerRef = useRef(null);
  const pendingCardStageRef = useRef(false);

  useEffect(() => {
    if (!phase) return;

    // Check if we're in "NO" flow using the ref
    if (phase === 'contentVisible') {
      // If pendingCardStageRef is true, we're in NO flow
      if (pendingCardStageRef.current) {
        // Clear the ref and show CARD_DETAIL with CardQueEsArlequin (card index 1)
        pendingCardStageRef.current = false;
        setSelectedCard(1);
        setStage(STAGES.CARD_DETAIL);
        return;
      }
      // Only show QUESTION if we're coming from a fresh start (NONE)
      if (stage === STAGES.NONE) {
        const hasAnswered = localStorage.getItem('arlequin_answered');
        setStage(hasAnswered ? STAGES.DEALING : STAGES.QUESTION);
      }
      return;
    }

    // Reset everything for home and reverse flows
    if (phase === 'home' || phase === 'logoGrowing' || phase === 'reverseClosing' || phase === 'reverseOpening') {
      setStage(STAGES.NONE);
      setSelectedCard(null);
      pendingCardStageRef.current = false;
      return;
    }
    
    // For logoShrinking, maskClosing, maskOpening - these are part of the initial animation
    // If pendingCardStageRef is true, we're in NO flow, so DON'T reset stage
    if (pendingCardStageRef.current) {
      return;
    }

    // Normal flow - reset stage for mask animations
    if (phase === 'logoShrinking' || phase === 'maskClosing' || phase === 'maskOpening') {
      setStage(STAGES.NONE);
      setSelectedCard(null);
    }
  }, [phase, stage]);

  // Handle YES click - trigger deal animation before grid
  const handleYes = useCallback(() => {
    localStorage.setItem('arlequin_answered', '1');
    setStage(STAGES.DEALING);
  }, []);

  // Called by CardDealAnimation when Phase B finishes (both initial entry and close return)
  const handleDealAnimationComplete = useCallback(() => {
    // Mount GridStage first so its cards paint underneath the still-mounted
    // CardDealAnimation, then drop the linger flag after a couple of frames.
    setStage(STAGES.GRID);
    setDealLingerVisible(true);
    // Do NOT reset dealMode here. CDA's useEffect depends on the skipGrow prop
    // (derived from dealMode='fromCardClose'). Changing dealMode while CDA is
    // still mounted flips skipGrow true→false, which re-triggers CDA's grow→deal
    // animation — causing the visible "cards shuffle toward center" double-animation.
    // Reset dealMode inside the timer so it fires in the same React batch as
    // setDealLingerVisible(false), unmounting CDA before the prop can change.
    if (dealLingerTimerRef.current) clearTimeout(dealLingerTimerRef.current);
    dealLingerTimerRef.current = setTimeout(() => {
      setDealLingerVisible(false);
      setIsCardExpanding(false);
      setDealMode('initial');
      dealLingerTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => () => {
    if (dealLingerTimerRef.current) clearTimeout(dealLingerTimerRef.current);
    if (dorsoBridgeTimerRef.current) clearTimeout(dorsoBridgeTimerRef.current);
  }, []);

  // Handle NO click - close and reopen mask before showing card detail
  const handleNo = useCallback(() => {
    localStorage.setItem('arlequin_answered', '1');
    pendingCardStageRef.current = true;
    setStage(STAGES.NONE);
    if (onRequestMaskAnimation) {
      onRequestMaskAnimation();
    }
  }, [onRequestMaskAnimation]);

  // Handle close button from card stage - go back to grid
  const handleCardClose = useCallback(() => {
    setStage(STAGES.GRID);
  }, []);

  const handleEscudoClick = useCallback(() => {
    if (stage === STAGES.GRID) {
      setCollectPurpose('close');
      setStage(STAGES.COLLECTING);
      return;
    }
    setIsShrinkingOut(true);
    setTimeout(() => {
      setIsShrinkingOut(false);
      if (onReset) onReset();
    }, 380);
  }, [onReset, stage]);

  const handleCollectComplete = useCallback(() => {
    if (collectPurpose === 'openCard') {
      setPreloadCard(null);
      setStage(STAGES.CARD_DETAIL);
    } else {
      if (onReset) onReset();
    }
  }, [collectPurpose, onReset]);

  // Handle grid card pre-click - preload images in background
  const handleGridCardPreClick = useCallback((cardIndex) => {
    setPreloadCard(cardIndex);
  }, []);

  // Grid card click: run collect animation first, then open card detail.
  const handleGridCardClick = useCallback((cardIndex) => {
    setPreloadCard(cardIndex); // keep preloading during the ~830ms collect
    setSelectedCard(cardIndex);
    setCardFromGrid(true);
    setIsCardExpanding(false);
    setCollectPurpose('openCard');
    setStage(STAGES.COLLECTING);
  }, []);

  const handleCardExpandStart = useCallback(() => {
    setIsCardExpanding(true);
  }, []);

  const handleDealComplete = useCallback(() => {
    setIsCardExpanding(false);
  }, []);

  const handleCardDetailCloseStart = useCallback(() => {
    setIsCardExpanding(true);
  }, []);

  const handleCardDetailClose = useCallback(() => {
    const wasFromGrid = cardFromGrid;
    setSelectedCard(null);
    setCardFromGrid(false);
    setDealMode(wasFromGrid ? 'fromCardClose' : 'initial');
    setStage(STAGES.DEALING);

    if (wasFromGrid) {
      // Show a grid-card-sized dorso at center to bridge the gap between
      // the canvas disappearing and CDA's deck becoming visible (~200ms mount).
      if (dorsoBridgeTimerRef.current) clearTimeout(dorsoBridgeTimerRef.current);
      setDorsoBridgeVisible(true);
      setDorsoBridgeFading(false);
      // Start fading at 200ms, complete fade at 400ms — aligns with CDA
      // starting its deal (~200ms after mount with skipGrow=true).
      dorsoBridgeTimerRef.current = setTimeout(() => {
        setDorsoBridgeFading(true);
        dorsoBridgeTimerRef.current = setTimeout(() => {
          setDorsoBridgeVisible(false);
          setDorsoBridgeFading(false);
        }, 200);
      }, 200);
    }
  }, [cardFromGrid]);

  // Handle go-to-contact from CardQueEsArlequin last page
  const handleGoToContact = useCallback(() => {
    setSelectedCard(4);
    setCardFromGrid(true); // instant start, no delay
    setIsCardExpanding(false);
  }, []);

  // Render current stage content
  const renderStageContent = () => {
    switch (stage) {
      case STAGES.QUESTION:
        return (
          <QuestionStage
            onYes={handleYes}
            onNo={handleNo}
            isDarkMode={isDarkMode}
          />
        );
      case STAGES.CARD:
        return (
          <CardStage
            onClose={handleCardClose}
            isDarkMode={isDarkMode}
          />
        );
      case STAGES.CARD_DETAIL: {
        const CardComponent = CARD_COMPONENTS[selectedCard];
        if (CardComponent) {
          return (
            <CardComponent
              isDarkMode={isDarkMode}
              onClose={handleCardDetailClose}
              onCloseStart={handleCardDetailCloseStart}
              fromGrid={cardFromGrid}
              isLowEnd={isLowEnd}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        }
        return null;
      }
      default:
        return null;
    }
  };

  const showEscudo = phase === 'contentVisible';

  return (
    <div className="arlequin-mask-system ready">
      {/* Preload only the hovered card; module-level caches in each component
          ensure the active instance finds images ready without re-fetching. */}
      {preloadCard !== null && (() => {
        const Preload = CARD_COMPONENTS[preloadCard];
        return Preload ? <Preload key={`preload-${preloadCard}`} preload={true} isDarkMode={isDarkMode} /> : null;
      })()}
      {showEscudo && (
        <ArlequinEscudo
          onClick={handleEscudoClick}
          isDarkMode={isDarkMode}
          minimized={isCardExpanding}
        />
      )}

      <ArlequinMask
        isDarkMode={isDarkMode}
        phase={phase}
        onTransitionEnd={onMaskTransitionEnd}
      />

      {stage !== STAGES.MASK_SHOWING && stage !== STAGES.NONE && (
        <div className={`mask-content${isShrinkingOut ? ' shrinking-out' : ''}`}>
          {/* CardDealAnimation rendered FIRST so it sits behind GridStage during
              the linger window. Once GridStage is mounted, it paints the cards
              (with text overlay) on top — when CardDealAnimation unmounts there
              is no paint gap because GridStage has already taken over the same
              coordinates. */}
          {(stage === STAGES.DEALING || dealLingerVisible) && (
            <CardDealAnimation
              isDarkMode={isDarkMode}
              onDealComplete={handleDealAnimationComplete}
              skipGrow={dealMode === 'fromCardClose'}
            />
          )}
          {stage === STAGES.GRID && (
            <GridStage
              onCardClick={handleGridCardClick}
              onCardPreClick={handleGridCardPreClick}
              onExpandStart={handleCardExpandStart}
              onDealComplete={handleDealComplete}
              isDarkMode={isDarkMode}
              dealKey={dealKey}
            />
          )}
          {stage === STAGES.COLLECTING && (
            <CardCollectAnimation
              isDarkMode={isDarkMode}
              onCollectComplete={handleCollectComplete}
              purpose={collectPurpose}
            />
          )}
          {/* Dorso bridge: covers the ~200ms gap between close animation end and
              CDA deck appearing. Sized to match a grid card so the visual
              transition from "close → small card at center → deal" is seamless. */}
          {dorsoBridgeVisible && (
            <div
              className={`dorso-bridge${isDarkMode ? ' dark' : ''}`}
              style={{
                opacity: dorsoBridgeFading ? 0 : 1,
                transition: dorsoBridgeFading ? 'opacity 0.2s ease-out' : 'none',
              }}
            >
              <img
                src={`/Cartas/00000_arlequin_dorso_${isDarkMode ? 'dark' : 'clear'}.avif`}
                alt=""
              />
            </div>
          )}
          {renderStageContent()}
        </div>
      )}
    </div>
  );
}

export default ArlequinMaskSystem;
export { STAGES };

