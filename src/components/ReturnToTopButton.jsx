import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ReturnToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="return-to-top-btn"
      aria-label="Return to top"
      style={{
        position: 'fixed',
        bottom: '6.5rem',
        right: '1.75rem',
        zIndex: 40,
        background: 'linear-gradient(135deg, #D42B2B, #A01E1E)',
        color: 'white',
        border: '1px solid rgba(200,200,212,0.15)',
        borderRadius: '50%',
        width: '3rem',
        height: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(212,43,43,0.4)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <ArrowUp size={20} />
      <style>{`
        .return-to-top-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 30px rgba(212,43,43,0.55);
          background: linear-gradient(135deg, #FF3030, #D42B2B) !important;
        }
        .return-to-top-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </button>
  );
}
