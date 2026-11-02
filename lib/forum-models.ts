// Modele 3D na forum: plik .glb w kubełku Supabase „forum-3d” (folder właściciela) + pinezki z opisem i głosem.
// Model leci z przeglądarki prosto do Supabase (podpisany link do wgrania), bo Vercel przyjmuje najwyżej 4,5 MB.
import { randomUUID } from 'crypto';
import { forumDb } from '@/lib/forum-db';
import { sanitizeInput } from '@/lib/sanitize';
import { ownsKey, publicVoiceUrl } from '@/lib/forum-voice';

export const MODEL_BUCKET = 'forum-3d';
export const MAX_PINS = 20;
const PIN_TEXT = 400;
const UUID = '[0-9a-f-]{36}';

export const isModelKey = (key: string) => typeof key === 'string' && new RegExp(`^${UUID}/${UUID}\\.glb$`).test(key);
const ownsModel = (userId: string, key: string) => typeof key === 'string' && new RegExp(`^${userId}/${UUID}\\.glb$`).test(key);

export async function createModelUpload(userId: string) {
  const key = `${userId}/${randomUUID()}.glb`;
  const { data, error } = await forumDb.storage.from(MODEL_BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw error || new Error('brak linku');
  return { key, token: data.token };
}

export async function signedModelUrl(key: string) {
  const { data, error } = await forumDb.storage.from(MODEL_BUCKET).createSignedUrl(key, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

const vec = (v: unknown) =>
  Array.isArray(v) && v.length === 3 && v.every((x) => Number.isFinite(x)) ? (v as number[]).map((x) => Math.round(x * 1e5) / 1e5) : null;

export type ModelRow = { key: string; name: string; size: number; pins: { p: number[]; n: number[]; text: string; voice: string | null }[] };

// Z formularza: własny, naprawdę wgrany model; pinezki oczyszczone
export async function modelField(userId: string, input: any): Promise<ModelRow | null | { error: string }> {
  if (input == null) return null;
  if (!ownsModel(userId, input.key)) return { error: 'Model 3D się nie wgrał. Dodaj go jeszcze raz.' };
  if (!(await signedModelUrl(input.key))) return { error: 'Model 3D się nie wgrał. Dodaj go jeszcze raz.' };
  const raw = Array.isArray(input.pins) ? input.pins : [];
  if (raw.length > MAX_PINS) return { error: `Najwyżej ${MAX_PINS} pinezek.` };
  const pins = [];
  for (const pin of raw) {
    const p = vec(pin?.p);
    const n = vec(pin?.n) || [0, 1, 0];
    const text = sanitizeInput(String(pin?.text || ''), PIN_TEXT).trim();
    const voice = pin?.voice && ownsKey(userId, pin.voice) ? pin.voice : null;
    if (!p || (!text && !voice)) continue; // pusta pinezka nic nie mówi
    pins.push({ p, n, text, voice });
  }
  return {
    key: input.key,
    name: sanitizeInput(String(input.name || 'model.glb'), 80),
    size: Math.max(0, Math.round(Number(input.size) || 0)),
    pins,
  };
}

// Dla przeglądarki: adresy zamiast kluczy
export function publicModel(m: ModelRow | null) {
  if (!m?.key) return null;
  return {
    url: `/api/forum/model?k=${encodeURIComponent(m.key)}`,
    name: m.name,
    size: m.size,
    pins: (m.pins || []).map((pin) => ({ p: pin.p, n: pin.n, text: pin.text, voiceUrl: publicVoiceUrl(pin.voice) })),
  };
}
