const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5; // poniżej = bot

export async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
  if (!token) return { success: false, error: 'Brak tokenu reCAPTCHA' };

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { success: false, error: 'Brak klucza reCAPTCHA na serwerze' };

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
    });

    const data = await res.json();

    if (!data.success) return { success: false, error: 'reCAPTCHA verification failed' };
    if (data.score < MIN_SCORE) return { success: false, score: data.score, error: `Score za niski: ${data.score}` };

    return { success: true, score: data.score };
  } catch (err) {
    return { success: false, error: 'Błąd połączenia z reCAPTCHA' };
  }
}
