import React, { useState, useEffect, useCallback } from 'react';
import {
  getTitleRecommendations,
  getPersonalizedRecommendations,
  getMoodRecommendations,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const POPULAR_SEEDS = [
  'Toy Story',
  'Heat',
  'Braveheart',
  'Seven (a.k.a. Se7en)',
  'Usual Suspects, The',
  'Jumanji',
  'GoldenEye',
  'Casino',
];

const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😄', color: '#f59e0b', desc: 'Uplifting & humorous comedy' },
  { id: 'relaxed', label: 'Relaxed', emoji: '☕', color: '#10b981', desc: 'Gentle, cozy & animated' },
  { id: 'excited', label: 'Excited', emoji: '⚡', color: '#e50914', desc: 'High-octane action & sci-fi' },
  { id: 'romantic', label: 'Romantic', emoji: '💖', color: '#ec4899', desc: 'Tender love & connection' },
  { id: 'emotional', label: 'Emotional', emoji: '😢', color: '#8b5cf6', desc: 'Profound drama & feelings' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🗺️', color: '#3b82f6', desc: 'Epic quests & expeditions' },
  { id: 'thoughtful', label: 'Thoughtful', emoji: '🧠', color: '#06b6d4', desc: 'Introspective mysteries' },
  { id: 'thrilling', label: 'Thrilling', emoji: '🔥', color: '#f97316', desc: 'Edge-of-your-seat suspense' },
];

const AiHubPage = ({ initialTitle = '', onSelectMovie, favorites = [] }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();

  // Engine Tab State: 'title', 'mood', or 'personalized'
  const [activeEngine, setActiveEngine] = useState('title');

  // Title Recommender State (FastAPI)
  const [searchTitle, setSearchTitle] = useState(initialTitle || 'Toy Story');
  const [titleResults, setTitleResults] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [expandedWhy, setExpandedWhy] = useState({});

  // Mood Recommender State (FastAPI)
  const [selectedMood, setSelectedMood] = useState('happy');
  const [moodResults, setMoodResults] = useState([]);
  const [moodMetadata, setMoodMetadata] = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState('');

  // Personalized Recommender State (Spring Boot)
  const [selectedGenre, setSelectedGenre] = useState('Sci-Fi');
  const [personalResults, setPersonalResults] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState('');

  const toggleWhy = (idx) => {
    setExpandedWhy((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Run title recommendation
  const handleTitleRecommendation = async (titleToQuery) => {
    const term = (titleToQuery || searchTitle).trim();
    if (!term) return;

    setTitleLoading(true);
    setTitleError('');
    try {
      const data = await getTitleRecommendations(term);
      setTitleResults(data.recommendations || []);
    } catch (err) {
      console.error('Title AI recommendation error:', err);
      const detail = err.response?.data?.detail || err.message || 'Unable to retrieve AI recommendations.';
      setTitleError(detail);
      setTitleResults([]);
    } finally {
      setTitleLoading(false);
    }
  };

  // Run mood recommendation
  const handleMoodRecommendation = useCallback(async (moodToQuery) => {
    const target = moodToQuery || selectedMood;
    setMoodLoading(true);
    setMoodError('');
    try {
      const data = await getMoodRecommendations(target);
      setMoodResults(data.recommendations || []);
      setMoodMetadata(data);
    } catch (err) {
      console.error('Mood recommendation error:', err);
      const detail = err.response?.data?.detail || err.message || 'Unable to retrieve mood recommendations.';
      setMoodError(detail);
      setMoodResults([]);
    } finally {
      setMoodLoading(false);
    }
  }, [selectedMood]);

  // Run personalized recommendation
  const handlePersonalizedRecommendation = async (genreChoice) => {
    if (!isAuthenticated) return;

    setPersonalLoading(true);
    setPersonalError('');
    try {
      const genre = genreChoice || selectedGenre;
      const data = await getPersonalizedRecommendations(genre);
      const recs = data.recommendations || (Array.isArray(data) ? data : []);
      setPersonalResults(recs);
    } catch (err) {
      console.error('Personalized recommendation error:', err);
      setPersonalError('Unable to generate personalized recommendations. Please try again.');
      setPersonalResults([]);
    } finally {
      setPersonalLoading(false);
    }
  };

  // Trigger initial recommendations on mount
  useEffect(() => {
    handleTitleRecommendation(initialTitle || 'Toy Story');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeEngine === 'mood' && moodResults.length === 0) {
      handleMoodRecommendation(selectedMood);
    }
  }, [activeEngine, selectedMood, moodResults.length, handleMoodRecommendation]);

  useEffect(() => {
    if (isAuthenticated && activeEngine === 'personalized' && personalResults.length === 0) {
      handlePersonalizedRecommendation(selectedGenre);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeEngine]);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(229, 9, 20, 0.15)',
            border: '1px solid var(--border-glow)',
            color: 'var(--primary-red-hover)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '0.5px',
            marginBottom: '14px',
          }}
        >
          <span>✦</span> EXPLAINABLE AI INTELLIGENCE SYSTEM
        </div>
        <h1 style={{ fontSize: '34px', fontWeight: '900', marginBottom: '8px' }}>
          AI Recommendation Intelligence Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '720px' }}>
          Discover cinema using explainable hybrid vector similarity, discover films matching your emotional mood, or generate custom recommendations based on your personal watch history.
        </p>

        {/* Engine Switcher Tabs */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginTop: '24px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveEngine('title')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              backgroundColor: activeEngine === 'title' ? 'var(--primary-red)' : 'transparent',
              color: activeEngine === 'title' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Title Matcher (Explainable AI)
          </button>

          <button
            type="button"
            onClick={() => setActiveEngine('mood')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              backgroundColor: activeEngine === 'mood' ? 'var(--primary-red)' : 'transparent',
              color: activeEngine === 'mood' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Mood-Based Discovery 🎭
          </button>

          <button
            type="button"
            onClick={() => setActiveEngine('personalized')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              backgroundColor: activeEngine === 'personalized' ? 'var(--primary-red)' : 'transparent',
              color: activeEngine === 'personalized' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Personalized User Feed
          </button>
        </div>
      </div>

      {/* ==================== ENGINE 1: TITLE-BASED HYBRID RECOMMENDER (XAI) ==================== */}
      {activeEngine === 'title' && (
        <section>
          {/* Query Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              marginBottom: '32px',
            }}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleTitleRecommendation(); }}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: '280px',
                  backgroundColor: '#0c0e15',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>🎬</span>
                <input
                  type="text"
                  placeholder="Enter a movie title (e.g. Toy Story, Heat, Braveheart)..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={titleLoading || !searchTitle.trim()}
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 28px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {titleLoading ? 'Computing Vectors...' : 'Run Hybrid Model →'}
              </button>
            </form>

            {/* Quick Seeds */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick Seeds:</span>
              {POPULAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => {
                    setSearchTitle(seed);
                    handleTitleRecommendation(seed);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-dim)',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-red)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                >
                  {seed}
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm Architecture Badge */}
          <div
            style={{
              backgroundColor: 'rgba(18, 21, 32, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h4 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>
                Algorithm: Hybrid Content-Collaborative Model with Explainable AI
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Score Equation: <code>HybridScore = (TF-IDF Content Similarity × 0.70) + (MovieLens Collaborative Rating × 0.30)</code>
              </p>
            </div>
            <span
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              Explainable AI (XAI) Enabled
            </span>
          </div>

          {/* Loading Indicator */}
          {titleLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                className="spin"
                style={{
                  width: '42px',
                  height: '42px',
                  border: '3px solid rgba(229, 9, 20, 0.2)',
                  borderTopColor: 'var(--primary-red)',
                  borderRadius: '50%',
                  margin: '0 auto 16px auto',
                }}
              />
              <p style={{ color: 'var(--primary-red-hover)', fontWeight: '700' }}>
                Extracting TF-IDF feature matrices & calculating collaborative ratings...
              </p>
            </div>
          )}

          {/* Error Notice */}
          {!titleLoading && titleError && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '32px',
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>⚠️ Movie Not Found in Dataset</h4>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {titleError} Try searching with one of the recommended seeds above such as "Toy Story", "Heat", or "Braveheart".
              </p>
            </div>
          )}

          {/* Results Grid */}
          {!titleLoading && titleResults.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {titleResults.map((item, index) => {
                const isWhyOpen = Boolean(expandedWhy[index]);
                const matchPct = Math.round((item.hybrid_score || item.score || 0) * 100);
                const contentPct = Math.round((item.content_score || 0) * 100);
                const collabPct = Math.round((item.collaborative_score || 0) * 100);

                return (
                  <div
                    key={index}
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      border: isWhyOpen ? '1px solid var(--primary-red)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                  >
                    <div>
                      {/* Top Scores Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span
                          style={{
                            backgroundColor: 'var(--primary-red)',
                            color: '#ffffff',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {matchPct}% MATCH
                        </span>
                        {item.confidence && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: item.confidence === 'High' ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                              textTransform: 'uppercase',
                            }}
                          >
                            ● {item.confidence} Confidence
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
                        {item.clean_title || item.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'capitalize' }}>
                        {item.genres}
                      </p>

                      {/* Matched Genre Badges */}
                      {item.matched_genres && item.matched_genres.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {item.matched_genres.map((g, gIdx) => (
                            <span
                              key={gIdx}
                              style={{
                                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                                color: 'var(--primary-red-hover)',
                                border: '1px solid rgba(229, 9, 20, 0.35)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                              }}
                            >
                              ✓ {g}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Brief Explanation Quote */}
                      {item.explanation && (
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                          "{item.explanation}"
                        </p>
                      )}

                      {/* Expandable "Why This Movie?" Explanation Panel */}
                      {isWhyOpen && (
                        <div
                          style={{
                            backgroundColor: 'rgba(10, 12, 18, 0.9)',
                            border: '1px solid var(--border-glow)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '14px',
                            animation: 'fadeIn 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
                              ✦ Recommendation Decomposition
                            </strong>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              TF-IDF + CF
                            </span>
                          </div>

                          {/* Contributing Factors Breakdown Bars */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Plot & Theme Vector Match (70% wt)</span>
                                <strong style={{ color: '#ffffff' }}>{contentPct}%</strong>
                              </div>
                              <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${contentPct}%`, backgroundColor: 'var(--primary-red)' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>MovieLens Viewer Rating (30% wt)</span>
                                <strong style={{ color: '#ffffff' }}>{collabPct}%</strong>
                              </div>
                              <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${collabPct}%`, backgroundColor: 'var(--accent-gold)' }} />
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Algorithm: <em>{item.recommendation_method || 'Hybrid Content-Based + Collaborative Filtering'}</em>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => toggleWhy(index)}
                        style={{
                          flex: 1,
                          backgroundColor: isWhyOpen ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid ${isWhyOpen ? 'var(--primary-red)' : 'var(--border-subtle)'}`,
                          color: isWhyOpen ? 'var(--primary-red-hover)' : 'var(--text-main)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{isWhyOpen ? '▲ Hide' : '▼ Why This Movie?'}</span>
                      </button>

                      {onSelectMovie && (
                        <button
                          type="button"
                          onClick={() => onSelectMovie({ id: item.movieId, title: item.clean_title, genre: item.genres })}
                          style={{
                            flex: 1,
                            backgroundColor: 'var(--primary-red)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== ENGINE 2: MOOD-BASED DISCOVERY (FEATURE 4) ==================== */}
      {activeEngine === 'mood' && (
        <section>
          {/* Mood Selector Grid */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-main)' }}>
              How are you feeling right now? Select a mood:
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '14px',
              }}
            >
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMood(m.id);
                      handleMoodRecommendation(m.id);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'var(--bg-card)',
                      border: `2px solid ${isSelected ? m.color : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 6px 20px ${m.color}33` : 'none',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = m.color;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>{m.emoji}</span>
                    <strong style={{ fontSize: '14px', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                      {m.label}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Mood Info & Refresh Controls */}
          {moodMetadata && (
            <div
              style={{
                backgroundColor: 'rgba(18, 21, 32, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 24px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Picks for {moodMetadata.mood_title} Mood</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>
                    ({moodMetadata.total_matches} catalog matches)
                  </span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Genres:</span>
                  {(moodMetadata.target_genres || []).map((g, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-dim)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleMoodRecommendation(selectedMood)}
                disabled={moodLoading}
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>↺</span> Refresh Mood Picks
              </button>
            </div>
          )}

          {/* Mood Loading */}
          {moodLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div
                className="spin"
                style={{
                  width: '42px',
                  height: '42px',
                  border: '3px solid rgba(229, 9, 20, 0.2)',
                  borderTopColor: 'var(--primary-red)',
                  borderRadius: '50%',
                  margin: '0 auto 16px auto',
                }}
              />
              <p style={{ color: 'var(--primary-red-hover)', fontWeight: '700' }}>
                Filtering movie catalog for {selectedMood} affinity vectors...
              </p>
            </div>
          )}

          {/* Mood Error */}
          {!moodLoading && moodError && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '32px',
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>Error Loading Mood Picks</h4>
              <p style={{ fontSize: '13px', margin: 0 }}>{moodError}</p>
            </div>
          )}

          {/* Mood Results Grid */}
          {!moodLoading && moodResults.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {moodResults.map((item, idx) => {
                const moodScorePct = Math.round((item.mood_score || 0) * 100);

                return (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'var(--primary-red)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-gold)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '800',
                          }}
                        >
                          ★ {item.average_rating || '4.0'}/5 Viewer Rating
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                          {moodScorePct}% Mood Affinity
                        </span>
                      </div>

                      <h4 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                        {item.clean_title || item.title} {item.year ? `(${item.year})` : ''}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 10px 0', textTransform: 'capitalize' }}>
                        {item.genres}
                      </p>

                      {/* Explanation */}
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
                        "{item.explanation}"
                      </p>
                    </div>

                    {onSelectMovie && (
                      <button
                        type="button"
                        onClick={() => onSelectMovie({ id: item.movieId, title: item.clean_title, genre: item.genres })}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary-red)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = 'var(--text-main)';
                        }}
                      >
                        View Movie Details & Reviews →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== ENGINE 3: PERSONALIZED RECOMMENDER (SPRING BOOT) ==================== */}
      {activeEngine === 'personalized' && (
        <section>
          {!isAuthenticated ? (
            <div
              className="glass-panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                Account Authentication Required
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                Personalized AI feeds require an authenticated account to analyze your rated films, watchlist selections, and interaction history.
              </p>
              <button
                type="button"
                onClick={() => openAuthModal('login', null, 'Sign in to access personalized AI feeds')}
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Sign In to View Your Feed →
              </button>
            </div>
          ) : (
            <div>
              {/* Genre Selector */}
              <div
                className="glass-panel"
                style={{
                  padding: '20px 24px',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)' }}>
                  Filter by Affinity Genre:
                </span>
                {['Sci-Fi', 'Action', 'Drama', 'Comedy', 'Thriller', 'Animation'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSelectedGenre(g);
                      handlePersonalizedRecommendation(g);
                    }}
                    style={{
                      backgroundColor: selectedGenre === g ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedGenre === g ? '#ffffff' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {personalLoading && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div
                    className="spin"
                    style={{
                      width: '42px',
                      height: '42px',
                      border: '3px solid rgba(229, 9, 20, 0.2)',
                      borderTopColor: 'var(--primary-red)',
                      borderRadius: '50%',
                      margin: '0 auto 16px auto',
                    }}
                  />
                  <p style={{ color: 'var(--primary-red-hover)', fontWeight: '700' }}>
                    Generating personalized latent factor feed for {user?.username}...
                  </p>
                </div>
              )}

              {!personalLoading && personalError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '24px',
                  }}
                >
                  {personalError}
                </div>
              )}

              {!personalLoading && personalResults.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {personalResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            backgroundColor: 'rgba(229, 9, 20, 0.15)',
                            color: 'var(--primary-red-hover)',
                            border: '1px solid var(--border-glow)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '800',
                          }}
                        >
                          PERSONALIZED MATCH
                        </span>
                        <h4 style={{ fontSize: '17px', fontWeight: '800', marginTop: '10px', marginBottom: '4px' }}>
                          {item.clean_title || item.title}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, textTransform: 'capitalize' }}>
                          {item.genres || item.genre || 'Recommended Title'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
                        {item.hybrid_score && (
                          <span>Score: {Math.round(item.hybrid_score * 100)}%</span>
                        )}
                        {item.confidence && (
                          <span style={{ color: 'var(--accent-emerald)' }}>● {item.confidence}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AiHubPage;
