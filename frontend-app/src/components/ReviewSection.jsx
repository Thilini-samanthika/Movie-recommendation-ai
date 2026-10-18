import React, { useState, useEffect, useCallback } from 'react';
import RatingStars from './RatingStars';
import { useAuth } from '../context/AuthContext';
import {
  fetchMovieReviews,
  fetchMovieReviewStats,
  fetchUserMovieReview,
  submitMovieReview,
  updateMovieReview,
  deleteMovieReview,
  reportMovieReview,
} from '../services/api';

const ReviewSection = ({ movieId, movieTitle, onToast }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();

  // State
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, ratingDistribution: {} });
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load reviews & statistics
  const loadReviews = useCallback(async () => {
    if (!movieId) return;
    try {
      setLoading(true);
      const [statsData, reviewsData] = await Promise.all([
        fetchMovieReviewStats(movieId).catch(() => ({ averageRating: 0, totalReviews: 0, ratingDistribution: {} })),
        fetchMovieReviews(movieId, { page, size: 6, sortBy }).catch(() => ({ content: [], totalPages: 0 })),
      ]);

      setStats(statsData || { averageRating: 0, totalReviews: 0, ratingDistribution: {} });
      setReviews(reviewsData.content || []);
      setTotalPages(reviewsData.totalPages || 0);

      if (isAuthenticated) {
        const myReview = await fetchUserMovieReview(movieId).catch(() => null);
        setUserReview(myReview);
        if (myReview) {
          setRatingInput(myReview.rating || 5);
          setCommentInput(myReview.comment || '');
        }
      }
    } catch (err) {
      console.warn('Error loading reviews:', err.message);
    } finally {
      setLoading(false);
    }
  }, [movieId, page, sortBy, isAuthenticated]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Submit or update user review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login', () => {}, 'Please sign in to rate and review this movie');
      return;
    }

    if (!ratingInput || ratingInput < 1 || ratingInput > 5) {
      onToast && onToast('Please select a star rating between 1 and 5', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (userReview && userReview.id) {
        // Update
        const updated = await updateMovieReview(userReview.id, {
          rating: ratingInput,
          comment: commentInput,
        });
        setUserReview(updated);
        setIsEditing(false);
        onToast && onToast('Your review has been updated successfully!', 'success');
      } else {
        // Create new
        const created = await submitMovieReview({
          movieId,
          rating: ratingInput,
          comment: commentInput,
        });
        setUserReview(created);
        setIsEditing(false);
        onToast && onToast('Thank you! Your rating and review have been submitted.', 'success');
      }
      loadReviews();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to submit review. Please try again.';
      onToast && onToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDelete = async () => {
    if (!userReview || !userReview.id) return;
    try {
      setSubmitting(true);
      await deleteMovieReview(userReview.id);
      setUserReview(null);
      setRatingInput(5);
      setCommentInput('');
      setShowDeleteModal(false);
      setIsEditing(false);
      onToast && onToast('Your review has been deleted.', 'info');
      loadReviews();
    } catch (err) {
      onToast && onToast('Failed to delete review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Report inappropriate review
  const handleReport = async (reviewId) => {
    if (!isAuthenticated) {
      openAuthModal('login', () => {}, 'Please sign in to report reviews');
      return;
    }
    try {
      await reportMovieReview(reviewId);
      onToast && onToast('Review reported to administrators for moderation.', 'info');
    } catch (err) {
      onToast && onToast('Failed to report review.', 'error');
    }
  };

  const totalReviewsCount = stats.totalReviews || 0;
  const avgRating = Number(stats.averageRating || 0).toFixed(1);

  return (
    <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>★</span> Ratings & Reviews
        </h3>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Aggregate Rating & Distribution Visual Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          backgroundColor: 'rgba(18, 21, 32, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: '28px',
        }}
      >
        {/* Average Score Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: '16px' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--accent-gold)', lineHeight: 1 }}>
            {avgRating}
          </div>
          <div style={{ marginTop: '8px' }}>
            <RatingStars rating={Number(avgRating)} maxStars={5} size={20} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Rating Distribution Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (stats.ratingDistribution && stats.ratingDistribution[star]) || 0;
            const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '40px', color: 'var(--text-dim)', textAlign: 'right' }}>{star} ★</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: star >= 4 ? 'var(--accent-gold)' : star === 3 ? 'var(--accent-cyan)' : 'var(--primary-red)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ width: '32px', color: 'var(--text-muted)', fontSize: '11px' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User's Review / Submission Form */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        {isAuthenticated ? (
          userReview && !isEditing ? (
            // Display User's Existing Review
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: 'rgba(229, 9, 20, 0.2)', color: 'var(--primary-red-hover)', border: '1px solid rgba(229, 9, 20, 0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                    YOUR REVIEW
                  </span>
                  <RatingStars rating={userReview.rating} size={16} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      backgroundColor: 'rgba(229, 9, 20, 0.15)',
                      border: '1px solid rgba(229, 9, 20, 0.3)',
                      color: 'var(--primary-red-hover)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                {userReview.comment || <em>(No written review text provided)</em>}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Reviewed on {new Date(userReview.createdAt).toLocaleDateString()}
                {userReview.updatedAt && userReview.updatedAt !== userReview.createdAt && ' (Edited)'}
              </div>
            </div>
          ) : (
            // Review Form (Create or Edit)
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {isEditing ? 'Edit Your Review' : `Rate & Review "${movieTitle}"`}
                </span>
                <RatingStars
                  rating={ratingInput}
                  interactive={true}
                  onChange={(val) => setRatingInput(val)}
                  size={24}
                  showLabel={true}
                />
              </div>

              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                maxLength={1000}
                placeholder="Share your thoughts about this movie... (acting, pacing, visuals, directing, etc.)"
                rows={3}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {commentInput.length}/1000 characters
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-dim)',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      backgroundColor: 'var(--primary-red)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {submitting ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </form>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Want to share your rating and review?
            </span>
            <button
              onClick={() => openAuthModal('login', () => {}, 'Please sign in to rate and review movies')}
              style={{
                marginLeft: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Sign In to Review →
            </button>
          </div>
        )}
      </div>

      {/* Delete Review Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#121520',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Delete Your Review?
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove your rating and review for "{movieTitle}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Keep Review
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                style={{
                  backgroundColor: 'var(--primary-red)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dim)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Community Reviews ({totalReviewsCount})
        </h4>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', backgroundColor: 'rgba(18, 21, 32, 0.4)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>💬</span>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dim)' }}>No reviews yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Be the first to share your thoughts on this movie!
            </div>
          </div>
        ) : (
          reviews.map((r) => {
            const authorInitial = (r.username || 'U').charAt(0).toUpperCase();
            const isMyPost = user && r.userId === user.id;

            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: 'rgba(18, 21, 32, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isMyPost ? 'var(--primary-red)' : 'var(--accent-purple)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '13px',
                      }}
                    >
                      {authorInitial}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {r.username}
                        </span>
                        {isMyPost && (
                          <span style={{ fontSize: '10px', backgroundColor: 'rgba(229, 9, 20, 0.2)', color: 'var(--primary-red-hover)', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                        {r.updatedAt && r.updatedAt !== r.createdAt && ' (Edited)'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <RatingStars rating={r.rating} size={14} />
                    {!isMyPost && (
                      <button
                        onClick={() => handleReport(r.id)}
                        title="Report inappropriate review"
                        aria-label="Report review"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-faint)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '2px 4px',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-red)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                      >
                        ⚐ Report
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                  {r.comment || <em>(No written review)</em>}
                </p>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: page === 0 ? 'var(--text-muted)' : 'var(--text-main)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-main)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
