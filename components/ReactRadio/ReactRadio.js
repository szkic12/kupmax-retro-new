'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './ReactRadio.module.scss';

const ReactRadio = ({ initialStation = null, isPlayerPage = false }) => {
  const [stations, setStations] = useState(initialStation ? [initialStation] : []);
  const [currentStation, setCurrentStation] = useState(initialStation);
  const [isPlaying, setIsPlaying] = useState(false); // Zawsze startuj wstrzymany
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isPlayerPage) {
      const fetchStations = async () => {
        try {
          const response = await fetch('/api/radio/stations');
          const data = await response.json();
          setStations(data);
        } catch (err) {
          setError('Nie udało się załadować listy stacji.');
        }
      };
      fetchStations();
    }
  }, [isPlayerPage]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().then(() => {
          setError(null); // Wyczyść błąd, gdy odtwarzanie się powiedzie
        }).catch(e => {
          setError('Błąd odtwarzania. Spróbuj ponownie.');
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSelectStation = (station) => {
    setCurrentStation(station);
    setError(null);
  };

  const handlePrimaryAction = () => {
    if (!currentStation) return;

    if (isPlayerPage) {
      setIsPlaying(!isPlaying);
    } else {
      const playerUrl = `/radio-player?stationUrl=${encodeURIComponent(currentStation.url)}&stationName=${encodeURIComponent(currentStation.name)}&stationGenre=${encodeURIComponent(currentStation.genre)}`;
      window.open(playerUrl, '_blank');
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (!isPlayerPage) {
      setCurrentStation(null);
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={styles.radioContainer}>
      <div className={styles.header}>
        <h2>📻 WEB 2.0 RADIO</h2>
        <p>{isPlayerPage ? 'Odtwarzacz' : 'Wybierz stację'}</p>
      </div>

      {currentStation && (
        <audio
          ref={audioRef}
          src={currentStation.url}
          onEnded={handleStop}
          onError={(e) => {
            // Ignoruj błąd "aborted by the user" przy zmianie stacji
            if (e.target.error.code !== 4) {
               setError('Błąd ładowania strumienia.');
            }
          }}
        />
      )}

      <div className={styles.playerSection}>
        <div className={styles.currentStation}>
          {currentStation ? (
            <>
              <div className={styles.nowPlaying}>
                <span className={styles.statusIndicator}>
                  {isPlaying ? '▶' : '⏸'}
                </span>
                <strong>{currentStation.name}</strong>
                <span className={styles.genre}>{currentStation.genre}</span>
              </div>
              
              {error && (
                <div className={styles.errorMessage}>
                  ⚠️ {error}
                </div>
              )}
              
              <div className={styles.playerControls}>
                <button 
                  className={styles.controlBtn}
                  onClick={handlePrimaryAction}
                  disabled={!currentStation}
                >
                  {isPlayerPage ? (isPlaying ? '⏸ PAUSE' : '▶ PLAY') : '▶ OTWÓRZ W NOWEJ KARCIE'}
                </button>
                <button 
                  className={styles.controlBtn}
                  onClick={handleStop}
                  disabled={!currentStation}
                >
                  ⏹ STOP
                </button>
                <div className={styles.volumeControl}>
                  <span>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                  <span>{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noStation}>
              Wybierz stację z listy poniżej
            </div>
          )}
        </div>
      </div>

      {!isPlayerPage && (
        <div className={styles.stationList}>
          <h3>Dostępne stacje ({stations.length})</h3>
          <fieldset className={styles.stationFieldset}>
            <legend>Wybierz stację:</legend>
            {stations.map(station => (
              <div key={station.id} className={styles.station}>
                <input
                  type="radio"
                  id={`station-${station.id}`}
                  name="station"
                  value={station.id}
                  checked={currentStation?.id === station.id}
                  onChange={() => handleSelectStation(station)}
                  className={styles.radioInput}
                />
                <label htmlFor={`station-${station.id}`} className={styles.radioLabel}>
                  <div className={styles.stationInfo}>
                    <div className={styles.stationIcon}>📻</div>
                    <div className={styles.stationDetails}>
                      <div className={styles.stationName}>{station.name}</div>
                      <div className={styles.stationGenre}>{station.genre}</div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </fieldset>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.info}>
          <strong>React Radio v5.1 (Manual Play)</strong><br/>
          Status: {currentStation ? (isPlaying ? `Playing: ${currentStation.name}`: 'Paused') : 'Ready'}<br/>
          Volume: {Math.round(volume * 100)}%
        </div>
      </div>
    </div>
  );
};

export default ReactRadio;
