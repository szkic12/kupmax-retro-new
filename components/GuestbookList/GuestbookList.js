import { useState, useEffect } from 'react';
import { useGuestbookEntries } from '../../hooks/useGuestbook';
import styles from './GuestbookList.module.scss';

/**
 * Komponent do wyświetlania listy wpisów z gośćca
 */
export default function GuestbookList({ maxEntries = 10 }) {
  const {
    entries,
    loading,
    error,
    loadMore,
    hasNextPage,
    refetch
  } = useGuestbookEntries({ first: maxEntries });

  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  // Sprawdź czy zalogowany jako admin (ma JWT cookie)
  useEffect(() => {
    fetch('/api/forum/verify-session', {
      method: 'GET',
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isAdmin) {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  // Funkcja usuwania wpisu
  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      return;
    }

    setDeletingEntryId(entryId);

    try {
      const response = await fetch(`/api/guestbook/entries?id=${entryId}`, {
        method: 'DELETE',
        credentials: 'same-origin' // Wysyła JWT cookie
      });

      const data = await response.json();

      if (data.success) {
        alert('Wpis usunięty!');
        refetch(); // Odśwież listę
      } else {
        alert(`Błąd: ${data.error}`);
      }
    } catch (err) {
      alert('Błąd podczas usuwania wpisu');
      console.error('Delete error:', err);
    } finally {
      setDeletingEntryId(null);
    }
  };

  // Loading state
  if (loading && !entries.length) {
    return (
      <div className={styles.guestbookList}>
        <h3>💬 Gość</h3>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Ładowanie wpisów...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !entries.length) {
    return (
      <div className={styles.guestbookList}>
        <h3>💬 Gość</h3>
        <div className={styles.error}>
          <p>❌ Nie udało się załadować wpisów</p>
          <button 
            onClick={() => refetch()}
            className={styles.retryButton}
          >
            🔄 Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && entries.length === 0) {
    return (
      <div className={styles.guestbookList}>
        <h3>💬 Gość</h3>
        <div className={styles.empty}>
          <p>📝 Bądź pierwszy i dodaj wpis do gościa!</p>
        </div>
      </div>
    );
  }

  /**
   * Formatowanie daty
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Niedawno';
    }
  };

  /**
   * Czyszczenie HTML z treści
   */
  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  /**
   * Skrócenie długich wiadomości
   */
  const truncateMessage = (message, maxLength = 200) => {
    const cleanMessage = stripHtml(message);
    if (cleanMessage.length <= maxLength) return cleanMessage;
    return cleanMessage.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.guestbookList}>
      <h3>💬 Gość ({entries.length})</h3>
      
      <div className={styles.entries}>
        {entries.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <div className={styles.entryHeader}>
              <div className={styles.authorInfo}>
                <span className={styles.nickname}>
                  {entry.nickname || 'Anonim'}
                </span>
                {entry.productRef && (
                  <span className={styles.productTag}>
                    📦 {entry.productRef}
                  </span>
                )}
              </div>
              <span className={styles.date}>
                {formatDate(entry.date)}
              </span>
            </div>
            
            <div className={styles.message}>
              {stripHtml(entry.message || '')}
            </div>

            {entry.email && (
              <div className={styles.authorEmail}>
                ✉️ {entry.email}
              </div>
            )}

            {/* Przycisk usuwania dla admina */}
            {isAdmin && (
              <div className={styles.adminActions}>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className={styles.deleteButton}
                  disabled={deletingEntryId === entry.id}
                >
                  {deletingEntryId === entry.id ? 'Usuwanie...' : '🗑️ Usuń'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Przycisk "Załaduj więcej" */}
      {hasNextPage && (
        <div className={styles.loadMoreContainer}>
          <button
            onClick={loadMore}
            className={styles.loadMoreButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Ładowanie...
              </>
            ) : (
              '📖 Załaduj więcej wpisów'
            )}
          </button>
        </div>
      )}

      {/* Informacja o błędzie podczas ładowania więcej */}
      {error && entries.length > 0 && (
        <div className={styles.loadError}>
          <small>⚠️ Wystąpił błąd podczas ładowania kolejnych wpisów</small>
        </div>
      )}
    </div>
  );
}
