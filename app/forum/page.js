'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { EmojiParser } from '../../components/RetroEmoji';

export default function ForumPage() {
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deletingThread, setDeletingThread] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchThreads();

    // Ustaw overflow na body aby umożliwić scrollowanie na stronie forum
    document.body.style.overflow = 'auto';

    // Sprawdź czy admin jest zalogowany (sprawdź cookie przez API)
    fetch('/api/forum/verify-session', {
      method: 'GET',
      credentials: 'same-origin' // Wysyła httpOnly cookie
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isAdmin) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(err => {
        logger.error('Error verifying session:', err);
      });

    // Cleanup: Przywróć overflow: hidden gdy użytkownik opuszcza stronę
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, [activeCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      logger.error('Error fetching categories:', error);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('categoryId', activeCategory);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/forum/threads?${params}`);
      const data = await response.json();
      if (data.success) {
        setThreads(data.threads);
      }
    } catch (error) {
      logger.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'przed chwilą';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz. temu`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} dni temu`;
    
    return date.toLocaleDateString('pl-PL');
  };

  // Funkcja do logowania administratora
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/forum/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // WAŻNE! Wysyła/odbiera httpOnly cookies
        body: JSON.stringify({
          password: adminPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAdminLoggedIn(true);
        // Token jest w httpOnly cookie - NIE zapisuj w localStorage!
        alert('Zalogowano jako administrator forum!');
        setShowAdminLogin(false);
        setAdminPassword('');
      } else {
        alert('Nieprawidłowe hasło administratora!');
      }
    } catch (err) {
      alert('Błąd sieci podczas logowania');
      logger.error('Admin login error:', err);
    }
  };

  // Funkcja do wylogowania administratora
  const handleAdminLogout = async () => {
    try {
      await fetch('/api/forum/logout', {
        method: 'POST',
        credentials: 'same-origin' // Wyśle cookie aby backend mógł go usunąć
      });
      setIsAdminLoggedIn(false);
      alert('Wylogowano z panelu administratora forum');
    } catch (err) {
      logger.error('Logout error:', err);
      setIsAdminLoggedIn(false);
    }
  };

  // Funkcja do usuwania wątku
  const handleDeleteThread = async (threadId, threadTitle) => {
    if (!isAdminLoggedIn) {
      alert('Musisz być zalogowany jako administrator aby usuwać wątki!');
      setShowAdminLogin(true);
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć wątek "${threadTitle}"?`)) {
      return;
    }

    setDeletingThread(threadId);

    try {
      // Token JWT jest w httpOnly cookie - browser wysyła go automatycznie!
      const response = await fetch(`/api/forum/threads?threadId=${threadId}`, {
        method: 'DELETE',
        credentials: 'same-origin' // WAŻNE! Wysyła httpOnly cookie z JWT
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchThreads(); // Odśwież listę wątków
      } else {
        alert(`Błąd: ${data.error}`);
        if (data.error.includes('Session expired') || data.error.includes('Not authenticated')) {
          // Sesja wygasła - wyloguj
          setIsAdminLoggedIn(false);
          setShowAdminLogin(true);
        }
      }
    } catch (err) {
      alert('Błąd sieci podczas usuwania wątku');
      logger.error('Delete thread error:', err);
    } finally {
      setDeletingThread(null);
    }
  };

  return (
    <>
      <Head>
        <title>Forum | Kupmax Retro</title>
        <meta name="description" content="Forum dyskusyjne Kupmax - pytania o produkty, wspomnienia retro, pomoc techniczna" />
      </Head>

      <div className="forum-page">
        {/* Nagłówek */}
        <div className="forum-header">
          <h1 className="forum-title">Forum Kupmax</h1>
          <p className="forum-subtitle">Miejsce spotkań miłośników retro</p>
          
          <div className="forum-actions">
            <button 
              onClick={() => window.location.href = '/forum/new-thread'}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>📝</span>
              Nowy wątek
            </button>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="latest">Najnowsze</option>
              <option value="popular">Najpopularniejsze</option>
              <option value="views">Najczęściej oglądane</option>
            </select>

            {/* Przyciski administratora - UKRYTE (dostęp tylko przez /admin/radio) */}
            {isAdminLoggedIn && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleAdminLogout}
                >
                  🚪 Wyloguj
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formularz logowania administratora */}
        {showAdminLogin && (
          <div className="admin-login-section">
            <div className="admin-login-form">
              <h3>Logowanie Administratora Forum</h3>
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label>Hasło administratora:</label>
                  <div
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#000',
                      border: '2px solid #00ff00',
                      borderRadius: '4px',
                      minHeight: '45px',
                      cursor: 'text',
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      color: '#00ff00'
                    }}
                    onClick={() => document.getElementById('hiddenForumPassword').focus()}
                  >
                    <span style={{ opacity: 0.5 }}>
                      {adminPassword.length === 0 ? 'Wprowadź hasło...' : ''}
                    </span>
                    <span style={{ animation: 'blink 1s infinite' }}>▌</span>
                  </div>
                  <input
                    type="text"
                    id="hiddenForumPassword"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="off"
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '1px',
                      height: '1px'
                    }}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Zaloguj
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAdminLogin(false)}
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kategorie */}
        <div className="categories-section">
          <h2 className="section-title">Kategorie</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <div 
                key={category.id}
                className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                style={{ borderLeftColor: category.color }}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-info">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                  <div className="category-stats">
                    <span>{category.threadCount} wątków</span>
                    {category.lastActivity && (
                      <span>Ostatnio: {formatDate(category.lastActivity)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista wątków */}
        <div className="threads-section">
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory 
                ? `Wątki: ${categories.find(c => c.id === activeCategory)?.name}`
                : 'Wszystkie wątki'
              }
            </h2>
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="btn btn-secondary"
              >
                Pokaż wszystkie
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Ładowanie wątków...</div>
          ) : threads.length === 0 ? (
            <div className="empty-state">
              <p>Brak wątków do wyświetlenia</p>
              <Link href="/forum/new-thread" className="btn btn-primary">
                Utwórz pierwszy wątek
              </Link>
            </div>
          ) : (
            <div className="threads-list">
              {threads.map(thread => (
                <div key={thread.id} className="thread-item">
                  <div className="thread-main">
                    <div className="thread-author">
                      <span className="author-avatar">{thread.author.avatar}</span>
                      <span className="author-name">{thread.author.nickname}</span>
                    </div>
                    
                    <div className="thread-content">
                      <Link href={`/forum/thread/${thread.id}`} className="thread-title">
                        {thread.title}
                      </Link>
                      <p className="thread-message">
                        <EmojiParser text={thread.message} emojiSize={28} />
                      </p>
                      
                      <div className="thread-meta">
                        <span className="thread-date">
                          {formatDate(thread.date)}
                        </span>
                        {thread.tags && thread.tags.length > 0 && (
                          <div className="thread-tags">
                            {thread.tags.map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="thread-stats">
                    <div className="stat">
                      <span className="stat-value">{thread.replyCount}</span>
                      <span className="stat-label">odpowiedzi</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{thread.views}</span>
                      <span className="stat-label">wyświetleń</span>
                    </div>
                    {thread.lastActivity && (
                      <div className="stat">
                        <span className="stat-label">Ostatnio:</span>
                        <span className="stat-value">{formatDate(thread.lastActivity)}</span>
                      </div>
                    )}
                    
                    {/* Przycisk usuwania dla administratora */}
                    {isAdminLoggedIn && (
                      <div className="stat">
                        <button
                          onClick={() => handleDeleteThread(thread.id, thread.title)}
                          disabled={deletingThread === thread.id}
                          className="btn-delete"
                          title="Usuń wątek"
                        >
                          {deletingThread === thread.id ? '🗑️ Usuwanie...' : '🗑️ Usuń'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .forum-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .forum-header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #dee2e6;
        }

        .forum-title {
          font-size: 2.8rem;
          color: #212529;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .forum-subtitle {
          font-size: 1.2rem;
          color: #495057;
          margin-bottom: 2rem;
        }

        .forum-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background-color: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #343a40;
          border: 1px solid #dee2e6;
        }

        .btn-secondary:hover {
          background: #e9ecef;
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background: #e0a800;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s;
        }

        .btn-delete:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-delete:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .admin-login-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid #dee2e6;
        }

        .admin-login-form h3 {
          margin-bottom: 1.5rem;
          color: #212529;
          text-align: center;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #495057;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .sort-select {
          padding: 0.75rem;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: white;
        }

        .section-title {
          font-size: 1.8rem;
          color: #212529;
          margin-bottom: 1.5rem;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .category-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-card:hover,
        .category-card.active {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .category-card.active {
          background: #f8f9ff;
        }

        .category-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .category-name {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #212529;
        }

        .category-description {
          color: #495057;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .category-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .loading, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #495057;
          background-color: #f8f9fa;
          border-radius: 12px;
        }

        .empty-state p {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .threads-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .thread-item {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: all 0.2s ease;
        }

        .thread-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .thread-main {
          flex: 1;
          display: flex;
          gap: 1rem;
        }

        .thread-author {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .author-avatar {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .author-name {
          font-size: 0.9rem;
          color: #6c757d;
          text-align: center;
        }

        .thread-content {
          flex: 1;
        }

        .thread-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #212529;
          text-decoration: none;
          display: block;
          margin-bottom: 0.5rem;
        }

        .thread-title:hover {
          color: #0056b3;
        }

        .thread-message {
          color: #495057;
          margin-bottom: 1rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .thread-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.9rem;
          color: #6c757d;
        }

        .thread-tags {
          display: flex;
          gap: 0.5rem;
        }

        .tag {
          background: #e9ecef;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #495057;
        }

        .thread-stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: right;
          min-width: 120px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-weight: 600;
          color: #212529;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6c757d;
        }

        @media (max-width: 768px) {
          .forum-title {
            font-size: 2rem;
          }
          
          .categories-grid {
            grid-template-columns: 1fr;
          }
          
          .thread-item {
            flex-direction: column;
            gap: 1rem;
          }
          
          .thread-stats {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
