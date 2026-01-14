import { useState, useRef, useEffect } from 'react';
import useSimpleChat from '../../hooks/useSimpleChat';
import styles from './Chatroom.module.scss';
import { EmojiParser } from '../RetroEmoji';
import WindowControls from '../WindowControls';

/**
 * Komponent Chatroom w stylu retro Windows 95
 */
export default function Chatroom() {
  const {
    isConnected,
    messages,
    users,
    currentUser,
    joinChat,
    sendMessage,
    leaveChat,
    formatTime,
    usersCount
  } = useSimpleChat();

  const [nickname, setNickname] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [banningUserId, setBanningUserId] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const loginWindowRef = useRef(null);
  const chatWindowRef = useRef(null);

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

  // Focus na input i scroll przy wejściu do czatu
  useEffect(() => {
    if (!showLogin) {
      messageInputRef.current?.focus();
      // Początkowy scroll na dół bez animacji tylko przy wejściu
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 0);
    }
  }, [showLogin]);

  /**
   * Obsługa logowania do czatu
   */
  const handleLogin = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    joinChat({ nickname: nickname.trim() });
    setShowLogin(false);
  };

  /**
   * Obsługa wysyłania wiadomości
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendMessage(messageInput);
    setMessageInput('');

    // Ponowny focus na input po wysłaniu
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  /**
   * Obsługa klawisza Enter w input
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  /**
   * Obsługa opuszczania czatu
   */
  const handleLeaveChat = () => {
    leaveChat();
    setShowLogin(true);
    setNickname('');
  };

  /**
   * Obsługa usuwania wiadomości (własnej lub admin każdej)
   */
  const handleDeleteMessage = async (messageId, messageUserId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) {
      return;
    }

    setDeletingMessageId(messageId);
    setSelectedMessageId(null);

    try {
      // Przekaż userId dla własnych wiadomości
      const url = isAdmin
        ? `/api/chat/simple?messageId=${messageId}`
        : `/api/chat/simple?messageId=${messageId}&userId=${currentUser?.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (!data.success) {
        alert(`Błąd: ${data.error}`);
      }
      // Wiadomość automatycznie zniknie przez polling
    } catch (err) {
      alert('Błąd podczas usuwania wiadomości');
      console.error('Delete error:', err);
    } finally {
      setDeletingMessageId(null);
    }
  };

  /**
   * Obsługa rozpoczęcia edycji wiadomości
   */
  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditText(message.message);
    setSelectedMessageId(null);
  };

  /**
   * Obsługa zapisywania edytowanej wiadomości
   */
  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingMessageId) return;

    try {
      const response = await fetch('/api/chat/simple', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: editingMessageId,
          userId: currentUser?.id,
          newMessage: editText.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(`Błąd: ${data.error}`);
      }
      // Wiadomość automatycznie zaktualizuje się przez polling
    } catch (err) {
      alert('Błąd podczas edycji wiadomości');
      console.error('Edit error:', err);
    } finally {
      setEditingMessageId(null);
      setEditText('');
    }
  };

  /**
   * Obsługa anulowania edycji
   */
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  /**
   * Obsługa kliknięcia na wiadomość
   */
  const handleMessageClick = (message) => {
    // Tylko własne wiadomości można edytować/usuwać (nie systemowe)
    if (message.userId === currentUser?.id && message.type !== 'system') {
      setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
    }
  };

  /**
   * Obsługa banowania użytkownika (tylko admin)
   */
  const handleBanUser = async (userId, userNickname) => {
    if (!confirm(`Czy na pewno chcesz zbanować użytkownika ${userNickname}?`)) {
      return;
    }

    setBanningUserId(userId);

    try {
      const response = await fetch('/api/chat/simple', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin', // Wysyła JWT cookie
        body: JSON.stringify({
          userId: userId,
          ban: true
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Użytkownik ${userNickname} został zbanowany!`);
        // Lista użytkowników automatycznie zaktualizuje się przez polling
      } else {
        alert(`Błąd: ${data.error}`);
      }
    } catch (err) {
      alert('Błąd podczas banowania użytkownika');
      console.error('Ban error:', err);
    } finally {
      setBanningUserId(null);
    }
  };

  /**
   * Renderowanie wiadomości z różnymi stylami
   */
  const renderMessage = (message) => {
    const isOwnMessage = message.userId === currentUser?.id;
    const isSystemMessage = message.type === 'system';
    const isActionMessage = message.type === 'action';
    const isSelected = selectedMessageId === message.id;
    const isEditing = editingMessageId === message.id;

    return (
      <div
        key={message.id}
        className={`${styles.message} ${
          isOwnMessage ? styles.ownMessage :
          isSystemMessage ? styles.systemMessage :
          isActionMessage ? styles.actionMessage :
          styles.otherMessage
        } ${isSelected ? styles.selectedMessage : ''} ${isOwnMessage && !isSystemMessage ? styles.clickableMessage : ''}`}
        onClick={() => !isEditing && handleMessageClick(message)}
      >
        <div className={styles.messageHeader}>
          {!isSystemMessage && !isActionMessage && (
            <span className={styles.avatar}>{message.avatar}</span>
          )}
          <span className={styles.nickname}>
            {message.nickname}
            {!isSystemMessage && !isActionMessage && (
              <span className={styles.time}>{formatTime(message.timestamp)}</span>
            )}
          </span>
        </div>

        {/* Tryb edycji */}
        {isEditing ? (
          <div className={styles.editContainer}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={styles.editInput}
              maxLength={280}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className={styles.editButtons}>
              <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className={styles.saveButton}>✓</button>
              <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className={styles.cancelButton}>✕</button>
            </div>
          </div>
        ) : (
          <div className={styles.messageContent}>
            <EmojiParser text={message.message} emojiSize={24} />
          </div>
        )}

        {/* Przyciski akcji dla własnych wiadomości (po kliknięciu) */}
        {isSelected && isOwnMessage && !isSystemMessage && !isEditing && (
          <div className={styles.messageActions}>
            <button
              onClick={(e) => { e.stopPropagation(); handleStartEdit(message); }}
              className={styles.editButton}
              title="Edytuj wiadomość"
            >
              ✏️ Edytuj
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message.id, message.userId); }}
              className={styles.deleteButton}
              disabled={deletingMessageId === message.id}
              title="Usuń wiadomość"
            >
              {deletingMessageId === message.id ? '⏳' : '🗑️'} Usuń
            </button>
          </div>
        )}

        {/* Przycisk usuwania dla admina (inne wiadomości) */}
        {isAdmin && !isOwnMessage && !isSystemMessage && (
          <div className={styles.adminActions}>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message.id, message.userId); }}
              className={styles.deleteButton}
              disabled={deletingMessageId === message.id}
              title="Usuń wiadomość (Admin)"
            >
              {deletingMessageId === message.id ? '⏳' : '🗑️'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Ekran logowania
  if (showLogin) {
    return (
      <div className={styles.chatroom}>
        <div className={styles.loginWindow} ref={loginWindowRef}>
          <div className={styles.windowHeader}>
            <span>💬 Retro Chatroom - Logowanie</span>
            <WindowControls
              newTabUrl="/chat"
              windowRef={loginWindowRef}
              onMinimize={() => setIsMinimized(!isMinimized)}
              canClose={false}
            />
          </div>

          {!isMinimized && (
          <div className={styles.loginContent}>
            <div className={styles.loginIcon}>💬</div>
            <h3>Witaj w Retro Chatroom!</h3>
            <p>Podaj swój nick aby dołączyć do czatu</p>
            
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.fieldGroup}>
                <label htmlFor="nickname">Twój nick:</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Wprowadź swój nick..."
                  maxLength={20}
                  autoFocus
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.loginButton}
                disabled={!nickname.trim()}
              >
                🚀 Dołącz do czatu
              </button>
            </form>
            
            <div className={styles.loginInfo}>
              <p>💡 <strong>Komendy czatu:</strong></p>
              <ul>
                <li><code>/help</code> - pomoc</li>
                <li><code>/users</code> - lista użytkowników</li>
                <li><code>/clear</code> - wyczyść czat</li>
                <li><code>/me [akcja]</code> - akcja użytkownika</li>
              </ul>
            </div>
          </div>
          )}
        </div>
      </div>
    );
  }

  // Główne okno czatu
  return (
    <div className={styles.chatroom}>
      <div className={styles.chatWindow} ref={chatWindowRef}>
        {/* Nagłówek okna */}
        <div className={styles.windowHeader}>
          <span>💬 Retro Chatroom ({usersCount} online)</span>
          <WindowControls
            newTabUrl="/chat"
            windowRef={chatWindowRef}
            onMinimize={() => setIsMinimized(!isMinimized)}
            onClose={handleLeaveChat}
          />
        </div>

        {/* Główna zawartość */}
        {!isMinimized && (
        <div className={styles.chatContent}>
          {/* Panel użytkowników */}
          <div className={styles.usersPanel}>
            <div className={styles.panelHeader}>
              <span>👥 Użytkownicy ({usersCount})</span>
            </div>
            <div className={styles.usersList}>
              {users.map(user => (
                <div key={user.id} className={styles.userItem}>
                  <span className={styles.userAvatar}>{user.avatar}</span>
                  <span className={styles.userName}>
                    {user.nickname}
                    {user.id === currentUser?.id && ' (Ty)'}
                  </span>
                  <span className={styles.userStatus}>●</span>

                  {/* Przycisk banowania dla admina (nie można zbanować samego siebie) */}
                  {isAdmin && user.id !== currentUser?.id && (
                    <button
                      onClick={() => handleBanUser(user.id, user.nickname)}
                      className={styles.banButton}
                      disabled={banningUserId === user.id}
                      title={`Zbanuj ${user.nickname}`}
                    >
                      {banningUserId === user.id ? '⏳' : '🚫'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panel czatu */}
          <div className={styles.chatPanel}>
            {/* Wiadomości */}
            <div
              className={styles.messagesContainer}
              ref={messagesContainerRef}
            >
              {messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <div className={styles.emptyIcon}>💬</div>
                  <p>Brak wiadomości</p>
                  <small>Bądź pierwszy i napisz coś!</small>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input wiadomości */}
            <form onSubmit={handleSendMessage} className={styles.messageForm}>
              <div className={styles.inputContainer}>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Napisz wiadomość... (Enter wyślij, /help komendy)"
                  maxLength={280}
                  disabled={!currentUser} // Blokuj tylko gdy nie ma użytkownika, nie gdy brak WebSocket
                />
                <button 
                  type="submit" 
                  className={styles.sendButton}
                  disabled={!messageInput.trim() || !currentUser} // Blokuj tylko gdy nie ma użytkownika
                  title="Wyślij wiadomość (Enter)"
                >
                  📤
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Status bar */}
        {!isMinimized && (
        <div className={styles.statusBar}>
          <span className={styles.connectionStatus}>
            {isConnected ? '🟢 Połączono' : '🔴 Rozłączono'}
          </span>
          <span className={styles.userInfo}>
            Zalogowany jako: <strong>{currentUser?.nickname}</strong>
          </span>
          <button
            onClick={handleLeaveChat}
            className={styles.leaveButton}
            title="Opuść czat"
          >
            🚪 Wyjdź
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
