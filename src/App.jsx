import { useState, useEffect } from 'react'
import BackgroundAnimation from './components/BackgroundAnimation'
import ThemeToggleStar from './components/ThemeToggleStar'
import LogoAnimation from './components/LogoAnimation'
import ArlequinMaskSystem from './components/ArlequinMaskSystem'
import FooterBanner from './components/FooterBanner'
import { useLowEndDevice } from './hooks/useLowEndDevice'
import './App.css'

const THEME_STORAGE_KEY = 'themeMode';

const ANIMATION_PHASE = {
  HOME: 'home',
  LOGO_SHRINKING: 'logoShrinking',
  MASK_CLOSING: 'maskClosing',
  MASK_OPENING: 'maskOpening',
  CONTENT_VISIBLE: 'contentVisible',
  REVERSE_CLOSING: 'reverseClosing',
  REVERSE_OPENING: 'reverseOpening',
  LOGO_GROWING: 'logoGrowing'
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [phase, setPhase] = useState(ANIMATION_PHASE.HOME);
  const { isLowEnd, prefersReducedMotion } = useLowEndDevice();

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);


  const handleToggle = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLogoClick = () => {
    if (phase === ANIMATION_PHASE.HOME) {
      setPhase(ANIMATION_PHASE.LOGO_SHRINKING);
    }
  };

  const handleEscudoReset = () => {
    if (phase === ANIMATION_PHASE.CONTENT_VISIBLE) {
      setPhase(ANIMATION_PHASE.REVERSE_CLOSING);
    }
  };

  const handleMaskTransitionEnd = () => {
    if (phase === ANIMATION_PHASE.LOGO_SHRINKING) {
      setPhase(ANIMATION_PHASE.MASK_CLOSING);
      return;
    }

    if (phase === ANIMATION_PHASE.MASK_CLOSING) {
      setPhase(ANIMATION_PHASE.MASK_OPENING);
      return;
    }

    if (phase === ANIMATION_PHASE.MASK_OPENING) {
      setPhase(ANIMATION_PHASE.CONTENT_VISIBLE);
      return;
    }

    if (phase === ANIMATION_PHASE.REVERSE_CLOSING) {
      setPhase(ANIMATION_PHASE.REVERSE_OPENING);
      return;
    }

    if (phase === ANIMATION_PHASE.REVERSE_OPENING) {
      setPhase(ANIMATION_PHASE.LOGO_GROWING);
    }
  };

  const handleLogoGrowComplete = () => {
    setPhase(ANIMATION_PHASE.HOME);
  };

  // Handle request to close and reopen mask (for NO -> card animation)
  const handleRequestMaskAnimation = () => {
    if (phase === ANIMATION_PHASE.CONTENT_VISIBLE) {
      setPhase(ANIMATION_PHASE.MASK_CLOSING);
    }
  };

  const isLogoShrinking =
    phase === ANIMATION_PHASE.LOGO_SHRINKING ||
    phase === ANIMATION_PHASE.MASK_CLOSING ||
    phase === ANIMATION_PHASE.MASK_OPENING ||
    phase === ANIMATION_PHASE.CONTENT_VISIBLE ||
    phase === ANIMATION_PHASE.REVERSE_CLOSING ||
    phase === ANIMATION_PHASE.REVERSE_OPENING;

  const isLogoRestoring = phase === ANIMATION_PHASE.LOGO_GROWING;

  return (
    <div className="app">
      <BackgroundAnimation isDarkMode={isDarkMode} isLowEnd={isLowEnd} prefersReducedMotion={prefersReducedMotion} />
      <ThemeToggleStar isDarkMode={isDarkMode} onToggle={handleToggle} isLowEnd={isLowEnd} />

      <LogoAnimation
        isDarkMode={isDarkMode}
        onClick={handleLogoClick}
        isShrinking={isLogoShrinking}
        isRestoring={isLogoRestoring}
        isHidden={false}
        onRestoreComplete={handleLogoGrowComplete}
      />

      <ArlequinMaskSystem
        isDarkMode={isDarkMode}
        phase={phase}
        onReset={handleEscudoReset}
        onMaskTransitionEnd={handleMaskTransitionEnd}
        onRequestMaskAnimation={handleRequestMaskAnimation}
        isLowEnd={isLowEnd}
        prefersReducedMotion={prefersReducedMotion}
      />

      <FooterBanner isDarkMode={isDarkMode} />

      <main className="content" />
    </div>
  )
}

export default App
export { ANIMATION_PHASE };

