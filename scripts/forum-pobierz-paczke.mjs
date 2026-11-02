// Ściąga ostatnią paczkę do nauki z forum (K10) na laptopa: ~/Pulpit/forums/paczki/<data>/
// Użycie (w folderze kupmax-retro-new): node scripts/forum-pobierz-paczke.mjs
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '').trim()]));
const s3 = new S3Client({ region: env.AWS_REGION || 'eu-central-1', credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY } });
const Bucket = (env.AWS_S3_BUCKET_NAME || env.AWS_S3_BUCKET || 'kupmax-downloads').trim();
const get = async (Key) => (await s3.send(new GetObjectCommand({ Bucket, Key }))).Body.transformToString();

const m = JSON.parse(await get('forum/export/latest.json'));
const out = join(homedir(), 'Pulpit', 'forums', 'paczki', m.date);
let n = 0;
for (const [pack, files] of Object.entries(m.counts)) {
  for (const [f, count] of Object.entries(files)) {
    if (!count) continue;
    const path = join(out, pack, `${f}.jsonl`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, await get(`forum/export/${m.date}/${pack}/${f}.jsonl`));
    console.log(`✅ ${pack}/${f}.jsonl: ${count}`);
    n += count;
  }
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'manifest.json'), JSON.stringify(m, null, 2));
console.log(n ? `\n📦 ${n} przykładów w ${out}` : `\nPaczka z ${m.date} jest jeszcze pusta: nic nie przeszło sita od ludzi ze zgodą.`);
