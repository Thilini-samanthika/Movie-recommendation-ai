import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({
  activeTab,
  setActiveTab,
  favoritesCount = 0,
  watchlistCount = 0,
}) => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navItemStyle = (tab) => {
    const isActive = activeTab === tab;
    return {
      background: 'none',
      border: 'none',
      color: isActive ? '#ffffff' : 'var(--text-muted)',
      fontWeight: isActive ? '700' : '500',
      fontSize: '14px',
      padding: '8px 14px',
      borderRadius: '8px',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s ease',
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    };
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(7, 8, 11, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        className="cin-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '16px',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              background: 'var(--primary-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '26px',
              fontWeight: '900',
              letterSpacing: '-0.5px',
            }}
          >
            CINEMA
          </span>
          <span
            style={{
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '900',
              letterSpacing: '0.5px',
              boxShadow: '0 2px 10px rgba(229, 9, 20, 0.4)',
            }}
          >
            AI
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px',
          }}
          className="desktop-nav"
        >
          <button type="button" onClick={() => handleNavClick('home')} style={navItemStyle('home')}>
            Home
          </button>
          <button type="button" onClick={() => handleNavClick('catalog')} style={navItemStyle('catalog')}>
            Discover Movies
          </button>
          <button type="button" onClick={() => handleNavClick('ai-hub')} style={navItemStyle('ai-hub')}>
            AI Recommendations
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('streaming')}
            style={{
              ...navItemStyle('streaming'),
              color: activeTab === 'streaming' ? '#ffffff' : 'var(--accent-cyan)',
            }}
          >
            Watch Free Films
          </button>

          {isAuthenticated && (
            <>
              <button type="button" onClick={() => handleNavClick('dashboard')} style={navItemStyle('dashboard')}>
                Dashboard
              </button>
              <button type="button" onClick={() => handleNavClick('favorites')} style={navItemStyle('favorites')}>
                Favorites
                {favoritesCount > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      backgroundColor: 'rgba(229, 9, 20, 0.25)',
                      color: 'var(--primary-red-hover)',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '800',
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
              <button type="button" onClick={() => handleNavClick('watchlist')} style={navItemStyle('watchlist')}>
                Watchlist
                {watchlistCount > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      backgroundColor: 'rgba(6, 182, 212, 0.25)',
                      color: 'var(--accent-cyan)',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '800',
                    }}
                  >
                    {watchlistCount}
                  </span>
                )}
              </button>
              <button type="button" onClick={() => handleNavClick('profile')} style={navItemStyle('profile')}>
                Profile
              </button>
            </>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              style={{
                ...navItemStyle('admin'),
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                backgroundColor: activeTab === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              }}
            >
              ⚙️ Admin
            </button>
          )}
        </nav>

        {/* Right Section: Auth & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'border-color 0.2s',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                style={{
                  background: 'var(--primary-gradient)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(229, 9, 20, 0.3)',
                }}
              >
                Register
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => handleNavClick('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isAdmin ? 'var(--accent-gold)' : 'var(--primary-red)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                  {user?.username}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '22px',
              padding: '6px',
              display: 'none',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(10, 12, 18, 0.98)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '16px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          className="mobile-drawer"
        >
          <button type="button" onClick={() => handleNavClick('home')} style={navItemStyle('home')}>
            Home
          </button>
          <button type="button" onClick={() => handleNavClick('catalog')} style={navItemStyle('catalog')}>
            Discover Movies
          </button>
          <button type="button" onClick={() => handleNavClick('ai-hub')} style={navItemStyle('ai-hub')}>
            AI Recommendations
          </button>
          <button type="button" onClick={() => handleNavClick('streaming')} style={navItemStyle('streaming')}>
            Watch Free Films
          </button>

          {isAuthenticated && (
            <>
              <button type="button" onClick={() => handleNavClick('dashboard')} style={navItemStyle('dashboard')}>
                Dashboard
              </button>
              <button type="button" onClick={() => handleNavClick('favorites')} style={navItemStyle('favorites')}>
                Favorites ({favoritesCount})
              </button>
              <button type="button" onClick={() => handleNavClick('watchlist')} style={navItemStyle('watchlist')}>
                Watchlist ({watchlistCount})
              </button>
              <button type="button" onClick={() => handleNavClick('profile')} style={navItemStyle('profile')}>
                My Profile
              </button>
            </>
          )}

          {isAdmin && (
            <button type="button" onClick={() => handleNavClick('admin')} style={navItemStyle('admin')}>
              ⚙️ Admin Panel
            </button>
          )}
        </div>
      )}

      {/* Inline styles for responsive media query toggle */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
