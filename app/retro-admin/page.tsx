'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RetroAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('radio');
  const [stations, setStations] = useState<any[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<any[]>([]);
  const [webringSites, setWebringSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // New station form
  const [newStation, setNewStation] = useState({ name: '', url: '', genre: '' });

  // New webring site form
  const [newSite, setNewSite] = useState({ name: '', url: '', description: '', category: '', icon: '✦' });

  // Simple password check (in production use proper auth)
  const ADMIN_PASSWORD = 'kupmax2024';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setMessage('Zalogowano pomyslnie!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('Bledne haslo!');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'radio') {
        const res = await fetch('/api/radio/stations');
        const data = await res.json();
        setStations(data);
      } else if (activeTab === 'guestbook') {
        const res = await fetch('/api/guestbook');
        const data = await res.json();
        setGuestbookEntries(data.entries || []);
      } else if (activeTab === 'webring') {
        const res = await fetch('/api/webring');
        const data = await res.json();
        setWebringSites(data.sites || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.url || !newStation.genre) {
      setMessage('Wypelnij wszystkie pola!');
      return;
    }

    try {
      const res = await fetch('/api/radio/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStation),
      });

      if (res.ok) {
        setMessage('Stacja dodana!');
        setNewStation({ name: '', url: '', genre: '' });
        fetchData();
      } else {
        setMessage('Blad dodawania stacji');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleAddWebsiteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.url) {
      setMessage('Nazwa i URL sa wymagane!');
      return;
    }

    try {
      const res = await fetch('/api/webring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      });

      if (res.ok) {
        setMessage('Strona dodana do webring!');
        setNewSite({ name: '', url: '', description: '', category: '', icon: '✦' });
        fetchData();
      } else {
        setMessage('Blad dodawania strony');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm('Czy na pewno usunac stacje?')) return;

    try {
      const res = await fetch(`/api/radio/stations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Stacja usunieta!');
        fetchData();
      } else {
        setMessage('Blad usuwania');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteGuestbookEntry = async (id: string) => {
    if (!confirm('Czy na pewno usunac wpis?')) return;

    try {
      const res = await fetch(`/api/guestbook?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Wpis usuniety!');
        fetchData();
      } else {
        setMessage('Blad usuwania wpisu');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  const handleDeleteWebringSite = async (id: string) => {
    if (!confirm('Czy na pewno usunac strone z webring?')) return;

    try {
      const res = await fetch(`/api/webring?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Strona usunieta z webring!');
        fetchData();
      } else {
        setMessage('Blad usuwania strony');
      }
    } catch (error) {
      setMessage('Blad sieci');
    }
  };

  // Retro styles
  const windowStyle: React.CSSProperties = {
    background: '#c0c0c0',
    border: '3px outset #fff',
    maxWidth: '900px',
    margin: '10px auto',
    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
  };

  const titleBarStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
    padding: '4px 8px',
    color: '#fff',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const contentStyle: React.CSSProperties = {
    padding: '15px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
    border: '2px outset #fff',
    padding: '6px 16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const inputStyle: React.CSSProperties = {
    border: '2px inset #808080',
    padding: '4px 8px',
    background: '#fff',
    width: '100%',
    marginBottom: '8px',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive
      ? 'linear-gradient(180deg, #c0c0c0 0%, #e0e0e0 100%)'
      : 'linear-gradient(180deg, #a0a0a0 0%, #808080 100%)',
    border: '2px outset #fff',
    padding: '8px 20px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? 'none' : '2px outset #fff',
    marginBottom: isActive ? '-2px' : '0',
    position: 'relative' as const,
    zIndex: isActive ? 1 : 0,
  });

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#008080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      }}>
        <div style={windowStyle}>
          <div style={titleBarStyle}>
            <span>🔐</span>
            <span>Retro Admin - Logowanie</span>
          </div>
          <div style={contentStyle}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <img
                  src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='50' font-size='50'>🔑</text></svg>"
                  alt="Key"
                  style={{ width: '64px', height: '64px' }}
                />
              </div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Haslo administratora:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Wprowadz haslo..."
              />
              {message && (
                <div style={{
                  background: message.includes('pomyslnie') ? '#00ff00' : '#ff0000',
                  color: message.includes('pomyslnie') ? '#000' : '#fff',
                  padding: '8px',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}>
                  {message}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="submit" style={buttonStyle}>
                  OK
                </button>
                <Link href="/" style={{ ...buttonStyle, textDecoration: 'none', color: '#000' }}>
                  Anuluj
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#008080',
      padding: '10px',
      fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={windowStyle}>
        <div style={titleBarStyle}>
          <span>⚙️</span>
          <span>Panel Administracyjny KupMax Retro</span>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setIsLoggedIn(false)}
              style={{
                background: '#c0c0c0',
                border: '2px outset #fff',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>

        <div style={contentStyle}>
          {/* Back link */}
          <div style={{ marginBottom: '15px' }}>
            <Link href="/" style={{ color: '#000080', fontWeight: 'bold' }}>
              ◄ Powrot do strony glownej
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '0', flexWrap: 'wrap' }}>
            <button style={tabStyle(activeTab === 'radio')} onClick={() => setActiveTab('radio')}>
              📻 Radio
            </button>
            <button style={tabStyle(activeTab === 'guestbook')} onClick={() => setActiveTab('guestbook')}>
              💬 Guestbook
            </button>
            <button style={tabStyle(activeTab === 'webring')} onClick={() => setActiveTab('webring')}>
              🔗 Webring
            </button>
          </div>

          {/* Tab content */}
          <div style={{
            border: '2px inset #808080',
            background: '#e0e0e0',
            padding: '15px',
            minHeight: '300px',
          }}>
            {message && (
              <div style={{
                background: '#ffff00',
                border: '1px solid #000',
                padding: '8px',
                marginBottom: '10px',
                textAlign: 'center',
              }}>
                {message}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                Ladowanie...
              </div>
            ) : (
              <>
                {/* Radio Tab */}
                {activeTab === 'radio' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Zarzadzanie stacjami radiowymi ({stations.length})
                    </h3>

                    {/* Add new station form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nowa stacje</legend>
                      <form onSubmit={handleAddStation}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa:</label>
                            <input
                              type="text"
                              value={newStation.name}
                              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Radio Retro"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL streamu:</label>
                            <input
                              type="text"
                              value={newStation.url}
                              onChange={(e) => setNewStation({ ...newStation, url: e.target.value })}
                              style={inputStyle}
                              placeholder="http://..."
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Gatunek:</label>
                            <input
                              type="text"
                              value={newStation.genre}
                              onChange={(e) => setNewStation({ ...newStation, genre: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Rock"
                            />
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>
                          + Dodaj stacje
                        </button>
                      </form>
                    </fieldset>

                    {/* Stations list */}
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '400px' }}>
                      <thead>
                        <tr style={{ background: '#000080', color: '#fff' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nazwa</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Gatunek</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations.map((station, i) => (
                          <tr key={station.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.id}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.name}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{station.genre}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <button
                                onClick={() => handleDeleteStation(station.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                }}
                              >
                                Usun
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {/* Guestbook Tab */}
                {activeTab === 'guestbook' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Wpisy w ksiedze gosci ({guestbookEntries.length})
                    </h3>
                    <div>
                      {guestbookEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          Brak wpisow w ksiedze gosci
                        </div>
                      ) : (
                        guestbookEntries.map((entry, i) => (
                          <div
                            key={entry.id}
                            style={{
                              background: i % 2 === 0 ? '#fff' : '#f0f0f0',
                              padding: '10px',
                              marginBottom: '5px',
                              border: '1px solid #ccc',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '5px' }}>
                              <div>
                                <strong>{entry.name || entry.nickname || 'Anonim'}</strong>
                                <br />
                                <small style={{ color: '#666' }}>{new Date(entry.timestamp || entry.date).toLocaleString('pl-PL')}</small>
                              </div>
                              <button
                                onClick={() => handleDeleteGuestbookEntry(entry.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                }}
                              >
                                🗑️ Usun
                              </button>
                            </div>
                            <p style={{ margin: '8px 0 0 0', color: '#333', wordBreak: 'break-word' }}>{entry.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Webring Tab */}
                {activeTab === 'webring' && (
                  <div>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #808080', paddingBottom: '5px' }}>
                      Zarzadzanie Webring ({webringSites.length} stron)
                    </h3>

                    {/* Add new site form */}
                    <fieldset style={{ border: '2px groove #fff', padding: '10px', marginBottom: '15px' }}>
                      <legend style={{ fontWeight: 'bold' }}>Dodaj nowa strone</legend>
                      <form onSubmit={handleAddWebsiteSite}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Nazwa strony *:</label>
                            <input
                              type="text"
                              value={newSite.name}
                              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                              style={inputStyle}
                              placeholder="np. Moja Strona Retro"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>URL *:</label>
                            <input
                              type="text"
                              value={newSite.url}
                              onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                              style={inputStyle}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Opis:</label>
                            <input
                              type="text"
                              value={newSite.description}
                              onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                              style={inputStyle}
                              placeholder="Krotki opis strony"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Kategoria:</label>
                            <select
                              value={newSite.category}
                              onChange={(e) => setNewSite({ ...newSite, category: e.target.value })}
                              style={{ ...inputStyle, height: '30px' }}
                            >
                              <option value="">Wybierz kategorie</option>
                              <option value="Retro">Retro</option>
                              <option value="Aesthetic">Aesthetic</option>
                              <option value="Archive">Archive</option>
                              <option value="Museum">Museum</option>
                              <option value="Personal">Personal</option>
                              <option value="Gaming">Gaming</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px' }}>Ikona:</label>
                            <select
                              value={newSite.icon}
                              onChange={(e) => setNewSite({ ...newSite, icon: e.target.value })}
                              style={{ ...inputStyle, height: '30px' }}
                            >
                              <option value="✦">✦ Biale sloneczko</option>
                              <option value="☼">☼ Slonce</option>
                              <option value="✧">✧ Gwiazdka</option>
                              <option value="◈">◈ Diament</option>
                              <option value="○">○ Kolko</option>
                              <option value="□">□ Kwadrat</option>
                              <option value="△">△ Trojkat</option>
                              <option value="♦">♦ Romb</option>
                              <option value="●">● Kropka</option>
                              <option value="★">★ Gwiazda</option>
                            </select>
                          </div>
                        </div>
                        <button type="submit" style={{ ...buttonStyle, marginTop: '10px' }}>
                          + Dodaj strone do Webring
                        </button>
                      </form>
                    </fieldset>

                    {/* Sites list */}
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ background: '#000080', color: '#fff' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Ikona</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Nazwa</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Kategoria</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webringSites.map((site, i) => (
                          <tr key={site.id} style={{ background: i % 2 === 0 ? '#fff' : '#f0f0f0' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc', fontSize: '20px' }}>
                              {site.icon || '☀️'}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ color: '#000080' }}>
                                {site.name}
                              </a>
                              <br />
                              <small style={{ color: '#666' }}>{site.description}</small>
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{site.category}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <span style={{
                                background: site.approved ? '#00aa00' : '#ffaa00',
                                color: '#fff',
                                padding: '2px 6px',
                                fontSize: '11px',
                              }}>
                                {site.approved ? 'Aktywna' : 'Oczekuje'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                              <button
                                onClick={() => handleDeleteWebringSite(site.id)}
                                style={{
                                  ...buttonStyle,
                                  background: '#ff6666',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                }}
                              >
                                🗑️ Usun
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <Link
                        href="/webring"
                        target="_blank"
                        style={{
                          ...buttonStyle,
                          display: 'inline-block',
                          textDecoration: 'none',
                          color: '#000',
                        }}
                      >
                        Zobacz katalog webring
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        color: '#fff',
        marginTop: '20px',
        fontSize: '12px',
      }}>
        KupMax Retro Admin Panel v1.0 | 2024
      </div>
    </div>
  );
}
