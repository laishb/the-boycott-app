import { useEffect, useRef } from 'react'
import { X, MessageCircle, Facebook, Share2, Copy, Check } from 'lucide-react'
import { SHARE_NOTE_MAX } from '../utils/constants.js'

/**
 * ShareSheet — bottom-sheet modal for composing and sharing the boycott list.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   products: Array,                          all 5 boycotted products (for selection UI)
 *   selectedIds: Set<string>,
 *   onToggleProduct: (id: string) => void,
 *   note: string,
 *   onNoteChange: (v: string) => void,
 *   copyStatus: 'idle' | 'copied' | 'error',
 *   capabilities: { hasWebShare: boolean, hasClipboard: boolean },
 *   onWhatsApp: () => void,
 *   onFacebook: () => void,
 *   onNativeShare: () => void,
 *   onCopy: () => void,
 * }} props
 */
export default function ShareSheet({
  isOpen,
  onClose,
  products,
  selectedIds,
  onToggleProduct,
  note,
  onNoteChange,
  copyStatus,
  capabilities,
  onWhatsApp,
  onFacebook,
  onNativeShare,
  onCopy,
}) {
  const closeRef = useRef(null)

  // Focus close button on open (accessibility)
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedCount = selectedIds.size

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-sheet-title"
          dir="rtl"
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm pointer-events-auto flex flex-col max-h-[90dvh]"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
            <h2 id="share-sheet-title" className="text-xl font-extrabold text-gray-900">
              שתף את החרם שלי 🚫
            </h2>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="סגור"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-5 pb-2">
            <p className="text-base text-gray-500 mb-3">בחר/י את המוצרים לשיתוף:</p>

            <ul className="flex flex-col gap-2 mb-5" aria-label="מוצרים לשיתוף">
              {products.map((product, i) => {
                const selected = selectedIds.has(product.productId)
                return (
                  <li key={product.productId}>
                    <button
                      onClick={() => onToggleProduct(product.productId)}
                      aria-pressed={selected}
                      className={[
                        'w-full flex items-center gap-3 min-h-[52px] px-4 py-2 rounded-xl border-2 transition-colors text-right',
                        selected
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50',
                      ].join(' ')}
                    >
                      {/* Rank badge — dir=rtl so this appears on the visual left */}
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-semibold text-gray-900 block truncate">
                          {product.name}
                        </span>
                        {product.priceRange && (
                          <span className="text-sm text-gray-500">{product.priceRange}</span>
                        )}
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={[
                          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          selected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {selected && <Check size={14} />}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Personal note */}
            <label htmlFor="share-note" className="block text-base font-semibold text-gray-700 mb-2">
              הוסף/י הערה אישית (אופציונלי):
            </label>
            <textarea
              id="share-note"
              value={note}
              onChange={e => onNoteChange(e.target.value)}
              maxLength={SHARE_NOTE_MAX}
              rows={3}
              dir="rtl"
              placeholder="למה אתה/את מחרים?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            {/* char counter — ltr so "35/140" reads left-to-right */}
            <p className="text-xs text-gray-400 mt-1" dir="ltr">
              {note.length}/{SHARE_NOTE_MAX}
            </p>
          </div>

          {/* ── Sticky footer: share buttons ── */}
          <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-gray-100">
            {selectedCount === 0 && (
              <p className="text-sm text-center text-red-500 mb-3" role="alert">
                יש לבחור לפחות מוצר אחד
              </p>
            )}

            <div className="flex flex-col gap-3">
              {/* WhatsApp — always present, highest priority for IL market */}
              <button
                onClick={onWhatsApp}
                disabled={selectedCount === 0}
                className="flex items-center justify-center gap-2 min-h-[52px] w-full rounded-2xl bg-green-500 text-white text-lg font-semibold hover:bg-green-600 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <MessageCircle size={22} aria-hidden="true" />
                שתף בוואטסאפ
              </button>

              {/* Facebook — always present */}
              <button
                onClick={onFacebook}
                disabled={selectedCount === 0}
                className="flex items-center justify-center gap-2 min-h-[52px] w-full rounded-2xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Facebook size={22} aria-hidden="true" />
                שתף בפייסבוק
              </button>

              {/* Native share sheet — only on devices that support it */}
              {capabilities.hasWebShare && (
                <button
                  onClick={onNativeShare}
                  disabled={selectedCount === 0}
                  className="flex items-center justify-center gap-2 min-h-[52px] w-full rounded-2xl bg-red-600 text-white text-lg font-semibold hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Share2 size={22} aria-hidden="true" />
                  שתף עוד...
                </button>
              )}

              {/* Copy to clipboard — universal fallback, always shown */}
              <button
                onClick={onCopy}
                disabled={selectedCount === 0 || copyStatus === 'copied'}
                className={[
                  'flex items-center justify-center gap-2 min-h-[48px] w-full rounded-2xl border-2 text-base font-semibold transition-colors',
                  copyStatus === 'copied'
                    ? 'border-green-400 bg-green-50 text-green-600 cursor-default'
                    : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {copyStatus === 'copied' ? (
                  <>
                    <Check size={20} aria-hidden="true" /> הועתק!
                  </>
                ) : (
                  <>
                    <Copy size={20} aria-hidden="true" /> העתק טקסט
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
