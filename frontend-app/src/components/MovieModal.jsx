import React, { useEffect } from 'react';
import ReviewSection from './ReviewSection';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

const MovieModal = ({
  movie,
  isFavorite = false,
  isInWatchlist = false,
  isWatched = false,
  onClose,
  onToggleFavorite,
  onToggleWatchlist,
  onToggleWatched,
  onFindSimilar,
  onToast,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!movie) return null;
  const aiExplanation =
  movie.explanation &&
  typeof movie.explanation === "object" &&
  !Array.isArray(movie.explanation)
    ? movie.explanation
    : null;

const explanationText =
  typeof movie.explanation === "string"
    ? movie.explanation
    : aiExplanation?.explanation ?? "";

const matchedGenres =
  aiExplanation?.matched_genres ?? movie.matched_genres ?? [];

const confidence =
  aiExplanation?.confidence ?? movie.confidence;

  const genreList = String(movie.genre || '')
    .split(/[|,]/)
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 10, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          ✕
        </button>

        {/* Modal Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            padding: '36px',
          }}
        >
          {/* Poster Section */}
          <div style={{ textAlign: 'center' }}>
            <img
              src={movie.posterUrl || FALLBACK_POSTER}
              alt={`${movie.title} poster`}
              onError={(e) => { e.currentTarget.src = FALLBACK_POSTER; }}
              style={{
                width: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>

          {/* Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {movie.releaseYear || 'Cinema Release'}
                </span>
                {movie.rating ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}
                  >
                    ★ {Number(movie.rating).toFixed(1)} / 5.0
                  </span>
                ) : null}
                {isWatched && (
                  <span
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--accent-emerald)',
                      border: '1px solid var(--accent-emerald)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                    }}
                  >
                    ✓ WATCHED
                  </span>
                )}
              </div>

              <h2
                id="movie-modal-title"
                style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1.2', color: 'var(--text-main)' }}
              >
                {movie.title}
              </h2>
            </div>

            {/* Genre Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {genreList.map((g) => (
                <span
                  key={g}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-dim)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Why Recommended / Explainable AI Block */}
            {(movie.explanation || (movie.reasons && movie.reasons.length > 0)) && (
              <div
                style={{
                  backgroundColor: 'rgba(229, 9, 20, 0.08)',
                  border: '1px solid rgba(229, 9, 20, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🧠</span>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-red-hover)', margin: 0, letterSpacing: '0.5px' }}>
                      WHY RECOMMENDED FOR YOU
                    </h4>
                  </div>
                  {confidence != null && (
                    <span
                      style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        color: 'var(--accent-cyan)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        padding: '1px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                    {confidence} Confidence
                    </span>
                  )}
                </div>

                {explanationText && (
  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
    {explanationText}
  </p>
)}

                {movie.reasons && movie.reasons.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                    {movie.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                )}

                {Array.isArray(matchedGenres) && matchedGenres.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Matched Genres:</span>
                    {matchedGenres.map((g) => (
                      <span
                        key={g}
                        style={{
                          backgroundColor: 'rgba(229, 9, 20, 0.18)',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Synopsis */}
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Overview
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>
                {movie.description || movie.overview || 'No description available for this title in the catalog.'}
              </p>
            </div>

            {/* Metadata (Director & Cast if present) */}
            {(movie.director || movie.cast) && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {movie.director && (
                  <p>
                    <strong style={{ color: 'var(--text-main)' }}>Director:</strong> {movie.director}
                  </p>
                )}
                {movie.cast && (
                  <p>
                    <strong style={{ color: 'var(--text-main)' }}>Cast:</strong> {movie.cast}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onToggleFavorite && onToggleFavorite(movie.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: isFavorite ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isFavorite ? 'var(--primary-red-hover)' : 'var(--text-main)',
                    border: isFavorite ? '1px solid var(--primary-red)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isFavorite ? '❤️ In Favorites' : '🤍 Add to Favorites'}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWatchlist && onToggleWatchlist(movie.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: isInWatchlist ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: isInWatchlist ? 'var(--accent-cyan)' : 'var(--text-main)',
                    border: isInWatchlist ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isInWatchlist ? '🔖 In Watchlist' : '📑 Add to Watchlist'}
                </button>
              </div>

              {/* Watched Toggle (if in watchlist) */}
              {isInWatchlist && onToggleWatched && (
                <button
                  type="button"
                  onClick={() => onToggleWatched(movie.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600',
                    fontSize: '12px',
                    backgroundColor: isWatched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isWatched ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    border: `1px solid ${isWatched ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {isWatched ? '✓ Marked as Watched' : '○ Mark as Watched'}
                </button>
              )}

              {/* AI Correlation Seed Trigger */}
              {onFindSimilar && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFindSimilar(movie.title);
                  }}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '800',
                    fontSize: '13px',
                    background: 'var(--primary-gradient)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(229, 9, 20, 0.35)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(229, 9, 20, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(229, 9, 20, 0.35)';
                  }}
                >
                  ✦ Run AI Recommendation on this Movie →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Ratings & Community Reviews Section */}
        <div style={{ padding: '0 36px 36px 36px' }}>
          <ReviewSection
            movieId={movie.id}
            movieTitle={movie.title}
            onToast={onToast}
          />
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
