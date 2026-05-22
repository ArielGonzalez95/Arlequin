import './FooterBanner.css';

function FooterBanner({ isDarkMode }) {
  const src = isDarkMode
    ? '/Cartas/arlequin_banner_zocalo_dark.avif'
    : '/Cartas/arlequin_banner_zocalo_clear.avif';

  return (
    <div className="footer-banner">
      <div
        className="footer-banner-scroll"
        style={{ backgroundImage: `url(${src})` }}
        role="img"
        aria-label="Footer banner"
      />
    </div>
  );
}

export default FooterBanner;
