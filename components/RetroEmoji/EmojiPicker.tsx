'use client';

import React, { useState } from 'react';
import { RetroEmoji, EmojiType, emojiToCode } from './RetroEmoji';
import styles from './EmojiPicker.module.css';

interface EmojiPickerProps {
  onSelect: (code: string) => void;
  size?: number;
}

const allEmojis: EmojiType[] = [
  'smile',
  'laugh',
  'sad',
  'wink',
  'tongue',
  'love',
  'cool',
  'angry',
  'surprise',
  'think',
];

const emojiNames: Record<EmojiType, string> = {
  'smile': 'Uśmiech',
  'laugh': 'Śmiech',
  'sad': 'Smutek',
  'wink': 'Mrugnięcie',
  'tongue': 'Język',
  'love': 'Miłość',
  'cool': 'Cool',
  'angry': 'Złość',
  'surprise': 'Zaskoczenie',
  'think': 'Myślenie',
};

export function EmojiPicker({ onSelect, size = 32 }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: EmojiType) => {
    const code = emojiToCode[type];
    onSelect(code);
    setIsOpen(false);
  };

  return (
    <div className={styles.pickerContainer}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.triggerButton}
        title="Wybierz emotkę"
      >
        <RetroEmoji type="smile" size={32} />
      </button>

      {isOpen && (
        <div className={styles.pickerDropdown}>
          <div className={styles.pickerHeader}>
            Wybierz emotkę
          </div>
          <div className={styles.emojiGrid}>
            {allEmojis.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                className={styles.emojiButton}
                title={`${emojiNames[type]} ${emojiToCode[type]}`}
              >
                <RetroEmoji type={type} size={size} />
              </button>
            ))}
          </div>
          <div className={styles.pickerFooter}>
            Kliknij emotkę aby wstawić
          </div>
        </div>
      )}
    </div>
  );
}

export default EmojiPicker;
