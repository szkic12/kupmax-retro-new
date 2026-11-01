// K1: przenosi stare forum (data/forum.json na S3) do tabel forum_* w Supabase.
// Uruchom po FORUM-K1.sql:  node --env-file=.env.local scripts/forum-przenies-z-s3.mjs
// Można puścić drugi raz — legacy_id pilnuje, żeby nic się nie zdublowało. Pliku na S3 nie rusza.
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// stare kategorie → nowe
const MAPA = { '1': 'kupmax', '2': 'retro', '3': 'komputery', '4': 'o-wszystkim' };

const s3 = new S3Client({ region: process.env.AWS_REGION.trim() });
const Bucket = (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const r = await s3.send(new GetObjectCommand({ Bucket, Key: 'data/forum.json' }));
const stare = JSON.parse(await r.Body.transformToString());

const watki = (stare.threads || []).map((t) => ({
  legacy_id: String(t.id),
  category_id: MAPA[String(t.categoryId)] || 'o-wszystkim',
  author_nick: t.author?.nickname || 'Anonim',
  author_avatar: t.author?.avatar || '👤',
  title: t.title,
  body: t.message || t.content || '',
  is_pinned: !!(t.isSticky || t.pinned),
  views: t.views || 0,
  created_at: t.date,
  last_activity: t.lastActivity || t.date,
}));
const { data: wstawione, error: e1 } = await db
  .from('forum_threads').upsert(watki, { onConflict: 'legacy_id' }).select('id, legacy_id');
if (e1) throw e1;

const idWatku = Object.fromEntries(wstawione.map((w) => [w.legacy_id, w.id]));
const posty = (stare.posts || []).filter((p) => idWatku[String(p.threadId)]).map((p) => ({
  legacy_id: String(p.id),
  thread_id: idWatku[String(p.threadId)],
  author_nick: p.author?.nickname || 'Anonim',
  author_avatar: p.author?.avatar || '👤',
  body: p.message || p.content || '',
  created_at: p.date,
}));
if (posty.length) {
  const { error: e2 } = await db.from('forum_posts').upsert(posty, { onConflict: 'legacy_id' });
  if (e2) throw e2;
}
console.log(`✅ przeniesione: ${watki.length} wątków, ${posty.length} odpowiedzi`);
