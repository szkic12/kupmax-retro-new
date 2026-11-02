// Głos na forum: nagrania w S3 (prywatny kubeł, odsłuch przez podpisany link),
// zamiana mowy na tekst i lektor (OpenAI). Surowe nagranie w trybie „lektor” i „tekst” nie jest zapisywane.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const VOICE_MODES = ['wlasny', 'zmieniony', 'lektor', 'tekst'] as const;
export type VoiceMode = (typeof VOICE_MODES)[number];
export const MAX_VOICE_SECONDS = 600;
export const MAX_BODY = 12000; // 10 minut mowy to ok. 9 tys. znaków

const bucket = () => (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
let s3: S3Client | null = null;
function client() {
  if (!s3) {
    s3 = new S3Client({
      region: (process.env.AWS_REGION || '').trim(),
      credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
      },
    });
  }
  return s3;
}

const EXT: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/aac': 'aac' };
export const baseType = (t: string) => (t || '').split(';')[0].trim();
export const isAudioType = (t: string) => baseType(t) in EXT;

// Klucz zawsze w folderze właściciela, żeby nikt nie podpiął cudzego nagrania
export async function storeAudio(userId: string, buf: Buffer, type: string) {
  const key = `forum/voice/${userId}/${randomUUID()}.${EXT[baseType(type)] || 'webm'}`;
  await client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: buf, ContentType: baseType(type) }));
  return key;
}

export const ownsKey = (userId: string, key: string) =>
  typeof key === 'string' && new RegExp(`^forum/voice/${userId}/[0-9a-f-]{36}\\.(webm|ogg|m4a|mp3|aac)$`).test(key);

export const isVoiceKey = (key: string) =>
  typeof key === 'string' && /^forum\/voice\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3|aac)$/.test(key);

export async function signedVoiceUrl(key: string) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 3600 });
}

// Adres, który widzi przeglądarka (nasz serwer przekierowuje na podpisany link)
export const publicVoiceUrl = (key: string | null) => (key ? `/api/forum/voice?k=${encodeURIComponent(key)}` : null);

export async function transcribe(buf: Buffer, type: string) {
  const form = new FormData();
  const ext = EXT[baseType(type)] || 'webm';
  form.append('file', new Blob([new Uint8Array(buf)], { type: baseType(type) }), `nagranie.${ext}`);
  form.append('model', 'gpt-4o-mini-transcribe');
  form.append('language', 'pl');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`transkrypcja ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return String(json.text || '').trim();
}

// Lektor czyta poprawiony tekst; dłuższe kawałki składamy z kilku plików mp3 (ramki mp3 da się sklejać)
export async function lektor(userId: string, text: string) {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length) {
    if (rest.length <= 4000) { parts.push(rest); break; }
    let cut = rest.lastIndexOf('. ', 4000);
    if (cut < 1000) cut = rest.lastIndexOf(' ', 4000);
    if (cut < 1000) cut = 4000;
    parts.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1).trim();
  }
  const chunks: Buffer[] = [];
  for (const input of parts) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'onyx', input, response_format: 'mp3' }),
    });
    if (!res.ok) throw new Error(`lektor ${res.status}: ${(await res.text()).slice(0, 200)}`);
    chunks.push(Buffer.from(await res.arrayBuffer()));
  }
  return storeAudio(userId, Buffer.concat(chunks), 'audio/mpeg');
}

// Wspólne dla wątku i odpowiedzi: sprawdza, co przyszło z formularza, i zwraca pola do bazy
export async function voiceFields(
  userId: string,
  input: { voiceKey?: string; voiceMode?: string; voiceSeconds?: number },
  body: string
): Promise<{ voice_url: string | null; voice_mode: VoiceMode; voice_seconds: number | null } | { error: string }> {
  const mode = (VOICE_MODES as readonly string[]).includes(input.voiceMode || '') ? (input.voiceMode as VoiceMode) : 'tekst';
  const seconds = Math.max(0, Math.min(MAX_VOICE_SECONDS, Math.round(Number(input.voiceSeconds) || 0))) || null;

  if (mode === 'tekst') return { voice_url: null, voice_mode: 'tekst', voice_seconds: null };
  if (mode === 'lektor') {
    try {
      return { voice_url: await lektor(userId, body), voice_mode: 'lektor', voice_seconds: seconds };
    } catch {
      return { error: 'Lektor chwilowo nie działa. Wyślij jako tekst albo spróbuj za chwilę.' };
    }
  }
  if (!input.voiceKey || !ownsKey(userId, input.voiceKey)) return { error: 'Brak nagrania. Nagraj jeszcze raz.' };
  return { voice_url: input.voiceKey, voice_mode: mode, voice_seconds: seconds };
}
