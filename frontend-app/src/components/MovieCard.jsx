import React, { useState } from 'react';

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

const MovieCard = ({
  movie,
  isFavorite = false,
  isInWatchlist = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatchlist,
  onSelectMovie,
}) => {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || FALLBACK_POSTER);
  const [isHovered, setIsHovered] = useState(false);

  // Parse pipe-separated genres cleanly
  const genreList = String(movie.genre || '')
    .split(/[|,]/)
    .map((g) => g.trim())
    .filter(Boolean);

  const primaryGenre = genreList[0] || 'Cinema';

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isHovered ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s, border-color 0.25s',
        position: 'relative',
      }}
    >
      {/* Poster Image Container */}
      <div
        onClick={() => onSelectMovie && onSelectMovie(movie)}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2/3',
          cursor: 'pointer',
          overflow: 'hidden',
          backgroundColor: '#161922',
        }}
      >
        <img
          src={imgSrc}
          alt={`${movie.title} poster`}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_POSTER)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Top Floating Badges */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            gap: '6px',
            zIndex: 2,
          }}
        >
          {movie.similarityScore && (
            <span
              style={{
                backgroundColor: 'var(--primary-red)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)',
              }}
            >
              {Math.round(movie.similarityScore * 100)}% MATCH
            </span>
          )}
          {isWatched && (
            <span
              style={{
                backgroundColor: 'var(--accent-emerald)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              WATCHED
            </span>
          )}
          {movie.explanation && (
            <span
              title={movie.explanation}
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.9)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
              }}
            >
              🧠 AI PICK
            </span>
          )}
        </div>

        {/* Rating Badge */}
        {movie.rating ? (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              backgroundColor: 'rgba(10, 12, 18, 0.88)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            ★ {Number(movie.rating).toFixed(1)}
          </div>
        ) : null}

        {/* Hover Quick View Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(7, 8, 11, 0.85) 0%, transparent 60%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '16px',
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            View Details
          </span>
        </div>
      </div>

      {/* Card Info Section */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          onClick={() => onSelectMovie && onSelectMovie(movie)}
          style={{ cursor: 'pointer', marginBottom: '8px' }}
        >
          <h4
            title={movie.title}
            style={{
              fontSize: '15px',
              fontWeight: '700',
              lineHeight: '1.3',
              color: isHovered ? 'var(--primary-red-hover)' : 'var(--text-main)',
              transition: 'color 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {movie.title}
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span>{movie.releaseYear || 'Cinema'}</span>
            <span>•</span>
            <span style={{ color: 'var(--text-dim)' }}>{primaryGenre}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {genreList.slice(0, 2).join(' / ')}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Watchlist Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist && onToggleWatchlist(movie.id);
              }}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={isInWatchlist ? `Remove ${movie.title} from Watchlist` : `Add ${movie.title} to Watchlist`}
              style={{
                background: isInWatchlist ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isInWatchlist ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: isInWatchlist ? 'var(--accent-cyan)' : 'var(--text-muted)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {isInWatchlist ? '🔖' : '📑'}
            </button>

            {/* Favorite Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite && onToggleFavorite(movie.id);
              }}
              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              aria-label={isFavorite ? `Remove ${movie.title} from Favorites` : `Add ${movie.title} to Favorites`}
              style={{
                background: isFavorite ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isFavorite ? 'var(--primary-red)' : 'var(--border-subtle)'}`,
                color: isFavorite ? 'var(--primary-red)' : 'var(--text-muted)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
