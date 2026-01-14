'use client';

import { useState, useRef } from 'react';
import { useGuestbook } from '../../hooks/useGuestbook';
import styles from './GuestbookForm.module.scss';
import { EmojiPicker } from '../RetroEmoji';

/**
 * Komponent formularza do dodawania wpisów do gośćca
 */
export default function GuestbookForm({ productRef = null, onSuccess = null }) {
  // Stan formularza
  const [formData, setFormData] = useState({
    nickname: '',
    message: '',
    email: ''
  });

  // Stan walidacji
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Hook do obsługi gośćca
  const { addGuestbookPost, isLoading, error } = useGuestbook();

  // Ref do textarea dla wstawiania emotek
  const messageRef = useRef(null);

  /**
   * Walidacja formularza
   */
  const validateForm = () => {
    const newErrors = {};

    // Walidacja pseudonimu
    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Pseudonim jest wymagany';
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = 'Pseudonim musi mieć co najmniej 2 znaki';
    } else if (formData.nickname.length > 40) {
      newErrors.nickname = 'Pseudonim nie może przekraczać 40 znaków';
    }

    // Walidacja wiadomości
    if (!formData.message.trim()) {
      newErrors.message = 'Wiadomość jest wymagana';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Wiadomość musi mieć co najmniej 10 znaków';
    } else if (formData.message.length > 280) {
      newErrors.message = 'Wiadomość nie może przekraczać 280 znaków';
    }

    // Walidacja email (opcjonalna)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Obsługa zmiany wartości w formularzu
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Usuń błąd dla tego pola przy zmianie
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Wstawia emotkę do pola wiadomości
   */
  const handleEmojiSelect = (emojiCode) => {
    const textarea = messageRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.message;
      const newText = text.substring(0, start) + emojiCode + text.substring(end);

      setFormData(prev => ({ ...prev, message: newText }));

      // Ustaw kursor za wstawioną emotką
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emojiCode.length;
        textarea.focus();
      }, 0);
    } else {
      // Fallback - dodaj na końcu
      setFormData(prev => ({ ...prev, message: prev.message + emojiCode }));
    }
  };

  /**
   * Obsługa wysłania formularza
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitted(false);

    try {
      const result = await addGuestbookPost({
        nickname: formData.nickname.trim(),
        message: formData.message.trim(),
        email: formData.email.trim() || null,
        productRef: productRef
      });

      if (result.success) {
        // Reset formularza
        setFormData({
          nickname: '',
          message: '',
          email: ''
        });
        setSubmitted(true);

        // Wywołaj callback jeśli został przekazany
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        console.error('Błąd podczas dodawania wpisu:', result.error);
        setErrors({ submit: result.error || 'Wystąpił błąd podczas dodawania wpisu' });
      }
    } catch (err) {
      console.error('Nieoczekiwany błąd:', err);
      setErrors({ submit: 'Wystąpił nieoczekiwany błąd' });
    }
  };

  // Jeśli wpis został pomyślnie dodany
  if (submitted) {
    return (
      <div className={styles.successMessage}>
        <h3>✅ Dziękujemy!</h3>
        <p>Twój wpis został dodany do gościa!</p>
        <button 
          className={styles.addAnotherButton}
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Dodaj kolejny wpis
        </button>
      </div>
    );
  }

  return (
    <div className={styles.guestbookForm}>
      <h3>📝 Dodaj wpis</h3>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Pole pseudonimu */}
        <div className={styles.fieldGroup}>
          <label htmlFor="nickname" className={styles.label}>
            Pseudonim *
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className={`${styles.input} ${errors.nickname ? styles.inputError : ''}`}
            placeholder="Wpisz swój pseudonim"
            maxLength="40"
            disabled={isLoading}
          />
          {errors.nickname && (
            <span className={styles.errorText}>{errors.nickname}</span>
          )}
        </div>

        {/* Pole email (opcjonalne) */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email (opcjonalnie)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            placeholder="twoj@email.com"
            disabled={isLoading}
          />
          {errors.email && (
            <span className={styles.errorText}>{errors.email}</span>
          )}
        </div>

        {/* Pole wiadomości */}
        <div className={styles.fieldGroup}>
          <label htmlFor="message" className={styles.label}>
            Wiadomość *
          </label>
          <div className={styles.messageWrapper}>
            <textarea
              ref={messageRef}
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
              placeholder="Podziel się swoimi przemyśleniami... Użyj :) :D ;) itp."
              rows="4"
              maxLength="280"
              disabled={isLoading}
            />
            <div className={styles.emojiPickerWrapper}>
              <EmojiPicker onSelect={handleEmojiSelect} size={36} />
            </div>
          </div>
          <div className={styles.charCounter}>
            {formData.message.length}/280 | Emotki: :) :D ;) :( :P {"<3"} 8) {">:("} :O :/
          </div>
          {errors.message && (
            <span className={styles.errorText}>{errors.message}</span>
          )}
        </div>

        {/* Produkt (jeśli przekazany) */}
        {productRef && (
          <div className={styles.productRef}>
            <small>💡 Wpis dotyczy produktu: <strong>{productRef}</strong></small>
          </div>
        )}

        {/* Błędy ogólne */}
        {(errors.submit || error) && (
          <div className={styles.errorMessage}>
            {errors.submit || error?.message || 'Wystąpił błąd'}
          </div>
        )}

        {/* Przycisk wysłania */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Dodawanie...
            </>
          ) : (
            '✉️ Dodaj wpis'
          )}
        </button>
      </form>
    </div>
  );
}
