import './FooterBanner.css';

function FooterBanner({ isDarkMode }) {
  const src = isDarkMode
    ? '/Cartas/arlequin_banner_zocalo_dark.avif'
    : '/Cartas/arlequin_banner_zocalo_clear.avif';

  return (
    <div
      className="footer-banner"
      style={{ backgroundImage: `url(${src})` }}
      role="img"
      aria-label="Footer banner"
    />
  );
}

export default FooterBanner;
