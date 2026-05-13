'use client';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

// Załaduj skrypt reCAPTCHA v3 jeśli jeszcze nie ma
export function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if (window.grecaptcha) return resolve();

    const existing = document.getElementById('recaptcha-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Pobierz token reCAPTCHA dla danej akcji
export async function getRecaptchaToken(action: string): Promise<string> {
  await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) return reject(new Error('reCAPTCHA not loaded'));

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    });
  });
}

// Rozszerz window o grecaptcha
declare global {
  interface Window {
    grecaptcha: any;
  }
}
