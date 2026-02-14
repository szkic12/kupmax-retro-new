'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewThreadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    message: '',
    nickname: '',
    avatar: '👤'
  });

  const avatars = ['👤', '😀', '😎', '🤓', '🧑‍💻', '👨‍🎤', '👩‍🔬', '🧙', '🤖', '👾', '🎮', '💀', '🐱', '🐶', '🦊'];

  useEffect(() => {
    document.body.style.overflow = 'auto';
    fetchCategories();
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      logger.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId) {
      setError('Wybierz kategorię!');
      return;
    }
    if (!formData.title.trim()) {
      setError('Wpisz tytuł wątku!');
      return;
    }
    if (!formData.message.trim()) {
      setError('Wpisz treść wątku!');
      return;
    }
    if (!formData.nickname.trim()) {
      setError('Wpisz swój nick!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          title: formData.title,
          message: formData.message,
          author: {
            nickname: formData.nickname,
            avatar: formData.avatar
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/forum/thread/${data.thread.id}`);
      } else {
        setError(data.error || 'Błąd tworzenia wątku');
      }
    } catch (err) {
      setError('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-thread-page">
      <div className="window">
        <div className="title-bar">
          <span>📝 Nowy wątek - Forum KupMax</span>
          <Link href="/forum" className="close-btn">✕</Link>
        </div>

        <div className="content">
          <div className="breadcrumb">
            <Link href="/">🏠 Strona główna</Link>
            <span> › </span>
            <Link href="/forum">💬 Forum</Link>
            <span> › </span>
            <span>Nowy wątek</span>
          </div>

          <h1>Utwórz nowy wątek</h1>

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset>
              <legend>Kategoria</legend>
              <div className="categories-grid">
                {categories.map(cat => (
                  <label
                    key={cat.id}
                    className={`category-option ${formData.categoryId === cat.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={formData.categoryId === cat.id}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    />
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Twój profil</legend>
              <div className="profile-row">
                <div className="avatar-picker">
                  <label>Avatar:</label>
                  <div className="avatars">
                    {avatars.map(av => (
                      <button
                        key={av}
                        type="button"
                        className={`avatar-btn ${formData.avatar === av ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, avatar: av })}
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
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Twój nick..."
                    maxLength={40}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Treść wątku</legend>
              <div className="form-group">
                <label>Tytuł:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tytuł wątku..."
                  maxLength={100}
                />
                <span className="char-count">{formData.title.length}/100</span>
              </div>

              <div className="form-group">
                <label>Wiadomość:</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Napisz swoją wiadomość... Możesz używać emotikonów :) :D ;) :P :( <3"
                  maxLength={5000}
                  rows={10}
                />
                <span className="char-count">{formData.message.length}/5000</span>
              </div>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Wysyłanie...' : '📨 Utwórz wątek'}
              </button>
              <Link href="/forum" className="btn btn-secondary">
                Anuluj
              </Link>
            </div>
          </form>
        </div>

        <div className="status-bar">
          <span>📝 Gotowy do tworzenia wątku</span>
        </div>
      </div>

      <style jsx>{`
        .new-thread-page {
          min-height: 100vh;
          background: #008080;
          padding: 20px;
          font-family: 'MS Sans Serif', Tahoma, sans-serif;
        }

        .window {
          max-width: 800px;
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

        h1 {
          font-size: 18px;
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #808080;
        }

        .error-box {
          background: #ffcccc;
          border: 2px solid #ff0000;
          padding: 10px;
          margin-bottom: 15px;
          color: #cc0000;
        }

        fieldset {
          border: 2px groove #fff;
          padding: 15px;
          margin-bottom: 15px;
        }

        legend {
          font-weight: bold;
          padding: 0 5px;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .category-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: #fff;
          border: 2px solid #808080;
          cursor: pointer;
        }

        .category-option:hover {
          background: #ffffcc;
        }

        .category-option.selected {
          background: #000080;
          color: #fff;
          border-color: #000080;
        }

        .category-option input {
          display: none;
        }

        .cat-icon {
          font-size: 20px;
        }

        .cat-name {
          font-size: 12px;
          font-weight: bold;
        }

        .profile-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .avatar-picker {
          flex: 1;
          min-width: 200px;
        }

        .avatar-picker label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .avatars {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .avatar-btn {
          width: 36px;
          height: 36px;
          font-size: 20px;
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

        .nickname-input label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .nickname-input input {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 2px inset #808080;
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 150px;
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 11px;
          color: #666;
          margin-top: 3px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 20px;
          border: 2px outset #fff;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-primary {
          background: linear-gradient(180deg, #c0c0c0 0%, #808080 100%);
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(180deg, #d0d0d0 0%, #909090 100%);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #c0c0c0;
          color: #000;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
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
        }

        @media (max-width: 600px) {
          .new-thread-page {
            padding: 10px;
          }

          .categories-grid {
            grid-template-columns: 1fr;
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
