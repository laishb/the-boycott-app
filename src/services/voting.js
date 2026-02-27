import { getUserVoteThisWeek, submitVote } from './api.js'
import { WEEK_VOTE_LIMIT } from '../utils/constants.js'

/**
 * Checks if the given user has already voted this week.
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function hasVotedThisWeek(uid) {
  const vote = await getUserVoteThisWeek(uid)
  return vote !== null
}

/**
 * Casts a vote for the given product IDs on behalf of the user.
 * Enforces: user not already voted, 1–WEEK_VOTE_LIMIT products selected.
 * @param {string} uid
 * @param {string[]} productIds
 * @returns {Promise<void>}
 * @throws {Error} if validation fails
 */
export async function castVote(uid, productIds) {
  if (!uid) throw new Error('Must be signed in to vote.')
  if (!productIds || productIds.length === 0) throw new Error('Select at least one product.')
  if (productIds.length > WEEK_VOTE_LIMIT) {
    throw new Error(`You can select up to ${WEEK_VOTE_LIMIT} products.`)
  }

  const alreadyVoted = await hasVotedThisWeek(uid)
  if (alreadyVoted) throw new Error('You have already voted this week.')

  await submitVote(uid, productIds)
}
