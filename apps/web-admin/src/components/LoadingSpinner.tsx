'use client';

/**
 * Loading Spinner Component
 * Shows a centered spinner while content is loading
 */

export function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div className="spinner" />
        <p style={{ color: '#8c8c8c', fontSize: '14px' }}>กำลังโหลด...</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
