'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LegalNoticeBoard.module.scss';
import Windows95Modal from '../Windows95Modal';

const LegalNoticeBoard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const notices = [
    {
      id: 1,
      title: '📜 Polityka Prywatności',
      description: 'Jak chronimy Twoje dane',
      file: 'POLITYKA_PRYWATNOSCI',
      rotation: -2,
      color: '#fff9c4', // żółty papier
      pinColor: '#e74c3c'
    },
    {
      id: 2,
      title: '🍪 Polityka Cookies',
      description: 'Informacje o ciasteczkach',
      file: 'POLITYKA_COOKIES',
      rotation: 3,
      color: '#e1f5fe', // niebieski papier
      pinColor: '#3498db'
    },
    {
      id: 3,
      title: '📖 Regulamin Portalu',
      description: 'Zasady korzystania z retro-portal',
      file: 'REGULAMIN_PORTALU',
      rotation: -1,
      color: '#f3e5f5', // fioletowy papier
      pinColor: '#9b59b6'
    },
    {
      id: 4,
      title: '🛒 Regulamin Sklepu',
      description: 'Zasady zakupów i zwrotów',
      file: 'REGULAMIN_SKLEPU',
      rotation: 2,
      color: '#e8f5e9', // zielony papier
      pinColor: '#27ae60'
    },
    {
      id: 5,
      title: '❓ FAQ - Pytania i Odpowiedzi',
      description: '28 najczęstszych pytań',
      file: 'FAQ',
      rotation: -2,
      color: '#fff3e0', // pomarańczowo-kremowy papier
      pinColor: '#ff6f00'
    },
    {
      id: 6,
      title: '📞 Obsługa Klienta',
      description: 'Kontakt i pomoc',
      file: 'OBSLUGA_KLIENTA',
      rotation: 1,
      color: '#e0f2f1', // turkusowy papier
      pinColor: '#00897b'
    },
    {
      id: 7,
      title: '♿ Polityka Dostępności',
      description: 'Dostępność dla wszystkich',
      file: 'POLITYKA_DOSTEPNOSCI',
      rotation: -1,
      color: '#f1f8e9', // jasnozielony papier
      pinColor: '#7cb342'
    },
    {
      id: 8,
      title: '🎮 Regulamin VibeHub3D',
      description: 'Gra Roblox - Quizy i zadania',
      file: 'REGULAMIN_VIBEHUB3D',
      rotation: 2,
      color: '#fce4ec', // różowy papier
      pinColor: '#e91e63'
    },
    {
      id: 9,
      title: '📱 Test zewnętrzny',
      description: 'vibe3d - Aplikacja Android',
      externalLink: 'https://play.google.com/store/apps/details?id=com.kupmax.vibe3d',
      rotation: -3,
      color: '#ffe0b2', // pomarańczowy papier
      pinColor: '#ff9800'
    },
    {
      id: 10,
      title: '🔧 Test wewnętrzny',
      description: 'vibe3d - Wersja testowa',
      externalLink: 'https://play.google.com/apps/internaltest/4701581523871923979',
      rotation: 1,
      color: '#ffccbc', // czerwonawy papier
      pinColor: '#ff5722'
    }
  ];

  const handleNoticeClick = async (notice) => {
    // Jeśli to link zewnętrzny, otwórz w nowej karcie
    if (notice.externalLink) {
      window.open(notice.externalLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // W przeciwnym razie wczytaj dokument
    setSelectedNotice(notice);
    setModalOpen(true);
    setLoading(true);
    setContent('');

    try {
      const response = await fetch(`/api/legal/${notice.file}`);
      if (!response.ok) throw new Error('Błąd wczytywania');
      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      logger.error('Błąd:', error);
      setContent('❌ Nie udało się wczytać dokumentu. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.noticeBoardContainer}>
        <h2 className={styles.boardTitle}>📜 Regulamin Serwisu</h2>
        <div className={styles.noticeBoard}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={styles.noticeWrapper}
              style={{ '--rotation': `${notice.rotation}deg` }}
              onClick={() => handleNoticeClick(notice)}
            >
              <div
                className={styles.notice}
                style={{ backgroundColor: notice.color }}
              >
                {/* Pinezka */}
                <div
                  className={styles.pin}
                  style={{ backgroundColor: notice.pinColor }}
                />

                {/* Treść karteczki */}
                <div className={styles.noticeContent}>
                  <h3 className={styles.noticeTitle}>{notice.title}</h3>
                  <p className={styles.noticeDescription}>{notice.description}</p>
                  <span className={styles.readMore}>Czytaj więcej →</span>
                </div>

                {/* Stempel "WAŻNE" */}
                <div className={styles.stamp}>WAŻNE</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Windows 95 Modal */}
      <Windows95Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedNotice?.title || 'Dokument'}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>⏳ Wczytywanie dokumentu...</p>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </Windows95Modal>
    </>
  );
};

export default LegalNoticeBoard;
