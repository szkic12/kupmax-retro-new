'use client';

import React from 'react';
import { RetroEmoji, emojiCodes, EmojiType } from './RetroEmoji';

interface EmojiParserProps {
  text: string;
  emojiSize?: number;
}

/**
 * Komponent parsujący tekst i zamieniający kody emotek na animowane SVG
 * np. "Cześć :) Jak się masz? :D" -> "Cześć [emoji] Jak się masz? [emoji]"
 */
export function EmojiParser({ text, emojiSize = 20 }: EmojiParserProps) {
  const parseText = () => {
    if (!text) return null;

    const parts: (string | React.ReactElement)[] = [];
    let remainingText = text;
    let keyIndex = 0;

    // Sortuj kody od najdłuższych (żeby :-) było przed :))
    const sortedCodes = Object.keys(emojiCodes).sort((a, b) => b.length - a.length);

    while (remainingText.length > 0) {
      let foundEmoji = false;

      for (const code of sortedCodes) {
        const index = remainingText.indexOf(code);

        if (index === 0) {
          // Emoji na początku
          const emojiType = emojiCodes[code];
          parts.push(
            <RetroEmoji
              key={`emoji-${keyIndex++}`}
              type={emojiType}
              size={emojiSize}
            />
          );
          remainingText = remainingText.slice(code.length);
          foundEmoji = true;
          break;
        } else if (index > 0) {
          // Tekst przed emoji
          parts.push(remainingText.slice(0, index));
          const emojiType = emojiCodes[code];
          parts.push(
            <RetroEmoji
              key={`emoji-${keyIndex++}`}
              type={emojiType}
              size={emojiSize}
            />
          );
          remainingText = remainingText.slice(index + code.length);
          foundEmoji = true;
          break;
        }
      }

      if (!foundEmoji) {
        // Nie znaleziono emoji - dodaj cały pozostały tekst
        parts.push(remainingText);
        break;
      }
    }

    return parts;
  };

  return <>{parseText()}</>;
}

export default EmojiParser;
