import { DEFAULT_APP_URL, SHARE_HASHTAG } from './constants.js'

// Get app URL from Vite env at runtime
const APP_URL = import.meta.env.VITE_APP_URL || DEFAULT_APP_URL

/**
 * Builds the Hebrew share text from a subset of products.
 *
 * @param {Array<{name: string, priceRange?: string}>} selectedProducts
 *   — ordered subset the user chose; numbering always starts at 1.
 * @param {string} personalNote — trimmed before use; omitted if empty.
 * @returns {string}
 */
export function buildShareText(selectedProducts, personalNote) {
  const lines = ['🚫 אני מחרים השבוע:\n']

  selectedProducts.forEach((p, i) => {
    const price = p.priceRange ? ` (${p.priceRange})` : ''
    lines.push(`${i + 1}. ${p.name}${price}`)
  })

  const trimmedNote = personalNote?.trim() ?? ''
  if (trimmedNote) {
    lines.push('')
    lines.push(trimmedNote)
  }

  lines.push('')
  lines.push(`הצטרפ/י גם אתם! 👉 ${APP_URL}`)
  lines.push(SHARE_HASHTAG)

  return lines.join('\n')
}

/**
 * Returns browser share capability flags.
 * Called at render time — cheap; no memoization needed.
 * @returns {{ hasWebShare: boolean, hasClipboard: boolean }}
 */
export function detectShareCapabilities() {
  return {
    hasWebShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    hasClipboard:
      typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function',
  }
}

/**
 * Builds the WhatsApp share URL (works on mobile app + web.whatsapp.com).
 * @param {string} text
 * @returns {string}
 */
export function buildWhatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Builds the Facebook share URL.
 * Facebook doesn't accept pre-filled text, but quote param is supported on mobile web.
 * @param {string} shareText
 * @returns {string}
 */
export function buildFacebookUrl(shareText) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}&quote=${encodeURIComponent(shareText)}`
}
