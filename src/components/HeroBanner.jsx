import React from 'react';
import siteConfig from '../config/siteConfig.js';
import './HeroBanner.css';

/**
 * Renders the brand hero banner image responsively.
 * As the banner image itself has the logo and text baked-in,
 * we display it cleanly without overlaying HTML text or inputs.
 */
function HeroBanner() {
  return (
    <div className="hero-banner-container">
      <img
        src={siteConfig.bannerImagePath}
        alt={siteConfig.name}
        className="hero-banner-img"
      />
    </div>
  );
}

export default HeroBanner;
