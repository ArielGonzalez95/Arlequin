import { useState, useEffect, useCallback, useRef } from 'react';
import ArlequinMask from './ArlequinMask';
import ArlequinEscudo from './ArlequinEscudo';
import QuestionStage from './QuestionStage';
import CardStage from './CardStage';
import GridStage from './GridStage';
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
  GRID: 'grid',
  CARD_DETAIL: 'card_detail'
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
  onRequestMaskAnimation
}) {
  const [stage, setStage] = useState(STAGES.NONE);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardFromGrid, setCardFromGrid] = useState(false);
  const [isShrinkingOut, setIsShrinkingOut] = useState(false);
  const [preloadCard, setPreloadCard] = useState(null);
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
        setStage(hasAnswered ? STAGES.GRID : STAGES.QUESTION);
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

  // Handle YES click - go to grid
  const handleYes = useCallback(() => {
    localStorage.setItem('arlequin_answered', '1');
    setStage(STAGES.GRID);
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

  // Handle clicking on escudo - shrink content out first, then start reverse animation
  const handleEscudoClick = useCallback(() => {
    setIsShrinkingOut(true);
    setTimeout(() => {
      setIsShrinkingOut(false);
      if (onReset) onReset();
    }, 380);
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
    setStage(STAGES.CARD_DETAIL);
  }, []);

  // Handle close from individual card detail
  const handleCardDetailClose = useCallback(() => {
    setSelectedCard(null);
    setCardFromGrid(false);
    setStage(STAGES.GRID);
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
      case STAGES.GRID:
        return (
          <GridStage
            onCardClick={handleGridCardClick}
            onCardPreClick={handleGridCardPreClick}
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
              fromGrid={cardFromGrid}
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
  const PreloadComponent = preloadCard ? CARD_COMPONENTS[preloadCard] : null;

  return (
    <div className="arlequin-mask-system ready">
      {/* Pre-mount next card invisibly so images are cached before grid animates away */}
      {PreloadComponent && (
        <PreloadComponent preload={true} isDarkMode={isDarkMode} />
      )}
      {showEscudo && (
        <ArlequinEscudo
          onClick={handleEscudoClick}
          isDarkMode={isDarkMode}
        />
      )}

      <ArlequinMask
        isDarkMode={isDarkMode}
        phase={phase}
        onTransitionEnd={onMaskTransitionEnd}
      />

      {stage !== STAGES.MASK_SHOWING && stage !== STAGES.NONE && (
        <div className={`mask-content${isShrinkingOut ? ' shrinking-out' : ''}`}>
          {renderStageContent()}
        </div>
      )}
    </div>
  );
}

export default ArlequinMaskSystem;
export { STAGES };

