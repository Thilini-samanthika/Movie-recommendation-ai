import React, { useState, useEffect, useCallback } from 'react';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import { fetchMovies } from '../services/api';

const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Children',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Western',
];

const CatalogPage = ({
  favorites = [],
  watchlist = [],
  onToggleFavorite,
  onToggleWatchlist,
  onSelectMovie,
  initialSearchQuery = '',
}) => {
  // Query & Filter States
  const [query, setQuery] = useState(initialSearchQuery);
  const [genre, setGenre] = useState('All');
  const [year, setYear] = useState('All');
  const [minRating, setMinRating] = useState('All');
  const [sortBy, setSortBy] = useState('id_asc');

  // Pagination States
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Data States
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch paginated movies from backend API
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMovies({
        page,
        size,
        query: query.trim(),
        genre: genre !== 'All' ? genre : '',
        year: year !== 'All' ? Number(year) : null,
        minRating: minRating !== 'All' ? Number(minRating) : null,
        sortBy,
      });

      const items = data.content || data || [];
      setMovies(items);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || items.length);
    } catch (err) {
      console.error('Catalog load error:', err);
      setError('Unable to load movies from the catalog. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [page, size, query, genre, year, minRating, sortBy]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleResetFilters = () => {
    setQuery('');
    setGenre('All');
    setYear('All');
    setMinRating('All');
    setSortBy('id_asc');
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadCatalog();
  };

  // Generate Year options from 2025 down to 1950
  const yearOptions = Array.from({ length: 76 }, (_, i) => 2025 - i);

  return (
    <div className="fade-in">
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          Discover Movie Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Browse and filter our comprehensive collection of {totalElements.toLocaleString()} catalog records with backend-driven pagination.
        </p>
      </div>

      {/* Filter & Search Bar Container */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Search Row */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: '280px',
              backgroundColor: '#0c0e15',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by title or genre keywords..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setPage(0); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(229, 9, 20, 0.35)',
            }}
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            Reset Filters
          </button>
        </form>

        {/* Multi-Filter Dropdown Selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Genre */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => { setGenre(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                backgroundColor: '#0c0e15',
                border: '1px solid var(--border-card)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g === 'All' ? 'All Genres' : g}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Release Year
            </label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                backgroundColor: '#0c0e15',
                border: '1px solid var(--border-card)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="All">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => { setMinRating(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                backgroundColor: '#0c0e15',
                border: '1px solid var(--border-card)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="All">Any Rating</option>
              <option value="4.5">★ 4.5 &amp; above</option>
              <option value="4.0">★ 4.0 &amp; above</option>
              <option value="3.5">★ 3.5 &amp; above</option>
              <option value="3.0">★ 3.0 &amp; above</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                backgroundColor: '#0c0e15',
                border: '1px solid var(--border-card)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="id_asc">Default Index Order</option>
              <option value="rating_desc">Highest Rating First</option>
              <option value="year_desc">Newest Year First</option>
              <option value="year_asc">Oldest Year First</option>
              <option value="title_asc">Title A → Z</option>
              <option value="title_desc">Title Z → A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Showing Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements.toLocaleString()} total films)
        </span>

        {/* Top Mini Pagination */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: page === 0 ? 'var(--text-muted)' : '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: page >= totalPages - 1 ? 'var(--text-muted)' : '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Movie Grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
            No Movies Match Your Search
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            Try broadening your search term or resetting the genre and year filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            Clear All Filters
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
          {movies.map((movie) => (
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
      )}

      {/* Bottom Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => {
              setPage((p) => Math.max(0, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: page === 0 ? 'var(--text-muted)' : '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            ← Previous Page
          </button>

          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Page {page + 1} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => {
              setPage((p) => p + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
