import { useState, useEffect } from 'react';
import './ArlequinEscudo.css';

function ArlequinEscudo({ onClick, isDarkMode, minimized = false }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const themeSuffix = isDarkMode ? 'dark' : 'clear';

  // Preload escudo image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(true);
    img.src = `/Cartas/arlequin_escudo_${themeSuffix}.avif`;
  }, [themeSuffix]);

  if (!isLoaded) {
    return <div className="arlequin-escudo loading" />;
  }

  return (
    <div className={`arlequin-escudo${minimized ? ' minimized' : ''}`} onClick={onClick} title="Volver al inicio">
      <img 
        src={`/Cartas/arlequin_escudo_${themeSuffix}.avif`} 
        alt="Escudo"
        className="escudo-image"
      />
    </div>
  );
}

export default ArlequinEscudo;

