'use client';

import { useState, useEffect } from 'react';
import styles from './Forum.module.scss';
import { EmojiParser } from '../RetroEmoji';
import Windows95Modal from '../Windows95Modal/Windows95Modal';

export default function Forum() {
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('categories'); // 'categories' | 'threads'

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadContent, setThreadContent] = useState({ posts: [], loading: false });

  useEffect(() => {
    fetchCategories();
    fetchThreads();
  }, []);

  useEffect(() => {
    if (view === 'threads') {
      fetchThreads();
    }
  }, [activeCategory, view]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('categoryId', activeCategory);
      params.append('sort', 'latest');

      const response = await fetch(`/api/forum/threads?${params}`);
      const data = await response.json();
      if (data.success) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadContent = async (threadId) => {
    setThreadContent({ posts: [], loading: true });
    try {
      const response = await fetch(`/api/forum/posts?threadId=${threadId}`);
      const data = await response.json();
      if (data.success) {
        setThreadContent({ posts: data.posts, loading: false });
      }
    } catch (error) {
      console.error('Error fetching thread content:', error);
      setThreadContent({ posts: [], loading: false });
    }
  };

  const handleThreadClick = async (thread) => {
    setSelectedThread(thread);
    setModalOpen(true);
    await fetchThreadContent(thread.id);
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

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setView('threads');
  };

  const handleBackToCategories = () => {
    setActiveCategory(null);
    setView('categories');
  };

  if (view === 'categories') {
    return (
      <div className={styles.forumContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>💬 Forum KupMax</h2>
          <p className={styles.subtitle}>Wybierz kategorię</p>
        </div>

        <div className={styles.categoriesList}>
          {categories.map(category => (
            <div
              key={category.id}
              className={styles.categoryCard}
              onClick={() => handleCategoryClick(category.id)}
              style={{ borderLeftColor: category.color }}
            >
              <div className={styles.categoryIcon}>{category.icon}</div>
              <div className={styles.categoryInfo}>
                <h3 className={styles.categoryName}>{category.name}</h3>
                <p className={styles.categoryDescription}>{category.description}</p>
                <div className={styles.categoryStats}>
                  <span>{category.threadCount || 0} wątków</span>
                  {category.lastActivity && (
                    <span>Ostatnio: {formatDate(category.lastActivity)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <a href="/forum" target="_blank" className={styles.fullPageLink}>
            📋 Zobacz pełną stronę forum
          </a>
        </div>
      </div>
    );
  }

  // Threads view
  const selectedCategory = categories.find(c => c.id === activeCategory);

  return (
    <>
      <div className={styles.forumContainer}>
        <div className={styles.header}>
          <button onClick={handleBackToCategories} className={styles.backButton}>
            ← Powrót do kategorii
          </button>
          <h2 className={styles.title}>
            {selectedCategory?.icon} {selectedCategory?.name}
          </h2>
        </div>

        {loading ? (
          <div className={styles.loading}>Ładowanie wątków...</div>
        ) : threads.length === 0 ? (
          <div className={styles.empty}>
            <p>Brak wątków w tej kategorii</p>
            <a href="/forum" target="_blank" className={styles.createLink}>
              Utwórz pierwszy wątek →
            </a>
          </div>
        ) : (
          <div className={styles.threadsList}>
            {threads.map(thread => (
              <div
                key={thread.id}
                className={styles.threadItem}
                onClick={() => handleThreadClick(thread)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.threadAuthor}>
                  <span className={styles.avatar}>{thread.author.avatar}</span>
                </div>
                <div className={styles.threadContent}>
                  <div className={styles.threadTitle}>
                    {thread.title}
                  </div>
                  <p className={styles.threadMessage}>
                    <EmojiParser text={thread.message.substring(0, 100) + '...'} emojiSize={20} />
                  </p>
                  <div className={styles.threadMeta}>
                    <span className={styles.author}>{thread.author.nickname}</span>
                    <span className={styles.date}>{formatDate(thread.date)}</span>
                  </div>
                </div>
                <div className={styles.threadStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{thread.replyCount || 0}</span>
                    <span className={styles.statLabel}>odpowiedzi</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{thread.views || 0}</span>
                    <span className={styles.statLabel}>wyświetleń</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <a href="/forum" target="_blank" className={styles.fullPageLink}>
            📋 Zobacz pełną stronę forum
          </a>
        </div>
      </div>

      {/* Thread Modal */}
      <Windows95Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedThread?.title || 'Wątek'}
      >
        {threadContent.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>⏳ Wczytywanie wątku...</p>
          </div>
        ) : (
          <div className={styles.threadModal}>
            {/* Original Post */}
            {selectedThread && (
              <div className={styles.modalPost}>
                <div className={styles.modalPostHeader}>
                  <span className={styles.modalAvatar}>{selectedThread.author.avatar}</span>
                  <div className={styles.modalAuthorInfo}>
                    <strong>{selectedThread.author.nickname}</strong>
                    <span className={styles.modalDate}>{formatDate(selectedThread.date)}</span>
                  </div>
                </div>
                <div className={styles.modalPostContent}>
                  <EmojiParser text={selectedThread.message} emojiSize={28} />
                </div>
              </div>
            )}

            {/* Replies */}
            {threadContent.posts && threadContent.posts.length > 0 && (
              <>
                <hr className={styles.modalDivider} />
                <h3 className={styles.modalRepliesTitle}>💬 Odpowiedzi ({threadContent.posts.length})</h3>
                {threadContent.posts.map((post, index) => (
                  <div key={index} className={styles.modalPost}>
                    <div className={styles.modalPostHeader}>
                      <span className={styles.modalAvatar}>{post.author.avatar}</span>
                      <div className={styles.modalAuthorInfo}>
                        <strong>{post.author.nickname}</strong>
                        <span className={styles.modalDate}>{formatDate(post.date)}</span>
                      </div>
                    </div>
                    <div className={styles.modalPostContent}>
                      <EmojiParser text={post.message} emojiSize={28} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No replies */}
            {threadContent.posts && threadContent.posts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Brak odpowiedzi
              </div>
            )}
          </div>
        )}
      </Windows95Modal>
    </>
  );
}
