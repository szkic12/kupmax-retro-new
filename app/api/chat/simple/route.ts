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

interface ChatData {
  messages: ChatMessage[];
  users: ChatUser[];
  bannedUsers: string[];
}

const DEFAULT_CHAT_DATA: ChatData = {
  messages: [],
  users: [],
  bannedUsers: []
};

// Pobierz dane czatu
async function getChatData(): Promise<ChatData> {
  const result = await s3Service.loadJsonData('chat-simple', DEFAULT_CHAT_DATA);
  return result.data || DEFAULT_CHAT_DATA;
}

// Zapisz dane czatu
async function saveChatData(data: ChatData) {
  return await s3Service.saveJsonData('chat-simple', data);
}

// Wyczyść nieaktywnych użytkowników (> 5 minut)
function cleanupInactiveUsers(data: ChatData): ChatData {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const activeUsers = data.users.filter(user => user.lastActivity > fiveMinutesAgo);

  // Jeśli usunięto użytkowników, dodaj wiadomości systemowe
  const removedUsers = data.users.filter(user => user.lastActivity <= fiveMinutesAgo);

  for (const user of removedUsers) {
    data.messages.push({
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system',
      nickname: '📢 System',
      avatar: '📢',
      message: `${user.nickname} opuścił/a czat (timeout)`,
      timestamp: new Date().toISOString(),
      type: 'system'
    });
  }

  data.users = activeUsers;
  return data;
}

// Ogranicz liczbę wiadomości (max 100)
function limitMessages(data: ChatData): ChatData {
  if (data.messages.length > 100) {
    data.messages = data.messages.slice(-100);
  }
  return data;
}

// GET - pobierz wiadomości i użytkowników
export async function GET(req: NextRequest) {
  try {
    let data = await getChatData();

    // Wyczyść nieaktywnych użytkowników
    data = cleanupInactiveUsers(data);
    data = limitMessages(data);

    // Zapisz (cleanup)
    await saveChatData(data);

    return NextResponse.json(
      {
        success: true,
        messages: data.messages,
        users: data.users
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - akcje czatu (join, leave, send, command)
export async function POST(req: NextRequest) {
  try {
    const { action, data: requestData } = await req.json();
    let chatData = await getChatData();

    // Wyczyść nieaktywnych
    chatData = cleanupInactiveUsers(chatData);

    switch (action) {
      case 'join': {
        const { user } = requestData;

        // Sprawdź czy nie jest zbanowany
        if (chatData.bannedUsers.includes(user.id)) {
          return NextResponse.json(
            { success: false, error: 'Jesteś zbanowany na tym czacie' },
            { status: 403 }
          );
        }

        // Dodaj użytkownika
        const newUser: ChatUser = {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar || '👤',
          joinTime: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };

        // Sprawdź czy już jest
        const existingIndex = chatData.users.findIndex(u => u.id === user.id);
        if (existingIndex >= 0) {
          chatData.users[existingIndex] = newUser;
        } else {
          chatData.users.push(newUser);

          // Dodaj wiadomość systemową
          chatData.messages.push({
            id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `${user.nickname} dołączył/a do czatu`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        }

        chatData = limitMessages(chatData);
        await saveChatData(chatData);

        return NextResponse.json({
          success: true,
          messages: chatData.messages,
          users: chatData.users
        });
      }

      case 'leave': {
        const { userId } = requestData;

        // Znajdź użytkownika
        const user = chatData.users.find(u => u.id === userId);

        if (user) {
          // Usuń użytkownika
          chatData.users = chatData.users.filter(u => u.id !== userId);

          // Dodaj wiadomość systemową
          chatData.messages.push({
            id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `${user.nickname} opuścił/a czat`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        }

        chatData = limitMessages(chatData);
        await saveChatData(chatData);

        return NextResponse.json({ success: true });
      }

      case 'send': {
        const { userId, nickname, avatar, message } = requestData;

        // Sprawdź czy użytkownik jest aktywny
        const userIndex = chatData.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          chatData.users[userIndex].lastActivity = new Date().toISOString();
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

        chatData.messages.push(newMessage);
        chatData = limitMessages(chatData);
        await saveChatData(chatData);

        return NextResponse.json({
          success: true,
          message: newMessage
        });
      }

      case 'command': {
        const { userId, command } = requestData;

        // Zaktualizuj aktywność
        const userIndex = chatData.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          chatData.users[userIndex].lastActivity = new Date().toISOString();
        }

        const user = chatData.users.find(u => u.id === userId);
        const newMessages: ChatMessage[] = [];

        if (command.toLowerCase() === '/help') {
          newMessages.push({
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: '📋 Dostępne komendy:\n/help - ta pomoc\n/users - lista użytkowników\n/clear - wyczyść swój widok\n/me [akcja] - wykonaj akcję',
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        } else if (command.toLowerCase() === '/users') {
          const userList = chatData.users.map(u => `${u.avatar} ${u.nickname}`).join(', ');
          newMessages.push({
            id: `sys_${Date.now()}`,
            userId: 'system',
            nickname: '📢 System',
            avatar: '📢',
            message: `👥 Online (${chatData.users.length}): ${userList}`,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
        } else if (command.toLowerCase().startsWith('/me ')) {
          const action = command.substring(4);
          newMessages.push({
            id: `act_${Date.now()}`,
            userId: userId,
            nickname: user?.nickname || 'Ktoś',
            avatar: user?.avatar || '👤',
            message: `* ${user?.nickname || 'Ktoś'} ${action}`,
            timestamp: new Date().toISOString(),
            type: 'action'
          });
          chatData.messages.push(newMessages[0]);
        }

        chatData = limitMessages(chatData);
        await saveChatData(chatData);

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
    console.error('Error in chat action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - usuń wiadomość (własną lub admin może każdą)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId'); // ID użytkownika który chce usunąć

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID required' },
        { status: 400 }
      );
    }

    let chatData = await getChatData();

    // Znajdź wiadomość
    const messageIndex = chatData.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = chatData.messages[messageIndex];

    // Sprawdź czy użytkownik może usunąć (własna wiadomość lub admin)
    // Admin nie musi podawać userId
    if (userId && message.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Możesz usunąć tylko własne wiadomości' },
        { status: 403 }
      );
    }

    chatData.messages.splice(messageIndex, 1);
    await saveChatData(chatData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - edytuj wiadomość (własną)
export async function PUT(req: NextRequest) {
  try {
    const { messageId, userId, newMessage } = await req.json();

    if (!messageId || !userId || !newMessage) {
      return NextResponse.json(
        { success: false, error: 'Message ID, User ID and new message required' },
        { status: 400 }
      );
    }

    let chatData = await getChatData();

    // Znajdź wiadomość
    const messageIndex = chatData.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = chatData.messages[messageIndex];

    // Sprawdź czy użytkownik może edytować (tylko własne wiadomości)
    if (message.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Możesz edytować tylko własne wiadomości' },
        { status: 403 }
      );
    }

    // Nie można edytować wiadomości systemowych
    if (message.type === 'system') {
      return NextResponse.json(
        { success: false, error: 'Nie można edytować wiadomości systemowych' },
        { status: 403 }
      );
    }

    // Zaktualizuj wiadomość
    chatData.messages[messageIndex].message = newMessage.substring(0, 280);
    chatData.messages[messageIndex].timestamp = new Date().toISOString() + ' (edytowano)';

    await saveChatData(chatData);

    return NextResponse.json({
      success: true,
      message: chatData.messages[messageIndex]
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - banuj użytkownika (tylko admin)
export async function PATCH(req: NextRequest) {
  try {
    const { userId, ban } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    let chatData = await getChatData();

    if (ban) {
      // Dodaj do zbanowanych
      if (!chatData.bannedUsers.includes(userId)) {
        chatData.bannedUsers.push(userId);
      }

      // Usuń z aktywnych użytkowników
      const user = chatData.users.find(u => u.id === userId);
      chatData.users = chatData.users.filter(u => u.id !== userId);

      if (user) {
        chatData.messages.push({
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
      chatData.bannedUsers = chatData.bannedUsers.filter(id => id !== userId);
    }

    await saveChatData(chatData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
