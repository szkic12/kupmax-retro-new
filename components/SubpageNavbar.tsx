'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: '🏠 Home', href: '/' },
  { label: '📰 News', href: '/news' },
  { label: '💬 Chat', href: '/chat' },
  { label: '📋 Forum', href: '/forum' },
  { label: '📖 Guestbook', href: '/guestbook' },
  { label: '📸 Photos', href: '/photos' },
  { label: '📥 Downloads', href: '/downloads' },
  { label: '📻 Radio', href: '/radio' },
  { label: '🎮 Tetris', href: '/tetris' },
  { label: '🛒 Shop', href: '/shop' },
  { label: '🌐 Webring', href: '/webring' },
];

export default function SubpageNavbar() {
  const pathname = usePathname();

  return (
    <nav
      className="mx-2 sm:mx-4 mb-4 p-3 rounded-lg"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        border: '2px solid #d4af37',
        boxShadow: '0 2px 10px rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-all hover:scale-105"
              style={{
                background: isActive
                  ? 'linear-gradient(180deg, #d4af37 0%, #b8871e 100%)'
                  : 'linear-gradient(180deg, #2a2a4a 0%, #1a1a3e 100%)',
                border: isActive
                  ? '2px solid #e8b94a'
                  : '1px solid #d4af3740',
                color: isActive ? '#1a1a2e' : '#d4af37',
                textShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
