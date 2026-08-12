import React, { useState } from 'react';

function App() {
  // Navigation & Authentication States
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('guest'); // 'guest', 'user', 'admin'
  const [userProfile, setUserProfile] = useState({ name: 'User', email: '', preferredGenres: ['Sci-Fi', 'Action'], theme: 'Dark' });

  // Filtering & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');

  // Selected Movie State (For Movie Details Modal View)
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Forms States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Sample Movies Catalog
  const [movies, setMovies] = useState([
    {
      id: 1,
      title: "Interstellar",
      releaseYear: 2014,
      genre: "Sci-Fi",
      rating: 8.7,
      duration: "2h 49m",
      director: "Christopher Nolan",
      cast: "Matthew McConaughey, Anne Hathaway",
      similarityScore: 0.96,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
      description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      reasons: ["Space Adventure Pattern Match", "Christopher Nolan Theme Correlation"],
      category: "Trending"
    },
    {
      id: 2,
      title: "Inception",
      releaseYear: 2010,
      genre: "Sci-Fi",
      rating: 8.8,
      duration: "2h 28m",
      director: "Christopher Nolan",
      cast: "Leonardo DiCaprio, Joseph Gordon-Levitt",
      similarityScore: 0.91,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
      description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
      reasons: ["Mind-Bending Narrative", "TF-IDF High Keyword Score"],
      category: "Popular"
    },
    {
      id: 3,
      title: "The Dark Knight",
      releaseYear: 2008,
      genre: "Action",
      rating: 9.0,
      duration: "2h 32m",
      director: "Christopher Nolan",
      cast: "Christian Bale, Heath Ledger",
      similarityScore: 0.85,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
      description: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.",
      reasons: ["Gritty Action Pattern", "DC Comic Universe Correlation"],
      category: "Top Rated"
    },
    {
      id: 4,
      title: "Blade Runner 2049",
      releaseYear: 2017,
      genre: "Cyberpunk",
      rating: 8.0,
      duration: "2h 44m",
      director: "Denis Villeneuve",
      cast: "Ryan Gosling, Harrison Ford",
      similarityScore: 0.89,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NjYtCjg3MV00OTJyLTgwYTgtNzA0NDNmNTM0M2JhXkEyXkFqcGdeQXVyMjg2MTMyNTM@._V1_.jpg",
      description: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.",
      reasons: ["Atmospheric Neo-Noir Visuals", "Sci-Fi Future Dystopia Match"],
      category: "New Releases"
    }
  ]);

  // User Collections State
  const [favorites, setFavorites] = useState([1]);
  const [watchlist, setWatchlist] = useState([{ id: 2, watched: false }]);
  const [recentlyViewed] = useState([1, 2]);

  // Trigger Toast Notifications
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Auth Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (authEmail === 'admin@cinema.com' && authPassword === 'admin123') {
      setIsLoggedIn(true);
      setUserRole('admin');
      setUserProfile({ ...userProfile, name: 'System Admin', email: authEmail });
      setActiveTab('admin');
      showToast("🛡️ Admin Login Successful!");
    } else if (authEmail && authPassword) {
      setIsLoggedIn(true);
      setUserRole('user');
      setUserProfile({ ...userProfile, name: authName || 'Chamuthu', email: authEmail });
      setActiveTab('dashboard');
      showToast("👤 User Login Successful!");
    } else {
      showToast("❌ Please fill in all fields!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('guest');
    setActiveTab('home');
    showToast("Logged out successfully");
  };

  // Toggle Favorite
  const toggleFavorite = (movieId) => {
    if (favorites.includes(movieId)) {
      setFavorites(favorites.filter(id => id !== movieId));
      showToast("Removed from Favorites");
    } else {
      setFavorites([...favorites, movieId]);
      showToast("❤️ Added to Favorites");
    }
  };

  // Toggle Watchlist
  const toggleWatchlist = (movieId) => {
    const exists = watchlist.find(item => item.id === movieId);
    if (exists) {
      setWatchlist(watchlist.filter(item => item.id !== movieId));
      showToast("Removed from Watchlist");
    } else {
      setWatchlist([...watchlist, { id: movieId, watched: false }]);
      showToast("📌 Added to Watchlist");
    }
  };

  // Search & Filter Pipeline
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          movie.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre === 'All' || movie.genre === filterGenre;
    const matchesYear = filterYear === 'All' || movie.releaseYear.toString() === filterYear;
    const matchesRating = filterRating === 'All' || movie.rating >= parseFloat(filterRating);
    return matchesSearch && matchesGenre && matchesYear && matchesRating;
  });

  return (
    <div style={{ backgroundColor: '#090d16', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>

      {/* TOAST NOTIFICATION COMPONENT */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#38bdf8', color: '#0f172a', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {toastMessage}
        </div>
      )}

      {/* COMPONENT: RESPONSIVE NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', backgroundColor: 'rgba(15, 23, 42, 0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => setActiveTab('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ background: 'linear-gradient(135deg, #e50914 0%, #ff5252 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '28px', fontWeight: '900' }}>CINEMA</span>
          <span style={{ fontSize: '28px', fontWeight: '300', color: '#38bdf8' }}>AI</span>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontWeight: '600' }}>
          <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: activeTab === 'home' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Home</button>
          <button onClick={() => setActiveTab('search')} style={{ background: 'none', border: 'none', color: activeTab === 'search' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Search & Filter</button>
          <button onClick={() => setActiveTab('recommendations')} style={{ background: 'none', border: 'none', color: activeTab === 'recommendations' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>AI Hub</button>
          
          {isLoggedIn && (
            <>
              <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Dashboard</button>
              <button onClick={() => setActiveTab('favorites')} style={{ background: 'none', border: 'none', color: activeTab === 'favorites' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Favorites ({favorites.length})</button>
              <button onClick={() => setActiveTab('watchlist')} style={{ background: 'none', border: 'none', color: activeTab === 'watchlist' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Watchlist ({watchlist.length})</button>
              <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', color: activeTab === 'profile' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '8px 12px' }}>Profile</button>
            </>
          )}

          {userRole === 'admin' && (
            <button onClick={() => setActiveTab('admin')} style={{ background: 'none', border: 'none', color: '#e50914', cursor: 'pointer', padding: '8px 12px', fontWeight: '800' }}>⚙️ Admin Panel</button>
          )}
        </div>

        {/* Dynamic Auth Controls */}
        {!isLoggedIn ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setActiveTab('login')} style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setActiveTab('register')} style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '700' }}>Register</button>
          </div>
        ) : (
          <button onClick={handleLogout} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>Sign Out</button>
        )}
      </nav>

      {/* MAIN LAYOUT WRAPPER */}
      <div style={{ padding: '40px 48px', maxWidth: '1300px', margin: '0 auto' }}>

        {/* ==================== 1. HOME PAGE ==================== */}
        {activeTab === 'home' && (
          <div>
            {/* HERO BANNER & SEARCH BAR */}
            <div style={{ textAlign: 'center', margin: '10px 0 40px 0', padding: '60px 20px', background: 'radial-gradient(circle, rgba(30,27,75,0.6) 0%, rgba(9,13,22,1) 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>Intelligent Movie Discovery</h1>
              <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px auto' }}>Discover hidden movie correlations through Machine Learning algorithms.</p>
              <div style={{ display: 'flex', alignItems: 'center', maxWidth: '600px', margin: '0 auto', backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: '6px 8px 6px 20px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <input type="text" placeholder="Search movies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', background: 'none', border: 'none', color: 'white', fontSize: '15px', outline: 'none' }} />
                <button onClick={() => setActiveTab('search')} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px 28px', borderRadius: '24px', fontWeight: '700', cursor: 'pointer' }}>Explore</button>
              </div>
            </div>

            {/* AI RECOMMENDATIONS CAROUSEL (IF LOGGED IN) */}
            {isLoggedIn && (
              <div style={{ marginBottom: '40px', padding: '24px', backgroundColor: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8' }}>✨ AI Recommended For You ({userProfile.name})</h3>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
                  {movies.map(movie => (
                    <div key={movie.id} onClick={() => setSelectedMovie(movie)} style={{ minWidth: '200px', cursor: 'pointer', backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px' }}>
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '8px' }} />
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px' }}>{movie.title}</h4>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>{Math.round(movie.similarityScore * 100)}% Match</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRENDING / POPULAR / TOP RATED CAROUSELS */}
            {['Trending', 'Popular', 'Top Rated', 'New Releases'].map((cat, idx) => (
              <div key={idx} style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>{cat} Movies</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                  {movies.map(movie => (
                    <div key={movie.id} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setSelectedMovie(movie)} />
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{movie.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '700' }}>★ {movie.rating}</span>
                          <button onClick={() => toggleFavorite(movie.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                            {favorites.includes(movie.id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== 2. LOGIN PAGE ==================== */}
        {activeTab === 'login' && (
          <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Sign In</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Demo Admin: admin@cinema.com / admin123</p>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', backgroundColor: '#e50914', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Login</button>
            </form>
          </div>
        )}

        {/* ==================== 3. REGISTER PAGE ==================== */}
        {activeTab === 'register' && (
          <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h2>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
              <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' }} />
              <button type="submit" style={{ width: '100%', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Register</button>
            </form>
          </div>
        )}

        {/* ==================== 4. USER DASHBOARD ==================== */}
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

        {/* ==================== 6. SEARCH & FILTER PAGE ==================== */}
        {activeTab === 'search' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Search & Filter Catalog</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
              {/* Filter Sidebar */}
              <div style={{ backgroundColor: 'rgba(30,41,59,0.6)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Filters</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Genre</label>
                  <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <option value="All">All Genres</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Action">Action</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                  </select>
                </div>
              </div>

              {/* Movie Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredMovies.map(movie => (
                  <div key={movie.id} onClick={() => setSelectedMovie(movie)} style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}>
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }} />
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px' }}>{movie.title}</h4>
                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>★ {movie.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. FAVORITES PAGE ==================== */}
        {activeTab === 'favorites' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Your Favorites</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {movies.filter(m => favorites.includes(m.id)).map(movie => (
                <div key={movie.id} style={{ backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '16px', padding: '16px' }}>
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px' }} />
                  <h4 style={{ margin: '12px 0 6px 0' }}>{movie.title}</h4>
                  <button onClick={() => toggleFavorite(movie.id)} style={{ backgroundColor: 'rgba(229,9,20,0.2)', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 8. WATCHLIST PAGE ==================== */}
        {activeTab === 'watchlist' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>Your Watchlist</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {movies.filter(m => watchlist.some(w => w.id === m.id)).map(movie => (
                <div key={movie.id} style={{ backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '16px', padding: '16px' }}>
                  <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px' }} />
                  <h4 style={{ margin: '12px 0 6px 0' }}>{movie.title}</h4>
                  <button onClick={() => toggleWatchlist(movie.id)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: '700' }}>Mark as Watched</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 9. AI RECOMMENDATION PAGE ==================== */}
        {activeTab === 'recommendations' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>AI Recommendation Engine</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Driven by Hidden Pattern Discovery (TF-IDF + Cosine Similarity).</p>
            <div style={{ backgroundColor: 'rgba(30,27,75,0.8)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(56,189,248,0.3)' }}>
              <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>96% SIMILARITY MATCH</span>
              <h3 style={{ fontSize: '28px', marginTop: '12px' }}>{movies[0].title}</h3>
              <p style={{ color: '#cbd5e1' }}>{movies[0].description}</p>
            </div>
          </div>
        )}

        {/* ==================== 10. PROFILE PAGE ==================== */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>User Settings & Profile</h2>
            <p><strong>Name:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Preferred Genres:</strong> Sci-Fi, Action</p>
          </div>
        )}

        {/* ==================== 11. ADMIN DASHBOARD ==================== */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>System Admin Panel</h2>
            <p>Indexed Dataset Items: {movies.length}</p>
          </div>
        )}

        {/* ==================== 5. MOVIE DETAILS MODAL ==================== */}
        {selectedMovie && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '20px', maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '28px', margin: '0 0 12px 0' }}>{selectedMovie.title} ({selectedMovie.releaseYear})</h2>
              <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{selectedMovie.description}</p>
              <p><strong>Director:</strong> {selectedMovie.director}</p>
              <p><strong>Cast:</strong> {selectedMovie.cast}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => toggleFavorite(selectedMovie.id)} style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>❤️ Favorite</button>
                <button onClick={() => toggleWatchlist(selectedMovie.id)} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>📌 Watchlist</button>
                <button onClick={() => setSelectedMovie(null)} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* COMPONENT: FOOTER */}
        <footer style={{ marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <p>© 2026 Horizon Campus - Intelligent Movie Recommendation System (NI Mini Project)</p>
        </footer>

      </div>
    </div>
  );
}

export default App;