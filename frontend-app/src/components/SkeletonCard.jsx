import React from 'react';

const SkeletonCard = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{
          width: '100%',
          aspectRatio: '2/3',
        }}
      />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div
          className="skeleton-shimmer"
          style={{ width: '85%', height: '18px', borderRadius: '4px' }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: '60%', height: '14px', borderRadius: '4px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <div
            className="skeleton-shimmer"
            style={{ width: '35%', height: '14px', borderRadius: '4px' }}
          />
          <div
            className="skeleton-shimmer"
            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
