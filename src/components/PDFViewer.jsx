import React, { useEffect, useState } from 'react';
import './PDFViewer.css';

/**
 * Renders a PDF inline (desktop) using <iframe>, since browser PDF
 * rendering is inconsistent on mobile — there we show View/Download
 * buttons instead. Always shows both actions regardless of screen size.
 */
function PDFViewer({ src, title }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pdf-viewer">
      {!isMobile && (
        <div className="pdf-viewer__frame-wrap">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`}
            title={title}
            className="pdf-viewer__frame"
          />
        </div>
      )}

      {isMobile && (
        <div className="pdf-viewer__mobile-note">
          <p>मोबाइल डिवाइस पर PDF सीधा ब्राउज़र में सही तरह से नहीं खुल सकता।</p>
        </div>
      )}

      <div className="pdf-viewer__actions">
        <a href={src} target="_blank" rel="noreferrer" className="btn btn-outline">
          PDF खोलें
        </a>
        <a href={src} download className="btn btn-green">
          PDF डाउनलोड करें
        </a>
      </div>
    </div>
  );
}

export default PDFViewer;
