import React, { useState } from 'react';
import MovieCard from '../components/MovieCard';

const WatchlistPage = ({
  movies = [],
  watchlist = [],
  favorites = [],
  onToggleFavorite,
  onToggleWatchlist,
  onToggleWatched,
  onSelectMovie,
  onNavigate,
}) => {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unwatched', 'watched'

  // Match full movie records with watchlist metadata
  const watchlistEntries = watchlist.map((item) => {
    const movieObj = item.movie || movies.find((m) => m.id === item.id) || null;
    return {
      watchlistId: item.id,
      movieId: item.movie?.id || item.id,
      watched: Boolean(item.watched),
      movie: movieObj,
    };
  }).filter((entry) => entry.movie != null);

  const totalCount = watchlistEntries.length;
  const watchedCount = watchlistEntries.filter((e) => e.watched).length;
  const unwatchedCount = totalCount - watchedCount;
  const completionPct = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

  const filteredEntries = watchlistEntries.filter((entry) => {
    if (filterMode === 'watched') return entry.watched;
    if (filterMode === 'unwatched') return !entry.watched;
    return true;
  });

  return (
    <div className="fade-in">
      {/* Title & Overview */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          Your Watchlist ({totalCount})
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Organize your film queue and track your viewing progress. Saved persistently to your authenticated account.
        </p>
      </div>

      {/* Progress & Quick Stats Card */}
      {totalCount > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)', letterSpacing: '0.5px' }}>
                QUEUE COMPLETION
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>
                {watchedCount} of {totalCount} Movies Watched ({completionPct}%)
              </h3>
            </div>

            {/* Filter Toggle Buttons */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  backgroundColor: filterMode === 'all' ? 'var(--primary-red)' : 'transparent',
                  color: filterMode === 'all' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unwatched')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  backgroundColor: filterMode === 'unwatched' ? 'var(--primary-red)' : 'transparent',
                  color: filterMode === 'unwatched' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                To Watch ({unwatchedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('watched')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  backgroundColor: filterMode === 'watched' ? 'var(--accent-emerald)' : 'transparent',
                  color: filterMode === 'watched' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Watched ({watchedCount})
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="dash-progress" style={{ marginTop: '4px' }}>
            <div style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Grid or Empty State */}
      {totalCount === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📑</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
            Your Watchlist is Empty
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            Save movies you want to watch later by clicking the bookmark button on any movie card or detail view.
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('catalog')}
            style={{
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '14px',
            }}
          >
            Explore Movie Catalog →
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            No movies match the selected "{filterMode}" filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredEntries.map(({ movie, watched }) => (
            <div key={movie.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <MovieCard
                movie={movie}
                isFavorite={favorites.includes(movie.id)}
                isInWatchlist={true}
                isWatched={watched}
                onToggleFavorite={onToggleFavorite}
                onToggleWatchlist={onToggleWatchlist}
                onSelectMovie={onSelectMovie}
              />
              {/* Quick Inline Watched Toggle */}
              <button
                type="button"
                onClick={() => onToggleWatched && onToggleWatched(movie.id)}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${watched ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                  backgroundColor: watched ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: watched ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {watched ? '✓ Marked as Watched' : '○ Mark as Watched'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
