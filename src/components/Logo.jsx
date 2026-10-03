import React, { useState } from 'react';
import siteConfig from '../config/siteConfig.js';
import './Logo.css';

/**
 * Renders the real logo file if it exists at src/config/siteConfig.js ->
 * logoPath. If that file hasn't been added yet, falls back to a clean
 * text/monogram wordmark so the header never shows a broken image.
 *
 * To use your real logo: drop the file at
 * public/logo/haryana-info-hub-logo.svg (or update `logoPath` in
 * src/config/siteConfig.js to point at your file) — no other changes needed.
 */
function Logo({ variant = 'header' }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src={siteConfig.logoPath}
        alt={siteConfig.name}
        className={`logo-img logo-img--${variant}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className={`logo-fallback logo-fallback--${variant}`}>
      <span className="logo-fallback__mark">हिं</span>
      <span className="logo-fallback__text">
        <strong>Haryana</strong>
        <em>Info Hub</em>
      </span>
    </div>
  );
}

export default Logo;
