import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Backend Base URLs
const BASE_URL = 'http://localhost:8090/api';          // Spring Boot backend (movies, auth, favorites)
const AI_URL = 'http://127.0.0.1:8000';                 // FastAPI recommendation engine

function App() {
  // ---------- Navigation & Authentication ----------
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('guest'); // 'guest' | 'user' | 'admin'
  const [userProfile, setUserProfile] = useState({
    id: null,
    name: 'User',
    email: '',
    preferredGenres: ['Sci-Fi', 'Action'],
    theme: 'Dark'
  });

  // ---------- Filtering & Search ----------
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');

  // ---------- Selected Movie (Details Modal) ----------
  const [selectedMovie, setSelectedMovie] = useState(null);

  // ---------- AI Recommendation Engine (search-by-title) ----------
  const [recSearchTerm, setRecSearchTerm] = useState('');
  const [recResults, setRecResults] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  // ---------- Auth Forms ----------
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // ---------- Movie Catalog ----------
  const [movies, setMovies] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  // ---------- User Collections ----------
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  // ---------- Toast Helper ----------
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ---------- 1. Fetch Real Movies from Spring Boot Backend on Mount ----------
  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/movies?size=60`);
      const fetchedMovies = response.data.content || response.data;

      const formattedMovies = fetchedMovies.map((m) => ({
        ...m,
        // Uses the official TMDB poster link updated in MySQL
        posterUrl: m.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60',
        releaseYear: m.releaseYear || 2024,
        similarityScore: m.similarityScore || 0.95
      }));

      if (formattedMovies.length > 0) {
        setMovies(formattedMovies);
      }
    } catch (error) {
      console.error('Error fetching movies from backend:', error);
      showToast(' Could not connect to backend');
    }
  };

  // ---------- 2. Fetch User Favorites from Backend ----------
  const loadFavorites = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/favorites/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favMovieIds = response.data.map((fav) => fav.movie.id);
      setFavorites(favMovieIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // ---------- 3. Real Auth Handlers (Register & Login) ----------
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      showToast(' Please fill in all fields!');
      return;
    }

    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        username: authName,
        email: authEmail,
        password: authPassword
      });
      showToast('🎉 Account created! Please sign in.');
      setActiveTab('login');
    } catch (error) {
      console.error('Registration failed:', error);
      showToast('❌ Registration failed! User or Email may already exist.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast(' Please fill in all fields!');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        username: authEmail,
        password: authPassword
      });

      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setIsLoggedIn(true);

        const isAdmin = authEmail === 'admin' || authEmail.includes('admin');
        const role = isAdmin ? 'admin' : 'user';
        const currentUserId = response.data.userId || 1;

        setUserRole(role);
        setUserProfile({
          id: currentUserId,
          name: authEmail,
          email: authEmail,
          preferredGenres: ['Sci-Fi', 'Action'],
          theme: 'Dark'
        });

        loadFavorites(currentUserId);
        fetchAiRecommendations(currentUserId, 'Sci-Fi');

        setActiveTab(isAdmin ? 'admin' : 'dashboard');
        showToast(` Welcome back, ${authEmail}!`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      showToast(' Invalid Username or Password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole('guest');
    setActiveTab('home');
    setFavorites([]);
    showToast('Logged out successfully');
  };

  // ---------- 4. AI Recommendation Call (personalized, by userId/genre) ----------
  const fetchAiRecommendations = async (userId, genre) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BASE_URL}/recommendations?userId=${userId}&genre=${genre}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiRecommendations(response.data);
    } catch (error) {
      console.error('AI Engine integration error:', error);
    }
  };

  // ---------- 4b. AI Recommendation Call (search by movie title, FastAPI) ----------
  const fetchRecommendations = async (title) => {
    if (!title.trim()) return;
    setRecLoading(true);
    setRecError('');
    setRecResults([]);
    try {
      const response = await fetch(`${AI_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_title: title })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Something went wrong.');
      }
      const data = await response.json();
      setRecResults(data.recommendations || []);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  // ---------- 5. Toggle Favorite (backend-backed) ----------
  const toggleFavorite = async (movieId) => {
    if (!isLoggedIn) {
      showToast(' Please login to add favorites!');
      setActiveTab('login');
      return;
    }

    const token = localStorage.getItem('token');
    const isFav = favorites.includes(movieId);

    try {
      if (isFav) {
        await axios.delete(`${BASE_URL}/favorites?userId=${userProfile.id}&movieId=${movieId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(favorites.filter((id) => id !== movieId));
        showToast('Removed from Favorites');
      } else {
        await axios.post(
          `${BASE_URL}/favorites`,
          { userId: userProfile.id, movieId: movieId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites([...favorites, movieId]);
        showToast(' Added to Favorites');
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      showToast(' Error updating favorites');
    }
  };

  // ---------- 6. Toggle Watchlist (local state) ----------
  const toggleWatchlist = (movieId) => {
    const exists = watchlist.find((item) => item.id === movieId);
    if (exists) {
      setWatchlist(watchlist.filter((item) => item.id !== movieId));
      showToast('Removed from Watchlist');
    } else {
      setWatchlist([...watchlist, { id: movieId, watched: false }]);
      showToast(' Added to Watchlist');
    }
  };

  // ---------- Search & Filter Pipeline ----------
  const filteredMovies = movies.filter((movie) => {
    const titleMatch = movie.title ? movie.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const descMatch = movie.description ? movie.description.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = titleMatch || descMatch;
    const matchesGenre = filterGenre === 'All' || (movie.genre && movie.genre.includes(filterGenre));
    const matchesYear = filterYear === 'All' || (movie.releaseYear && movie.releaseYear.toString() === filterYear);
    const matchesRating = filterRating === 'All' || (movie.rating && movie.rating >= parseFloat(filterRating));
    return matchesSearch && matchesGenre && matchesYear && matchesRating;
  });

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      {/* TOAST */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            zIndex: 2000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* NAVBAR */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div onClick={() => setActiveTab('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #e50914 0%, #ff5252 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '28px',
              fontWeight: '900'
            }}
          >
            CINEMA
          </span>
          <span style={{ fontSize: '28px', fontWeight: '300', color: '#38bdf8' }}>AI</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontWeight: '600', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('home')} style={navBtnStyle(activeTab === 'home')}>Home</button>
          <button onClick={() => setActiveTab('search')} style={navBtnStyle(activeTab === 'search')}>Search & Filter</button>
          <button onClick={() => setActiveTab('recommendations')} style={navBtnStyle(activeTab === 'recommendations')}>AI Hub</button>

          {isLoggedIn && (
            <>
              <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>Dashboard</button>
              <button onClick={() => setActiveTab('favorites')} style={navBtnStyle(activeTab === 'favorites')}>Favorites ({favorites.length})</button>
              <button onClick={() => setActiveTab('watchlist')} style={navBtnStyle(activeTab === 'watchlist')}>Watchlist ({watchlist.length})</button>
              <button onClick={() => setActiveTab('profile')} style={navBtnStyle(activeTab === 'profile')}>Profile</button>
            </>
          )}

          {userRole === 'admin' && (
            <button onClick={() => setActiveTab('admin')} style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', padding: '8px 12px', fontWeight: '800' }}>
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {!isLoggedIn ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setActiveTab('login')} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setActiveTab('register')} style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700' }}>Register</button>
          </div>
        ) : (
          <button onClick={handleLogout} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>Sign Out</button>
        )}
      </nav>

      <div style={{ padding: '40px 48px', maxWidth: '1300px', margin: '0 auto' }}>
        {/* ==================== HOME ==================== */}
        {activeTab === 'home' && (
          <div>
            <div
              style={{
                textAlign: 'center',
                margin: '10px 0 40px 0',
                padding: '60px 20px',
                background: 'radial-gradient(circle, rgba(30,27,75,0.6) 0%, rgba(9,13,22,1) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>Intelligent Movie Discovery</h1>
              <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
                Discover hidden movie correlations through Machine Learning algorithms.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: '600px',
                  margin: '0 auto',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  padding: '6px 8px 6px 20px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'white', fontSize: '15px', outline: 'none' }}
                />
                <button onClick={() => setActiveTab('search')} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px 28px', borderRadius: '24px', fontWeight: '700', cursor: 'pointer' }}>
                  Explore
                </button>
              </div>
            </div>

            {/* AI RECOMMENDED FOR YOU (logged in) */}
            {isLoggedIn && (
              <div style={{ marginBottom: '40px', padding: '24px', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>✨ AI Recommended For You ({userProfile.name})</h3>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
                  {movies.slice(0, 10).map((movie) => (
                    <div key={movie.id} onClick={() => setSelectedMovie(movie)} style={{ minWidth: '200px', cursor: 'pointer', backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px' }}>
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px' }}>{movie.title}</h4>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>{Math.round((movie.similarityScore || 0.9) * 100)}% Match</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALL MOVIES IN DATABASE */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>Available Movies in Catalog</h3>
              {movies.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No movies found in database.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                  {movies.map((movie) => (
                    <div key={movie.id} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setSelectedMovie(movie)} />
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{movie.title}</h4>
                        <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '13px' }}>{movie.genre}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '700' }}>★ {movie.rating || 0}</span>
                          <button onClick={() => toggleFavorite(movie.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            {favorites.includes(movie.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== LOGIN ==================== */}
        {activeTab === 'login' && (
          <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Sign In</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Enter your account username/email &amp; password</p>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Username or Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={inputStyle} />
              <button type="submit" style={{ width: '100%', backgroundColor: '#e50914', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Login
              </button>
            </form>
          </div>
        )}

        {/* ==================== REGISTER ==================== */}
        {activeTab === 'register' && (
          <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>Create Account</h2>
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="Username" value={authName} onChange={(e) => setAuthName(e.target.value)} style={inputStyle} />
              <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ ...inputStyle, marginBottom: '24px' }} />
              <button type="submit" style={{ width: '100%', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Register
              </button>
            </form>
          </div>
        )}

        {/* ==================== DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Welcome back, {userProfile.name}! 👋</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Here is your personalized movie activity overview.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              <div style={{ backgroundColor: 'rgba(30,41,59,0.6)', padding: '24px', borderRadius: '16px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Watchlist Movies</span>
                <h3 style={{ fontSize: '32px', color: '#38bdf8', margin: '8px 0 0 0' }}>{watchlist.length}</h3>
              </div>
              <div style={{ backgroundColor: 'rgba(30,41,59,0.6)', padding: '24px', borderRadius: '16px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Favorites Saved</span>
                <h3 style={{ fontSize: '32px', color: '#e50914', margin: '8px 0 0 0' }}>{favorites.length}</h3>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEARCH & FILTER ==================== */}
        {activeTab === 'search' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Search & Filter Catalog</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
              <div style={{ backgroundColor: 'rgba(30,41,59,0.6)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', height: 'fit-content' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Filters</h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={filterLabelStyle}>Genre</label>
                  <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} style={selectStyle}>
                    <option value="All">All Genres</option>
                    <option value="Animation">Animation</option>
                    <option value="Children">Children</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Action">Action</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Romance">Romance</option>
                    <option value="Drama">Drama</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Thriller">Thriller</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={filterLabelStyle}>Minimum Rating</label>
                  <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={selectStyle}>
                    <option value="All">Any Rating</option>
                    <option value="9">9.0+</option>
                    <option value="8">8.0+</option>
                    <option value="7">7.0+</option>
                  </select>
                </div>

                <div>
                  <label style={filterLabelStyle}>Year</label>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={selectStyle}>
                    <option value="All">All Years</option>
                    {[...new Set(movies.map((m) => m.releaseYear))].sort((a, b) => b - a).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredMovies.length === 0 && <p style={{ color: '#94a3b8' }}>No movies match your filters.</p>}
                {filteredMovies.map((movie) => (
                  <div key={movie.id} onClick={() => setSelectedMovie(movie)} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}>
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }} />
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px' }}>{movie.title}</h4>
                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>★ {movie.rating || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== FAVORITES ==================== */}
        {activeTab === 'favorites' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Your Favorites</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {movies.filter((m) => favorites.includes(m.id)).map((movie) => (
                <div key={movie.id} style={{ backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '16px', padding: '16px' }}>
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px' }} />
                  <h4 style={{ margin: '12px 0 6px 0' }}>{movie.title}</h4>
                  <button onClick={() => toggleFavorite(movie.id)} style={{ backgroundColor: 'rgba(229,9,20,0.2)', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                    Remove
                  </button>
                </div>
              ))}
              {favorites.length === 0 && <p style={{ color: '#94a3b8' }}>No favorites yet.</p>}
            </div>
          </div>
        )}

        {/* ==================== WATCHLIST ==================== */}
        {activeTab === 'watchlist' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Your Watchlist</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {movies.filter((m) => watchlist.some((w) => w.id === m.id)).map((movie) => (
                <div key={movie.id} style={{ backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '16px', padding: '16px' }}>
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px' }} />
                  <h4 style={{ margin: '12px 0 6px 0' }}>{movie.title}</h4>
                  <button onClick={() => toggleWatchlist(movie.id)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: '700' }}>
                    Remove from Watchlist
                  </button>
                </div>
              ))}
              {watchlist.length === 0 && <p style={{ color: '#94a3b8' }}>Your watchlist is empty.</p>}
            </div>
          </div>
        )}

        {/* ==================== AI RECOMMENDATION ENGINE ==================== */}
        {activeTab === 'recommendations' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>AI Recommendation Engine</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Driven by Hybrid Model (TF-IDF Content Similarity + Collaborative Filtering).</p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '600px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '6px 8px 6px 20px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '32px',
                opacity: recLoading ? 0.7 : 1
              }}
            >
              <input
                type="text"
                placeholder="Enter a movie title (e.g. Toy Story)..."
                value={recSearchTerm}
                disabled={recLoading}
                onChange={(e) => setRecSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !recLoading && fetchRecommendations(recSearchTerm)}
                style={{ width: '100%', background: 'none', border: 'none', color: 'white', fontSize: '15px', outline: 'none' }}
              />
              <button
                onClick={() => fetchRecommendations(recSearchTerm)}
                disabled={recLoading || !recSearchTerm.trim()}
                style={{
                  backgroundColor: recLoading || !recSearchTerm.trim() ? '#334155' : '#38bdf8',
                  color: recLoading || !recSearchTerm.trim() ? '#94a3b8' : '#0f172a',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '24px',
                  fontWeight: '700',
                  cursor: recLoading || !recSearchTerm.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {recLoading ? 'Analyzing...' : 'Get Recommendations'}
              </button>
            </div>

            {recLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(56, 189, 248, 0.2)',
                    borderTopColor: '#38bdf8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <p style={{ color: '#38bdf8', fontWeight: '600', margin: 0 }}>Analyzing patterns...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!recLoading && recError && (
              <div style={{ backgroundColor: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', padding: '16px 20px', borderRadius: '12px', color: '#ef4444', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span>{recError}</span>
              </div>
            )}

            {!recLoading && !recError && recResults.length === 0 && !recSearchTerm && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
                <p style={{ fontSize: '15px' }}>Enter a movie title above to get AI-powered recommendations.</p>
              </div>
            )}

            {!recLoading && !recError && recResults.length === 0 && recSearchTerm && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '15px' }}>No recommendations found. Try a different title.</p>
              </div>
            )}

            {!recLoading && recResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {recResults.map((movie, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(30,27,75,0.8)',
                      padding: '24px',
                      borderRadius: '16px',
                      border: '1px solid rgba(56,189,248,0.3)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'rgba(56,189,248,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
                    }}
                  >
                    <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                      {Math.round((movie.hybrid_score || 0) * 100)}% MATCH
                    </span>
                    <h3 style={{ fontSize: '20px', marginTop: '12px', marginBottom: '4px' }}>{movie.clean_title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>{movie.genres}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>Content: {movie.content_score}</span>
                      <span>Collaborative: {movie.collaborative_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== PROFILE ==================== */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>User Settings & Profile</h2>
            <p><strong>Username:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Status:</strong> Active Session</p>
            <p><strong>Preferred Genres:</strong> {userProfile.preferredGenres.join(', ')}</p>
          </div>
        )}

        {/* ==================== ADMIN ==================== */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>System Admin Panel</h2>
            <p>Indexed Database Records: {movies.length}</p>
          </div>
        )}

        {/* ==================== MOVIE DETAILS MODAL ==================== */}
        {selectedMovie && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
            onClick={() => setSelectedMovie(null)}
          >
            <div
              style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '20px', maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '28px', margin: '0 0 12px 0' }}>
                {selectedMovie.title} {selectedMovie.releaseYear ? `(${selectedMovie.releaseYear})` : ''}
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{selectedMovie.description}</p>
              <p><strong>Genre:</strong> {selectedMovie.genre}</p>
              <p><strong>Rating:</strong> ★ {selectedMovie.rating || 0}</p>
              {selectedMovie.director && <p><strong>Director:</strong> {selectedMovie.director}</p>}
              {selectedMovie.cast && <p><strong>Cast:</strong> {selectedMovie.cast}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => toggleFavorite(selectedMovie.id)} style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  ❤️ Favorite
                </button>
                <button onClick={() => toggleWatchlist(selectedMovie.id)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                   Watchlist
                </button>
                <button onClick={() => setSelectedMovie(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <p>© 2026 Intelligent Movie Recommendation System</p>
        </footer>
      </div>
    </div>
  );
}

// ---------- Shared style helpers ----------
const navBtnStyle = (active) => ({
  background: 'none',
  border: 'none',
  color: active ? '#38bdf8' : '#94a3b8',
  cursor: 'pointer',
  padding: '8px 12px'
});

const inputStyle = {
  width: '100%',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  color: 'white',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '16px',
  outline: 'none',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  backgroundColor: '#0f172a',
  color: 'white',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #334155'
};

const filterLabelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#94a3b8',
  marginBottom: '6px'
};

export default App;