import { useState, useEffect, useCallback } from 'react'
import { getUserLikedProducts, likeProduct } from '../services/api.js'

/**
 * Tracks which boycotted products the current user has liked this week,
 * and provides a handler to like a product (one like per product per week).
 *
 * @param {object|null} user  Current authenticated user (or null)
 * @param {Array} products    Current boycott list products (to seed initial like counts)
 * @returns {{
 *   likedIds: Set,           productIds the user has already liked this week
 *   likeCounts: object,      { [productId]: number } — optimistically updated
 *   handleLike: function,    (productId) => void
 * }}
 */
export function useBoycottLikes(user, products) {
  const [likedIds, setLikedIds] = useState(new Set())
  const [likeCounts, setLikeCounts] = useState({})

  // Seed like counts from product data
  useEffect(() => {
    const counts = {}
    products.forEach(p => { counts[p.productId] = p.weeklyLikes ?? 0 })
    setLikeCounts(counts)
  }, [products])

  // Fetch which products this user has already liked this week
  useEffect(() => {
    if (!user) {
      setLikedIds(new Set())
      return
    }
    getUserLikedProducts(user.uid).then(ids => setLikedIds(ids))
  }, [user])

  const handleLike = useCallback(async (productId) => {
    if (!user || likedIds.has(productId)) return

    // Optimistic update
    setLikedIds(prev => new Set([...prev, productId]))
    setLikeCounts(prev => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }))

    try {
      await likeProduct(user.uid, productId)
    } catch {
      // Revert on error
      setLikedIds(prev => { const next = new Set(prev); next.delete(productId); return next })
      setLikeCounts(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] ?? 1) - 1) }))
    }
  }, [user, likedIds])

  return { likedIds, likeCounts, handleLike }
}
