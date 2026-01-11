import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook do zarządzania czatem w czasie rzeczywistym
 */
export function useChat() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Inicjalizacja połączenia Socket.io z poprawioną konfiguracją
    socketRef.current = io({
      path: '/api/socket',
      transports: ['polling', 'websocket'], // Polling jako fallback
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    // Obsługa zdarzeń
    socketRef.current.on('connect', () => {
      console.log('Połączono z serwerem czatu');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Rozłączono z serwerem czatu');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Błąd połączenia:', error);
      setIsConnected(false);
    });

    // Odbieranie historii czatu
    socketRef.current.on('chat_history', (history) => {
      setMessages(history);
    });

    // Odbieranie nowych wiadomości
    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Aktualizacja listy użytkowników
    socketRef.current.on('users_list', (usersList) => {
      setUsers(usersList);
    });

    socketRef.current.on('user_joined', (user) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socketRef.current.on('user_left', (user) => {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    });

    // Czyszczenie czatu (dla komendy /clear)
    socketRef.current.on('clear_chat', () => {
      setMessages([]);
    });

    // Ping/pong dla utrzymania połączenia
    const pingInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 30000);

    // Czyszczenie przy odmontowaniu komponentu
    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Dołącz do czatu jako użytkownik
   */
  const joinChat = (userData) => {
    if (!socketRef.current) return;

    const user = {
      nickname: userData.nickname?.trim() || `Użytkownik_${Date.now().toString().slice(-4)}`,
      avatar: userData.avatar || '👤'
    };

    socketRef.current.emit('user_join', user);
    setCurrentUser({ ...user, id: socketRef.current.id });
  };

  /**
   * Wyślij wiadomość do czatu
   */
  const sendMessage = (message) => {
    if (!socketRef.current || !message?.trim()) return;

    // Sprawdź czy to komenda
    if (message.startsWith('/')) {
      socketRef.current.emit('chat_command', { command: message });
    } else {
      socketRef.current.emit('send_message', { message: message.trim() });
    }
  };

  /**
   * Opuść czat
   */
  const leaveChat = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setCurrentUser(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
  };

  /**
   * Formatowanie timestamp
   */
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    // Stan
    isConnected,
    messages,
    users,
    currentUser,
    
    // Akcje
    joinChat,
    sendMessage,
    leaveChat,
    formatTime,
    
    // Informacje
    usersCount: users.length,
    messagesCount: messages.length
  };
}

export default useChat;
