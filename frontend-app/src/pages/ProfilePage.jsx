import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, fetchMyReviews, deleteMovieReview, updateMovieReview } from '../services/api';
import RatingStars from '../components/RatingStars';

const ProfilePage = ({ favoritesCount = 0, watchlistCount = 0, onShowToast }) => {
  const { user, logout, restoreSession } = useAuth();

  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  // My Reviews state
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadMyReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const data = await fetchMyReviews();
      setMyReviews(data || []);
    } catch (err) {
      console.warn('Failed to load my reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyReviews();
  }, [loadMyReviews]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateMessage('');
    try {
      await updateUserProfile({
        email: emailInput.trim(),
        newPassword: newPassword.trim() || undefined,
      });
      setUpdateMessage('Profile updated successfully.');
      onShowToast && onShowToast('Profile settings updated successfully!', 'success');
      setNewPassword('');
      restoreSession();
    } catch (err) {
      console.error('Update profile error:', err);
      setUpdateMessage('Failed to update profile. Please verify your connection.');
      onShowToast && onShowToast('Error updating profile.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || '');
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditComment('');
  };

  const saveEdit = async (reviewId) => {
    setSubmittingEdit(true);
    try {
      const updated = await updateMovieReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      setMyReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, rating: updated.rating, comment: updated.comment, updatedAt: updated.updatedAt } : r))
      );
      setEditingReviewId(null);
      onShowToast && onShowToast('Review updated successfully!', 'success');
    } catch (err) {
      onShowToast && onShowToast('Failed to update review.', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to delete your review for "${movieTitle || 'this movie'}"?`)) {
      return;
    }
    try {
      await deleteMovieReview(reviewId);
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      onShowToast && onShowToast('Review deleted successfully!', 'info');
    } catch (err) {
      onShowToast && onShowToast('Failed to delete review.', 'error');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          User Account &amp; Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Verified identity retrieved directly from Spring Boot backend session and MySQL database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Profile Details Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: user?.role === 'ROLE_ADMIN' ? 'var(--accent-gold)' : 'var(--primary-red)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: '900',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{user?.username}</h2>
              <span
                style={{
                  backgroundColor: user?.role === 'ROLE_ADMIN' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(229, 9, 20, 0.2)',
                  color: user?.role === 'ROLE_ADMIN' ? 'var(--accent-gold)' : 'var(--primary-red-hover)',
                  border: `1px solid ${user?.role === 'ROLE_ADMIN' ? 'var(--accent-gold)' : 'var(--primary-red)'}`,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                }}
              >
                {user?.role === 'ROLE_ADMIN' ? 'ADMINISTRATOR' : 'VERIFIED USER'}
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>User ID (MySQL PK):</span>
              <strong style={{ color: 'var(--text-main)' }}>#{user?.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered Email:</span>
              <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Session State:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>● Active JWT Session</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Saved Favorites:</span>
              <strong style={{ color: 'var(--text-main)' }}>{favoritesCount} films</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Watchlist Items:</span>
              <strong style={{ color: 'var(--text-main)' }}>{watchlistCount} films</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>My Reviews:</span>
              <strong style={{ color: 'var(--accent-gold)' }}>{myReviews.length} reviews</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: 'auto',
            }}
          >
            Sign Out of CINEMA AI
          </button>
        </div>

        {/* Profile Settings & Update Form */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            Account Settings
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Update your registered email or change your security credentials.
          </p>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {updateMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid var(--accent-emerald)',
                  color: 'var(--accent-emerald)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {updateMessage}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
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
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              style={{
                backgroundColor: 'var(--primary-red)',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1,
                marginTop: '8px',
              }}
            >
              {updating ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FEATURE 2: MY REVIEWS SECTION */}
      {/* ============================================================ */}
      <section className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⭐</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>My Movie Ratings &amp; Reviews</h2>
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              {myReviews.length} Submitted
            </span>
          </div>
          <button
            onClick={loadMyReviews}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {reviewsLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading your reviews...
          </div>
        ) : myReviews.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>✍️</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              No Reviews Submitted Yet
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '460px', margin: '0 auto', lineHeight: '1.5' }}>
              Explore movies in the catalog, rate titles from 1 to 5 stars, and write reviews. Your ratings directly train your personalized AI recommendations!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myReviews.map((rev) => {
              const isEditing = editingReviewId === rev.id;
              const formattedDate = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recently';

              return (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        {rev.movieTitle || `Movie #${rev.movieId}`}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RatingStars rating={rev.rating} size={16} showLabel />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {formattedDate}</span>
                        {rev.hidden && (
                          <span
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Under Moderation Review
                          </span>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => startEdit(rev)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-dim)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.movieTitle)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Update Rating:
                        </label>
                        <RatingStars rating={editRating} interactive onChange={setEditRating} size={22} showLabel />
                      </div>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Write your movie thoughts and review..."
                        rows={3}
                        style={{
                          width: '100%',
                          backgroundColor: '#0c0e15',
                          border: '1px solid var(--border-card)',
                          color: '#ffffff',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={cancelEdit}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-muted)',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={submittingEdit}
                          onClick={() => saveEdit(rev.id)}
                          style={{
                            backgroundColor: 'var(--primary-red)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: submittingEdit ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {submittingEdit ? 'Saving...' : 'Save Review'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    rev.comment && (
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                        "{rev.comment}"
                      </p>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
