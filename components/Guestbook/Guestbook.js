'use client';

import { useState } from 'react';
import GuestbookForm from '../GuestbookForm';
import GuestbookList from '../GuestbookList';
import styles from './Guestbook.module.scss';

/**
 * Kompletny komponent gośćca z formularzem i listą wpisów
 */
export default function Guestbook({ 
  productRef = null, 
  showForm = true, 
  showList = true,
  maxEntries = 10,
  title = "💬 Gośćiec KupMax"
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Callback wywoływany po pomyślnym dodaniu wpisu
   */
  const handleEntryAdded = (newEntry) => {
    console.log('Nowy wpis dodany:', newEntry);
    
    // Wymuszenie odświeżenia listy
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={styles.guestbook}>
      {/* Tytuł sekcji */}
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>
          Podziel się swoimi przemyśleniami i opiniami z innymi użytkownikami
        </p>
      </div>

      <div className={styles.content}>
        {/* Formularz dodawania wpisu */}
        {showForm && (
          <div className={styles.formSection}>
            <GuestbookForm 
              productRef={productRef}
              onSuccess={handleEntryAdded}
            />
          </div>
        )}

        {/* Lista wpisów */}
        {showList && (
          <div className={styles.listSection}>
            <GuestbookList 
              key={refreshKey}
              maxEntries={maxEntries}
            />
          </div>
        )}

        {/* Jeśli nie pokazujemy ani formularza ani listy */}
        {!showForm && !showList && (
          <div className={styles.emptyState}>
            <p>🤔 Skonfiguruj gościa aby wyświetlić formularz lub listę wpisów</p>
          </div>
        )}
      </div>
    </div>
  );
}
