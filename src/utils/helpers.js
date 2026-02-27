import { PREVIOUS_BOYCOTT_MULTIPLIER } from './constants.js'

/**
 * Applies the previous boycott bonus to a vote count.
 * @param {number} baseVotes
 * @param {boolean} isPreviousBoycott
 * @returns {number}
 */
export function calculateDisplayVotes(baseVotes, isPreviousBoycott) {
  return isPreviousBoycott ? Math.floor(baseVotes * PREVIOUS_BOYCOTT_MULTIPLIER) : baseVotes
}

/**
 * Sorts products descending by displayVotes (bonus applied).
 * @param {Array} products
 * @returns {Array}
 */
export function sortByDisplayVotes(products) {
  return [...products].sort((a, b) => {
    const aVotes = calculateDisplayVotes(a.currentWeekVotes, a.isPreviousBoycott)
    const bVotes = calculateDisplayVotes(b.currentWeekVotes, b.isPreviousBoycott)
    return bVotes - aVotes
  })
}

/**
 * Formats a number as a locale string e.g. 1234 → "1,234".
 * @param {number} n
 * @returns {string}
 */
export function formatVoteCount(n) {
  return n.toLocaleString('en-US')
}

/**
 * Calculates the great-circle distance between two lat/lon points in meters.
 * Uses the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6_371_000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
