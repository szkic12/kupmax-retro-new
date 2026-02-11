import { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import usePrivateChat from '../../hooks/usePrivateChat';
import styles from './PrivateChatroom.module.scss';
import { EmojiParser } from '../RetroEmoji';
import WindowControls from '../WindowControls';

/**
 * Komponent prywatnych pokoi czatu - jak na starym Onet.pl
 */
export default function PrivateChatroom() {
  const {
    isConnected,
    messages,
    users,
    currentUser,
    currentRoom,
    createRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    formatTime,
    usersCount,
    isLoading
  } = usePrivateChat();

  const [nickname, setNickname] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [mode, setMode] = useState('select'); // 'select', 'create', 'join', 'chat'
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [banningUserId, setBanningUserId] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const selectWindowRef = useRef(null);
  const createWindowRef = useRef(null);
  const joinWindowRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Sprawdź czy zalogowany jako admin
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
      .catch(() => setIsAdmin(false));
  }, []);

  // Focus na input i scroll przy wejściu do czatu
  useEffect(() => {
    if (mode === 'chat') {
      messageInputRef.current?.focus();
      // Początkowy scroll na dół bez animacji tylko przy wejściu
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 0);
    }
  }, [mode]);

  /**
   * Obsługa tworzenia pokoju
   */
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setError('');
    try {
      const roomId = await createRoom(
        { nickname: nickname.trim() }, 
        passwordInput.trim() || null
      );
      
      if (roomId) {
        setMode('chat');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  /**
   * Obsługa dołączania do pokoju
   */
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !roomIdInput.trim() || !passwordInput.trim()) return;

    setError('');
    try {
      const result = await joinRoom(
        { nickname: nickname.trim() },
        roomIdInput.trim().toUpperCase(),
        passwordInput.trim()
      );
      
      if (result.success) {
        setMode('chat');
      } else {
        setError(result.error || 'Błąd podczas dołączania do pokoju');
      }
    } catch (error) {
      setError(error.message || 'Nieznany błąd');
    }
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
   * Obsługa opuszczania pokoju
   */
  const handleLeaveRoom = () => {
    leaveRoom();
    setMode('select');
    setNickname('');
    setRoomIdInput('');
    setPasswordInput('');
    setError('');
  };

  /**
   * Obsługa usuwania wiadomości (własnej lub admin każdej)
   */
  const handleDeleteMessage = async (messageId, messageUserId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;

    setDeletingMessageId(messageId);
    setSelectedMessageId(null);

    try {
      // Przekaż userId dla własnych wiadomości
      const url = isAdmin
        ? `/api/chat/private?messageId=${messageId}&roomId=${currentRoom}`
        : `/api/chat/private?messageId=${messageId}&roomId=${currentRoom}&userId=${currentUser?.id}`;

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
      logger.error('Delete error:', err);
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
      const response = await fetch('/api/chat/private', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: editingMessageId,
          userId: currentUser?.id,
          roomId: currentRoom,
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
      logger.error('Edit error:', err);
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
   * Obsługa kasowania całego pokoju
   */
  const handleDeleteRoom = async () => {
    if (!confirm('Czy na pewno chcesz USUNĄĆ CAŁY POKÓJ? Wszystkie wiadomości zostaną trwale usunięte!')) return;
    if (!confirm('To jest NIEODWRACALNE! Na pewno chcesz kontynuować?')) return;

    setIsDeletingRoom(true);

    try {
      const response = await fetch(`/api/chat/private?roomId=${currentRoom}&deleteRoom=true`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (data.success) {
        alert('Pokój został usunięty!');
        // Wróć do ekranu wyboru
        setMode('select');
        setNickname('');
        setRoomIdInput('');
        setPasswordInput('');
        setError('');
      } else {
        alert(`Błąd: ${data.error}`);
      }
    } catch (err) {
      alert('Błąd podczas usuwania pokoju');
      logger.error('Delete room error:', err);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  /**
   * Obsługa banowania użytkownika (tylko admin)
   */
  const handleBanUser = async (userId, userNickname) => {
    if (!confirm(`Czy na pewno chcesz zbanować użytkownika ${userNickname}?`)) return;

    setBanningUserId(userId);

    try {
      const response = await fetch('/api/chat/private', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          userId: userId,
          roomId: currentRoom,
          ban: true
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Użytkownik ${userNickname} został zbanowany!`);
      } else {
        alert(`Błąd: ${data.error}`);
      }
    } catch (err) {
      alert('Błąd podczas banowania użytkownika');
      logger.error('Ban error:', err);
    } finally {
      setBanningUserId(null);
    }
  };

  /**
   * Renderowanie wiadomości
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

  // Ekran wyboru akcji
  if (mode === 'select') {
    return (
      <div className={styles.privateChatroom}>
        <div className={styles.selectWindow} ref={selectWindowRef}>
          <div className={styles.windowHeader}>
            <span>🔒 Prywatne Pokoje Czatu</span>
            <WindowControls
              newTabUrl="/private-chat"
              windowRef={selectWindowRef}
              onMinimize={() => setIsMinimized(!isMinimized)}
              canClose={false}
            />
          </div>

          {!isMinimized && (
          <div className={styles.selectContent}>
            <div className={styles.selectIcon}>🔒</div>
            <h3>Witaj w Prywatnych Pokojach!</h3>
            <p>Wybierz opcję:</p>
            
            <div className={styles.selectOptions}>
              <button 
                onClick={() => setMode('create')}
                className={styles.optionButton}
              >
                🏠 Stwórz nowy pokój
              </button>
              
              <button 
                onClick={() => setMode('join')}
                className={styles.optionButton}
              >
                🔑 Dołącz do pokoju
              </button>
            </div>
            
            <div className={styles.selectInfo}>
              <p>💡 <strong>Jak to działa:</strong></p>
              <ul>
                <li>🏠 <strong>Stwórz pokój</strong> - Utwórz prywatny pokój i zaproś znajomych</li>
                <li>🔑 <strong>Dołącz do pokoju</strong> - Wejdź do istniejącego pokoju z ID</li>
                <li>🔒 <strong>Prywatność</strong> - Tylko osoby z ID pokoju mają dostęp</li>
                <li>🗝️ <strong>Hasło</strong> - Zabezpieczenie pokoju</li>
              </ul>
            </div>
          </div>
          )}
        </div>
      </div>
    );
  }

  // Ekran tworzenia pokoju
  if (mode === 'create') {
    return (
      <div className={styles.privateChatroom}>
        <div className={styles.createWindow} ref={createWindowRef}>
          <div className={styles.windowHeader}>
            <span>🏠 Tworzenie Prywatnego Pokoju</span>
            <WindowControls
              newTabUrl="/private-chat"
              windowRef={createWindowRef}
              onMinimize={() => setIsMinimized(!isMinimized)}
              onClose={() => setMode('select')}
            />
          </div>

          {!isMinimized && (
          <div className={styles.createContent}>
            <div className={styles.createIcon}>🏠</div>
            <h3>Stwórz prywatny pokój</h3>
            <p>Podaj swój nick i hasło</p>
            
            <form onSubmit={handleCreateRoom} className={styles.createForm}>
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
              
              <div className={styles.fieldGroup}>
                <label htmlFor="password">Hasło:</label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Wprowadź hasło..."
                  maxLength={20}
                />
              </div>
              
              {error && <div className={styles.error}>{error}</div>}
              
              <button 
                type="submit" 
                className={styles.createButton}
                disabled={!nickname.trim() || isLoading}
              >
                {isLoading ? '⏳ Tworzenie...' : '🚀 Stwórz pokój'}
              </button>
            </form>
          </div>
          )}
        </div>
      </div>
    );
  }

  // Ekran dołączania do pokoju
  if (mode === 'join') {
    return (
      <div className={styles.privateChatroom}>
        <div className={styles.joinWindow} ref={joinWindowRef}>
          <div className={styles.windowHeader}>
            <span>🔑 Dołączanie do Pokoju</span>
            <WindowControls
              newTabUrl="/private-chat"
              windowRef={joinWindowRef}
              onMinimize={() => setIsMinimized(!isMinimized)}
              onClose={() => setMode('select')}
            />
          </div>

          {!isMinimized && (
          <div className={styles.joinContent}>
            <div className={styles.joinIcon}>🔑</div>
            <h3>Dołącz do prywatnego pokoju</h3>
            <p>Podaj ID pokoju i swoje dane</p>
            
            <form onSubmit={handleJoinRoom} className={styles.joinForm}>
              <div className={styles.fieldGroup}>
                <label htmlFor="roomId">ID Pokoju:</label>
                <input
                  id="roomId"
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="Wprowadź ID pokoju..."
                  maxLength={8}
                  autoFocus
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="joinNickname">Twój nick:</label>
                <input
                  id="joinNickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Wprowadź swój nick..."
                  maxLength={20}
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="joinPassword">Hasło:</label>
                <input
                  id="joinPassword"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Wprowadź hasło..."
                  maxLength={20}
                />
              </div>
              
              {error && <div className={styles.error}>{error}</div>}
              
              <button 
                type="submit" 
                className={styles.joinButton}
                disabled={!nickname.trim() || !roomIdInput.trim() || !passwordInput.trim() || isLoading}
              >
                {isLoading ? '⏳ Dołączanie...' : '🔑 Dołącz do pokoju'}
              </button>
            </form>
          </div>
          )}
        </div>
      </div>
    );
  }

  // Główne okno czatu
  return (
    <div className={styles.privateChatroom}>
      <div className={styles.chatWindow} ref={chatWindowRef}>
        {/* Nagłówek okna */}
        <div className={styles.windowHeader}>
          <span>🔒 Prywatny Pokój: {currentRoom} ({usersCount} online)</span>
          <WindowControls
            newTabUrl="/private-chat"
            windowRef={chatWindowRef}
            onMinimize={() => setIsMinimized(!isMinimized)}
            onClose={handleLeaveRoom}
          />
        </div>

        {/* Główna zawartość */}
        {!isMinimized && (
        <div className={styles.chatContent}>
          {/* Panel użytkowników */}
          <div className={styles.usersPanel}>
            <div className={styles.panelHeader}>
              <span>👥 W pokoju ({usersCount})</span>
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

                  {/* Przycisk banowania dla admina */}
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
                  <div className={styles.emptyIcon}>🔒</div>
                  <p>Prywatny pokój utworzony</p>
                  <small>Zaproś znajomych podając ID: <strong>{currentRoom}</strong></small>
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
                  disabled={!currentUser}
                />
                <button 
                  type="submit" 
                  className={styles.sendButton}
                  disabled={!messageInput.trim() || !currentUser}
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
          <span className={styles.roomInfo}>
            Pokój: <strong>{currentRoom}</strong>
          </span>
          <span className={styles.userInfo}>
            Zalogowany jako: <strong>{currentUser?.nickname}</strong>
          </span>
          <div className={styles.statusButtons}>
            <button
              onClick={handleLeaveRoom}
              className={styles.leaveButton}
              title="Opuść pokój"
            >
              🚪 Wyjdź
            </button>
            <button
              onClick={handleDeleteRoom}
              className={styles.deleteRoomButton}
              disabled={isDeletingRoom}
              title="Usuń pokój i wszystkie wiadomości"
            >
              {isDeletingRoom ? '⏳' : '🗑️'} Kasuj pokój
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
