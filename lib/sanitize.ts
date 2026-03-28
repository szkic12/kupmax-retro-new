/**
 * Input sanitization utilities
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for HTML display
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize user input for storage
 * - Escapes HTML characters
 * - Trims whitespace
 * - Validates string type
 * @param input - The user input to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  const trimmed = input.trim();
  
  if (trimmed.length > maxLength) {
    return escapeHtml(trimmed.substring(0, maxLength));
  }

  return escapeHtml(trimmed);
}
