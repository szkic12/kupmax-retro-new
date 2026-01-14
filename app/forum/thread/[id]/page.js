'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id;

  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reply form
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyData, setReplyData] = useState({
    message: '',
    nickname: '',
    avatar: '👤'
  });

  const avatars = ['👤', '😀', '😎', '🤓', '🧑‍💻', '👨‍🎤', '👩‍🔬', '🧙', '🤖', '👾', '🎮', '💀', '🐱', '🐶', '🦊'];

  useEffect(() => {
    document.body.style.overflow = 'auto';
    fetchThread();
    fetchCategories();
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/forum/posts?threadId=${threadId}`);
      const data = await response.json();

      if (data.success) {
        setThread(data.thread);
        setPosts(data.posts);
      } else {
        setError(data.error || 'Nie znaleziono wątku');
      }
    } catch (err) {
      setError('Błąd ładowania wątku');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!replyData.message.trim()) {
      setError('Wpisz treść odpowiedzi!');
      return;
    }
    if (!replyData.nickname.trim()) {
      setError('Wpisz swój nick!');
      return;
    }

    setReplyLoading(true);

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          message: replyData.message,
          author: {
            nickname: replyData.nickname,
            avatar: replyData.avatar
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setReplyData({ ...replyData, message: '' });
        setShowReplyForm(false);
        fetchThread(); // Refresh posts
      } else {
        setError(data.error || 'Błąd dodawania odpowiedzi');
      }
    } catch (err) {
      setError('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  // Prosta funkcja do parsowania emotikonów tekstowych
  const parseEmojis = (text) => {
    if (!text) return '';
    return text
      .replace(/:D/g, '😄')
      .replace(/:\)/g, '🙂')
      .replace(/;\)/g, '😉')
      .replace(/:P/g, '😛')
      .replace(/:\(/g, '😢')
      .replace(/<3/g, '❤️')
      .replace(/:O/g, '😮')
      .replace(/:\//g, '😕')
      .replace(/8\)/g, '😎');
  };

  if (loading) {
    return (
      <div className="thread-page">
        <div className="window">
          <div className="title-bar">
            <span>⏳ Ładowanie...</span>
          </div>
          <div className="content loading-content">
            <div className="loading-spinner">⏳</div>
            <p>Ładowanie wątku...</p>
          </div>
        </div>
        <style jsx>{`
          .thread-page {
            min-height: 100vh;
            background: #008080;
            padding: 20px;
            font-family: 'MS Sans Serif', Tahoma, sans-serif;
          }
          .window {
            max-width: 900px;
            margin: 0 auto;
            background: #c0c0c0;
            border: 3px outset #fff;
          }
          .title-bar {
            background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
            color: #fff;
            padding: 4px 8px;
            font-weight: bold;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .loading-spinner {
            font-size: 48px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="thread-page">
        <div className="window">
          <div className="title-bar">
            <span>❌ Błąd</span>
          </div>
          <div className="content error-content">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <Link href="/forum" className="btn">Powrót do forum</Link>
          </div>
        </div>
        <style jsx>{`
          .thread-page {
            min-height: 100vh;
            background: #008080;
            padding: 20px;
            font-family: 'MS Sans Serif', Tahoma, sans-serif;
          }
          .window {
            max-width: 600px;
            margin: 0 auto;
            background: #c0c0c0;
            border: 3px outset #fff;
          }
          .title-bar {
            background: linear-gradient(90deg, #800000 0%, #d04010 100%);
            color: #fff;
            padding: 4px 8px;
            font-weight: bold;
          }
          .content {
            padding: 40px;
            text-align: center;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 8px 20px;
            background: #c0c0c0;
            border: 2px outset #fff;
            color: #000;
            text-decoration: none;
            font-weight: bold;
          }
          .btn:hover {
            background: #d0d0d0;
          }
        `}</style>
      </div>
    );
  }

  const category = getCategory(thread?.categoryId);

  return (
    <div className="thread-page">
      <div className="window">
        <div className="title-bar">
          <span>💬 {thread?.title}</span>
          <Link href="/forum" className="close-btn">✕</Link>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link href="/">🏠 Strona główna</Link>
            <span> › </span>
            <Link href="/forum">💬 Forum</Link>
            {category && (
              <>
                <span> › </span>
                <span>{category.icon} {category.name}</span>
              </>
            )}
          </div>

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          {/* Main thread post */}
          <div className="thread-header">
            <h1>{thread?.title}</h1>
            <div className="thread-meta">
              <span>📁 {category?.name || 'Brak kategorii'}</span>
              <span>👁️ {thread?.views || 0} wyświetleń</span>
              <span>💬 {thread?.replyCount || 0} odpowiedzi</span>
            </div>
          </div>

          <div className="post main-post">
            <div className="post-author">
              <div className="author-avatar">{thread?.author?.avatar || '👤'}</div>
              <div className="author-name">{thread?.author?.nickname || 'Anonim'}</div>
              <div className="author-badge">Autor</div>
            </div>
            <div className="post-content">
              <div className="post-date">
                📅 {formatDate(thread?.date)}
              </div>
              <div className="post-message">
                {parseEmojis(thread?.message)}
              </div>
            </div>
          </div>

          {/* Replies */}
          {posts.length > 0 && (
            <div className="replies-section">
              <h2>💬 Odpowiedzi ({posts.length})</h2>
              {posts.map((post, index) => (
                <div key={post.id} className="post reply-post">
                  <div className="post-author">
                    <div className="author-avatar">{post.author?.avatar || '👤'}</div>
                    <div className="author-name">{post.author?.nickname || 'Anonim'}</div>
                    <div className="reply-number">#{index + 1}</div>
                  </div>
                  <div className="post-content">
                    <div className="post-date">
                      📅 {formatDate(post.date)}
                    </div>
                    <div className="post-message">
                      {parseEmojis(post.message)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply button / form */}
          {!thread?.isLocked && (
            <div className="reply-section">
              {!showReplyForm ? (
                <button
                  className="btn btn-reply"
                  onClick={() => setShowReplyForm(true)}
                >
                  ✍️ Napisz odpowiedź
                </button>
              ) : (
                <div className="reply-form-container">
                  <h3>✍️ Twoja odpowiedź</h3>
                  <form onSubmit={handleReplySubmit}>
                    <div className="profile-row">
                      <div className="avatar-picker">
                        <label>Avatar:</label>
                        <div className="avatars">
                          {avatars.map(av => (
                            <button
                              key={av}
                              type="button"
                              className={`avatar-btn ${replyData.avatar === av ? 'selected' : ''}`}
                              onClick={() => setReplyData({ ...replyData, avatar: av })}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="nickname-input">
                        <label>Nick:</label>
                        <input
                          type="text"
                          value={replyData.nickname}
                          onChange={(e) => setReplyData({ ...replyData, nickname: e.target.value })}
                          placeholder="Twój nick..."
                          maxLength={40}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Wiadomość:</label>
                      <textarea
                        value={replyData.message}
                        onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                        placeholder="Napisz swoją odpowiedź... Możesz używać emotikonów :) :D ;) :P :( <3"
                        maxLength={5000}
                        rows={6}
                      />
                      <span className="char-count">{replyData.message.length}/5000</span>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={replyLoading}>
                        {replyLoading ? '⏳ Wysyłanie...' : '📨 Wyślij odpowiedź'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowReplyForm(false)}
                      >
                        Anuluj
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {thread?.isLocked && (
            <div className="locked-notice">
              🔒 Ten wątek jest zamknięty. Nie można dodawać odpowiedzi.
            </div>
          )}
        </div>

        <div className="status-bar">
          <span>💬 Wątek: {thread?.title}</span>
        </div>
      </div>

      <style jsx>{`
        .thread-page {
          min-height: 100vh;
          background: #008080;
          padding: 20px;
          font-family: 'MS Sans Serif', Tahoma, sans-serif;
        }

        .window {
          max-width: 900px;
          margin: 0 auto;
          background: #c0c0c0;
          border: 3px outset #fff;
        }

        .title-bar {
          background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
          color: #fff;
          padding: 4px 8px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-btn {
          background: #c0c0c0;
          border: 2px outset #fff;
          color: #000;
          text-decoration: none;
          padding: 0 6px;
          font-size: 12px;
        }

        .close-btn:hover {
          background: #d0d0d0;
        }

        .content {
          padding: 15px;
        }

        .breadcrumb {
          margin-bottom: 15px;
          font-size: 12px;
        }

        .breadcrumb a {
          color: #000080;
          text-decoration: none;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .error-box {
          background: #ffcccc;
          border: 2px solid #ff0000;
          padding: 10px;
          margin-bottom: 15px;
          color: #cc0000;
        }

        .thread-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #808080;
        }

        .thread-header h1 {
          font-size: 20px;
          margin: 0 0 10px 0;
        }

        .thread-meta {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: #666;
          flex-wrap: wrap;
        }

        .post {
          display: flex;
          gap: 15px;
          background: #fff;
          border: 2px solid #808080;
          margin-bottom: 10px;
        }

        .main-post {
          border-color: #000080;
          border-width: 3px;
        }

        .post-author {
          width: 100px;
          flex-shrink: 0;
          padding: 15px;
          background: #e0e0e0;
          text-align: center;
          border-right: 1px solid #808080;
        }

        .author-avatar {
          font-size: 40px;
          margin-bottom: 5px;
        }

        .author-name {
          font-weight: bold;
          font-size: 12px;
          word-break: break-word;
        }

        .author-badge {
          background: #000080;
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          margin-top: 5px;
          display: inline-block;
        }

        .reply-number {
          color: #666;
          font-size: 10px;
          margin-top: 5px;
        }

        .post-content {
          flex: 1;
          padding: 15px;
        }

        .post-date {
          font-size: 11px;
          color: #666;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .post-message {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .replies-section {
          margin-top: 30px;
        }

        .replies-section h2 {
          font-size: 16px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #808080;
        }

        .reply-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #808080;
        }

        .btn {
          padding: 8px 20px;
          border: 2px outset #fff;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          background: #c0c0c0;
          color: #000;
        }

        .btn:hover {
          background: #d0d0d0;
        }

        .btn-reply {
          background: linear-gradient(180deg, #90EE90 0%, #228B22 100%);
          color: #000;
        }

        .btn-reply:hover {
          background: linear-gradient(180deg, #98FB98 0%, #32CD32 100%);
        }

        .reply-form-container {
          background: #f0f0f0;
          border: 2px groove #fff;
          padding: 15px;
        }

        .reply-form-container h3 {
          margin: 0 0 15px 0;
          font-size: 14px;
        }

        .profile-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .avatar-picker {
          flex: 1;
          min-width: 200px;
        }

        .avatar-picker label,
        .nickname-input label,
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          font-size: 12px;
        }

        .avatars {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .avatar-btn {
          width: 32px;
          height: 32px;
          font-size: 18px;
          background: #fff;
          border: 2px solid #808080;
          cursor: pointer;
          padding: 0;
        }

        .avatar-btn:hover {
          background: #ffffcc;
        }

        .avatar-btn.selected {
          background: #000080;
          border-color: #000080;
        }

        .nickname-input {
          flex: 1;
          min-width: 200px;
        }

        .nickname-input input {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 100px;
          box-sizing: border-box;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 10px;
          color: #666;
          margin-top: 3px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #c0c0c0;
        }

        .locked-notice {
          background: #ffffcc;
          border: 2px solid #808000;
          padding: 15px;
          text-align: center;
          margin-top: 20px;
        }

        .status-bar {
          background: #c0c0c0;
          border-top: 2px solid #808080;
          padding: 4px 8px;
          font-size: 11px;
        }

        .status-bar span {
          border: 1px inset #808080;
          padding: 2px 8px;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .thread-page {
            padding: 10px;
          }

          .post {
            flex-direction: column;
          }

          .post-author {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #808080;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
          }

          .author-avatar {
            font-size: 30px;
            margin-bottom: 0;
          }

          .thread-meta {
            flex-direction: column;
            gap: 5px;
          }

          .profile-row {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
