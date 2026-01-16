'use client';

// This is a honeypot/decoy page
// The real admin panel is at a secret URL
// This page logs access attempts and shows a fake error

import { useEffect, useState } from 'react';

export default function FakeAdminPage() {
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Log this access attempt (potential attacker)
    const logAttempt = async () => {
      try {
        await fetch('/api/admin/honeypot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/retro-admin',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {}
    };
    logAttempt();
  }, []);

  const handleFakeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempts(prev => prev + 1);

    if (attempts >= 2) {
      setBlocked(true);
    }
  };

  if (blocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ff0000', fontSize: '48px' }}>⚠️ ACCESS DENIED</h1>
          <p style={{ fontSize: '18px' }}>Your IP has been logged.</p>
          <p style={{ fontSize: '14px', color: '#888' }}>Incident ID: {Math.random().toString(36).slice(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#008080',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
    }}>
      <div style={{
        background: '#c0c0c0',
        border: '3px outset #fff',
        maxWidth: '400px',
        width: '90%',
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
          padding: '4px 8px',
          color: '#fff',
          fontWeight: 'bold',
        }}>
          🔐 Admin Login
        </div>
        <div style={{ padding: '20px' }}>
          <form onSubmit={handleFakeLogin}>
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <span style={{ fontSize: '48px' }}>🔑</span>
            </div>

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Password:
            </label>
            <input
              type="password"
              style={{
                border: '2px inset #808080',
                padding: '8px',
                width: '100%',
                marginBottom: '10px',
              }}
              placeholder="Enter password..."
            />

            <div style={{
              background: '#ffcccc',
              border: '1px solid #cc0000',
              padding: '8px',
              marginBottom: '10px',
              fontSize: '12px',
              color: '#cc0000',
            }}>
              ⚠️ Error: Authentication service unavailable (503)
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
                border: '2px outset #fff',
                padding: '8px 24px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Login
            </button>
          </form>

          <div style={{
            marginTop: '15px',
            padding: '8px',
            background: '#ffffcc',
            border: '1px solid #ccaa00',
            fontSize: '11px',
          }}>
            ⚠️ System maintenance in progress. Please try again later.
          </div>
        </div>
      </div>
    </div>
  );
}
