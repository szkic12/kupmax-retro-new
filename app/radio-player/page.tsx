'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactRadio = dynamic(() => import('../../components/ReactRadio/ReactRadio'), {
  ssr: false,
});

function RadioPlayerContent() {
  const searchParams = useSearchParams();

  const stationUrl = searchParams.get('stationUrl');
  const stationName = searchParams.get('stationName') || 'Unknown Station';
  const stationGenre = searchParams.get('stationGenre') || 'Unknown';

  if (!stationUrl) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>No station selected</h1>
          <p>Please select a station from the main page.</p>
        </div>
      </div>
    );
  }

  const station = {
    id: 'player',
    name: stationName,
    url: stationUrl,
    genre: stationGenre,
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '20px',
    }}>
      <ReactRadio initialStation={station} isPlayerPage={true} />
    </div>
  );
}

export default function RadioPlayerPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div>Loading radio player...</div>
      </div>
    }>
      <RadioPlayerContent />
    </Suspense>
  );
}
