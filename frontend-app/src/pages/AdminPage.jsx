import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUserStatus,
  updateAdminUserRole,
  getAdminMovies,
  addAdminMovie,
  deleteAdminMovie,
  getAdminReviews,
  hideAdminReview,
  restoreAdminReview,
  deleteAdminReview,
  getAdminLegalFilms,
  getAdminAnalytics,
  getAdminAuditLogs,
} from '../services/api';

const AdminPage = ({ onShowToast, onReloadMovies }) => {
  const { user: currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, reviews, catalog, legal, audit
  const [loading, setLoading] = useState(true);

  // Stats & Analytics
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Review Moderation State
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, reported, hidden
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Catalog State
  const [catalogMovies, setCatalogMovies] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Add Movie Form State
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieGenre, setNewMovieGenre] = useState('');
  const [newMovieYear, setNewMovieYear] = useState('2024');
  const [newMovieRating, setNewMovieRating] = useState('4.5');
  const [newMoviePoster, setNewMoviePoster] = useState('');
  const [newMovieDesc, setNewMovieDesc] = useState('');
  const [addingMovie, setAddingMovie] = useState(false);

  // Legal Films State
  const [legalFilms, setLegalFilms] = useState([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // 1. Initial Overview & Stats Load
  const loadOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminAnalytics().catch(() => null),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadOverviewData();
    }
  }, [isAdmin, loadOverviewData]);

  // 2. Load Users
  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const params = {};
      if (userSearch.trim()) params.query = userSearch.trim();
      if (userRoleFilter) params.role = userRoleFilter;
      const data = await getAdminUsers(params);
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      onShowToast && onShowToast('Failed to load user registry', 'error');
    } finally {
      setUserLoading(false);
    }
  }, [userSearch, userRoleFilter, onShowToast]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeTab, loadUsers]);

  // 3. Load Reviews
  const loadReviews = useCallback(async () => {
    setReviewLoading(true);
    try {
      const data = await getAdminReviews(reviewFilter, reviewPage, 15);
      setReviews(data?.content || []);
    } catch (err) {
      console.error('Failed to load reviews for moderation:', err);
      onShowToast && onShowToast('Failed to load reviews', 'error');
    } finally {
      setReviewLoading(false);
    }
  }, [reviewFilter, reviewPage, onShowToast]);

  useEffect(() => {
    if (isAdmin && activeTab === 'reviews') {
      loadReviews();
    }
  }, [isAdmin, activeTab, loadReviews]);

  // 4. Load Catalog Movies
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const data = await getAdminMovies({
        query: catalogSearch.trim() || undefined,
        page: catalogPage,
        size: 12,
      });
      setCatalogMovies(data?.content || []);
      setCatalogTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load movie catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogSearch, catalogPage]);

  useEffect(() => {
    if (isAdmin && activeTab === 'catalog') {
      loadCatalog();
    }
  }, [isAdmin, activeTab, loadCatalog]);

  // 5. Load Legal Films
  const loadLegalFilms = useCallback(async () => {
    try {
      const data = await getAdminLegalFilms();
      setLegalFilms(data || []);
    } catch (err) {
      console.error('Failed to load legal films:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'legal') {
      loadLegalFilms();
    }
  }, [isAdmin, activeTab, loadLegalFilms]);

  // 6. Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await getAdminAuditLogs(0, 30);
      setAuditLogs(data?.content || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [isAdmin, activeTab, loadAuditLogs]);

  // User Actions
  const handleToggleUserStatus = async (user) => {
    const nextStatus = !user.active;
    const actionLabel = nextStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} account "${user.username}"?`)) return;

    try {
      await updateAdminUserStatus(user.id, nextStatus);
      onShowToast && onShowToast(`User "${user.username}" has been ${nextStatus ? 'activated' : 'deactivated'}.`, 'success');
      loadUsers();
      loadOverviewData();
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${actionLabel} user.`;
      onShowToast && onShowToast(msg, 'error');
    }
  };

  const handleChangeUserRole = async (user, newRole) => {
    if (user.role === newRole) return;
    if (!window.confirm(`Change role of "${user.username}" to ${newRole}?`)) return;

    try {
      await updateAdminUserRole(user.id, newRole);
      onShowToast && onShowToast(`Role for "${user.username}" updated to ${newRole}.`, 'success');
      loadUsers();
      loadOverviewData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user role.';
      onShowToast && onShowToast(msg, 'error');
    }
  };

  // Review Actions
  const handleHideReview = async (reviewId) => {
    try {
      await hideAdminReview(reviewId);
      onShowToast && onShowToast('Review has been hidden from public display.', 'success');
      loadReviews();
      loadOverviewData();
    } catch (err) {
      onShowToast && onShowToast('Failed to hide review.', 'error');
    }
  };

  const handleRestoreReview = async (reviewId) => {
    try {
      await restoreAdminReview(reviewId);
      onShowToast && onShowToast('Review restored to public visibility.', 'success');
      loadReviews();
      loadOverviewData();
    } catch (err) {
      onShowToast && onShowToast('Failed to restore review.', 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Permanently delete this review from the database? This cannot be undone.')) return;
    try {
      await deleteAdminReview(reviewId);
      onShowToast && onShowToast('Review permanently deleted.', 'success');
      loadReviews();
      loadOverviewData();
    } catch (err) {
      onShowToast && onShowToast('Failed to delete review.', 'error');
    }
  };

  // Movie Catalog Actions
  const handleAddMovie = async (e) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) {
      onShowToast && onShowToast('Please enter a movie title', 'error');
      return;
    }

    setAddingMovie(true);
    try {
      await addAdminMovie({
        title: newMovieTitle.trim(),
        genre: newMovieGenre.trim() || 'Drama',
        releaseYear: Number(newMovieYear) || 2024,
        rating: Number(newMovieRating) || 4.0,
        posterUrl: newMoviePoster.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60',
        description: newMovieDesc.trim() || 'Film record added through CINEMA AI Admin Panel.',
      });

      onShowToast && onShowToast(`Movie "${newMovieTitle}" added to catalog!`, 'success');
      setNewMovieTitle('');
      setNewMovieGenre('');
      setNewMovieDesc('');
      setNewMoviePoster('');

      loadCatalog();
      loadOverviewData();
      onReloadMovies && onReloadMovies();
    } catch (err) {
      console.error('Add movie error:', err);
      onShowToast && onShowToast('Failed to add movie to catalog.', 'error');
    } finally {
      setAddingMovie(false);
    }
  };

  const handleDeleteMovie = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}" (ID #${movie.id}) from the database?`)) return;

    try {
      await deleteAdminMovie(movie.id);
      onShowToast && onShowToast(`Movie "${movie.title}" removed from catalog.`, 'success');
      loadCatalog();
      loadOverviewData();
      onReloadMovies && onReloadMovies();
    } catch (err) {
      onShowToast && onShowToast('Could not delete movie. Please verify constraints.', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
          Access Restricted to Administrators
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Your current authenticated session does not possess the <code>ROLE_ADMIN</code> authority required to view this panel.
        </p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
          Loading System Telemetry...
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Connecting to MySQL database metrics and enterprise audit logs...
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & Telemetry', icon: '📊' },
    { id: 'users', label: 'User Registry', icon: '👥' },
    { id: 'reviews', label: 'Review Moderation', icon: '🛡️' },
    { id: 'catalog', label: 'Movie Catalog', icon: '🎬' },
    { id: 'legal', label: 'Authorized Streaming', icon: '⚖️' },
    { id: 'audit', label: 'Security Audit Log', icon: '📜' },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--accent-gold)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.8px',
            marginBottom: '12px',
          }}
        >
          <span>⚙️</span>
          <span>ENTERPRISE CONTROL PLANE</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          System Administration Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Live system telemetry, user role authorization, content moderation, and real-time database management for authorized administrators.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '12px',
          marginBottom: '28px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid rgba(229, 9, 20, 0.5)' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(229, 9, 20, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metric Tiles */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>TOTAL MOVIES</span>
                <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '6px', color: '#ffffff' }}>
                  {stats.totalMovies?.toLocaleString()}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>REGISTERED USERS</span>
                <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '6px', color: 'var(--accent-cyan)' }}>
                  {stats.totalUsers?.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  {stats.activeUsers} active · {stats.inactiveUsers || 0} suspended
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>TOTAL REVIEWS</span>
                <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '6px', color: 'var(--accent-gold)' }}>
                  {stats.totalReviews?.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  {stats.reportedReviews || 0} reported · {stats.hiddenReviews || 0} hidden
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>SAVED FAVORITES</span>
                <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '6px', color: 'var(--primary-red-hover)' }}>
                  {stats.totalFavorites?.toLocaleString()}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>LEGAL STREAMS</span>
                <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '6px', color: 'var(--accent-emerald)' }}>
                  {stats.authorizedLegalFilms || 5}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  Public Domain & CC Licensed
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.6px' }}>SYSTEM HEALTH</span>
                <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '12px', color: 'var(--accent-emerald)' }}>
                  ● {stats.systemStatus || 'ONLINE'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  Spring Boot 3.3.3 + MySQL 8.0
                </div>
              </div>
            </div>
          )}

          {/* Database Analytics Visualizations */}
          {analytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Rating Distribution */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>
                  ⭐ Community Rating Distribution
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '18px' }}>
                  Aggregated distribution of 1 to 5-star ratings submitted by verified users.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = analytics.ratingDistribution?.[star] || 0;
                    const maxCount = Math.max(...Object.values(analytics.ratingDistribution || {}), 1);
                    const pct = Math.round((count / maxCount) * 100);

                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <span style={{ width: '40px', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {star} ★
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '5px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: star >= 4 ? 'var(--accent-gold)' : star === 3 ? 'var(--accent-cyan)' : 'var(--primary-red)',
                              borderRadius: '5px',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                        <span style={{ width: '35px', textAlign: 'right', fontWeight: '700', color: '#ffffff' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Favorited Movies */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>
                  ❤️ Most Favorited Movies
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Real-time aggregation from the MySQL <code>favorites</code> table.
                </p>

                {analytics.topFavorited && analytics.topFavorited.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analytics.topFavorited.map((item, idx) => (
                      <div
                        key={item.movieId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--accent-gold)', fontWeight: '900', fontSize: '13px' }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                              Movie ID #{item.movieId}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            backgroundColor: 'rgba(229, 9, 20, 0.15)',
                            color: 'var(--primary-red-hover)',
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                          }}
                        >
                          {item.favoriteCount} saves
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                    No favorites recorded yet in the database.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER REGISTRY */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
                User Registry & Access Control
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Manage account authorization, toggle active status, and audit permissions. Last administrator accounts are protected against lockout.
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  backgroundColor: '#0c0e15',
                  border: '1px solid var(--border-card)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  backgroundColor: '#0c0e15',
                  border: '1px solid var(--border-card)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">All Roles</option>
                <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                <option value="ROLE_USER">ROLE_USER</option>
              </select>
            </div>
          </div>

          {userLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading user registry...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>User Details</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Account Status</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser?.username === u.username;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 10px', color: 'var(--text-faint)' }}>#{u.id}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: '700', color: '#ffffff' }}>
                            {u.username} {isSelf && <span style={{ color: 'var(--accent-gold)', fontSize: '11px' }}>(You)</span>}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u, e.target.value)}
                            disabled={isSelf}
                            style={{
                              backgroundColor: u.role === 'ROLE_ADMIN' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: u.role === 'ROLE_ADMIN' ? 'var(--accent-gold)' : 'var(--text-main)',
                              border: `1px solid ${u.role === 'ROLE_ADMIN' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'}`,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '700',
                              outline: 'none',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <option value="ROLE_USER">ROLE_USER</option>
                            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              backgroundColor: u.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: u.active ? 'var(--accent-emerald)' : '#f87171',
                              border: `1px solid ${u.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            {u.active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={isSelf}
                            style={{
                              backgroundColor: u.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: u.active ? '#f87171' : 'var(--accent-emerald)',
                              border: `1px solid ${u.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
                Community Review Moderation
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Review, soft-hide, or restore reviews reported by users or flagged by automated filters.
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'reported', label: '🚩 Reported Reviews' },
                { id: 'hidden', label: '👁️ Hidden Reviews' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setReviewFilter(f.id);
                    setReviewPage(0);
                  }}
                  style={{
                    backgroundColor: reviewFilter === f.id ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {reviewLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              No reviews match the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: r.reported ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '14px' }}>
                        {r.username}
                      </span>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '13px' }}>
                        {'★'.repeat(Math.round(r.rating || 0))} ({r.rating})
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        Movie ID #{r.movieId}
                      </span>
                      {r.reported && (
                        <span
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          REPORTED
                        </span>
                      )}
                      {r.hidden && (
                        <span
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            color: 'var(--accent-gold)',
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.5', margin: '4px 0' }}>
                      "{r.comment}"
                    </p>

                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
                      Submitted: {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Recent'}
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {r.hidden ? (
                      <button
                        onClick={() => handleRestoreReview(r.id)}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--accent-emerald)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHideReview(r.id)}
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-gold)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        Hide Review
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MOVIE CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
          {/* Add Movie Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
              Add New Movie Record
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Expand the MySQL catalog and index metadata for the Explainable AI recommender.
            </p>

            <form onSubmit={handleAddMovie} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dune: Part Two"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0c0e15',
                    border: '1px solid var(--border-card)',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Genre (Pipe Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Action|Sci-Fi"
                    value={newMovieGenre}
                    onChange={(e) => setNewMovieGenre(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0c0e15',
                      border: '1px solid var(--border-card)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={newMovieYear}
                    onChange={(e) => setNewMovieYear(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0c0e15',
                      border: '1px solid var(--border-card)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Initial Rating (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    max="5"
                    min="0"
                    value={newMovieRating}
                    onChange={(e) => setNewMovieRating(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0c0e15',
                      border: '1px solid var(--border-card)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newMoviePoster}
                    onChange={(e) => setNewMoviePoster(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0c0e15',
                      border: '1px solid var(--border-card)',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Plot synopsis..."
                  value={newMovieDesc}
                  onChange={(e) => setNewMovieDesc(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0c0e15',
                    border: '1px solid var(--border-card)',
                    color: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={addingMovie}
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: addingMovie ? 'not-allowed' : 'pointer',
                  opacity: addingMovie ? 0.6 : 1,
                }}
              >
                {addingMovie ? 'Saving Movie...' : '+ Add Movie to Catalog'}
              </button>
            </form>
          </div>

          {/* Paginated Catalog Browser */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                Catalog Browser
              </h3>
              <input
                type="text"
                placeholder="Search catalog..."
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setCatalogPage(0);
                }}
                style={{
                  backgroundColor: '#0c0e15',
                  border: '1px solid var(--border-card)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  outline: 'none',
                  width: '160px',
                }}
              />
            </div>

            {catalogLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading catalog...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {catalogMovies.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-faint)', fontSize: '11px', width: '32px' }}>
                        #{m.id}
                      </span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#ffffff' }}>
                          {m.title} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({m.releaseYear})</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {m.genre} · ⭐ {m.rating}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMovie(m)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button
                    disabled={catalogPage === 0}
                    onClick={() => setCatalogPage((p) => Math.max(0, p - 1))}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: catalogPage === 0 ? 'var(--text-faint)' : '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: catalogPage === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Prev
                  </button>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Page {catalogPage + 1} of {catalogTotalPages || 1}
                  </span>

                  <button
                    disabled={catalogPage >= catalogTotalPages - 1}
                    onClick={() => setCatalogPage((p) => p + 1)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: catalogPage >= catalogTotalPages - 1 ? 'var(--text-faint)' : '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: catalogPage >= catalogTotalPages - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUTHORIZED LEGAL FILMS */}
      {activeTab === 'legal' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
              Authorized Legal Film Directory
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Verified open-source films streaming under Creative Commons and Blender Foundation licenses. Commercial pirated media is strictly prohibited.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {legalFilms.map((film) => (
              <div
                key={film.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                      {film.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>
                      {film.year} · {film.genre}
                    </span>
                  </div>
                  <span
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '800',
                    }}
                  >
                    CC LICENSED
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {film.description}
                </p>

                <div style={{ fontSize: '11px', color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div><strong>License:</strong> {film.license}</div>
                  <div><strong>Attribution:</strong> {film.attribution}</div>
                  <div style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                    <strong>Stream Source:</strong> <code style={{ color: 'var(--accent-cyan)' }}>{film.streamUrl}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
              Administrative Security Audit Trail
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Immutable record of administrative actions logged to the <code>admin_audit_logs</code> table.
            </p>
          </div>

          {auditLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading audit trail...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No audit log entries recorded yet. Actions such as role adjustments and review moderations are recorded here automatically.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 10px' }}>Timestamp</th>
                    <th style={{ padding: '8px 10px' }}>Administrator</th>
                    <th style={{ padding: '8px 10px' }}>Action</th>
                    <th style={{ padding: '8px 10px' }}>Target</th>
                    <th style={{ padding: '8px 10px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', fontWeight: '700', color: 'var(--accent-gold)' }}>
                        {log.adminUsername}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {log.targetEntity} #{log.targetId}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-dim)' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
