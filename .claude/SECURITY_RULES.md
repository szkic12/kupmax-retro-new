# SECURITY RULES - Zasady bezpieczenstwa dla Claude

## ZAWSZE STOSUJ TE ZASADY PRZY PISANIU KODU API

### 1. AUTORYZACJA (AUTH)

**KAZDY endpoint POST/PUT/PATCH/DELETE musi miec autoryzacje!**

```typescript
// WZORZEC dla endpointow adminowych:
import { verifyAdminToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Admin auth required
    const isAdmin = await verifyAdminToken(request, body);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // ... reszta kodu
  }
}

// Dla DELETE bez body:
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    // ...
  }
}
```

### 2. RATE LIMITING

**Endpointy publiczne MUSZA miec rate limiting!**

```typescript
import { checkRateLimit, getClientIP } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: X requests per minute per IP
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`endpoint-name:${clientIP}`, 10, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele zapytan. Poczekaj chwile.' },
        { status: 429 }
      );
    }
    // ...
  }
}
```

**Limity:**
- AI endpoints (Anthropic/Gemini): 15-20 req/min
- Forum/guestbook posts: 3-5 req/min
- Voting (polls): 5 req/min
- Game scores: 10 req/min
- Chat messages: 10 req/min

### 3. IDOR PREVENTION

**Zawsze sprawdzaj ownership zasobow!**

```typescript
// ZLE - kazdy moze pobrac dowolne zamowienie
const order = await getOrder(id);
return NextResponse.json(order);

// DOBRZE - sprawdz czy user jest wlascicielem
const order = await getOrder(id);
const isOwner = order.buyerId === user.id || order.sellerId === user.id;
const isAdmin = user.role === 'ADMIN';

if (!isOwner && !isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
return NextResponse.json(order);
```

### 4. STATUS/ENUM WHITELIST

**Zawsze waliduj wartosci enumow!**

```typescript
// WZORZEC:
const ALLOWED_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

if (!ALLOWED_STATUSES.includes(status)) {
  return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
}
```

### 5. INPUT VALIDATION

**Zawsze waliduj i sanityzuj input!**

```typescript
// Ogranicz dlugosc
const title = body.title?.substring(0, 100);
const message = body.message?.substring(0, 5000);

// Sprawdz wymagane pola
if (!title || !message) {
  return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
}

// Sanityzuj - usun potencjalnie niebezpieczne znaki
const safeName = name.replace(/[<>]/g, '');
```

### 6. UPLOAD ENDPOINTS

**Uploady ZAWSZE wymagaja auth + walidacji pliku!**

```typescript
export async function POST(request: NextRequest) {
  // 1. Auth
  const isAdmin = await verifyAdminToken(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Walidacja typu pliku
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 3. Walidacja rozmiaru
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  // 4. Sprawdz path traversal
  if (file.name.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
}
```

## CHECKLIST PRZED MERGEM

- [ ] Czy wszystkie POST/PUT/PATCH/DELETE maja auth?
- [ ] Czy publiczne endpointy maja rate limiting?
- [ ] Czy pobieranie zasobow sprawdza ownership (IDOR)?
- [ ] Czy enumy sa walidowane przez whitelist?
- [ ] Czy input jest walidowany i sanityzowany?
- [ ] Czy uploady sprawdzaja typ i rozmiar pliku?
- [ ] Czy nie ma hardcodowanych sekretow w kodzie?

## TYPOWE BLEDY DO UNIKANIA

1. **Brak auth na DELETE** - nawet jesli body jest puste, sprawdz token z headera/cookie
2. **Rate limiting tylko na POST** - dodaj tez do innych metod jesli potrzeba
3. **Zaufanie frontendowi** - backend MUSI walidowac wszystko
4. **Logowanie sekretow** - nigdy nie loguj tokenow, hasel, kluczy API
5. **Hardcoded fallbacks** - unikaj `|| 'default-key'` dla sekretow

## PRZYKLAD KOMPLETNEGO ENDPOINTA

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, checkRateLimit, getClientIP } from '@/lib/admin-auth';

const ALLOWED_CATEGORIES = ['tech', 'news', 'general'];

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (dla publicznych) LUB Auth (dla adminowych)
    const body = await request.json();

    const isAdmin = await verifyAdminToken(request, body);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // 2. Walidacja inputu
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // 3. Whitelist dla enumow
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // 4. Sanityzacja
    const safeTitle = title.substring(0, 100);
    const safeContent = content.substring(0, 10000);

    // 5. Operacja na bazie
    const result = await createPost({
      title: safeTitle,
      content: safeContent,
      category: category || 'general'
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
