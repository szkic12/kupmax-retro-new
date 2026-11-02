// Zdjęcia na forum: do 5 przy wpisie, w S3 w folderze właściciela, pokazywane przez podpisany link.
// Przeglądarka sama zmniejsza zdjęcie i zapisuje je od nowa, więc znika z niego np. lokalizacja GPS.
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { client, bucket } from '@/lib/forum-voice';

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // limit Vercela 4,5 MB na zapytanie
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
export const isPhotoType = (t: string) => t in EXT;

export async function storePhoto(userId: string, buf: Buffer, type: string) {
  const key = `forum/photo/${userId}/${randomUUID()}.${EXT[type]}`;
  await client().send(new PutObjectCommand({
    Bucket: bucket(), Key: key, Body: buf, ContentType: type, CacheControl: 'public, max-age=31536000, immutable',
  }));
  return key;
}

const KEY = '[0-9a-f-]{36}/[0-9a-f-]{36}\\.(webp|jpg|png)';
export const isPhotoKey = (key: string) => typeof key === 'string' && new RegExp(`^forum/photo/${KEY}$`).test(key);
const ownsPhoto = (userId: string, key: string) =>
  typeof key === 'string' && new RegExp(`^forum/photo/${userId}/[0-9a-f-]{36}\\.(webp|jpg|png)$`).test(key);

export async function signedPhotoUrl(key: string) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 3600 });
}

export const publicPhotoUrl = (key: string) => `/api/forum/photo?k=${encodeURIComponent(key)}`;

// Z formularza: tylko własne zdjęcia, bez powtórek, najwyżej 5
export function photoKeys(userId: string, input: unknown): string[] | { error: string } {
  if (input == null) return [];
  if (!Array.isArray(input)) return { error: 'Złe zdjęcia.' };
  const keys = [...new Set(input)];
  if (keys.length > MAX_PHOTOS) return { error: `Najwyżej ${MAX_PHOTOS} zdjęć.` };
  if (!keys.every((k) => ownsPhoto(userId, k as string))) return { error: 'Któreś zdjęcie się nie wgrało. Dodaj je jeszcze raz.' };
  return keys as string[];
}
