import axios from 'axios';

// Spring Boot Backend Base Instance
const API = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT Authorization Header Injection
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified Error Interceptor for Token Expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If server explicitly returns 401 Unauthorized on protected routes, broadcast or handle session expiry
      if (error.config && error.config.url && !error.config.url.includes('/auth/login')) {
        console.warn('Session expired or unauthorized for:', error.config.url);
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. Authentication & User Profile APIs
// ==========================================
export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await API.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await API.put('/users/profile', profileData);
  return response.data;
};

// ==========================================
// 2. Movie Catalog APIs (Paginated & Filtered)
// ==========================================
export const fetchMovies = async ({
  page = 0,
  size = 20,
  query = '',
  genre = '',
  year = null,
  minRating = null,
  sortBy = 'id_asc',
} = {}) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('size', size);
  if (query && query.trim()) params.append('query', query.trim());
  if (genre && genre !== 'All') params.append('genre', genre);
  if (year && year !== 'All') params.append('year', year);
  if (minRating && minRating !== 'All') params.append('minRating', minRating);
  if (sortBy) params.append('sortBy', sortBy);

  const response = await API.get(`/movies?${params.toString()}`);
  return response.data;
};

export const fetchMovieDetails = async (movieId) => {
  const response = await API.get(`/movies/${movieId}`);
  return response.data;
};

export const searchMovies = async (query, page = 0, size = 20) => {
  const response = await API.get(`/movies/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  return response.data;
};

// ==========================================
// 3. User Collections (Favorites & Watchlist)
// ==========================================
export const fetchFavorites = async () => {
  const response = await API.get('/favorites');
  return response.data;
};

export const addFavorite = async (movieId) => {
  const response = await API.post('/favorites', { movieId });
  return response.data;
};

export const removeFavorite = async (movieId) => {
  const response = await API.delete(`/favorites?movieId=${movieId}`);
  return response.data;
};

export const fetchWatchlist = async () => {
  const response = await API.get('/watchlist');
  return response.data;
};

export const addToWatchlist = async (movieId, watched = false) => {
  const response = await API.post('/watchlist', { movieId, watched });
  return response.data;
};

export const removeFromWatchlist = async (movieId) => {
  const response = await API.delete(`/watchlist/${movieId}`);
  return response.data;
};

export const toggleWatched = async (movieId, watched = null) => {
  const url = watched !== null
    ? `/watchlist/${movieId}/watched?watched=${watched}`
    : `/watchlist/${movieId}/watched`;
  const response = await API.patch(url);
  return response.data;
};

// ==========================================
// 4. Legal Free Streaming APIs
// ==========================================
export const fetchLegalCatalog = async () => {
  const response = await API.get('/streaming/catalog');
  return response.data;
};

export const authorizeLegalStream = async (filmId) => {
  const response = await API.get(`/streaming/authorize/${filmId}`);
  return response.data;
};

// ==========================================
// 4b. Playback Progress APIs (Feature 1)
// ==========================================
export const fetchPlaybackProgress = async () => {
  const response = await API.get('/playback-progress');
  return response.data;
};

export const fetchFilmPlaybackProgress = async (filmId) => {
  const response = await API.get(`/playback-progress/${filmId}`);
  return response.data;
};

export const savePlaybackProgress = async (filmId, { positionSeconds, durationSeconds, completed = false }) => {
  const response = await API.put(`/playback-progress/${filmId}`, {
    positionSeconds,
    durationSeconds,
    completed,
  });
  return response.data;
};

export const deletePlaybackProgress = async (filmId) => {
  const response = await API.delete(`/playback-progress/${filmId}`);
  return response.data;
};

// ==========================================
// 4c. Movie Ratings & Reviews APIs (Feature 2)
// ==========================================
export const fetchMovieReviews = async (movieId, { page = 0, size = 10, sortBy = 'newest' } = {}) => {
  const response = await API.get(`/reviews/movie/${movieId}?page=${page}&size=${size}&sortBy=${sortBy}`);
  return response.data;
};

export const fetchMovieReviewStats = async (movieId) => {
  const response = await API.get(`/reviews/movie/${movieId}/stats`);
  return response.data;
};

export const fetchUserMovieReview = async (movieId) => {
  const response = await API.get(`/reviews/movie/${movieId}/user`);
  return response.data;
};

export const submitMovieReview = async ({ movieId, rating, comment }) => {
  const response = await API.post('/reviews', { movieId, rating, comment });
  return response.data;
};

export const updateMovieReview = async (reviewId, { rating, comment }) => {
  const response = await API.put(`/reviews/${reviewId}`, { rating, comment });
  return response.data;
};

export const deleteMovieReview = async (reviewId) => {
  const response = await API.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const reportMovieReview = async (reviewId) => {
  const response = await API.post(`/reviews/${reviewId}/report`);
  return response.data;
};

export const fetchMyReviews = async () => {
  const response = await API.get('/users/me/reviews');
  return response.data;
};

// ==========================================
// 5. AI Recommendation Engines (Features 3 & 4)
// ==========================================
// Mood-Based Recommendations (Feature 4)
export const getMoodRecommendations = async (mood) => {
  const response = await axios.get(`/mood-recommendations?mood=${encodeURIComponent(mood)}`, {
    timeout: 15000,
  });
  return response.data;
};
// Workflow A: Search-by-title through FastAPI
export const getTitleRecommendations = async (title) => {
  // Proxied through Nginx /recommend or direct
  const response = await axios.post('/recommend', { movie_title: title }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  });
  return response.data;
};

// Workflow B: Personalized AI Recommendations through Spring Boot
export const getPersonalizedRecommendations = async (genre = 'Sci-Fi') => {
  const response = await API.post(`/recommendations?genre=${encodeURIComponent(genre)}`);
  // Handle string response or parsed JSON object safely
  if (typeof response.data === 'string') {
    try {
      return JSON.parse(response.data);
    } catch {
      return { recommendations: [] };
    }
  }
  return response.data;
};

// ==========================================
// 6. Administrative APIs (ROLE_ADMIN only)
// ==========================================
export const getAdminStats = async () => {
  const response = await API.get('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await API.get('/admin/users', { params });
  return response.data;
};

export const updateAdminUserStatus = async (userId, active) => {
  const response = await API.put(`/admin/users/${userId}/status`, { active });
  return response.data;
};

export const updateAdminUserRole = async (userId, role) => {
  const response = await API.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const getAdminMovies = async (params = {}) => {
  const response = await API.get('/admin/movies', { params });
  return response.data;
};

export const addAdminMovie = async (movieData) => {
  const response = await API.post('/admin/movies', movieData);
  return response.data;
};

export const updateAdminMovie = async (id, movieData) => {
  const response = await API.put(`/admin/movies/${id}`, movieData);
  return response.data;
};

export const deleteAdminMovie = async (id) => {
  const response = await API.delete(`/admin/movies/${id}`);
  return response.data;
};

export const getAdminReviews = async (filter = 'all', page = 0, size = 15) => {
  const response = await API.get('/admin/reviews', { params: { filter, page, size } });
  return response.data;
};

export const hideAdminReview = async (reviewId) => {
  const response = await API.put(`/admin/reviews/${reviewId}/hide`);
  return response.data;
};

export const restoreAdminReview = async (reviewId) => {
  const response = await API.put(`/admin/reviews/${reviewId}/restore`);
  return response.data;
};

export const deleteAdminReview = async (reviewId) => {
  const response = await API.delete(`/admin/reviews/${reviewId}`);
  return response.data;
};

export const getAdminLegalFilms = async () => {
  const response = await API.get('/admin/legal-films');
  return response.data;
};

export const updateAdminLegalFilm = async (filmId, filmData) => {
  const response = await API.put(`/admin/legal-films/${filmId}`, filmData);
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await API.get('/admin/analytics');
  return response.data;
};

export const getAdminAuditLogs = async (page = 0, size = 20) => {
  const response = await API.get('/admin/audit-logs', { params: { page, size } });
  return response.data;
};

export default API;

