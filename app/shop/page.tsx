'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * /shop - Stary eBay/Allegro z 1999
 * Aukcje, animowane GIFy "HOT DEAL!", liczniki, marquee
 */
export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showCartPopup, setShowCartPopup] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?perPage=20');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    setCartCount(prev => prev + 1);
    setShowCartPopup(true);
    setTimeout(() => setShowCartPopup(false), 2000);
  };

  const categories = ['all', 'Electronics', 'Clothing', 'Books', 'Games', 'Other'];

  return (
    <div className="min-h-screen" style={{ background: '#f0f0f0' }}>
      {/* Top banner - Allegro style */}
      <div
        className="py-1 text-center text-sm"
        style={{
          background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
          borderBottom: '3px solid #cc6600',
        }}
      >
        <marquee scrollamount="3">
          🔥 MEGA WYPRZEDAŻ! 🔥 Darmowa dostawa od 100 zł! 🚚 Zwrot do 14 dni! ✅ Bezpieczne płatności! 💳 Tysiące zadowolonych klientów! ⭐⭐⭐⭐⭐
        </marquee>
      </div>

      {/* Header */}
      <header
        className="py-4 px-4"
        style={{
          background: 'linear-gradient(180deg, #003366 0%, #001a33 100%)',
          borderBottom: '4px solid #ffcc00',
        }}
      >
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-4xl">🛒</span>
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{
                    color: '#ffcc00',
                    textShadow: '2px 2px 0 #000',
                    fontFamily: 'Impact, sans-serif',
                  }}
                >
                  KUPMAX SHOP
                </h1>
                <p className="text-xs text-gray-300">Największy sklep internetowy!</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Szukaj produktów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-r-0 border-yellow-400 text-lg"
                  style={{ background: '#ffffcc' }}
                />
                <button
                  className="px-6 py-2 font-bold text-black"
                  style={{
                    background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
                    border: '2px solid #cc6600',
                  }}
                >
                  🔍 SZUKAJ
                </button>
              </div>
            </div>

            {/* Cart */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 text-white border-2 border-yellow-400 rounded"
                style={{ background: '#006633' }}
              >
                <span className="text-2xl">🛒</span>
                <span>Koszyk ({cartCount})</span>
              </button>
              {showCartPopup && (
                <div
                  className="absolute top-full right-0 mt-2 px-4 py-2 text-white rounded animate-bounce"
                  style={{ background: '#00cc00', whiteSpace: 'nowrap' }}
                >
                  ✅ Dodano do koszyka!
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1 text-sm font-bold rounded"
                style={{
                  background: selectedCategory === cat
                    ? 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)'
                    : '#ffffff',
                  border: '2px solid #003366',
                  color: selectedCategory === cat ? '#000' : '#003366',
                }}
              >
                {cat === 'all' ? '📦 Wszystkie' : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hot deals banner */}
      <div
        className="py-2 text-center"
        style={{
          background: 'repeating-linear-gradient(45deg, #ff0000, #ff0000 10px, #ffcc00 10px, #ffcc00 20px)',
        }}
      >
        <span
          className="text-2xl font-bold text-white px-4 py-1"
          style={{ background: '#ff0000', textShadow: '2px 2px 0 #000' }}
        >
          🔥 HOT DEALS! 🔥 OKAZJE DNIA! 🔥 TYLKO TERAZ! 🔥
        </span>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside
            className="hidden md:block w-64 flex-shrink-0"
            style={{
              background: '#ffffff',
              border: '3px solid #003366',
              borderRadius: '8px',
            }}
          >
            {/* Special offers */}
            <div
              className="p-4 text-center"
              style={{
                background: 'linear-gradient(180deg, #ff0000 0%, #cc0000 100%)',
                borderRadius: '5px 5px 0 0',
              }}
            >
              <p
                className="text-white font-bold text-xl animate-pulse"
                style={{ textShadow: '1px 1px 0 #000' }}
              >
                ⚡ SUPER OFERTY ⚡
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Countdown */}
              <div
                className="text-center p-3 rounded"
                style={{ background: '#ffffcc', border: '2px dashed #ff0000' }}
              >
                <p className="text-sm font-bold text-red-600">Promocja kończy się za:</p>
                <div className="flex justify-center gap-1 mt-2">
                  <span className="bg-black text-green-400 px-2 py-1 font-mono">02</span>
                  <span className="text-xl">:</span>
                  <span className="bg-black text-green-400 px-2 py-1 font-mono">34</span>
                  <span className="text-xl">:</span>
                  <span className="bg-black text-green-400 px-2 py-1 font-mono">56</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-2 text-center text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <span>✅</span>
                  <span>Bezpieczne zakupy</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span>🚚</span>
                  <span>Szybka wysyłka</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span>↩️</span>
                  <span>14 dni na zwrot</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span>💳</span>
                  <span>Płatność przy odbiorze</span>
                </div>
              </div>

              {/* Ratings */}
              <div
                className="text-center p-3 rounded"
                style={{ background: '#e6ffe6', border: '2px solid #00cc00' }}
              >
                <p className="font-bold">Ocena sklepu:</p>
                <p className="text-2xl">⭐⭐⭐⭐⭐</p>
                <p className="text-sm text-gray-600">98.7% pozytywnych opinii</p>
              </div>

              {/* Hit counter */}
              <div className="text-center">
                <p className="text-sm mb-1">Licznik odwiedzin:</p>
                <div className="flex justify-center">
                  {['1', '5', '8', '4', '2', '9'].map((d, i) => (
                    <span
                      key={i}
                      className="bg-black text-green-400 px-1 font-mono text-sm border border-gray-600"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Results header */}
            <div
              className="flex justify-between items-center mb-4 p-3 rounded"
              style={{ background: '#e6e6e6', border: '2px solid #999999' }}
            >
              <p className="font-bold">
                📦 Znaleziono: <span className="text-blue-600">{products.length}</span> produktów
              </p>
              <select
                className="px-3 py-1 border-2 border-gray-400"
                style={{ background: '#ffffff' }}
              >
                <option>Sortuj: Domyślnie</option>
                <option>Cena: rosnąco</option>
                <option>Cena: malejąco</option>
                <option>Popularność</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="text-6xl animate-spin mb-4">⏳</div>
                <p className="text-xl font-bold">Ładowanie produktów...</p>
                <div className="w-48 h-4 bg-gray-300 mx-auto mt-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: '60%', animation: 'loading 1s infinite' }}
                  />
                </div>
              </div>
            ) : products.length === 0 ? (
              <div
                className="text-center py-10 rounded"
                style={{
                  background: '#ffffcc',
                  border: '3px dashed #ff9900',
                }}
              >
                <p className="text-4xl mb-4">🛒</p>
                <p className="text-xl font-bold">Brak produktów w bazie</p>
                <p className="text-gray-600 mt-2">Sprawdź czy Supabase jest uruchomiony</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="relative rounded overflow-hidden transition-transform hover:-translate-y-1"
                    style={{
                      background: '#ffffff',
                      border: '3px solid #003366',
                      boxShadow: '3px 3px 0 #999',
                    }}
                  >
                    {/* Hot label */}
                    {index < 3 && (
                      <div
                        className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded z-10 animate-pulse"
                        style={{
                          background: 'linear-gradient(45deg, #ff0000, #ff6600)',
                          transform: 'rotate(-10deg)',
                        }}
                      >
                        🔥 HOT!
                      </div>
                    )}

                    {/* New label */}
                    {index >= 3 && index < 6 && (
                      <div
                        className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded z-10"
                        style={{ background: '#00cc00' }}
                      >
                        ✨ NOWOŚĆ!
                      </div>
                    )}

                    {/* Image */}
                    <div
                      className="aspect-square flex items-center justify-center"
                      style={{ background: '#f5f5f5', borderBottom: '2px solid #003366' }}
                    >
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl">📦</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2" style={{ color: '#003366' }}>
                        {product.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span
                          className="text-2xl font-bold"
                          style={{ color: '#cc0000' }}
                        >
                          {product.price} {product.currency}
                        </span>
                        {Math.random() > 0.5 && (
                          <span className="text-sm text-gray-500 line-through">
                            {(parseFloat(product.price) * 1.3).toFixed(2)} {product.currency}
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      {product.stock !== null && (
                        <p className="text-xs text-gray-600 mb-2">
                          📦 Na stanie: {product.stock} szt.
                        </p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1 text-sm mb-3">
                        <span>⭐⭐⭐⭐⭐</span>
                        <span className="text-gray-500">({Math.floor(Math.random() * 100 + 10)})</span>
                      </div>

                      {/* Buy button */}
                      <button
                        onClick={addToCart}
                        className="w-full py-2 font-bold text-white rounded transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(180deg, #ff9900 0%, #cc6600 100%)',
                          border: '2px solid #994d00',
                          textShadow: '1px 1px 0 #000',
                        }}
                      >
                        🛒 KUP TERAZ!
                      </button>
                    </div>

                    {/* Auction timer for some items */}
                    {index % 4 === 0 && (
                      <div
                        className="px-3 py-2 text-center text-sm"
                        style={{ background: '#ffffcc', borderTop: '2px dashed #ff9900' }}
                      >
                        <span className="text-red-600 font-bold animate-pulse">
                          ⏰ Licytacja kończy się za: 2h 34m
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  className="px-4 py-2 font-bold rounded"
                  style={{
                    background: '#e6e6e6',
                    border: '2px solid #999',
                  }}
                >
                  ◀ Poprzednia
                </button>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className="px-4 py-2 font-bold rounded"
                    style={{
                      background: n === 1 ? '#003366' : '#ffffff',
                      color: n === 1 ? '#ffffff' : '#003366',
                      border: '2px solid #003366',
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-4 py-2 font-bold rounded"
                  style={{
                    background: '#ffcc00',
                    border: '2px solid #cc6600',
                  }}
                >
                  Następna ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="mt-8 py-6"
        style={{
          background: 'linear-gradient(180deg, #003366 0%, #001a33 100%)',
          borderTop: '4px solid #ffcc00',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-sm">
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">📞 Kontakt</h4>
              <p>Tel: 0-801-XXX-XXX</p>
              <p>Email: sklep@kupmax.pl</p>
              <p>Pon-Pt: 8:00-18:00</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">🚚 Dostawa</h4>
              <p>Poczta Polska</p>
              <p>Kurier DHL</p>
              <p>Odbiór osobisty</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">💳 Płatności</h4>
              <p>Przelew bankowy</p>
              <p>Płatność przy odbiorze</p>
              <p>PayU / DotPay</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">📋 Informacje</h4>
              <Link href="/bulletin" className="block hover:text-yellow-400">Regulamin</Link>
              <p>Polityka prywatności</p>
              <p>Zwroty i reklamacje</p>
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-gray-600">
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
            >
              ← POWRÓT DO STRONY GŁÓWNEJ
            </Link>
            <p className="text-gray-400 text-sm mt-4">
              © 1999-2026 KUPMAX Shop - Twój zaufany sklep internetowy
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
}
