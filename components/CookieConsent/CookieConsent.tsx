'use client';

import { useState, useEffect } from 'react';
import styles from './CookieConsent.module.scss';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after 1 second
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(prev => ({ ...prev, ...saved }));
      } catch (e) {
        // Invalid JSON, show banner
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    setShowBanner(false);
    setShowSettings(false);

    // Reload page to apply cookie settings
    if (prefs.analytics || prefs.marketing) {
      window.location.reload();
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className={styles.overlay} onClick={() => setShowBanner(false)} />
      <div className={styles.banner}>
        <div className={styles.window}>
          {/* Title bar */}
          <div className={styles.titleBar}>
            <span className={styles.titleText}>🍪 Cookies - kupmax.pl</span>
            <button
              className={styles.closeButton}
              onClick={() => setShowBanner(false)}
              aria-label="Zamknij"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {!showSettings ? (
              <>
                <div className={styles.message}>
                  <h3>Witaj w kupmax.pl!</h3>
                  <p>
                    Korzystając z naszej strony, akceptujesz pliki cookie oraz nasz{' '}
                    <a href="/bulletin" className="font-bold underline">
                      Regulamin Serwisu (Terms of Service)
                    </a>.
                  </p>
                  <p>
                    Używamy plików cookie aby zapewnić prawidłowe działanie strony,
                    zapamiętać Twoje preferencje oraz analizować ruch.
                    Możesz zaakceptować wszystkie cookies lub dostosować ustawienia.
                  </p>
                  <p className={styles.privacy}>
                    Szczegóły znajdziesz w{' '}
                    <a href="/bulletin" target="_blank">
                      Regulaminie i Polityce Cookies
                    </a>
                    .
                  </p>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={acceptAll}
                  >
                    ✓ Akceptuj wszystkie
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={acceptNecessary}
                  >
                    Tylko niezbędne
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonSettings}`}
                    onClick={() => setShowSettings(true)}
                  >
                    ⚙ Ustawienia
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.settings}>
                  <h3>Ustawienia plików cookie</h3>
                  <p className={styles.settingsDesc}>
                    Wybierz kategorie plików cookie, które chcesz zaakceptować:
                  </p>

                  <div className={styles.cookieTypes}>
                    {/* Necessary */}
                    <div className={styles.cookieType}>
                      <div className={styles.cookieHeader}>
                        <input
                          type="checkbox"
                          id="necessary"
                          checked={true}
                          disabled
                          className={styles.checkbox}
                        />
                        <label htmlFor="necessary" className={styles.cookieLabel}>
                          <strong>Niezbędne</strong>
                          <span className={styles.required}>(Wymagane)</span>
                        </label>
                      </div>
                      <p className={styles.cookieDesc}>
                        Niezbędne do działania strony (sesje, bezpieczeństwo, podstawowa funkcjonalność).
                      </p>
                    </div>

                    {/* Functional */}
                    <div className={styles.cookieType}>
                      <div className={styles.cookieHeader}>
                        <input
                          type="checkbox"
                          id="functional"
                          checked={preferences.functional}
                          onChange={(e) =>
                            setPreferences({ ...preferences, functional: e.target.checked })
                          }
                          className={styles.checkbox}
                        />
                        <label htmlFor="functional" className={styles.cookieLabel}>
                          <strong>Funkcjonalne</strong>
                        </label>
                      </div>
                      <p className={styles.cookieDesc}>
                        Zapamiętują Twoje preferencje (język, motyw, ustawienia).
                      </p>
                    </div>

                    {/* Analytics */}
                    <div className={styles.cookieType}>
                      <div className={styles.cookieHeader}>
                        <input
                          type="checkbox"
                          id="analytics"
                          checked={preferences.analytics}
                          onChange={(e) =>
                            setPreferences({ ...preferences, analytics: e.target.checked })
                          }
                          className={styles.checkbox}
                        />
                        <label htmlFor="analytics" className={styles.cookieLabel}>
                          <strong>Analityczne</strong>
                        </label>
                      </div>
                      <p className={styles.cookieDesc}>
                        Pomagają zrozumieć jak korzystasz ze strony (anonimowe statystyki).
                      </p>
                    </div>

                    {/* Marketing */}
                    <div className={styles.cookieType}>
                      <div className={styles.cookieHeader}>
                        <input
                          type="checkbox"
                          id="marketing"
                          checked={preferences.marketing}
                          onChange={(e) =>
                            setPreferences({ ...preferences, marketing: e.target.checked })
                          }
                          className={styles.checkbox}
                        />
                        <label htmlFor="marketing" className={styles.cookieLabel}>
                          <strong>Marketingowe</strong>
                        </label>
                      </div>
                      <p className={styles.cookieDesc}>
                        Umożliwiają wyświetlanie spersonalizowanych reklam.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={saveCustom}
                  >
                    ✓ Zapisz ustawienia
                  </button>
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => setShowSettings(false)}
                  >
                    ← Wróć
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
