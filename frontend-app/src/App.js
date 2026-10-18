import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import MovieModal from './components/MovieModal';
import Toast from './components/Toast';
import LegalStreamingPlayer from './components/LegalStreamingPlayer';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import AiHubPage from './pages/AiHubPage';
import LegalStreamingPage from './pages/LegalStreamingPage';
import DashboardPage from './pages/DashboardPage';
import FavoritesPage from './pages/FavoritesPage';
import WatchlistPage from './pages/WatchlistPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

import {
  fetchMovies,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatched,
} from './services/api';

function AppContent() {
  const {
    isAuthenticated,
    authModalState,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState('home');

  // Movie catalog state
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // User collections state
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  // Detail Modal & Toast state
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeStreamTicket, setActiveStreamTicket] = useState(null);

  // Deep-link / cross-page parameter state
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [initialAiTitle, setInitialAiTitle] = useState('');

  // Show Toast helper with auto-dismiss
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load catalog movies for Home and Dashboard
  const loadCatalogMovies = useCallback(async () => {
    setLoadingMovies(true);
    try {
      const data = await fetchMovies({ page: 0, size: 60 });
      const items = data.content || data || [];
      setMovies(items);
    } catch (err) {
      console.warn('Initial movies load error:', err.message);
    } finally {
      setLoadingMovies(false);
    }
  }, []);

  // Load user collections (favorites and watchlist)
  const loadCollections = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setWatchlist([]);
      return;
    }
    try {
      const [favData, watchData] = await Promise.all([
        fetchFavorites().catch(() => []),
        fetchWatchlist().catch(() => []),
      ]);

      // Normalize favorites: extract movie IDs
      const favList = Array.isArray(favData) ? favData : [];
      const favIds = favList.map((f) => (f.movie ? f.movie.id : f.movieId || f.id || f));
      setFavorites(favIds);

      // Normalize watchlist
      const watchList = Array.isArray(watchData) ? watchData : [];
      setWatchlist(watchList);
    } catch (err) {
      console.warn('Error loading collections:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCatalogMovies();
  }, [loadCatalogMovies]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Favorite toggle handler
  const handleToggleFavorite = async (movieId) => {
    if (!isAuthenticated) {
      openAuthModal(
        'login',
        () => handleToggleFavorite(movieId),
        'Please sign in or register to add movies to your personal favorites.'
      );
      return;
    }

    const isFav = favorites.includes(movieId);
    try {
      if (isFav) {
        await removeFavorite(movieId);
        setFavorites((prev) => prev.filter((id) => id !== movieId));
        showToast('Removed movie from favorites.', 'info');
      } else {
        await addFavorite(movieId);
        setFavorites((prev) => [...prev, movieId]);
        showToast('Added movie to favorites!', 'success');
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
      showToast(err.response?.data?.message || err.message || 'Unable to update favorites.', 'error');
    }
  };

  // Watchlist toggle handler
  const handleToggleWatchlist = async (movieId) => {
    if (!isAuthenticated) {
      openAuthModal(
        'login',
        () => handleToggleWatchlist(movieId),
        'Please sign in or register to manage your movie watchlist.'
      );
      return;
    }

    const inWatchlist = watchlist.some((w) => (w.movie?.id || w.id) === movieId);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movieId);
        setWatchlist((prev) => prev.filter((w) => (w.movie?.id || w.id) !== movieId));
        showToast('Removed movie from watchlist.', 'info');
      } else {
        const added = await addToWatchlist(movieId, false);
        const movieObj = movies.find((m) => m.id === movieId);
        const newItem = {
          id: added.id || movieId,
          movie: added.movie || movieObj || { id: movieId },
          watched: false,
        };
        setWatchlist((prev) => [newItem, ...prev]);
        showToast('Added movie to watchlist!', 'success');
      }
    } catch (err) {
      console.error('Toggle watchlist error:', err);
      showToast(err.response?.data?.message || err.message || 'Unable to update watchlist.', 'error');
    }
  };

  // Watched status toggle handler
  const handleToggleWatched = async (movieId) => {
    if (!isAuthenticated) {
      openAuthModal('login', null, 'Please sign in to update your watch progress.');
      return;
    }

    const target = watchlist.find((w) => (w.movie?.id || w.id) === movieId);
    const newStatus = target ? !target.watched : true;
    try {
      await toggleWatched(movieId, newStatus);
      setWatchlist((prev) =>
        prev.map((w) => {
          if ((w.movie?.id || w.id) === movieId) {
            return { ...w, watched: newStatus };
          }
          return w;
        })
      );
      showToast(`Marked as ${newStatus ? 'Watched' : 'To Watch'}`, 'success');
    } catch (err) {
      console.error('Toggle watched error:', err);
      showToast('Unable to update watch progress.', 'error');
    }
  };

  // Movie modal selector
  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  // Navigation coordinator
  const handleNavigate = (tab, param) => {
    if (tab === 'catalog' && param) {
      setInitialSearchQuery(param);
    }
    if (tab === 'ai-hub' && param) {
      setInitialAiTitle(param);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render Auth Required Banner for protected tabs when guest
  const renderAuthGate = (featureName) => (
    <div
      className="glass-panel"
      style={{
        textAlign: 'center',
        padding: '80px 24px',
        maxWidth: '600px',
        margin: '60px auto',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
        {featureName} Requires an Account
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
        Sign in to your free CINEMA AI account or register in seconds to access your personalized {featureName.toLowerCase()}, track watching history, and compute AI recommendations.
      </p>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          style={{
            backgroundColor: 'var(--primary-red)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Sign In Now
        </button>
        <button
          type="button"
          onClick={() => openAuthModal('register')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: '1px solid var(--border-subtle)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Create Free Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        favoritesCount={favorites.length}
        watchlistCount={watchlist.length}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px 0' }}>
        <div className="cin-container">
          {activeTab === 'home' && (
            <HomePage
              movies={movies}
              loading={loadingMovies}
              favorites={favorites}
              watchlist={watchlist}
              onToggleFavorite={handleToggleFavorite}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectMovie={handleSelectMovie}
              onNavigate={handleNavigate}
              onSearchSubmit={(query) => handleNavigate('catalog', query)}
              onPlayFilm={(ticket) => setActiveStreamTicket(ticket)}
              onToast={showToast}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogPage
              favorites={favorites}
              watchlist={watchlist}
              onToggleFavorite={handleToggleFavorite}
              onToggleWatchlist={handleToggleWatchlist}
              onSelectMovie={handleSelectMovie}
              initialSearchQuery={initialSearchQuery}
            />
          )}

          {activeTab === 'ai-hub' && (
            <AiHubPage
              initialTitle={initialAiTitle}
              onSelectMovie={handleSelectMovie}
              favorites={favorites}
            />
          )}

          {activeTab === 'streaming' && (
            <LegalStreamingPage onShowToast={showToast} onPlayFilm={(ticket) => setActiveStreamTicket(ticket)} />
          )}

          {activeTab === 'dashboard' && (
            isAuthenticated ? (
              <DashboardPage
                movies={movies}
                favorites={favorites}
                watchlist={watchlist}
                onSelectMovie={handleSelectMovie}
                onNavigate={handleNavigate}
                onPlayFilm={(ticket) => setActiveStreamTicket(ticket)}
                onToast={showToast}
              />
            ) : renderAuthGate('Personal Dashboard')
          )}

          {activeTab === 'favorites' && (
            isAuthenticated ? (
              <FavoritesPage
                movies={movies}
                favorites={favorites}
                watchlist={watchlist}
                onToggleFavorite={handleToggleFavorite}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectMovie={handleSelectMovie}
                onNavigate={handleNavigate}
              />
            ) : renderAuthGate('Favorites Collection')
          )}

          {activeTab === 'watchlist' && (
            isAuthenticated ? (
              <WatchlistPage
                movies={movies}
                watchlist={watchlist}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleWatched={handleToggleWatched}
                onSelectMovie={handleSelectMovie}
                onNavigate={handleNavigate}
              />
            ) : renderAuthGate('Movie Watchlist')
          )}

          {activeTab === 'profile' && (
            isAuthenticated ? (
              <ProfilePage
                favoritesCount={favorites.length}
                watchlistCount={watchlist.length}
                onShowToast={showToast}
              />
            ) : renderAuthGate('User Profile')
          )}

          {activeTab === 'admin' && (
            <AdminPage
              onShowToast={showToast}
              onReloadMovies={loadCatalogMovies}
            />
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.initialMode}
        message={authModalState.message}
        onClose={closeAuthModal}
        onSuccess={() => {
          showToast('Authenticated successfully!', 'success');
          loadCollections();
        }}
      />

      {/* Movie Details Modal */}
      <MovieModal
        movie={selectedMovie}
        isFavorite={selectedMovie ? favorites.includes(selectedMovie.id) : false}
        isInWatchlist={
          selectedMovie
            ? watchlist.some((w) => (w.movie?.id || w.id) === selectedMovie.id)
            : false
        }
        isWatched={
          selectedMovie
            ? watchlist.some(
                (w) => (w.movie?.id || w.id) === selectedMovie.id && w.watched
              )
            : false
        }
        onClose={() => setSelectedMovie(null)}
        onToggleFavorite={handleToggleFavorite}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleWatched={handleToggleWatched}
        onFindSimilar={(title) => {
          setSelectedMovie(null);
          handleNavigate('ai-hub', title);
        }}
        onToast={showToast}
      />

      {/* Global In-App Video Player */}
      {activeStreamTicket && (
        <LegalStreamingPlayer
          ticket={activeStreamTicket}
          onClose={() => setActiveStreamTicket(null)}
        />
      )}

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}