import { useState, useEffect, useRef } from 'react';

/**
 * Hook do prywatnych pokoi czatu - jak na starym Onet.pl
 */
export function usePrivateChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const pollingIntervalRef = useRef(null);

  // Generuj trwałe ID użytkownika (zapisywane w localStorage)
  const getOrCreateUserId = (nickname) => {
    if (typeof window === 'undefined') {
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const storageKey = `private_chat_user_${nickname}`;
    let userId = localStorage.getItem(storageKey);
    
    if (!userId) {
      userId = `user_${nickname}_${Date.now().toString().slice(-6)}`;
      localStorage.setItem(storageKey, userId);
    }
    
    return userId;
  };

  // Polling dla aktualizacji w czasie rzeczywistym
  const startPolling = (roomId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log('Uruchamianie polling dla pokoju:', roomId);
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/private?roomId=${roomId}`);
        
        if (response.status === 404) {
          // Pokój nie istnieje - zatrzymaj polling i wyjdź z pokoju
          console.log('Pokój nie istnieje, zatrzymywanie polling...');
          stopPolling();
          setCurrentUser(null);
          setCurrentRoom(null);
          setMessages([]);
          setUsers([]);
          setIsConnected(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];
          const newUsers = data.users || [];
          
          // Aktualizuj tylko jeśli są nowe wiadomości lub użytkownicy
          setMessages(prevMessages => {
            // Sprawdź czy wiadomości się zmieniły
            if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
              return newMessages;
            }
            return prevMessages;
          });
          
          setUsers(prevUsers => {
            // Sprawdź czy użytkownicy się zmienili
            if (JSON.stringify(prevUsers) !== JSON.stringify(newUsers)) {
              return newUsers;
            }
            return prevUsers;
          });
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

  // Stwórz nowy prywatny pokój
  const createRoom = async (userData, password = null) => {
    setIsLoading(true);
    try {
      const nickname = userData.nickname?.trim() || `Użytkownik_${Date.now().toString().slice(-4)}`;
      const userId = getOrCreateUserId(nickname);
      
      const user = {
        id: userId,
        nickname: nickname,
        avatar: userData.avatar || '👤'
      };

      const response = await fetch('/api/chat/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_room',
          data: {
            userId: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            password: password,
            creator: user.nickname
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(user);
        setCurrentRoom(result.roomId);
        setMessages(result.messages || []);
        setUsers(result.users || []);
        startPolling(result.roomId);
        setIsConnected(true);
        
        return result.roomId;
      } else {
        throw new Error('Błąd podczas tworzenia pokoju');
      }
    } catch (error) {
      console.error('Błąd:', error);
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Dołącz do istniejącego pokoju
  const joinRoom = async (userData, roomId, password = null) => {
    setIsLoading(true);
    try {
      const nickname = userData.nickname?.trim() || `Użytkownik_${Date.now().toString().slice(-4)}`;
      const userId = getOrCreateUserId(nickname);
      
      const user = {
        id: userId,
        nickname: nickname,
        avatar: userData.avatar || '👤'
      };

      const response = await fetch('/api/chat/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join_room',
          data: {
            userId: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            roomId: roomId,
            password: password
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(user);
        setCurrentRoom(roomId);
        setMessages(result.messages || []);
        setUsers(result.users || []);
        startPolling(roomId);
        setIsConnected(true);
        return { success: true };
      } else {
        // Obsługa różnych kodów błędów
        const errorData = await response.json();
        let errorMessage = 'Błąd podczas dołączania do pokoju';
        
        if (response.status === 401) {
          errorMessage = 'Nieprawidłowe hasło';
        } else if (response.status === 404) {
          errorMessage = 'Pokój nie istnieje';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        console.error('Błąd dołączania:', errorMessage);
        setIsConnected(false);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Błąd:', error);
      setIsConnected(false);
      return { success: false, error: 'Błąd połączenia z serwerem' };
    } finally {
      setIsLoading(false);
    }
  };

  // Wyślij wiadomość do pokoju
  const sendMessage = async (message) => {
    if (!message?.trim() || !currentUser || !currentRoom) return;

    setIsLoading(true);
    try {
      // Sprawdź czy to komenda
      if (message.startsWith('/')) {
        const response = await fetch('/api/chat/private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'command',
            data: {
              userId: currentUser.id,
              roomId: currentRoom,
              command: message
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // Obsługa specjalnych przypadków jak /clear
          if (message.toLowerCase() === '/clear') {
            setMessages([]);
          } else {
            setMessages(prev => [...prev, ...(result.newMessages || [])]);
          }
        }
      } else {
        // Normalna wiadomość
        const response = await fetch('/api/chat/private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send_message',
            data: {
              userId: currentUser.id,
              nickname: currentUser.nickname,
              avatar: currentUser.avatar,
              roomId: currentRoom,
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

  // Opuść pokój
  const leaveRoom = async () => {
    if (currentUser && currentRoom) {
      try {
        await fetch('/api/chat/private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'leave_room',
            data: {
              userId: currentUser.id,
              nickname: currentUser.nickname,
              roomId: currentRoom
            }
          })
        });
      } catch (error) {
        console.error('Błąd podczas opuszczania pokoju:', error);
      }
    }

    stopPolling();
    setCurrentUser(null);
    setCurrentRoom(null);
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
      if (currentUser && currentRoom) {
        leaveRoom();
      }
    };
  }, []);

  return {
    // Stan
    isConnected,
    messages,
    users,
    currentUser,
    currentRoom,
    isLoading,
    
    // Akcje
    createRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    formatTime,
    
    // Informacje
    usersCount: users.length,
    messagesCount: messages.length
  };
}

export default usePrivateChat;
