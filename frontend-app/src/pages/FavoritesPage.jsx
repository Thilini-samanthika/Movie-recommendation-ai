import React from 'react';
import MovieCard from '../components/MovieCard';

const FavoritesPage = ({
  movies = [],
  favorites = [],
  watchlist = [],
  onToggleFavorite,
  onToggleWatchlist,
  onSelectMovie,
  onNavigate,
}) => {
  const favoriteMovies = movies.filter((m) => favorites.includes(m.id));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          Your Favorite Movies ({favoriteMovies.length})
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Persistently saved to your authenticated account in MySQL and used to calculate your personalized AI recommendations.
        </p>
      </div>

      {favoriteMovies.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
            No Saved Favorites Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            Browse the movie catalog and click the heart icon on any movie card to add it to your personal favorites.
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
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {favoriteMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isFavorite={true}
              isInWatchlist={watchlist.some((w) => w.id === movie.id || w.movie?.id === movie.id)}
              isWatched={watchlist.some((w) => (w.id === movie.id || w.movie?.id === movie.id) && w.watched)}
              onToggleFavorite={onToggleFavorite}
              onToggleWatchlist={onToggleWatchlist}
              onSelectMovie={onSelectMovie}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
