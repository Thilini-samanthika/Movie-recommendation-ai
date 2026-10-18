import React, { useState } from 'react';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import ContinueWatching from '../components/ContinueWatching';
import { useAuth } from '../context/AuthContext';

const HomePage = ({
  movies = [],
  loading = false,
  favorites = [],
  watchlist = [],
  aiRecommendations = [],
  onToggleFavorite,
  onToggleWatchlist,
  onSelectMovie,
  onNavigate,
  onSearchSubmit,
  onPlayFilm,
  onToast,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [heroSearchInput, setHeroSearchInput] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearchInput.trim() && onSearchSubmit) {
      onSearchSubmit(heroSearchInput.trim());
    } else if (onNavigate) {
      onNavigate('catalog');
    }
  };

  // Curated collections from real database records
  const highlyRated = [...movies]
    .filter((m) => m.rating != null && m.rating >= 4.0)
    .slice(0, 10);

  const sciFiAction = [...movies]
    .filter((m) => {
      const g = (m.genre || '').toLowerCase();
      return g.includes('sci-fi') || g.includes('action');
    })
    .slice(0, 10);

  // Featured Hero movie (e.g. first highly rated or first movie)
  const heroMovie = highlyRated[0] || movies[0] || {
    title: 'Toy Story',
    genre: 'Adventure | Animation | Comedy',
    releaseYear: 1995,
    description: 'A little boy named Andy loves to be in his room, making his toys play together. When Andy leaves his room, the toys come to life and have their own adventures.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
  };

  return (
    <div className="fade-in">
      {/* ==================== HERO SECTION ==================== */}
      <section
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '50px',
          backgroundColor: '#0d0f17',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Background Gradient & Artwork */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 75% 30%, rgba(229, 9, 20, 0.22) 0%, rgba(7, 8, 11, 0.95) 75%), url(${heroMovie.posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />

        {/* Hero Overlay */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '60px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                border: '1px solid var(--border-glow)',
                color: 'var(--primary-red-hover)',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: '800',
                letterSpacing: '1px',
                marginBottom: '18px',
              }}
            >
              <span>✦</span>
              <span>INTELLIGENT CINEMA DISCOVERY</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 54px)',
                fontWeight: '900',
                lineHeight: '1.1',
                marginBottom: '16px',
                color: '#ffffff',
              }}
            >
              Discover Cinema Through{' '}
              <span
                style={{
                  background: 'var(--primary-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AI Precision
              </span>
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-dim)',
                lineHeight: '1.6',
                maxWidth: '560px',
                marginBottom: '32px',
              }}
            >
              Explore 9,700+ curated catalog films with hybrid content-based vector similarity and collaborative filtering. Stream authorized open movies legally without subscription paywalls.
            </p>

            {/* Hero Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(18, 21, 32, 0.85)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 8px 6px 20px',
                maxWidth: '520px',
                marginBottom: '28px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              <input
                type="text"
                placeholder="Search by title, actor, or genre..."
                value={heroSearchInput}
                onChange={(e) => setHeroSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px 24px',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.35)',
                }}
              >
                Search
              </button>
            </form>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('catalog')}
                style={{
                  background: 'var(--primary-gradient)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 4px 16px rgba(229, 9, 20, 0.35)',
                }}
              >
                Explore Catalog →
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('ai-hub')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 22px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                ✦ AI Recommender
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('streaming')}
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '700',
                  fontSize: '14px',
                }}
              >
                ▶ Watch Free Films
              </button>
            </div>
          </div>

          {/* Featured Spotlight Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              onClick={() => onSelectMovie && onSelectMovie(heroMovie)}
              style={{
                maxWidth: '300px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: 'rgba(18, 21, 32, 0.85)',
                border: '1px solid var(--border-glow)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                cursor: 'pointer',
                transform: 'rotate(-2deg)',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotate(-2deg) scale(1)'; }}
            >
              <img
                src={heroMovie.posterUrl}
                alt={heroMovie.title}
                style={{ width: '100%', height: '360px', objectFit: 'cover' }}
              />
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--primary-red-hover)', fontWeight: '800' }}>
                    SPOTLIGHT PICK
                  </span>
                  {heroMovie.rating && (
                    <span style={{ color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '700' }}>
                      ★ {Number(heroMovie.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>
                  {heroMovie.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {heroMovie.genre}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CONTINUE WATCHING ROW ==================== */}
      <ContinueWatching onPlayFilm={onPlayFilm} onToast={onToast} />

      {/* ==================== AI PERSONALIZED SECTION (FOR LOGGED IN USERS) ==================== */}
      {isAuthenticated && (
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-red-hover)', letterSpacing: '1px' }}>
                RECOMMENDED FOR YOU
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>
                Personalized Picks for {user?.username}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-red-hover)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              View Analytics →
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {aiRecommendations.length > 0 ? (
              aiRecommendations.slice(0, 5).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isFavorite={favorites.includes(movie.id)}
                  isInWatchlist={watchlist.some((w) => w.id === movie.id || w.movie?.id === movie.id)}
                  isWatched={watchlist.some((w) => (w.id === movie.id || w.movie?.id === movie.id) && w.watched)}
                  onToggleFavorite={onToggleFavorite}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectMovie={onSelectMovie}
                />
              ))
            ) : (
              // Fallback to top rated when personalized queue is computing
              highlyRated.slice(0, 5).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isFavorite={favorites.includes(movie.id)}
                  isInWatchlist={watchlist.some((w) => w.id === movie.id || w.movie?.id === movie.id)}
                  isWatched={watchlist.some((w) => (w.id === movie.id || w.movie?.id === movie.id) && w.watched)}
                  onToggleFavorite={onToggleFavorite}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectMovie={onSelectMovie}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* ==================== HIGHLY RATED & TRENDING SECTION ==================== */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Trending &amp; Critically Acclaimed</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Highest rated selections from the MovieLens indexed dataset.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('catalog')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-red-hover)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Explore all ({movies.length}) →
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {loading && movies.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : highlyRated.slice(0, 5).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isFavorite={favorites.includes(movie.id)}
                  isInWatchlist={watchlist.some((w) => w.id === movie.id || w.movie?.id === movie.id)}
                  isWatched={watchlist.some((w) => (w.id === movie.id || w.movie?.id === movie.id) && w.watched)}
                  onToggleFavorite={onToggleFavorite}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectMovie={onSelectMovie}
                />
              ))}
        </div>
      </section>

      {/* ==================== SCI-FI & ACTION COLLECTION ==================== */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Sci-Fi &amp; High-Octane Action</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Futuristic adventures and thrilling cinematic blockbusters.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {loading && movies.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : sciFiAction.slice(0, 5).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isFavorite={favorites.includes(movie.id)}
                  isInWatchlist={watchlist.some((w) => w.id === movie.id || w.movie?.id === movie.id)}
                  isWatched={watchlist.some((w) => (w.id === movie.id || w.movie?.id === movie.id) && w.watched)}
                  onToggleFavorite={onToggleFavorite}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectMovie={onSelectMovie}
                />
              ))}
        </div>
      </section>

      {/* ==================== FREE LEGAL FILMS PREVIEW BANNER ==================== */}
      <section
        style={{
          backgroundColor: 'rgba(18, 21, 32, 0.75)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '800',
              }}
            >
              AUTHENTICATED LEGAL STREAMING
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
            Stream Authorized Open Films Free
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
            Watch full open-source cinematic short films from the Blender Foundation including Big Buck Bunny, Sintel, and Tears of Steel. Free account required for authenticated playback.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('streaming')}
          style={{
            backgroundColor: 'var(--accent-cyan)',
            color: '#071321',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          ▶ Explore Free Films
        </button>
      </section>
    </div>
  );
};

export default HomePage;
