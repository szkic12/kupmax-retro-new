import { useState, useEffect, useRef } from 'react';

/**
 * Hook do zarządzania czatem z użyciem API REST zamiast WebSocket
 */
export function useChatRest() {
  const [isConnected, setIsConnected] = useState(true); // Zawsze połączony z API
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const pollIntervalRef = useRef(null);
  const userIdRef = useRef(null);

  // Polling dla aktualizacji w czasie rzeczywistym
  const startPolling = () => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/chat/messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania wiadomości:', error);
      }
    }, 2000); // Polling co 2 sekundy
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Dołącz do czatu
  const joinChat = async (userData) => {
    setIsLoading(true);
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      userIdRef.current = userId;

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          data: {
            id: userId,
            nickname: userData.nickname?.trim(),
            avatar: userData.avatar || '👤'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.user);
        setMessages(prev => [...prev, result.message]);
        startPolling();
        setIsConnected(true);
      } else {
        throw new Error('Błąd podczas dołączania do czatu');
      }
    } catch (error) {
      console.error('Błąd:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Wyślij wiadomość
  const sendMessage = async (message) => {
    if (!message?.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      // Sprawdź czy to komenda
      if (message.startsWith('/')) {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'command',
            data: {
              userId: currentUser.id,
              command: message
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.response) {
            setMessages(prev => [...prev, result.response]);
          }
        }
      } else {
        // Normalna wiadomość
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send',
            data: {
              userId: currentUser.id,
              nickname: currentUser.nickname,
              avatar: currentUser.avatar,
              message: message.trim()
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          setMessages(prev => [...prev, result.message]);
        }
      }
    } catch (error) {
      console.error('Błąd podczas wysyłania wiadomości:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Opuść czat
  const leaveChat = async () => {
    if (currentUser) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'leave',
            data: {
              userId: currentUser.id
            }
          })
        });
      } catch (error) {
        console.error('Błąd podczas opuszczania czatu:', error);
      }
    }

    stopPolling();
    setCurrentUser(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
    userIdRef.current = null;
  };

  // Formatowanie czasu
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Czyszczenie przy odmontowaniu
  useEffect(() => {
    return () => {
      stopPolling();
      if (currentUser) {
        leaveChat();
      }
    };
  }, []);

  return {
    // Stan
    isConnected,
    messages,
    users,
    currentUser,
    isLoading,
    
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

export default useChatRest;
