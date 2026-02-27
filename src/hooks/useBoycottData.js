import { useState, useEffect } from 'react'
import { getCurrentBoycottList } from '../services/api.js'
import { sortByDisplayVotes } from '../utils/helpers.js'
import { getWeekLabel, getWeekId } from '../utils/weekHelpers.js'

/**
 * Fetches and returns the current week's boycott product list.
 * @returns {{ products: Array, isLoading: boolean, error: string|null, weekLabel: string, weekId: string }}
 */
export function useBoycottData() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getCurrentBoycottList()
      .then(data => {
        if (!cancelled) {
          setProducts(sortByDisplayVotes(data))
          setIsLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load boycott list.')
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  return {
    products,
    isLoading,
    error,
    weekLabel: getWeekLabel(),
    weekId: getWeekId(),
  }
}
