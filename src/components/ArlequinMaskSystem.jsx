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
  // When the deal animation ends we keep CardDealAnimation mounted for an
  // extra ~150 ms while GridStage paints in the same coordinates. Avoids
  // the unmount→mount gap that produced a one-frame "cards disappear" flash
  // on mobile Safari at the exact moment the text overlays became visible.
  const [dealLingerVisible, setDealLingerVisible] = useState(false);
  const dealLingerTimerRef = useRef(null);
  // Linger the card-detail component in DOM after its close animation fires
  // onClose() — keeps it mounted (fading canvas) while CardDealAnimation mounts
  // behind it, eliminating the blank-frame gap between the two stages.
  const [cardDetailLinger, setCardDetailLinger] = useState(false);
  const lingerCardRef = useRef(null);
  const cardDetailLingerTimerRef = useRef(null);
  // 'initial': normal deal with grow phase (logo → grid flow).
  // 'fromCardClose': skip the grow phase — the card canvas is fading out and
  //   the deck should be at full center size immediately to take its place.
  const [dealMode, setDealMode] = useState('initial');
  const [cardFromGrid, setCardFromGrid] = useState(false);
  const [isShrinkingOut, setIsShrinkingOut] = useState(false);
  const [preloadCard, setPreloadCard] = useState(null);
  const [isCardExpanding, setIsCardExpanding] = useState(false);
  const [dealKey, setDealKey] = useState(0);
  // Use ref for tracking "NO" flow - more reliable than state
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
      setCardDetailLinger(false);
      lingerCardRef.current = null;
      if (cardDetailLingerTimerRef.current) { clearTimeout(cardDetailLingerTimerRef.current); cardDetailLingerTimerRef.current = null; }
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
      setCardDetailLinger(false);
      lingerCardRef.current = null;
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
    // Reset the deal mode now that the deal is complete — the next deal (if
    // user re-opens & closes a card) will need to set it again from
    // handleCardDetailClose if applicable. Resetting here keeps the state
    // honest for any future open-from-logo path.
    setDealMode('initial');
    if (dealLingerTimerRef.current) clearTimeout(dealLingerTimerRef.current);
    dealLingerTimerRef.current = setTimeout(() => {
      setDealLingerVisible(false);
      // Restore escudo visibility AFTER the swap is done so its scale
      // transition doesn't compound with the card swap in the same frame.
      setIsCardExpanding(false);
      dealLingerTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => () => {
    if (dealLingerTimerRef.current) clearTimeout(dealLingerTimerRef.current);
    if (cardDetailLingerTimerRef.current) clearTimeout(cardDetailLingerTimerRef.current);
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

  // Handle clicking on escudo. If the user is on the GRID, run the
  // collect → shrink animation (reverse of CardDealAnimation) before
  // triggering the mask close. From any other stage, fall back to the
  // legacy mask-content shrink-out (there are no cards to gather).
  const handleEscudoClick = useCallback(() => {
    if (stage === STAGES.GRID) {
      setStage(STAGES.COLLECTING);
      return;
    }
    setIsShrinkingOut(true);
    setTimeout(() => {
      setIsShrinkingOut(false);
      if (onReset) onReset();
    }, 380);
  }, [onReset, stage]);

  // Called by CardCollectAnimation when the deck has fully gathered and
  // shrunk to a tiny invisible point at center — that's the moment we hand
  // off to the parent so the mask close animation runs over the empty stage.
  const handleCollectComplete = useCallback(() => {
    if (onReset) onReset();
  }, [onReset]);

  // Handle grid card pre-click - preload images in background
  const handleGridCardPreClick = useCallback((cardIndex) => {
    setPreloadCard(cardIndex);
  }, []);

  // Handle grid card click - show individual card
  const handleGridCardClick = useCallback((cardIndex) => {
    setPreloadCard(null);
    setSelectedCard(cardIndex);
    setCardFromGrid(true);
    setIsCardExpanding(false);
    setStage(STAGES.CARD_DETAIL);
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

  // Handle close from individual card detail.
  // The card's canvas has already faded to opacity 0 when this fires.
  // We keep the card component in the DOM (linger) for 400 ms so that
  // CardDealAnimation can mount and paint *behind* the invisible canvas
  // before the card unmounts — eliminates the blank-frame gap.
  const handleCardDetailClose = useCallback(() => {
    lingerCardRef.current = selectedCard;
    setCardDetailLinger(true);
    setSelectedCard(null);
    setCardFromGrid(false);
    setDealMode('fromCardClose');
    setStage(STAGES.DEALING);
    if (cardDetailLingerTimerRef.current) clearTimeout(cardDetailLingerTimerRef.current);
    cardDetailLingerTimerRef.current = setTimeout(() => {
      setCardDetailLinger(false);
      lingerCardRef.current = null;
      cardDetailLingerTimerRef.current = null;
    }, 400);
  }, [selectedCard]);

  // Handle go-to-contact from CardQueEsArlequin last page
  const handleGoToContact = useCallback(() => {
    setSelectedCard(4);
    setCardFromGrid(true); // instant start, no delay
    setIsCardExpanding(false);
  }, []);

  // Render current stage content
  const renderStageContent = () => {
    // Active card detail
    if (stage === STAGES.CARD_DETAIL && selectedCard !== null) {
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
    }

    // Post-close linger: keep the card in the DOM (its canvas is already
    // opacity:0) while CardDealAnimation mounts and paints behind it.
    if (cardDetailLinger && lingerCardRef.current !== null) {
      const CardComponent = CARD_COMPONENTS[lingerCardRef.current];
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
    }

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
            />
          )}
          {renderStageContent()}
        </div>
      )}
    </div>
  );
}

export default ArlequinMaskSystem;
export { STAGES };

