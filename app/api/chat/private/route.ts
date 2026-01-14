import { NextRequest, NextResponse } from 'next/server';
import s3Service from '../../../../lib/aws-s3.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ChatUser {
  id: string;
  nickname: string;
  avatar: string;
  joinTime: string;
  lastActivity: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'action';
}

interface PrivateRoom {
  id: string;
  password: string;
  creator: string;
  createdAt: string;
  messages: ChatMessage[];
  users: ChatUser[];
  bannedUsers: string[];
}

interface PrivateChatData {
  rooms: PrivateRoom[];
}

const DEFAULT_DATA: PrivateChatData = {
  rooms: []
};

// Pobierz dane prywatnych czatów
async function getPrivateChatData(): Promise<PrivateChatData> {
  const result = await s3Service.loadJsonData('chat-private', DEFAULT_DATA);
  return result.data || DEFAULT_DATA;
}

// Zapisz dane prywatnych czatów
async function savePrivateChatData(data: PrivateChatData) {
  return await s3Service.saveJsonData('chat-private', data);
}

// Generuj ID pokoju (6 znaków)
function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Wyczyść nieaktywnych użytkowników w pokoju (> 10 minut)
function cleanupInactiveUsers(room: PrivateRoom): PrivateRoom {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const activeUsers = room.users.filter(user => user.lastActivity > tenMinutesAgo);

  // Jeśli usunięto użytkowników, dodaj wiadomości systemowe
  const removedUsers = room.users.filter(user => user.lastActivity <= tenMinutesAgo);

  for (const user of removedUsers) {
    room.messages.push({
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system',
      nickname: '📢 System',
      avatar: '📢',
      message: `${user.nickname} opuścił/a pokój (timeout)`,
      timestamp: new Date().toISOString(),
      type: 'system'
    });
  }

  room.users = activeUsers;
  return room;
}

// Wyczyść stare pokoje (> 24 godziny bez aktywności)
function cleanupOldRooms(data: PrivateChatData): PrivateChatData {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  data.rooms = data.rooms.filter(room => {
    // Zachowaj pokój jeśli ma aktywnych użytkowników
    if (room.users.length > 0) return true;

    // Zachowaj pokój jeśli ma ostatnią wiadomość w ciągu 24h
    const lastMessage = room.messages[room.messages.length - 1];
    if (lastMessage && lastMessage.timestamp > oneDayAgo) return true;

    // Usuń stary pokój
    return false;
  });

  return data;
}

// Ogranicz liczbę wiadomości w pokoju (max 200)
function limitMessages(room: PrivateRoom): PrivateRoom {
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-200);
  }
  return room;
}

// GET - pobierz dane pokoju
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'Room ID required' },
        { status: 400 }
      );
    }

    let data = await getPrivateChatData();

    // Znajdź pokój
    let room = data.rooms.find(r => r.id === roomId.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Wyczyść nieaktywnych
    room = cleanupInactiveUsers(room);
    room = limitMessages(room);

    // Zapisz zmiany
    await savePrivateChatData(data);

    return NextResponse.json(
      {
        success: true,
        messages: room.messages,
        users: room.users,
        roomId: room.id
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Error fetching private room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - akcje prywatnego czatu
export async function POST(req: NextRequest) {
  try {
    const { action, data: requestData } = await req.json();
    let chatData = await getPrivateChatData();

    // Wyczyść stare pokoje
    chatData = cleanupOldRooms(chatData);

    switch (action) {
      case 'create_room': {
        const { userId, nickname, avatar, password, creator } = requestData;

        // Generuj unikalne ID
        let roomId = generateRoomId();
        while (chatData.rooms.some(r => r.id === roomId)) {
          roomId = generateRoomId();
        }

        // Utwórz nowy pokój
        const newRoom: PrivateRoom = {
          id: roomId,
          password: password || '',
          creator: creator || nickname,
          createdAt: new Date().toISOString(),
          messages: [{
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `Pokój "${roomId}" utworzony przez ${creator || nickname}. Podziel się ID z znajomymi!`,
            timestamp: new Date().toISOString(),
            type: 'system'
          }],
          users: [{
            id: userId,
            nickname,
            avatar: avatar || '👤',
            joinTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          }],
          bannedUsers: []
        };

        chatData.rooms.push(newRoom);
        await savePrivateChatData(chatData);

        return NextResponse.json({
          success: true,
          roomId,
          messages: newRoom.messages,
          users: newRoom.users
        });
      }

      case 'join_room': {
        const { userId, nickname, avatar, roomId, password } = requestData;

        // Znajdź pokój
        const roomIndex = chatData.rooms.findIndex(r => r.id === roomId.toUpperCase());
        if (roomIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Pokój nie istnieje' },
            { status: 404 }
          );
        }

        let room = chatData.rooms[roomIndex];

        // Sprawdź hasło
        if (room.password && room.password !== password) {
          return NextResponse.json(
            { success: false, error: 'Nieprawidłowe hasło' },
            { status: 401 }
          );
        }

        // Sprawdź czy nie jest zbanowany
        if (room.bannedUsers.includes(userId)) {
          return NextResponse.json(
            { success: false, error: 'Jesteś zbanowany w tym pokoju' },
            { status: 403 }
          );
        }

        // Dodaj lub zaktualizuj użytkownika
        const newUser: ChatUser = {
          id: userId,
          nickname,
          avatar: avatar || '👤',
          joinTime: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };

        const existingIndex = room.users.findIndex(u => u.id === userId);
        if (existingIndex >= 0) {
          room.users[existingIndex] = newUser;
        } else {
          room.users.push(newUser);

          // Dodaj wiadomość systemową
          room.messages.push({
            id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `${nickname} dołączył/a do pokoju`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        }

        room = cleanupInactiveUsers(room);
        room = limitMessages(room);

        chatData.rooms[roomIndex] = room;
        await savePrivateChatData(chatData);

        return NextResponse.json({
          success: true,
          messages: room.messages,
          users: room.users
        });
      }

      case 'leave_room': {
        const { userId, nickname, roomId } = requestData;

        const roomIndex = chatData.rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
          return NextResponse.json({ success: true });
        }

        let room = chatData.rooms[roomIndex];

        // Usuń użytkownika
        room.users = room.users.filter(u => u.id !== userId);

        // Dodaj wiadomość systemową
        room.messages.push({
          id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: 'system',
          nickname: '📢 System',
          avatar: '📢',
          message: `${nickname} opuścił/a pokój`,
          timestamp: new Date().toISOString(),
          type: 'system'
        });

        room = limitMessages(room);
        chatData.rooms[roomIndex] = room;

        await savePrivateChatData(chatData);

        return NextResponse.json({ success: true });
      }

      case 'send_message': {
        const { userId, nickname, avatar, roomId, message } = requestData;

        const roomIndex = chatData.rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Room not found' },
            { status: 404 }
          );
        }

        let room = chatData.rooms[roomIndex];

        // Zaktualizuj aktywność użytkownika
        const userIndex = room.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          room.users[userIndex].lastActivity = new Date().toISOString();
        }

        // Dodaj wiadomość
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          nickname,
          avatar: avatar || '👤',
          message: message.substring(0, 280),
          timestamp: new Date().toISOString(),
          type: 'message'
        };

        room.messages.push(newMessage);
        room = limitMessages(room);

        chatData.rooms[roomIndex] = room;
        await savePrivateChatData(chatData);

        return NextResponse.json({
          success: true,
          message: newMessage
        });
      }

      case 'command': {
        const { userId, roomId, command } = requestData;

        const roomIndex = chatData.rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Room not found' },
            { status: 404 }
          );
        }

        let room = chatData.rooms[roomIndex];

        // Zaktualizuj aktywność
        const userIndex = room.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          room.users[userIndex].lastActivity = new Date().toISOString();
        }

        const user = room.users.find(u => u.id === userId);
        const newMessages: ChatMessage[] = [];

        if (command.toLowerCase() === '/help') {
          newMessages.push({
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: '📋 Komendy:\n/help - pomoc\n/users - lista użytkowników\n/clear - wyczyść widok\n/me [akcja] - wykonaj akcję\n/roomid - pokaż ID pokoju',
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        } else if (command.toLowerCase() === '/users') {
          const userList = room.users.map(u => `${u.avatar} ${u.nickname}`).join(', ');
          newMessages.push({
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `👥 W pokoju (${room.users.length}): ${userList}`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        } else if (command.toLowerCase() === '/roomid') {
          newMessages.push({
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `🔑 ID pokoju: ${room.id}`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        } else if (command.toLowerCase().startsWith('/me ')) {
          const action = command.substring(4);
          const actionMsg: ChatMessage = {
            id: `act_${Date.now()}`,
            userId: userId,
            nickname: user?.nickname || 'Ktoś',
            avatar: user?.avatar || '👤',
            message: `* ${user?.nickname || 'Ktoś'} ${action}`,
            timestamp: new Date().toISOString(),
            type: 'action'
          };
          newMessages.push(actionMsg);
          room.messages.push(actionMsg);
        }

        room = limitMessages(room);
        chatData.rooms[roomIndex] = room;
        await savePrivateChatData(chatData);

        return NextResponse.json({
          success: true,
          newMessages
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in private chat action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - usuń wiadomość (tylko admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const roomId = searchParams.get('roomId');

    if (!messageId || !roomId) {
      return NextResponse.json(
        { success: false, error: 'Message ID and Room ID required' },
        { status: 400 }
      );
    }

    let chatData = await getPrivateChatData();

    const roomIndex = chatData.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const room = chatData.rooms[roomIndex];

    // Znajdź i usuń wiadomość
    const messageIndex = room.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    room.messages.splice(messageIndex, 1);
    await savePrivateChatData(chatData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - banuj użytkownika (tylko admin)
export async function PATCH(req: NextRequest) {
  try {
    const { userId, roomId, ban } = await req.json();

    if (!userId || !roomId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Room ID required' },
        { status: 400 }
      );
    }

    let chatData = await getPrivateChatData();

    const roomIndex = chatData.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const room = chatData.rooms[roomIndex];

    if (ban) {
      // Dodaj do zbanowanych
      if (!room.bannedUsers.includes(userId)) {
        room.bannedUsers.push(userId);
      }

      // Usuń z aktywnych użytkowników
      const user = room.users.find(u => u.id === userId);
      room.users = room.users.filter(u => u.id !== userId);

      if (user) {
        room.messages.push({
          id: `sys_${Date.now()}`,
          userId: 'system',
          nickname: '📢 System',
          avatar: '📢',
          message: `${user.nickname} został/a zbanowany/a`,
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }
    } else {
      // Odbanuj
      room.bannedUsers = room.bannedUsers.filter(id => id !== userId);
    }

    await savePrivateChatData(chatData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
