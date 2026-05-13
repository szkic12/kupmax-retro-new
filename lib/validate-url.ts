const ALLOWED_HOSTS = [
  'kupmax-downloads.s3.eu-central-1.amazonaws.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'ai.kupmax.pl',
  'kupmax.pl',
  'www.kupmax.pl',
];

export function validateUrl(urlString: string): boolean {
  if (!urlString) return true; // puste = ok (opcjonalne pole)
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

export function validateUrls(urls: string[]): boolean {
  return urls.every(u => validateUrl(u));
}
