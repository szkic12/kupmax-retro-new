'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable drag on mobile
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isMobile) {
      setWindowPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Mobile layout - centered, responsive
  if (isMobile) {
    return (
      <div
        className="w-full min-h-screen flex flexlex-col items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #008080 0%, #004d4d 100%)',
        }}
      >
        {/* Okno błędu w stylu Windows 95 */}
        <div
          className="win95-window w-full max-w-sm"
          style={{
            boxShadow: '3px 3px 10px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Title Bar */}
          <div
            className="win95-titlebar"
            style={{
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px' }}>⚠️</span>
              <span>Error.exe</span>
            </div>
          </div>

          {/* Content */}
          <div className="win95-content" style={{ padding: '12px' }}>
            {/* Error Message */}
            <div style={{ marginBottom: '12px' }}>
              <p
                style={{
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  fontSize: '11px',
                }}
              >
                404 - PAGE NOT FOUND
              </p>
              <p style={{ fontSize: '10px', lineHeight: '1.5' }}>
                The file or folder you are looking for does not exist.
              </p>
            </div>

            {/* Detailed Message */}
            <div
              style={{
                background: '#fff',
                border: '2px solid #dfdfdf #000 #000 #dfdfdf',
                padding: '6px',
                marginBottom: '12px',
                fontSize: '9px',
                fontFamily: 'monospace',
                minHeight: '60px',
                overflowY: 'auto',
              }}
            >
              <div>• HTTP Error: 404</div>
              <div>• Resource not available</div>
              <div>• Check the URL</div>
              <div style={{ marginTop: '4px' }}>✓ Options:</div>
              <div>- Return to home</div>
              <div>- Go back</div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Link href="/">
                <button className="win95-button" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  Home
                </button>
              </Link>
              <button
                className="win95-button"
                style={{ fontSize: '10px', padding: '2px 6px' }}
                onClick={() => window.history.back()}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout - draggable
  return (
    <div
      className="w-screen h-screen"
      style={{
        background: 'linear-gradient(135deg, #008080 0%, #004d4d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Błędy na tle (retro efekt) */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.05,
          fontSize: '10px',
          color: '#000',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        {Array(100)
          .fill('404 ERROR • FILE NOT FOUND • ')
          .join('')}
      </div>

      {/* Okno błędu w stylu Windows 95 */}
      <div
        className="win95-window"
        style={{
          position: 'absolute',
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          width: '450px',
          maxWidth: '90vw',
          boxShadow: '3px 3px 10px rgba(0, 0, 0, 0.7)',
          cursor: isDragging ? 'grabbing' : 'auto',
          zIndex: 1000,
        }}
      >
        {/* Title Bar */}
        <div
          className="win95-titlebar"
          onMouseDown={handleMouseDown}
          style={{
            userSelect: 'none',
            cursor: 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px' }}>⚠️</span>
            <span>Error.exe</span>
          </div>
          <button
            style={{
              background: '#c0c0c0',
              border: '2px solid #dfdfdf #000 #000 #dfdfdf',
              width: '16px',
              height: '14px',
              padding: '0',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="win95-content" style={{ padding: '16px' }}>
          {/* Error Message */}
          <div style={{ marginBottom: '16px' }}>
            <p
              style={{
                fontWeight: 'bold',
                marginBottom: '8px',
                fontSize: '12px',
              }}
            >
              404 - PAGE NOT FOUND
            </p>
            <p style={{ fontSize: '11px', lineHeight: '1.6' }}>
              The file or folder you are looking for does not exist on this
              server.
            </p>
            <p style={{ fontSize: '11px', lineHeight: '1.6', marginTop: '8px' }}>
              Path: <code style={{ fontSize: '10px' }}>/page-not-found</code>
            </p>
          </div>

          {/* Detailed Message */}
          <div
            style={{
              background: '#fff',
              border: '2px solid #dfdfdf #000 #000 #dfdfdf',
              padding: '8px',
              marginBottom: '16px',
              fontSize: '10px',
              fontFamily: 'monospace',
              minHeight: '80px',
              overflowY: 'auto',
            }}
          >
            <div>• HTTP Error: 404</div>
            <div>• Resource not available</div>
            <div>• Check the URL and try again</div>
            <div style={{ marginTop: '8px' }}>✓ Suggestions:</div>
            <div>- Return to home page</div>
            <div>- Check the navigation menu</div>
            <div>- Verify the URL spelling</div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Link href="/">
              <button className="win95-button">Go Home</button>
            </Link>
            <button
              className="win95-button"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28px',
          background: 'linear-gradient(180deg, #dfdfdf, #c0c0c0)',
          borderTop: '2px solid #dfdfdf',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '4px',
          fontSize: '11px',
          boxShadow: 'inset 1px 1px 0 0 #fff, inset -1px -1px 0 0 #808080',
          zIndex: 999,
        }}
      >
        <div
          style={{
            background: '#000080',
            color: '#fff',
            padding: '2px 6px',
            marginRight: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          📄 404 Error
        </div>
        <span style={{ marginLeft: 'auto', marginRight: '4px' }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
