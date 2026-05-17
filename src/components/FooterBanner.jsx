import { useEffect, useRef } from 'react';
import './FooterBanner.css';

function FooterBanner({ isDarkMode }) {
  const bannerRef = useRef(null);
  
  return (
    <div className="footer-banner">
      <div className="footer-banner-track">
        <img
          src={isDarkMode ? '/Cartas/arlequin_banner_zocalo_dark.avif' : '/Cartas/arlequin_banner_zocalo_clear.avif'}
          alt="Footer banner"
          className="footer-banner-image"
          loading="lazy"
          decoding="async"
        />
        <img
          src={isDarkMode ? '/Cartas/arlequin_banner_zocalo_dark.avif' : '/Cartas/arlequin_banner_zocalo_clear.avif'}
          alt="Footer banner"
          className="footer-banner-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

export default FooterBanner;

