'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RetroNavbar from '../../components/RetroNavbar';

interface Seller {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
}

/**
 * /shop - Stary eBay/Allegro z 1999
 * Aukcje, animowane GIFy "HOT DEAL!", liczniki, marquee
 * Tylko firmy które ukończyły Hive Sounds (9 planet) mają tu dostęp!
 */
export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Wyciągnij unikalne kategorie z produktów
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtruj produkty po kategorii
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Pobierz firmy które ukończyły Hive Sounds (9 planet)
  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    fetchProducts();
    setSelectedCategory('all'); // Reset kategorii przy zmianie firmy
  }, [selectedSeller]);

  const fetchSellers = async () => {
    try {
      const response = await fetch('/api/sellers');
      const data = await response.json();
      if (data.sellers) {
        setSellers(data.sellers);
      }
    } catch (error) {
      logger.error('Error fetching sellers:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products?perPage=50';
      if (selectedSeller !== 'all') {
        url += `&seller=${selectedSeller}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      logger.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Retro ikona na podstawie nazwy produktu
  const getProductIcon = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('laptop') || nameLower.includes('notebook')) return '💻';
    if (nameLower.includes('klawiatura') || nameLower.includes('keyboard')) return '⌨️';
    if (nameLower.includes('myszka') || nameLower.includes('mouse')) return '🖱️';
    if (nameLower.includes('monitor') || nameLower.includes('ekran')) return '🖥️';
    if (nameLower.includes('telefon') || nameLower.includes('phone')) return '📱';
    if (nameLower.includes('słuchawki') || nameLower.includes('headphone')) return '🎧';
    if (nameLower.includes('kamera') || nameLower.includes('camera')) return '📷';
    if (nameLower.includes('drukarka') || nameLower.includes('printer')) return '🖨️';
    if (nameLower.includes('ram') || nameLower.includes('pamięć')) return '🧠';
    if (nameLower.includes('dysk') || nameLower.includes('ssd') || nameLower.includes('hdd')) return '💾';
    if (nameLower.includes('kabel') || nameLower.includes('cable')) return '🔌';
    if (nameLower.includes('ładowarka') || nameLower.includes('charger')) return '🔋';
    if (nameLower.includes('zawias') || nameLower.includes('hinge')) return '🔧';
    if (nameLower.includes('rezystor') || nameLower.includes('kondensator') || nameLower.includes('elektronik')) return '⚡';
    if (nameLower.includes('procesor') || nameLower.includes('cpu')) return '🔲';
    if (nameLower.includes('gpu') || nameLower.includes('grafik')) return '🎮';
    return '📦';
  };

  // Ikona dla firmy na podstawie nazwy
  const getSellerIcon = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('honey') || nameLower.includes('miód')) return '🍯';
    if (nameLower.includes('boss') || nameLower.includes('game')) return '🎮';
    if (nameLower.includes('tech')) return '💻';
    if (nameLower.includes('food') || nameLower.includes('jedzenie')) return '🍕';
    if (nameLower.includes('art') || nameLower.includes('sztuka')) return '🎨';
    return '🏪';
  };

  return (
    <div className="min-h-screen pt-10" style={{ background: '#f0f0f0' }}>
      <RetroNavbar />
      {/* Top banner - Allegro style */}
      <div
        className="py-1 text-center text-sm overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
          borderBottom: '3px solid #cc6600',
        }}
      >
        <div className="overflow-hidden whitespace-nowrap">
          <span
            className="inline-block"
            style={{ animation: 'marquee 15s linear infinite' }}
          >
            🔥 MEGA WYPRZEDAŻ! 🔥 Darmowa dostawa od 100 zł! 🚚 Zwrot do 14 dni! ✅ Bezpieczne płatności! 💳 Tysiące zadowolonych klientów! ⭐⭐⭐⭐⭐
          </span>
        </div>
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
              <form
                className="flex"
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchProducts();
                }}
              >
                <input
                  type="text"
                  placeholder="Szukaj produktów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-r-0 border-yellow-400 text-lg"
                  style={{ background: '#ffffcc' }}
                />
                <button
                  type="submit"
                  className="px-6 py-2 font-bold text-black"
                  style={{
                    background: 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)',
                    border: '2px solid #cc6600',
                  }}
                >
                  🔍 SZUKAJ
                </button>
              </form>
            </div>

            {/* Cart - redirects to ai.kupmax.pl */}
            <a
              href="https://ai.kupmax.pl/cart"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-white border-2 border-yellow-400 rounded hover:opacity-90 transition-opacity"
              style={{ background: '#006633' }}
            >
              <span className="text-2xl">🛒</span>
              <span>Koszyk</span>
            </a>
          </div>

          {/* Sellers / Firmy które ukończyły Hive Sounds */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs text-gray-400 mr-2" title="Firmy które ukończyły 9 zadań Dźwięków Ula">
              🐝 Zweryfikowani:
            </span>
            {/* Przycisk "Wszystkie" */}
            <button
              onClick={() => setSelectedSeller('all')}
              className="px-4 py-1 text-sm font-bold rounded"
              style={{
                background: selectedSeller === 'all'
                  ? 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)'
                  : '#ffffff',
                border: '2px solid #003366',
                color: selectedSeller === 'all' ? '#000' : '#003366',
              }}
            >
              📦 Wszystkie
            </button>
            {/* Dynamiczne przyciski firm z 9 planetami */}
            {sellers.map((seller) => (
              <button
                key={seller.id}
                onClick={() => setSelectedSeller(seller.id)}
                className="px-4 py-1 text-sm font-bold rounded"
                style={{
                  background: selectedSeller === seller.id
                    ? 'linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)'
                    : '#ffffff',
                  border: '2px solid #003366',
                  color: selectedSeller === seller.id ? '#000' : '#003366',
                }}
              >
                {getSellerIcon(seller.name)} {seller.name}
              </button>
            ))}
          </div>

          {/* Zakładki kategorii produktów - pokazuj tylko gdy wybrana firma i są produkty */}
          {selectedSeller !== 'all' && categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-gray-400 mr-2">
                📁 Kategorie:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1 text-xs font-bold rounded"
                  style={{
                    background: selectedCategory === cat
                      ? 'linear-gradient(180deg, #00cc66 0%, #009944 100%)'
                      : '#e6e6e6',
                    border: '2px solid #006633',
                    color: selectedCategory === cat ? '#fff' : '#006633',
                  }}
                >
                  {cat === 'all' ? '📦 Wszystkie' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Info o Hive Sounds - jak zostać sprzedawcą */}
          {sellers.length === 0 && (
            <div
              className="mt-4 p-3 rounded text-center"
              style={{
                background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)',
                border: '2px solid #9933ff',
              }}
            >
              <p className="text-purple-300 text-sm">
                🐝 <strong className="text-yellow-400">Dźwięki Ula</strong> - Chcesz sprzedawać tutaj?
                Ukończ 9 zadań na{' '}
                <a
                  href="https://ai.kupmax.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  ai.kupmax.pl
                </a>
                {' '}i odblokuj dostęp do retro sklepu!
              </p>
            </div>
          )}
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

              {/* AI KupMax link */}
              <a
                href="https://ai.kupmax.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center p-3 rounded transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(180deg, #6600cc 0%, #9933ff 100%)',
                  border: '2px solid #cc99ff',
                  boxShadow: '0 0 10px rgba(153, 51, 255, 0.5)',
                }}
              >
                <p className="text-white font-bold" style={{ textShadow: '1px 1px 0 #000' }}>
                  🤖 KupMax AI
                </p>
                <p className="text-purple-200 text-xs mt-1">
                  Nowoczesna platforma!
                </p>
              </a>

              {/* Hive Sounds info */}
              <div
                className="text-center p-3 rounded"
                style={{
                  background: 'linear-gradient(180deg, #1a1a00 0%, #333300 100%)',
                  border: '2px solid #666600',
                }}
              >
                <p className="text-yellow-400 font-bold text-sm" style={{ textShadow: '1px 1px 0 #000' }}>
                  🐝 Dźwięki Ula
                </p>
                <p className="text-yellow-200 text-xs mt-1 leading-relaxed">
                  Sprzedawcy w tym sklepie przeszli 9 zadań weryfikacyjnych.
                </p>
                <a
                  href="https://ai.kupmax.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 text-xs underline hover:text-cyan-300 block mt-2"
                >
                  Chcesz dołączyć? →
                </a>
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
                📦 Znaleziono: <span className="text-blue-600">{filteredProducts.length}</span> produktów
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
            ) : filteredProducts.length === 0 ? (
              <div
                className="text-center py-10 rounded"
                style={{
                  background: '#ffffcc',
                  border: '3px dashed #ff9900',
                }}
              >
                <p className="text-4xl mb-4">🛒</p>
                <p className="text-xl font-bold">
                  {products.length === 0 ? 'Brak produktów w bazie' : 'Brak produktów w tej kategorii'}
                </p>
                <p className="text-gray-600 mt-2">
                  {products.length === 0 ? 'Sprawdź czy Supabase jest uruchomiony' : 'Wybierz inną kategorię'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product, index) => (
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
                      {product.images && product.images[0] && !product.images[0].includes('127.0.0.1') ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <span className="text-6xl">{getProductIcon(product.name)}</span>
                          <p className="text-xs text-gray-500 mt-2">Brak zdjęcia</p>
                        </div>
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

                      {/* Buy button - redirects to ai.kupmax.pl */}
                      <a
                        href={`https://ai.kupmax.pl/product/${product.slug || product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 font-bold text-white rounded transition-all hover:scale-105 text-center"
                        style={{
                          background: 'linear-gradient(180deg, #ff9900 0%, #cc6600 100%)',
                          border: '2px solid #994d00',
                          textShadow: '1px 1px 0 #000',
                        }}
                      >
                        🛒 KUP TERAZ!
                      </a>
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
            {filteredProducts.length > 0 && (
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-white text-sm">
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">📞 Kontakt</h4>
              <p>
                <a href="mailto:kontakt@kupmax.pl" className="hover:text-yellow-400">
                  kontakt@kupmax.pl
                </a>
              </p>
              <p className="text-gray-400 text-xs mt-1">Odpowiadamy w 24h</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">🚚 Dostawa</h4>
              <p>Poczta Polska</p>
              <p>Kurier DHL/InPost</p>
              <p>Odbiór osobisty (Wrocław)</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">💳 Płatności</h4>
              <p>Stripe</p>
              <p>Przelew bankowy</p>
              <p>BLIK / PayU</p>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">📋 Informacje</h4>
              <a href="https://ai.kupmax.pl/terms" target="_blank" rel="noopener noreferrer" className="block hover:text-yellow-400">Regulamin</a>
              <a href="https://ai.kupmax.pl/privacy" target="_blank" rel="noopener noreferrer" className="block hover:text-yellow-400">Polityka prywatności</a>
              <a href="https://ai.kupmax.pl/faq" target="_blank" rel="noopener noreferrer" className="block hover:text-yellow-400">FAQ</a>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">🐝 Dla Firm</h4>
              <p className="text-xs text-gray-300 mb-2">
                Chcesz sprzedawać w retro stylu?
              </p>
              <a
                href="https://ai.kupmax.pl/register-company"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cyan-400 hover:text-cyan-300 text-xs"
              >
                → Zarejestruj firmę
              </a>
              <a
                href="https://ai.kupmax.pl/my-company/hive-sounds"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-purple-400 hover:text-purple-300 text-xs mt-1"
              >
                → Ukończ 9 Dźwięków Ula
              </a>
            </div>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-gray-600">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
              >
                ← STRONA GŁÓWNA
              </Link>
              <a
                href="https://ai.kupmax.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-500 transition-colors"
              >
                🤖 KupMax AI →
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024-{new Date().getFullYear()} KUPMAX PSA - Retro Shop
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Produkty od zweryfikowanych sprzedawców (Dźwięki Ula 🐝)
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
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
