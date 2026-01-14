'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LegalNoticeBoard = dynamic(() => import('../../components/LegalNoticeBoard'), {
  ssr: false,
});

/**
 * /bulletin - Legal Document Style
 * Times New Roman, official stamps, seals, paper texture
 */
export default function BulletinPage() {
  const [accepted, setAccepted] = useState(false);

  const currentDate = new Date().toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        background: `
          linear-gradient(180deg, #d4c4a8 0%, #e8dcc8 50%, #d4c4a8 100%)
        `,
      }}
    >
      {/* Paper document container */}
      <div
        className="max-w-4xl mx-auto"
        style={{
          background: '#fdfbf7',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)',
          borderRadius: '2px',
        }}
      >
        {/* Header with seal */}
        <header
          className="relative py-8 px-8 text-center"
          style={{
            borderBottom: '3px double #8b7355',
          }}
        >
          {/* Official seal */}
          <div className="absolute top-4 left-4 w-20 h-20 opacity-30">
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                border: '3px solid #8b0000',
                background: 'radial-gradient(circle, transparent 40%, rgba(139,0,0,0.1) 100%)',
              }}
            >
              <span className="text-3xl">⚖️</span>
            </div>
          </div>

          {/* Stamp */}
          <div
            className="absolute top-4 right-4 px-4 py-2 transform rotate-[-15deg]"
            style={{
              border: '3px solid #8b0000',
              color: '#8b0000',
              fontWeight: 'bold',
              fontFamily: 'serif',
              opacity: 0.7,
            }}
          >
            DOKUMENT<br />OFICJALNY
          </div>

          <div className="text-6xl mb-4">📜</div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{
              fontFamily: 'Times New Roman, Georgia, serif',
              color: '#1a1a1a',
              letterSpacing: '0.05em',
            }}
          >
            REGULAMIN SERWISU
          </h1>

          <h2
            className="text-xl mb-4"
            style={{
              fontFamily: 'Times New Roman, Georgia, serif',
              color: '#4a4a4a',
              fontStyle: 'italic',
            }}
          >
            KUPMAX RETRO
          </h2>

          <div
            className="inline-block px-6 py-2 rounded"
            style={{
              background: '#f5f0e6',
              border: '1px solid #8b7355',
              fontFamily: 'Times New Roman, Georgia, serif',
            }}
          >
            <p className="text-sm text-gray-600">
              Obowiązuje od dnia: <strong>{currentDate}</strong>
            </p>
          </div>
        </header>

        {/* Document body */}
        <main className="p-8">
          {/* Preamble */}
          <section
            className="mb-8 p-6 rounded"
            style={{
              background: '#faf8f4',
              border: '1px solid #d4c4a8',
            }}
          >
            <h3
              className="text-lg font-bold mb-4 text-center"
              style={{ fontFamily: 'Times New Roman, Georgia, serif' }}
            >
              PREAMBUŁA
            </h3>
            <p
              className="text-justify leading-relaxed"
              style={{ fontFamily: 'Times New Roman, Georgia, serif', textIndent: '2em' }}
            >
              Niniejszy Regulamin określa zasady korzystania z serwisu internetowego KUPMAX RETRO,
              dostępnego pod adresem kupmax-retro-new.vercel.app. Korzystanie z serwisu oznacza
              akceptację wszystkich postanowień niniejszego Regulaminu. Prosimy o dokładne
              zapoznanie się z jego treścią przed rozpoczęciem korzystania z usług.
            </p>
          </section>

          {/* Actual legal component */}
          <div
            className="mb-8 rounded overflow-hidden"
            style={{
              border: '2px solid #8b7355',
            }}
          >
            <div
              className="py-3 px-4 text-center font-bold"
              style={{
                background: '#8b7355',
                color: '#fff',
                fontFamily: 'Times New Roman, Georgia, serif',
              }}
            >
              TREŚĆ REGULAMINU
            </div>
            <div className="p-6" style={{ background: '#fffef9' }}>
              <LegalNoticeBoard />
            </div>
          </div>

          {/* Additional sections */}
          <section className="space-y-6" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
            <article>
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span className="text-2xl">§</span> POSTANOWIENIA KOŃCOWE
              </h4>
              <ol className="list-decimal pl-8 space-y-2 text-justify">
                <li>Regulamin wchodzi w życie z dniem publikacji na stronie internetowej Serwisu.</li>
                <li>Administrator zastrzega sobie prawo do zmiany Regulaminu w każdym czasie.</li>
                <li>O zmianach Regulaminu Użytkownicy zostaną poinformowani poprzez publikację nowej treści na stronie.</li>
                <li>W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego.</li>
              </ol>
            </article>

            <article>
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span className="text-2xl">§</span> KONTAKT
              </h4>
              <div
                className="p-4 rounded"
                style={{ background: '#f5f0e6', border: '1px dashed #8b7355' }}
              >
                <p><strong>Administrator Serwisu:</strong> KUPMAX Sp. z o.o.</p>
                <p><strong>Adres:</strong> ul. Retro 95, 00-001 Warszawa</p>
                <p><strong>E-mail:</strong> kontakt@kupmax.pl</p>
                <p><strong>Telefon:</strong> +48 800 123 456</p>
              </div>
            </article>
          </section>

          {/* Acceptance section */}
          <section
            className="mt-8 p-6 rounded text-center"
            style={{
              background: accepted ? '#e8f5e9' : '#fff3e0',
              border: `2px solid ${accepted ? '#4caf50' : '#ff9800'}`,
            }}
          >
            <label className="flex items-center justify-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
              <span style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
                Oświadczam, że zapoznałem/am się z treścią Regulaminu i akceptuję jego postanowienia.
              </span>
            </label>

            {accepted && (
              <div className="animate-fade-in">
                <p className="text-green-700 font-bold mb-2">✅ Regulamin zaakceptowany</p>
                <p className="text-sm text-gray-600">Dziękujemy! Możesz teraz korzystać z serwisu.</p>
              </div>
            )}
          </section>
        </main>

        {/* Footer with signatures */}
        <footer
          className="p-8"
          style={{
            borderTop: '3px double #8b7355',
            background: '#faf8f4',
          }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Signature area */}
            <div className="text-center">
              <div
                className="h-20 border-b-2 border-black mb-2 flex items-end justify-center pb-2"
                style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '24px', color: '#00008b' }}
              >
                Jan Kowalski
              </div>
              <p className="text-sm" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
                Prezes Zarządu<br />KUPMAX Sp. z o.o.
              </p>
            </div>

            {/* Official stamp */}
            <div className="flex justify-center items-center">
              <div
                className="w-32 h-32 rounded-full flex flex-col items-center justify-center transform rotate-[-5deg]"
                style={{
                  border: '4px solid #8b0000',
                  color: '#8b0000',
                  background: 'rgba(139,0,0,0.05)',
                }}
              >
                <span className="text-2xl">⚖️</span>
                <span className="text-xs font-bold text-center" style={{ fontFamily: 'serif' }}>
                  KUPMAX<br />SP. Z O.O.
                </span>
                <span className="text-[8px]">KRS 0000000</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Times New Roman, Georgia, serif' }}>
              Dokument wygenerowany elektronicznie w dniu {currentDate}
            </p>

            <Link
              href="/"
              className="inline-block px-8 py-3 font-bold rounded transition-all hover:scale-105"
              style={{
                background: '#8b7355',
                color: '#fff',
                fontFamily: 'Times New Roman, Georgia, serif',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              ← Powrót do strony głównej
            </Link>
          </div>
        </footer>
      </div>

      {/* Decorative corners */}
      <div
        className="fixed top-4 left-4 w-16 h-16 border-t-4 border-l-4"
        style={{ borderColor: '#8b7355', opacity: 0.3 }}
      />
      <div
        className="fixed top-4 right-4 w-16 h-16 border-t-4 border-r-4"
        style={{ borderColor: '#8b7355', opacity: 0.3 }}
      />
      <div
        className="fixed bottom-4 left-4 w-16 h-16 border-b-4 border-l-4"
        style={{ borderColor: '#8b7355', opacity: 0.3 }}
      />
      <div
        className="fixed bottom-4 right-4 w-16 h-16 border-b-4 border-r-4"
        style={{ borderColor: '#8b7355', opacity: 0.3 }}
      />
    </div>
  );
}
