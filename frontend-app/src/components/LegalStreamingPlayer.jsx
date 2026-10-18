import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFilmPlaybackProgress, savePlaybackProgress } from '../services/api';

const formatTime = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${paddedMins}:${paddedSecs}`;
};

const LegalStreamingPlayer = ({ ticket, onClose }) => {
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''

  const videoRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const filmId = ticket ? (ticket.id || ticket.filmId || '').toLowerCase() : '';

  // 1. Fetch saved playback progress on mount
  useEffect(() => {
    let isMounted = true;
    if (!filmId) return;

    if (ticket && ticket.initialPosition === 0) {
      // User explicitly requested to start from beginning
      setResumePrompt(null);
      return;
    }

    if (ticket && typeof ticket.initialPosition === 'number' && ticket.initialPosition > 5) {
      // Direct resume position provided
      setResumePrompt({
        position: ticket.initialPosition,
        duration: ticket.duration || 0,
        formatted: formatTime(ticket.initialPosition),
      });
      return;
    }

    const checkProgress = async () => {
      try {
        const progress = await fetchFilmPlaybackProgress(filmId);
        if (isMounted && progress && progress.positionSeconds > 5 && !progress.completed) {
          setResumePrompt({
            position: progress.positionSeconds,
            duration: progress.durationSeconds,
            formatted: formatTime(progress.positionSeconds),
          });
        }
      } catch (err) {

        console.debug('No prior playback progress found for', filmId);
      }
    };

    checkProgress();

    return () => {
      isMounted = false;
    };
  }, [filmId, ticket]);

  // 2. Throttled save function
  const persistProgress = useCallback(async (isCompleted = false) => {
    if (!videoRef.current || !filmId) return;
    const currentPos = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    if (!duration || isNaN(duration) || duration <= 0) return;

    try {
      setSaveStatus('saving');
      await savePlaybackProgress(filmId, {
        positionSeconds: currentPos,
        durationSeconds: duration,
        completed: isCompleted,
      });
      lastSavedTimeRef.current = Date.now();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.warn('Failed to save playback progress:', err.message);
      setSaveStatus('');
    }
  }, [filmId]);

  // 3. Periodic save during playback
  const handleTimeUpdate = () => {
    const now = Date.now();
    // Save every 10 seconds
    if (now - lastSavedTimeRef.current > 10000) {
      persistProgress(false);
    }
  };

  const handlePause = () => {
    persistProgress(false);
  };

  const handleSeeked = () => {
    persistProgress(false);
  };

  const handleEnded = () => {
    persistProgress(true);
  };

  // 4. Resume action
  const handleResume = () => {
    if (videoRef.current && resumePrompt) {
      videoRef.current.currentTime = resumePrompt.position;
      videoRef.current.play().catch(() => {});
    }
    setResumePrompt(null);
  };

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setResumePrompt(null);
  };

  // 5. Cleanup / save on close or unmount
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        persistProgress(false);
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      persistProgress(false);
    };
  }, [onClose, persistProgress]);

  if (!ticket) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${ticket.title}`}
      onClick={() => {
        persistProgress(false);
        onClose && onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0a0c12',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          maxWidth: '1020px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Player Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(18, 21, 32, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid var(--accent-emerald)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                }}
              >
                AUTHENTICATED PLAYBACK SESSION
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Ticket: #{ticket.ticketId ? ticket.ticketId.slice(0, 8) : 'AUTH-STREAM'}
              </span>
              {saveStatus === 'saved' && (
                <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Progress Saved
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--text-main)' }}>
              {ticket.title} <small style={{ fontWeight: '400', color: 'var(--text-muted)' }}>({ticket.year})</small>
            </h2>
          </div>

          <button
            onClick={() => {
              persistProgress(false);
              onClose && onClose();
            }}
            aria-label="Close video player"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-red)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
          >
            ✕ Close Player
          </button>
        </div>

        {/* Video Player Display Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#000000',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Resume Playback Prompt Banner */}
          {resumePrompt && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 25,
                backgroundColor: 'rgba(15, 17, 26, 0.95)',
                border: '1px solid var(--primary-red)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                animation: 'slideDown 0.3s ease',
              }}
            >
              <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>
                Resume from <strong style={{ color: 'var(--primary-red-hover)' }}>{resumePrompt.formatted}</strong>?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleResume}
                  style={{
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ▶ Resume
                </button>
                <button
                  onClick={handleStartOver}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  ↺ Start Over
                </button>
              </div>
            </div>
          )}

          {/* Buffering Spinner */}
          {videoLoading && !videoError && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                zIndex: 5,
                color: '#ffffff',
                pointerEvents: 'none',
              }}
            >
              <div
                className="spin"
                style={{
                  width: '42px',
                  height: '42px',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: 'var(--primary-red)',
                  borderRadius: '50%',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>
                Buffering Stream...
              </span>
            </div>
          )}

          {/* Fallback Display if Video Fails to Load */}
          {videoError ? (
            <div
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                maxWidth: '560px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span style={{ fontSize: '42px' }}>📡</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                Direct Stream Temporarily Unavailable
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Your browser or network prevented the direct video stream from playing. You can watch or download this film directly via the official project page below:
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a
                  href={ticket.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Open Official Film Site ↗
                </a>
                <a
                  href={ticket.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '700',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Direct MP4 Link ↗
                </a>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              key={ticket.id || ticket.filmId}
              src={ticket.videoUrl}
              controls
              autoPlay
              playsInline
              preload="auto"
              controlsList="nodownload"
              onLoadStart={() => {
                setVideoLoading(true);
                setVideoError(false);
              }}
              onLoadedMetadata={() => setVideoLoading(false)}
              onLoadedData={() => {
                setVideoLoading(false);
                setVideoError(false);
              }}
              onCanPlay={() => {
                setVideoLoading(false);
                setVideoError(false);
              }}
              onPlaying={() => {
                setVideoLoading(false);
                setVideoError(false);
              }}
              onWaiting={() => setVideoLoading(true)}
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onSeeked={handleSeeked}
              onEnded={handleEnded}
              onError={(e) => {
                console.warn('Video element onError triggered for:', ticket.videoUrl, e);
                setVideoLoading(false);
                setVideoError(true);
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            >
              <source src={ticket.videoUrl} type="video/mp4" />
              Your browser does not support the HTML5 video element.
            </video>
          )}
        </div>

        {/* Player Legal Credits & Licensing Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#0d0f17',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: '600' }}>
              {ticket.credit || '© Blender Foundation — CC BY 3.0'}
            </span>
            <div style={{ display: 'flex', gap: '14px' }}>
              <a
                href={ticket.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}
              >
                License: CC BY 3.0 ↗
              </a>
              <a
                href={ticket.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary-red-hover)', textDecoration: 'underline' }}
              >
                Official Project Site ↗
              </a>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-faint)' }}>
            Notice: This video is streamed under verified open-source Creative Commons terms from rights-holder servers. Commercial titles in the discovery catalog are strictly for recommendation and discovery without unauthorized playback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalStreamingPlayer;
