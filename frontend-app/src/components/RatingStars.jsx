import React, { useState } from 'react';

const RATING_LABELS = {
  1: '1 Star — Poor',
  2: '2 Stars — Fair',
  3: '3 Stars — Good',
  4: '4 Stars — Great',
  5: '5 Stars — Masterpiece',
};

const RatingStars = ({
  rating = 0,
  maxStars = 5,
  interactive = false,
  onChange = null,
  size = 20,
  showLabel = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${displayRating} out of ${maxStars} stars`}
        style={{ display: 'flex', gap: '4px', cursor: interactive ? 'pointer' : 'default' }}
        onMouseLeave={() => interactive && setHoverRating(0)}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayRating;
          const isHalf = !isFilled && starValue - 0.5 <= displayRating;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              aria-label={`${starValue} Star`}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: interactive ? 'pointer' : 'default',
                fontSize: `${size}px`,
                lineHeight: 1,
                color: isFilled || isHalf ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.15s, color 0.15s',
                transform: interactive && hoverRating === starValue ? 'scale(1.25)' : 'scale(1)',
              }}
            >
              ★
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
          {RATING_LABELS[displayRating] || `${Number(displayRating).toFixed(1)} / ${maxStars}`}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
