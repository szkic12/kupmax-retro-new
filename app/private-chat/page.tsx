'use client';

import { useEffect } from 'react';
import PrivateChatroom from '../../components/PrivateChatroom/PrivateChatroom';
import RetroNavbar from '../../components/RetroNavbar';
import SubpageNavbar from '../../components/SubpageNavbar';

export default function PrivateChatPage() {
  useEffect(() => {
    // Ustaw tytuł strony
    document.title = 'Private Chat - Kupmax Retro';

    // Pozwól na scroll
    document.body.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#008080',
      padding: '20px',
      paddingTop: '60px',
      fontFamily: "'MS Sans Serif', 'Segoe UI', sans-serif"
    }}>
      <RetroNavbar />
      <SubpageNavbar />
      <PrivateChatroom />
    </div>
  );
}
