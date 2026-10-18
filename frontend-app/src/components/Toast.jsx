import React from 'react';

const Toast = ({ toast, onClose }) => {
  if (!toast || !toast.message) return null;

  const typeStyles = {
    success: {
      bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      border: 'rgba(52, 211, 153, 0.4)',
      icon: '✓',
    },
    error: {
      bg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      border: 'rgba(248, 113, 113, 0.4)',
      icon: '✕',
    },
    info: {
      bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      border: 'rgba(96, 165, 250, 0.4)',
      icon: 'ℹ',
    },
  };

  const style = typeStyles[toast.type || 'info'];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 9999,
        background: style.bg,
        color: '#ffffff',
        border: `1px solid ${style.border}`,
        borderRadius: '14px',
        padding: '14px 22px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '600',
        maxWidth: '420px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '12px',
          flexShrink: 0,
        }}
      >
        {style.icon}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '2px 6px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
