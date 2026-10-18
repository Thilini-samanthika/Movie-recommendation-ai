import React from 'react';
import { useAuth } from '../context/AuthContext';
import ContinueWatching from '../components/ContinueWatching';

const DashboardPage = ({
  movies = [],
  favorites = [],
  watchlist = [],
  aiRecommendations = [],
  onSelectMovie,
  onNavigate,
  onPlayFilm,
  onToast,
}) => {
  const { user } = useAuth();

  // Match favorite movies from database
  const favoriteMovies = movies.filter((m) => favorites.includes(m.id));

  // Match watchlist movies
  const watchlistMovies = movies.filter((m) =>
    watchlist.some((w) => w.id === m.id || w.movie?.id === m.id)
  );

  const watchedCount = watchlist.filter((w) => w.watched).length;
  const watchlistCompletionPct = watchlistMovies.length > 0
    ? Math.round((watchedCount / watchlistMovies.length) * 100)
    : 0;

  // Real Genre Distribution calculated from user's favorites
  const genreCounts = favoriteMovies.reduce((acc, movie) => {
    String(movie.genre || '')
      .split(/[|,]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .forEach((g) => {
        acc[g] = (acc[g] || 0) + 1;
      });
    return acc;
  }, {});

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxGenreCount = Math.max(1, ...topGenres.map(([, count]) => count));

  return (
    <div className="fade-in cinema-dashboard">
      {/* Personalized Welcome Banner */}
      <section className="dash-hero">
        <div>
          <span className="dash-eyebrow">YOUR PERSONAL CINEMA INTELLIGENCE SPACE</span>
          <h2>
            Welcome back, <span>{user?.username || 'Cinema Enthusiast'}</span>!
          </h2>
          <p>
            Explore your real-time collection metrics, watch activity, and algorithmic correlations.
          </p>
        </div>
        <button
          type="button"
          className="dash-primary"
          onClick={() => onNavigate && onNavigate('catalog')}
        >
          Explore Catalog →
        </button>
      </section>

      {/* 4 Metric Stats Cards */}
      <div className="dash-stats">
        <div className="dash-stat dash-red">
          <span className="dash-stat-icon" aria-hidden="true">♥</span>
          <div className="dash-stat-number">{favorites.length}</div>
          <div className="dash-stat-label">Saved Favorites</div>
        </div>

        <div className="dash-stat dash-blue">
          <span className="dash-stat-icon" aria-hidden="true">◈</span>
          <div className="dash-stat-number">{watchlist.length}</div>
          <div className="dash-stat-label">Watchlist Titles</div>
        </div>

        <div className="dash-stat dash-green">
          <span className="dash-stat-icon" aria-hidden="true">✓</span>
          <div className="dash-stat-number">{watchedCount}</div>
          <div className="dash-stat-label">Marked as Watched</div>
        </div>

        <div className="dash-stat dash-purple">
          <span className="dash-stat-icon" aria-hidden="true">✦</span>
          <div className="dash-stat-number">{Object.keys(genreCounts).length}</div>
          <div className="dash-stat-label">Discovered Genres</div>
        </div>
      </div>

      {/* Continue Watching Section */}
      <ContinueWatching onPlayFilm={onPlayFilm} onToast={onToast} />

      {/* Dual Analytics Panels */}
      <div className="dash-panels">
        {/* Panel 1: Genre Distribution Breakdown */}
        <section className="dash-panel">
          <div className="dash-panel-heading">
            <div>
              <h3>Favorite Genre Distribution</h3>
              <span>Calculated from saved favorites</span>
            </div>
          </div>

          {topGenres.length > 0 ? (
            topGenres.map(([genreName, count]) => {
              const pct = Math.round((count / maxGenreCount) * 100);
              return (
                <div className="dash-genre" key={genreName}>
                  <div className="dash-genre-label">
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{genreName}</span>
                    <span>{count} {count === 1 ? 'title' : 'titles'}</span>
                  </div>
                  <div className="dash-genre-track">
                    <div className="dash-genre-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="dash-empty">
              No genre analytics yet. Add movies to your Favorites to visualize your personal taste profile!
            </p>
          )}
        </section>

        {/* Panel 2: Watchlist Progress */}
        <section className="dash-panel">
          <div className="dash-panel-heading">
            <div>
              <h3>Watchlist Progress</h3>
              <span>Viewing completion rate</span>
            </div>
            <button type="button" onClick={() => onNavigate && onNavigate('watchlist')}>
              Manage Watchlist →
            </button>
          </div>

          <div className="dash-collection-rows">
            <div>
              <span>Watchlist Movies</span>
              <strong>{watchlist.length}</strong>
            </div>
            <div>
              <span>Watched Movies</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{watchedCount}</strong>
            </div>
            <div>
              <span>Completion Rate</span>
              <strong>{watchlistCompletionPct}%</strong>
            </div>
          </div>

          <div className="dash-progress" style={{ marginTop: '24px' }}>
            <div style={{ width: `${watchlistCompletionPct}%` }} />
          </div>
          <p className="dash-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
            Progress updates instantly as you toggle the watched status of films in your collection.
          </p>
        </section>
      </div>

      {/* Recently Saved Favorites Row */}
      <section className="dash-panel">
        <div className="dash-panel-heading">
          <div>
            <h3>Recently Saved Favorites</h3>
            <span>Your curated top picks</span>
          </div>
          <button type="button" onClick={() => onNavigate && onNavigate('favorites')}>
            View All ({favorites.length}) →
          </button>
        </div>

        {favoriteMovies.length > 0 ? (
          <div className="dash-movie-grid">
            {favoriteMovies.slice(-4).reverse().map((movie) => (
              <button
                type="button"
                className="dash-movie"
                key={movie.id}
                onClick={() => onSelectMovie && onSelectMovie(movie)}
              >
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
                <strong>{movie.title}</strong>
                <span>{movie.releaseYear || 'Cinema'} • ★ {movie.rating || 0}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="dash-empty">
            Your favorites will appear here after you save some movies. Browse the catalog to start building your collection!
          </p>
        )}
      </section>

      {/* Personalized AI Picks */}
      <section className="dash-panel">
        <div className="dash-panel-heading">
          <div>
            <h3>Personalized Algorithmic Matches</h3>
            <span>Driven by TF-IDF &amp; collaborative filtering</span>
          </div>
          <button type="button" onClick={() => onNavigate && onNavigate('ai-hub')}>
            AI Hub →
          </button>
        </div>

        {aiRecommendations.length > 0 ? (
          <div className="dash-movie-grid">
            {aiRecommendations.slice(0, 4).map((movie) => (
              <button
                type="button"
                className="dash-movie"
                key={movie.id}
                onClick={() => onSelectMovie && onSelectMovie(movie)}
              >
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
                <strong>{movie.title}</strong>
                <span>{movie.genre || 'Recommended'}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="dash-empty">
            Personalized matches appear here based on your saved favorites. Visit the AI Hub to generate instant recommendations!
          </p>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
