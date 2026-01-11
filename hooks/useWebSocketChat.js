import { useState, useEffect, useRef } from 'react';

/**
 * Hook do zarządzania czatem z użyciem natywnego WebSocket API + fallback
 */
export function useWebSocketChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectionIdRef = useRef(null);
  const fallbackPollingRef = useRef(null);

  // URL WebSocket z fallback na HTTP jeśli HTTPS
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/websocket`;
  };

  // Fallback polling dla gdy WebSocket zawiedzie
  const startFallbackPolling = () => {
    if (fallbackPollingRef.current) return;

    console.log('Uruchamianie fallback polling...');
    fallbackPollingRef.current = setInterval(async () => {
      try {
        // Pobierz aktualny stan czatu przez REST API
        const response = await fetch('/api/chat/status');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Błąd fallback polling:', error);
      }
    }, 3000); // Polling co 3 sekundy
  };

  const stopFallbackPolling = () => {
    if (fallbackPollingRef.current) {
      clearInterval(fallbackPollingRef.current);
      fallbackPollingRef.current = null;
      console.log('Zatrzymano fallback polling');
    }
  };

  // Połączenie WebSocket
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = getWebSocketUrl();
      console.log('Łączenie z WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      setConnectionStatus('connecting');

      wsRef.current.onopen = () => {
        console.log('WebSocket połączony');
        setIsConnected(true);
        setConnectionStatus('connected');
        stopFallbackPolling();
        
        // Ponowne dołączenie jeśli użytkownik był zalogowany
        if (currentUser) {
          sendWebSocketMessage({
            type: 'join',
            data: currentUser
          });
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Błąd parsowania wiadomości WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket zamknięty:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Automatyczne ponowne połączenie
        if (event.code !== 1000) { // Nie próbuj ponownie jeśli zamknięte normalnie
          scheduleReconnect();
          startFallbackPolling(); // Uruchom fallback
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Błąd WebSocket:', error);
        setConnectionStatus('error');
        startFallbackPolling(); // Uruchom fallback przy błędzie
      };

    } catch (error) {
      console.error('Błąd tworzenia WebSocket:', error);
      setConnectionStatus('error');
      startFallbackPolling(); // Uruchom fallback
    }
  };

  // Automatyczne ponowne połączenie
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      console.log('Próba ponownego połączenia...');
      connectWebSocket();
    }, 3000); // Ponów za 3 sekundy
  };

  // Wysyłanie wiadomości przez WebSocket
  const sendWebSocketMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  // Obsługa przychodzących wiadomości WebSocket
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'welcome':
        connectionIdRef.current = message.connectionId;
        console.log('Połączenie potwierdzone:', message.connectionId);
        break;

      case 'chat_history':
        setMessages(message.messages || []);
        setUsers(message.users || []);
        break;

      case 'new_message':
        setMessages(prev => [...prev, message.message]);
        break;

      case 'user_joined':
        setUsers(prev => [...prev.filter(u => u.id !== message.user.id), message.user]);
        break;

      case 'user_left':
        setUsers(prev => prev.filter(u => u.id !== message.userId));
        break;

      case 'clear_chat':
        setMessages([]);
        break;

      case 'error':
        console.error('Błąd z serwera:', message.message);
        break;

      default:
        console.log('Nieznany typ wiadomości:', message.type);
    }
  };

  // Dołącz do czatu
  const joinChat = (userData) => {
    const user = {
      nickname: userData.nickname?.trim() || `Użytkownik_${Date.now().toString().slice(-4)}`,
      avatar: userData.avatar || '👤'
    };

    setCurrentUser(user);

    // Zawsze próbuj połączyć się z WebSocket
    connectWebSocket();
    
    // Jeśli WebSocket jest już połączony, wyślij wiadomość join
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendWebSocketMessage({
        type: 'join',
        data: user
      });
    } else {
      // Jeśli nie ma połączenia, uruchom fallback polling
      startFallbackPolling();
    }
  };

  // Wyślij wiadomość
  const sendMessage = (message) => {
    if (!message?.trim() || !currentUser) return;

    // Sprawdź czy to komenda
    if (message.startsWith('/')) {
      // Komendy tylko przez WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendWebSocketMessage({
          type: 'command',
          data: { command: message }
        });
      } else {
        console.warn('Nie można wysłać komendy - brak połączenia WebSocket');
      }
    } else {
      // Normalna wiadomość - próbuj przez WebSocket, jeśli nie działa, użyj fallback
      const sent = sendWebSocketMessage({
        type: 'send_message',
        data: { message: message.trim() }
      });

      if (!sent) {
        // Fallback: dodaj wiadomość lokalnie i zsynchronizuj przez polling
        console.log('Używanie fallback dla wiadomości');
        const fallbackMessage = {
          id: Date.now().toString(),
          type: 'message',
          userId: 'fallback_' + Date.now(),
          nickname: currentUser.nickname,
          avatar: currentUser.avatar,
          message: message.trim(),
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
        
        // Próbuj wysłać przez REST API jako fallback
        try {
          fetch('/api/chat/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'add_message',
              data: { message: fallbackMessage }
            })
          });
        } catch (error) {
          console.error('Błąd fallback wysyłania wiadomości:', error);
        }
      }
    }
  };

  // Opuść czat
  const leaveChat = () => {
    if (isConnected) {
      sendWebSocketMessage({
        type: 'leave'
      });
    }

    // Zamknij połączenie
    if (wsRef.current) {
      wsRef.current.close(1000, 'Użytkownik opuścił czat');
    }

    stopFallbackPolling();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setCurrentUser(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  // Formatowanie czasu
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Inicjalizacja połączenia przy montowaniu
  useEffect(() => {
    // Automatyczne połączenie przy starcie
    connectWebSocket();

    return () => {
      // Czyszczenie przy odmontowaniu
      if (wsRef.current) {
        wsRef.current.close(1000, 'Komponent odmontowany');
      }
      
      stopFallbackPolling();
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Stan
    isConnected,
    messages,
    users,
    currentUser,
    connectionStatus,
    
    // Akcje
    joinChat,
    sendMessage,
    leaveChat,
    formatTime,
    
    // Informacje
    usersCount: users.length,
    messagesCount: messages.length,
    
    // Kontrola połączenia
    reconnect: connectWebSocket
  };
}

export default useWebSocketChat;
