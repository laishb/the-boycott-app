import { useState, useCallback, useMemo } from 'react'
import { buildShareText, buildWhatsAppUrl, buildFacebookUrl, detectShareCapabilities } from '../utils/shareHelpers.js'

/**
 * Manages the ShareSheet modal lifecycle and all share actions.
 *
 * @param {Array} products — current boycott list (all 5 products, in display order)
 * @returns {{
 *   isOpen: boolean,
 *   openSheet: () => void,
 *   closeSheet: () => void,
 *   selectedIds: Set<string>,
 *   toggleProduct: (productId: string) => void,
 *   note: string,
 *   setNote: (v: string) => void,
 *   shareText: string,
 *   copyStatus: 'idle' | 'copied' | 'error',
 *   capabilities: { hasWebShare: boolean, hasClipboard: boolean },
 *   handleWhatsApp: () => void,
 *   handleFacebook: () => void,
 *   handleNativeShare: () => Promise<void>,
 *   handleCopy: () => Promise<void>,
 * }}
 */
export function useShare(products) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [note, setNote] = useState('')
  const [copyStatus, setCopyStatus] = useState('idle') // 'idle' | 'copied' | 'error'

  const capabilities = useMemo(() => detectShareCapabilities(), [])

  // Opens the modal with all products pre-selected and state reset
  const openSheet = useCallback(() => {
    setSelectedIds(new Set(products.map(p => p.productId)))
    setNote('')
    setCopyStatus('idle')
    setIsOpen(true)
  }, [products])

  const closeSheet = useCallback(() => setIsOpen(false), [])

  const toggleProduct = useCallback((productId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }, [])

  // Derived: selected products in original list order (preserves numbered list)
  const selectedProducts = products.filter(p => selectedIds.has(p.productId))

  const shareText = buildShareText(selectedProducts, note)

  const handleWhatsApp = useCallback(() => {
    window.open(buildWhatsAppUrl(shareText), '_blank', 'noopener,noreferrer')
  }, [shareText])

  const handleFacebook = useCallback(() => {
    window.open(buildFacebookUrl(shareText), '_blank', 'noopener,noreferrer')
  }, [shareText])

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ text: shareText })
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('[useShare] native share failed:', err)
      // AbortError = user cancelled — not an error
    }
  }, [shareText])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2500)
    } catch {
      setCopyStatus('error')
    }
  }, [shareText])

  return {
    isOpen,
    openSheet,
    closeSheet,
    selectedIds,
    toggleProduct,
    note,
    setNote,
    shareText,
    copyStatus,
    capabilities,
    handleWhatsApp,
    handleFacebook,
    handleNativeShare,
    handleCopy,
  }
}
