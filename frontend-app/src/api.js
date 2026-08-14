import axios from 'axios';

// Spring Boot Backend Base URL
const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Request එකක් යද්දී LocalStorage එකේ JWT Token එකක් තිබේ නම් එය Header එකට එක් කිරීම
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Authentication APIs
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);

// Movie APIs
export const fetchMovies = (page = 0, size = 10) => API.get(`/movies?page=${page}&size=${size}`);
export const fetchMovieDetails = (id) => API.get(`/movies/${id}`);
export const searchMovies = (query) => API.get(`/movies/search?query=${query}`);

// Review APIs
export const addReview = (reviewData) => API.post('/reviews', reviewData);
export const fetchMovieReviews = (movieId) => API.get(`/reviews/movie/${movieId}`);

// Favorite APIs
export const addFavorite = (favData) => API.post('/favorites', favData);
export const fetchFavorites = (userId) => API.get(`/favorites/user/${userId}`);

// AI Recommendation API
export const getRecommendations = (userId, genre) => 
  API.post(`/recommendations?userId=${userId}&genre=${genre}`);

export default API;