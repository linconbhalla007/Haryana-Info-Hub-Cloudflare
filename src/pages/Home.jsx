import React, { useState, useEffect, useMemo } from "react";
import HeroBanner from "../components/HeroBanner.jsx";
import SectionCard from "../components/SectionCard.jsx";
import { getPublicHomepageSections } from "../services/homepageSectionService.js";
import "./pages.css";
import "./Home.css";

function Home({ onDevClick }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPublicHomepageSections()
      .then((data) => {
        if (isMounted) {
          setSections(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSections([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeCtas = useMemo(() => {
    if (loading || !Array.isArray(sections)) return [];
    return sections
      .filter((item) => {
        if (!item || item.enabled !== true || item.type !== "cta") return false;
        const cfg = item.config;
        if (!cfg || typeof cfg !== "object") return false;
        if (!cfg.title || typeof cfg.title !== "string") return false;
        if (!cfg.whatsappNumber || typeof cfg.whatsappNumber !== "string") return false;
        if (!cfg.whatsappMessage || typeof cfg.whatsappMessage !== "string") return false;
        return true;
      })
      .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
  }, [sections, loading]);

  return (
    <>
      <HeroBanner />

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">मुख्य सेवाएं</span>
            <h2 className="section-title">आपको क्या चाहिए, यहां खोजें</h2>
          </div>
        </div>

        <div className="home-cards-grid">
          {/* Card 1: Departmental Exams Study Material */}
          <SectionCard
            to="/news"
            accent="navy"
            title="विभागीय परीक्षा संबंधित अध्ययन सामग्री"
            items={["परीक्षा पाठ्यक्रम / Syllabus", "पिछले वर्षों के प्रश्न पत्र", "अध्ययन नोट्स / Study Notes"]}
            buttonLabel="View Study Material"
            icon={<NewsIcon />}
            onClick={() => onDevClick && onDevClick("विभागीय परीक्षा संबंधित अध्ययन सामग्री")}
          />

          {/* Card 2: Government Orders & Directives */}
          <SectionCard
            to="/government-orders"
            accent="green"
            title="सरकारी आदेश एवं निर्देश"
            items={["नए आदेश", "पुराने आदेश", "विभागीय निर्देश"]}
            buttonLabel="View Government Orders"
            icon={<OrderIcon />}
          />

          {/* Card 3: Recruitment & Careers */}
          <SectionCard
            to="/jobs"
            accent="saffron"
            title="सरकारी भर्तियाँ एवं रोजगार जानकारी"
            items={["सरकारी नौकरियां", "भर्ती अधिसूचना", "परीक्षा अपडेट"]}
            buttonLabel="View Jobs"
            icon={<JobIcon />}
          />

          {/* Card 4: Treasury / E-Salary / HRMS Info */}
          <SectionCard
            to="/schemes"
            accent="navy"
            title="Treasury / e-Salary / HRMS संबंधित जानकारी"
            items={["पेस्लिप और जीपीएफ रिपोर्ट", "सर्विस बुक विवरण / Service Book", "HRMS लॉगइन गाइड"]}
            buttonLabel="View HRMS Info"
            icon={<SchemeIcon />}
            onClick={() => onDevClick && onDevClick("Treasury / e-Salary / HRMS संबंधित जानकारी")}
          />

          {/* Card 5: Useful Employee Forms & Files */}
          <SectionCard
            to="/proforma-files"
            accent="green"
            title="सरकारी कर्मचारियों के उपयोगी प्रोफॉर्मा एवं फाइलें"
            items={["Medical Reimbursement", "LTC (Leave Travel Concession)", "GPF / NPS विवरण", "Pension फॉर्म एवं नियम"]}
            buttonLabel="View Proformas"
            icon={<FileIcon />}
            onClick={() => onDevClick && onDevClick("सरकारी कर्मचारियों के उपयोगी प्रोफॉर्मा एवं फाइलें")}
          />
        </div>
      </section>

      {/* Loading Skeleton while CTA API is fetching */}
      {loading && (
        <section className="whatsapp-cta-section container">
          <div className="whatsapp-cta-border-wrap whatsapp-cta-skeleton-wrap">
            <div className="whatsapp-cta-card whatsapp-cta-skeleton-card">
              <div className="whatsapp-cta-left-icon" aria-hidden="true">
                <div className="whatsapp-cta-skeleton-icon"></div>
              </div>
              <div className="whatsapp-cta-content">
                <div className="whatsapp-cta-skeleton-text"></div>
              </div>
              <div className="whatsapp-cta-action">
                <div className="whatsapp-cta-skeleton-button"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp Help CTA Banners (API-driven) */}
      {!loading && activeCtas.map((item, index) => {
        const cleanNumber = item.config.whatsappNumber.replace(/[^\d]/g, "");
        const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(item.config.whatsappMessage)}`;
        const buttonLabel = item.config.buttonText || "WhatsApp पर सहायता लें";

        return (
          <section className="whatsapp-cta-section container" key={item._id || item.key || index}>
            <div className="whatsapp-cta-border-wrap">
              <div className="whatsapp-cta-card">

                {/* Left side WhatsApp brand icon */}
                <div className="whatsapp-cta-left-icon" aria-hidden="true">
                  <WhatsAppIcon className="whatsapp-icon-pulse" />
                </div>

                {/* Middle Plain Clean Announcement Text */}
                <div className="whatsapp-cta-content">
                  <p className="whatsapp-cta-text">
                    {item.config.title}
                  </p>
                </div>

                {/* Right side WhatsApp Button (The ONLY clickable element) */}
                <div className="whatsapp-cta-action">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-cta-button"
                    aria-label={buttonLabel}
                  >
                    <WhatsAppIcon className="whatsapp-btn-icon" />
                    <span>{buttonLabel}</span>
                    <span className="whatsapp-btn-arrow" aria-hidden="true">→</span>
                  </a>
                </div>

              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h13a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
        stroke="white"
        strokeWidth="1.7"
      />
      <path
        d="M17 6V4a2 2 0 00-2-2H6a2 2 0 00-2 2v13"
        stroke="white"
        strokeWidth="1.7"
      />
      <path
        d="M7 9h9M7 12h9M7 15h5"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
        stroke="white"
        strokeWidth="1.7"
      />
      <path d="M14 3v5h5" stroke="white" strokeWidth="1.7" />
      <path
        d="M8.5 13h7M8.5 16.5h7M8.5 9.5h3"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function JobIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3.5"
        y="7"
        width="17"
        height="12"
        rx="1.5"
        stroke="white"
        strokeWidth="1.7"
      />
      <path
        d="M8 7V5.5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0116 5.5V7"
        stroke="white"
        strokeWidth="1.7"
      />
      <path d="M3.5 12h17" stroke="white" strokeWidth="1.7" />
    </svg>
  );
}

function SchemeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="white" strokeWidth="1.7" />
      <path d="M14 2v6h6" stroke="white" strokeWidth="1.7" />
      <path d="M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default Home;
