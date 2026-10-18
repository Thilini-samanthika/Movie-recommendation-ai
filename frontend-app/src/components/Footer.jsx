import React from 'react';

const Footer = ({ onNavigate }) => {
  return (
    <footer
      style={{
        marginTop: '80px',
        backgroundColor: 'var(--bg-darkest)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '50px 0 30px 0',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}
    >
      <div className="cin-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Col 1: Brand & Overview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  background: 'var(--primary-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '22px',
                  fontWeight: '900',
                }}
              >
                CINEMA
              </span>
              <span
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                }}
              >
                AI
              </span>
            </div>
            <p style={{ lineHeight: '1.6', color: 'var(--text-faint)' }}>
              Intelligent Movie Discovery and Recommendation Platform powered by Machine Learning algorithms, Spring Boot, MySQL, and authorized open legal streaming.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '14px', marginBottom: '14px', fontWeight: '700' }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('home')}
                style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('catalog')}
                style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                Discover Movies
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('ai-hub')}
                style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                AI Recommendations
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('streaming')}
                style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              >
                Watch Free Legal Films
              </button>
            </div>
          </div>

          {/* Col 3: Technology Architecture */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '14px', marginBottom: '14px', fontWeight: '700' }}>
              Architecture
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-faint)' }}>
              <span>Frontend: React 19 SPA, Modular CSS</span>
              <span>Backend: Spring Boot 3.3, REST APIs</span>
              <span>AI Service: Python FastAPI, TF-IDF + Collaborative</span>
              <span>Database: MySQL 8.0</span>
              <span>Reverse Proxy: Nginx, Docker Compose</span>
            </div>
          </div>

          {/* Col 4: Legal & Licensing */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '14px', marginBottom: '14px', fontWeight: '700' }}>
              Legal Streaming Notice
            </h4>
            <p style={{ lineHeight: '1.6', color: 'var(--text-faint)' }}>
              Open films (Big Buck Bunny, Sintel, Tears of Steel) are licensed under Creative Commons Attribution 3.0 by the Blender Foundation. Commercial catalog items are for discovery and algorithmic correlation only.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>© 2026 CINEMA AI — Intelligent Movie Recommendation System. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ color: 'var(--text-faint)' }}>Production-Grade Full-Stack Portfolio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
