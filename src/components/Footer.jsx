import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import siteConfig from "../config/siteConfig.js";
import "./Footer.css";

const quickLinks = [
  { to: "/", label: "मुख्य पृष्ठ" },
  { to: "/news", label: "विभागीय परीक्षा संबंधित अध्ययन सामग्री" },
  { to: "/government-orders", label: "सरकारी आदेश एवं निर्देश" },
  { to: "/jobs", label: "सरकारी भर्तियाँ एवं रोजगार जानकारी" },
  { to: "/schemes", label: "Treasury / e-Salary / HRMS संबंधित जानकारी" },
  { to: "/proforma-files", label: "सरकारी कर्मचारियों के उपयोगी प्रोफॉर्मा एवं फाइलें" },
  { to: "/departments", label: "विभाग" },
  { to: "#footer-contact", label: "संपर्क करें" },
];

function Footer({ onDevClick }) {
  const handleQuickLinkClick = (e, link) => {
    if (link.to.startsWith("#")) {
      e.preventDefault();
      const element = document.getElementById("footer-contact");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (["/news", "/schemes", "/departments", "/proforma-files"].includes(link.to)) {
      e.preventDefault();
      if (onDevClick) {
        onDevClick(link.label);
      }
    }
  };

  return (
    <footer className="site-footer">
      {/* Accent strip: Green -> White -> Orange */}
      <div className="footer-accent-strip" />

      <div className="site-footer__grid footer-container footer-main">
        {/* Column 1: Brand / About */}
        <div className="site-footer__about footer-column">
          <Link to="/" className="site-footer__logo-link footer-logo">
            <Logo variant="footer" />
          </Link>
          <h3 className="site-footer__brand-title footer-brand-title">
            हरियाणा सरकार के{" "}
            <span className="highlight-orange">नियम व निर्देश</span>
          </h3>
          <div className="site-footer__deco-line" />
          <p className="site-footer__desc footer-description">
            {siteConfig.description}
          </p>

          <div className="site-footer__socials footer-social">
            <a
              href={siteConfig.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-btn site-footer__social-btn--facebook"
              aria-label="Facebook Page"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-btn site-footer__social-btn--whatsapp"
              aria-label="WhatsApp Chat"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              href={siteConfig.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-btn site-footer__social-btn--twitter"
              aria-label="X (Twitter) Page"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="site-footer__col footer-column">
          <h4 className="site-footer__heading footer-heading">त्वरित लिंक</h4>
          <ul className="site-footer__links-list footer-links">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  onClick={(e) => handleQuickLinkClick(e, link)}
                  className="site-footer__link-item"
                >
                  <span className="site-footer__bullet">›</span> {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Important Links */}
        <div className="site-footer__col footer-column">
          <h4 className="site-footer__heading footer-heading">
            महत्वपूर्ण लिंक
          </h4>
          <ul className="site-footer__links-list footer-links">
            {siteConfig.importantLinks.map((link) => (
              <li key={link.title}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__link-item"
                >
                  <span className="site-footer__bullet">›</span> {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div id="footer-contact" className="site-footer__col footer-column">
          <h4 className="site-footer__heading footer-heading">संपर्क सूत्र</h4>
          <ul className="site-footer__contact">
            <li className="contact-item">
              <div className="site-footer__contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="site-footer__contact-text">
                <span className="site-footer__label">कार्यालय का पता</span>
                {siteConfig.address}
              </div>
            </li>
            <li className="contact-item">
              <div className="site-footer__contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="site-footer__contact-text">
                <span className="site-footer__label">ईमेल आईडी</span>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="site-footer__interactive-link"
                >
                  {siteConfig.email}
                </a>
              </div>
            </li>
            <li className="contact-item">
              <div className="site-footer__contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="site-footer__contact-text">
                <span className="site-footer__label">हेल्पलाइन नंबर</span>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="site-footer__interactive-link"
                >
                  {siteConfig.phone}
                </a>
              </div>
            </li>
            <li className="contact-item">
              <div className="site-footer__contact-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="site-footer__contact-text">
                <span className="site-footer__label">कार्य समय</span>
                {siteConfig.officeHours}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom-wrapper">
        <div className="site-footer__bottom footer-container footer-bottom">
          <div className="site-footer__copyright">
            <p>
              © {siteConfig.year} <strong>{siteConfig.companyName}</strong>.
              सर्वाधिकार सुरक्षित।
            </p>
            <p className="site-footer__trust">
              ✓ विश्वसनीय और उपयोगी सरकारी जानकारी
            </p>
          </div>
          <div className="site-footer__meta">
            <span className="site-footer__version">
              संस्करण: {siteConfig.version}
            </span>
            <span className="site-footer__separator">|</span>
            <span className="site-footer__credit">
              Developed by{" "}
              <a
                href={siteConfig.developedByUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.developedBy}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
