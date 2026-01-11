import { useState, useRef, useEffect } from 'react';
import usePrivateChat from '../../hooks/usePrivateChat';
import styles from './PrivateChatroom.module.scss';

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

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

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
   * Obsługa usuwania wiadomości (tylko admin)
   */
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;

    setDeletingMessageId(messageId);

    try {
      const response = await fetch(`/api/chat/private?messageId=${messageId}&roomId=${currentRoom}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (data.success) {
        alert('Wiadomość usunięta!');
      } else {
        alert(`Błąd: ${data.error}`);
      }
    } catch (err) {
      alert('Błąd podczas usuwania wiadomości');
      console.error('Delete error:', err);
    } finally {
      setDeletingMessageId(null);
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
      console.error('Ban error:', err);
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

    return (
      <div
        key={message.id}
        className={`${styles.message} ${
          isOwnMessage ? styles.ownMessage : 
          isSystemMessage ? styles.systemMessage :
          isActionMessage ? styles.actionMessage :
          styles.otherMessage
        }`}
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
        <div className={styles.messageContent}>
          {message.message}
        </div>

        {/* Przycisk usuwania dla admina */}
        {isAdmin && !isSystemMessage && (
          <div className={styles.adminActions}>
            <button
              onClick={() => handleDeleteMessage(message.id)}
              className={styles.deleteButton}
              disabled={deletingMessageId === message.id}
              title="Usuń wiadomość"
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
        <div className={styles.selectWindow}>
          <div className={styles.windowHeader}>
            <span>🔒 Prywatne Pokoje Czatu</span>
            <div className={styles.windowControls}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
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
        </div>
      </div>
    );
  }

  // Ekran tworzenia pokoju
  if (mode === 'create') {
    return (
      <div className={styles.privateChatroom}>
        <div className={styles.createWindow}>
          <div className={styles.windowHeader}>
            <span>🏠 Tworzenie Prywatnego Pokoju</span>
            <div className={styles.windowControls}>
              <span title="Cofnij" onClick={() => setMode('select')}></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
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
        </div>
      </div>
    );
  }

  // Ekran dołączania do pokoju
  if (mode === 'join') {
    return (
      <div className={styles.privateChatroom}>
        <div className={styles.joinWindow}>
          <div className={styles.windowHeader}>
            <span>🔑 Dołączanie do Pokoju</span>
            <div className={styles.windowControls}>
              <span title="Cofnij" onClick={() => setMode('select')}></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
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
        </div>
      </div>
    );
  }

  // Główne okno czatu
  return (
    <div className={styles.privateChatroom}>
      <div className={styles.chatWindow}>
        {/* Nagłówek okna */}
        <div className={styles.windowHeader}>
          <span>🔒 Prywatny Pokój: {currentRoom} ({usersCount} online)</span>
          <div className={styles.windowControls}>
            <span title="Minimalizuj"></span>
            <span title="Maksymalizuj"></span>
            <span title="Zamknij" onClick={handleLeaveRoom}></span>
          </div>
        </div>

        {/* Główna zawartość */}
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

        {/* Status bar */}
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
          <button 
            onClick={handleLeaveRoom}
            className={styles.leaveButton}
            title="Opuść pokój"
          >
            🚪 Wyjdź
          </button>
        </div>
      </div>
    </div>
  );
}
