import React, { useState, useEffect, useCallback } from 'react';
import { fetchPlaybackProgress, deletePlaybackProgress, authorizeLegalStream } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatSeconds = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatLastWatched = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 86400 * 7) return `${Math.floor(diffSecs / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

const ContinueWatching = ({ onPlayFilm, onToast }) => {
  const { isAuthenticated } = useAuth();
  const [inProgressList, setInProgressList] = useState([]);

  const loadProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setInProgressList([]);
      return;
    }
    try {
      const data = await fetchPlaybackProgress();
      // Keep items with positive duration and progress
      const items = (data || []).filter((item) => item.positionSeconds > 5 || item.completed);
      // Sort in-progress first, then by updatedAt descending
      items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
      setInProgressList(items);
    } catch (err) {
      console.warn('Failed to load continue watching:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleResume = async (filmId, fromBeginning = false, currentPos = 0) => {
    try {
      const ticket = await authorizeLegalStream(filmId);
      ticket.initialPosition = fromBeginning ? 0 : currentPos;
      onPlayFilm && onPlayFilm(ticket);
    } catch (err) {
      onToast && onToast('Could not authorize stream. Please try again.', 'error');
    }
  };

  const handleRemove = async (e, filmId, filmTitle) => {
    e.stopPropagation();
    try {
      await deletePlaybackProgress(filmId);
      setInProgressList((prev) => prev.filter((item) => item.filmId !== filmId));
      onToast && onToast(`Removed "${filmTitle}" from Continue Watching`, 'info');
    } catch (err) {
      onToast && onToast('Failed to remove from Continue Watching', 'error');
    }
  };

  if (!isAuthenticated || inProgressList.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Continue Watching"
      style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⏱️</span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            Continue Watching
          </h2>
          <span
            style={{
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              color: 'var(--primary-red-hover)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {inProgressList.length} In Progress
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {inProgressList.map((item) => {
          const remainingSecs = Math.max(0, (item.durationSeconds || 0) - (item.positionSeconds || 0));
          const percentage = Math.min(100, Math.round(item.progressPercentage || 0));

          return (
            <div
              key={item.filmId}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(229, 9, 20, 0.25)';
                e.currentTarget.style.borderColor = 'var(--border-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Card Header & Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  backgroundColor: '#0a0d14',
                  overflow: 'hidden',
                }}
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.filmTitle}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.85)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '32px',
                    }}
                  >
                    🎬
                  </div>
                )}

                {/* Dismiss Button */}
                <button
                  onClick={(e) => handleRemove(e, item.filmId, item.filmTitle)}
                  title="Remove from Continue Watching"
                  aria-label="Remove from Continue Watching"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-red)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  }}
                >
                  ✕
                </button>

                {/* Progress Overlay Tag */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#ffffff',
                  }}
                >
                  {percentage}% watched
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                  }}
                >
                  {formatSeconds(remainingSecs)} left
                </div>

                {/* Visual Progress Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: 'var(--primary-red)',
                      boxShadow: '0 0 8px var(--primary-red)',
                    }}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.filmTitle}
                    </h3>
                    {item.completed && (
                      <span
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--accent-emerald)',
                          border: '1px solid var(--accent-emerald)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          letterSpacing: '0.5px',
                          flexShrink: 0,
                        }}
                      >
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{item.genre || 'Open Film'}</span>
                    <span>•</span>
                    <span>{item.completed ? 'Finished' : `Resume from ${formatSeconds(item.positionSeconds)}`}</span>
                    {item.updatedAt && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Watched {formatLastWatched(item.updatedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => handleResume(item.filmId, false, item.positionSeconds)}
                    style={{
                      flex: 2,
                      backgroundColor: item.completed ? 'rgba(255, 255, 255, 0.12)' : 'var(--primary-red)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = item.completed ? 'rgba(255, 255, 255, 0.2)' : 'var(--primary-red-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = item.completed ? 'rgba(255, 255, 255, 0.12)' : 'var(--primary-red)';
                    }}
                  >
                    <span>▶</span> {item.completed ? 'Watch Again' : 'Resume Watching'}
                  </button>

                  <button
                    onClick={() => handleResume(item.filmId, true)}
                    title="Restart from beginning"
                    aria-label="Restart from beginning"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-dim)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = 'var(--text-dim)';
                    }}
                  >
                    ↺ Restart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatching;
