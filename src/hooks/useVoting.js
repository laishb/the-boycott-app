import { useState, useEffect, useCallback } from 'react'
import { getVotableProducts } from '../services/api.js'
import { hasVotedThisWeek, castVote } from '../services/voting.js'
import { sortByDisplayVotes } from '../utils/helpers.js'
import { WEEK_VOTE_LIMIT, PRODUCT_STATUS } from '../utils/constants.js'

/**
 * Manages voting state: product lists (boycotted + active), selection, and submission.
 * @param {object|null} user  Current authenticated user (or null)
 * @returns {{
 *   boycottedProducts: Array,   products currently boycotted (can be re-voted to keep)
 *   activeProducts: Array,      products available to add to next week's list
 *   isLoading: boolean,
 *   error: string|null,
 *   selectedIds: Set,
 *   toggleProduct: function,
 *   handleSubmitVote: function,
 *   hasVoted: boolean,
 *   isSubmitting: boolean,
 *   submitError: string|null,
 *   selectionCount: number,
 * }}
 */
export function useVoting(user) {
  const [boycottedProducts, setBoycottedProducts] = useState([])
  const [activeProducts, setActiveProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetches = [
      getVotableProducts(),
      user ? hasVotedThisWeek(user.uid) : Promise.resolve(false),
    ]

    Promise.all(fetches)
      .then(([allProducts, voted]) => {
        if (!cancelled) {
          const sorted = sortByDisplayVotes(allProducts)
          setBoycottedProducts(sorted.filter(p => p.status === PRODUCT_STATUS.BOYCOTTED))
          setActiveProducts(sorted.filter(p => p.status === PRODUCT_STATUS.ACTIVE))
          setHasVoted(voted)
          setIsLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load products.')
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  const toggleProduct = useCallback((productId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else if (next.size < WEEK_VOTE_LIMIT) {
        next.add(productId)
      }
      return next
    })
  }, [])

  const handleSubmitVote = useCallback(async () => {
    if (!user) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await castVote(user.uid, Array.from(selectedIds))
      setHasVoted(true)
      setSelectedIds(new Set())
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit vote.')
    } finally {
      setIsSubmitting(false)
    }
  }, [user, selectedIds])

  return {
    boycottedProducts,
    activeProducts,
    isLoading,
    error,
    selectedIds,
    toggleProduct,
    handleSubmitVote,
    hasVoted,
    isSubmitting,
    submitError,
    selectionCount: selectedIds.size,
  }
}
