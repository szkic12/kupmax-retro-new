import { useState, useEffect, useRef } from 'react';

/**
 * Prosty hook do czatu z użyciem tylko REST API - bez WebSocket
 */
export function useSimpleChat() {
  const [isConnected, setIsConnected] = useState(true); // Zawsze połączony z API
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const pollingIntervalRef = useRef(null);

  // Polling dla aktualizacji w czasie rzeczywistym
  const startPolling = () => {
    if (pollingIntervalRef.current) return;

    console.log('Uruchamianie polling...');
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/chat/simple');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Błąd polling:', error);
      }
    }, 2000); // Polling co 2 sekundy
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('Zatrzymano polling');
    }
  };

  // Dołącz do czatu
  const joinChat = async (userData) => {
    setIsLoading(true);
    try {
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nickname: userData.nickname?.trim() || `Użytkownik_${Date.now().toString().slice(-4)}`,
        avatar: userData.avatar || '👤',
        joinTime: new Date().toISOString()
      };

      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          data: { user }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(user);
        setMessages(result.messages || []);
        setUsers(result.users || []);
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
        const response = await fetch('/api/chat/simple', {
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
          
          // Obsługa specjalnych przypadków jak /clear
          if (message.toLowerCase() === '/clear') {
            // Wyczyść wszystkie wiadomości dla tego użytkownika
            setMessages([]);
          } else {
            // Normalne dodawanie wiadomości
            setMessages(prev => [...prev, ...(result.newMessages || [])]);
          }
        }
      } else {
        // Normalna wiadomość
        const response = await fetch('/api/chat/simple', {
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
        await fetch('/api/chat/simple', {
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

export default useSimpleChat;
