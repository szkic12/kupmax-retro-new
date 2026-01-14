'use client';

import React from 'react';
import styles from './RetroEmoji.module.css';

export type EmojiType = 'smile' | 'laugh' | 'sad' | 'wink' | 'tongue' | 'love' | 'cool' | 'angry' | 'surprise' | 'think';

interface RetroEmojiProps {
  type: EmojiType;
  size?: number;
  className?: string;
}

// Mapowanie kodów tekstowych na typy emotek
export const emojiCodes: Record<string, EmojiType> = {
  ':)': 'smile',
  ':-)': 'smile',
  ':D': 'laugh',
  ':-D': 'laugh',
  ':(': 'sad',
  ':-(': 'sad',
  ';)': 'wink',
  ';-)': 'wink',
  ':P': 'tongue',
  ':-P': 'tongue',
  ':p': 'tongue',
  '<3': 'love',
  '8)': 'cool',
  '8-)': 'cool',
  '>:(': 'angry',
  ':O': 'surprise',
  ':-O': 'surprise',
  ':o': 'surprise',
  ':/': 'think',
  ':-/': 'think',
};

// Odwrotne mapowanie - typ na kod
export const emojiToCode: Record<EmojiType, string> = {
  'smile': ':)',
  'laugh': ':D',
  'sad': ':(',
  'wink': ';)',
  'tongue': ':P',
  'love': '<3',
  'cool': '8)',
  'angry': '>:(',
  'surprise': ':O',
  'think': ':/',
};

export function RetroEmoji({ type, size = 24, className = '' }: RetroEmojiProps) {
  const getAnimationClass = () => {
    switch (type) {
      case 'laugh': return styles.animateLaugh;
      case 'wink': return styles.animateWink;
      case 'sad': return styles.animateSad;
      case 'love': return styles.animateLove;
      case 'surprise': return styles.animateSurprise;
      case 'angry': return styles.animateAngry;
      default: return styles.animateIdle;
    }
  };

  const getFace = () => {
    switch (type) {
      case 'smile':
        return (
          <>
            {/* Oczy */}
            <circle cx="35" cy="38" r="4" fill="#333" />
            <circle cx="65" cy="38" r="4" fill="#333" />
            {/* Uśmiech */}
            <path d="M 30 55 Q 50 75 70 55" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'laugh':
        return (
          <>
            {/* Oczy zamknięte (śmiech) */}
            <path d="M 28 38 Q 35 32 42 38" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 58 38 Q 65 32 72 38" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Szeroki uśmiech */}
            <path d="M 25 52 Q 50 80 75 52" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Zęby */}
            <rect x="38" y="58" width="24" height="8" fill="white" stroke="#333" strokeWidth="2" rx="2" />
          </>
        );
      case 'sad':
        return (
          <>
            {/* Oczy smutne */}
            <circle cx="35" cy="40" r="4" fill="#333" />
            <circle cx="65" cy="40" r="4" fill="#333" />
            {/* Brwi smutne */}
            <path d="M 25 30 L 40 35" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 30 L 60 35" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            {/* Smutna buzia */}
            <path d="M 30 65 Q 50 50 70 65" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Łezka */}
            <ellipse cx="75" cy="50" rx="3" ry="5" fill="#87CEEB" className={styles.tear} />
          </>
        );
      case 'wink':
        return (
          <>
            {/* Lewe oko normalne */}
            <circle cx="35" cy="38" r="4" fill="#333" />
            {/* Prawe oko mruga */}
            <path d="M 58 38 Q 65 38 72 38" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" className={styles.winkEye} />
            {/* Uśmiech */}
            <path d="M 30 55 Q 50 75 70 55" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'tongue':
        return (
          <>
            {/* Oczy */}
            <circle cx="35" cy="38" r="4" fill="#333" />
            <circle cx="65" cy="38" r="4" fill="#333" />
            {/* Buzia otwarta */}
            <ellipse cx="50" cy="60" rx="15" ry="10" fill="#333" />
            {/* Język */}
            <ellipse cx="50" cy="68" rx="8" ry="12" fill="#FF6B6B" className={styles.tongue} />
          </>
        );
      case 'love':
        return (
          <>
            {/* Oczy - serduszka */}
            <path d="M 30 35 C 25 30 20 35 30 45 C 40 35 35 30 30 35" fill="#FF6B6B" className={styles.heartEye} />
            <path d="M 70 35 C 65 30 60 35 70 45 C 80 35 75 30 70 35" fill="#FF6B6B" className={styles.heartEye} />
            {/* Uśmiech */}
            <path d="M 30 58 Q 50 78 70 58" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'cool':
        return (
          <>
            {/* Okulary */}
            <rect x="22" y="32" width="22" height="16" rx="3" fill="#333" />
            <rect x="56" y="32" width="22" height="16" rx="3" fill="#333" />
            <path d="M 44 40 L 56 40" stroke="#333" strokeWidth="3" />
            {/* Uśmiech */}
            <path d="M 32 58 Q 50 72 68 58" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'angry':
        return (
          <>
            {/* Oczy złe */}
            <circle cx="35" cy="42" r="4" fill="#333" />
            <circle cx="65" cy="42" r="4" fill="#333" />
            {/* Brwi złe */}
            <path d="M 25 32 L 42 38" stroke="#333" strokeWidth="4" strokeLinecap="round" />
            <path d="M 75 32 L 58 38" stroke="#333" strokeWidth="4" strokeLinecap="round" />
            {/* Usta zaciśnięte */}
            <path d="M 35 62 L 65 62" stroke="#333" strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 'surprise':
        return (
          <>
            {/* Oczy duże */}
            <circle cx="35" cy="38" r="6" fill="#333" />
            <circle cx="65" cy="38" r="6" fill="#333" />
            <circle cx="36" cy="36" r="2" fill="white" />
            <circle cx="66" cy="36" r="2" fill="white" />
            {/* Brwi uniesione */}
            <path d="M 25 26 L 42 28" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 26 L 58 28" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            {/* Usta O */}
            <ellipse cx="50" cy="62" rx="10" ry="12" fill="#333" />
          </>
        );
      case 'think':
        return (
          <>
            {/* Oczy patrzą w bok */}
            <circle cx="38" cy="38" r="4" fill="#333" />
            <circle cx="68" cy="38" r="4" fill="#333" />
            {/* Jedna brew uniesiona */}
            <path d="M 25 30 L 42 32" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 28 L 58 34" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            {/* Usta krzywe */}
            <path d="M 35 60 Q 50 55 65 62" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${styles.emoji} ${getAnimationClass()} ${className}`}
      style={{ width: size, height: size }}
    >
      <defs>
        {/* Tęczowy glow - gradient */}
        <radialGradient id={`rainbowGlow-${type}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="40%" stopColor="white" stopOpacity="0.8" />
          <stop offset="55%" stopColor="#ff0000" stopOpacity="0.3" />
          <stop offset="65%" stopColor="#ff7700" stopOpacity="0.25" />
          <stop offset="72%" stopColor="#ffff00" stopOpacity="0.2" />
          <stop offset="79%" stopColor="#00ff00" stopOpacity="0.15" />
          <stop offset="86%" stopColor="#0099ff" stopOpacity="0.1" />
          <stop offset="93%" stopColor="#9900ff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#9900ff" stopOpacity="0" />
        </radialGradient>

        {/* Biały glow dla środka */}
        <filter id={`whiteGlow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Tęczowa poświata - zewnętrzna warstwa */}
      <circle cx="50" cy="50" r="48" fill={`url(#rainbowGlow-${type})`} className={styles.glow} />

      {/* Biała kula - główne słoneczko */}
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="white"
        filter={`url(#whiteGlow-${type})`}
        className={styles.sun}
      />

      {/* Twarz */}
      <g className={styles.face}>
        {getFace()}
      </g>
    </svg>
  );
}

export default RetroEmoji;
