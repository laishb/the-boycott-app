// api.js — Data abstraction layer
// Switches between mock data and real Firebase based on VITE_USE_MOCK env var.
// All hooks and components import only from this file, never directly from mockData or Firebase.

import {
  MOCK_BOYCOTTED_PRODUCTS,
  MOCK_ACTIVE_PRODUCTS,
  getMockVotes,
  addMockVote,
  incrementMockVoteCounts,
  getMockVoteCount,
  getMockLikes,
  addMockLike,
  hasUserLikedProduct,
  getMockLikeCount,
  incrementMockLikeCount,
} from '../data/mockData.js'
import { getWeekId } from '../utils/weekHelpers.js'
import { calculateDisplayVotes } from '../utils/helpers.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// ─── Mock Implementations ─────────────────────────────────────────────────────

function withDisplayVotes(products) {
  return products.map(p => ({
    ...p,
    currentWeekVotes: getMockVoteCount(p.productId),
    displayVotes: calculateDisplayVotes(getMockVoteCount(p.productId), p.isPreviousBoycott),
  }))
}

async function mockGetCurrentBoycottList() {
  await delay(200)
  return withDisplayVotes(MOCK_BOYCOTTED_PRODUCTS)
}

// Returns all voteable products: current boycott list + active candidates.
// Used by VoteScreen so users can vote to keep boycotted products OR add new ones.
async function mockGetVotableProducts() {
  await delay(200)
  return withDisplayVotes([...MOCK_BOYCOTTED_PRODUCTS, ...MOCK_ACTIVE_PRODUCTS])
}

async function mockGetUserVoteThisWeek(uid) {
  await delay(100)
  const weekId = getWeekId()
  return getMockVotes().find(v => v.userId === uid && v.weekId === weekId) || null
}

async function mockSubmitVote(uid, productIds) {
  await delay(300)
  const weekId = getWeekId()
  addMockVote({
    voteId: `vote-${Date.now()}`,
    userId: uid,
    productIds,
    weekId,
    timestamp: new Date(),
  })
  incrementMockVoteCounts(productIds)
}

async function mockGetUserLikedProducts(uid) {
  await delay(100)
  const weekId = getWeekId()
  const ids = getMockLikes()
    .filter(l => l.userId === uid && l.weekId === weekId)
    .map(l => l.productId)
  return new Set(ids)
}

async function mockLikeProduct(uid, productId) {
  await delay(150)
  const weekId = getWeekId()
  if (hasUserLikedProduct(uid, productId, weekId)) {
    throw new Error('Already liked this product this week')
  }
  addMockLike({ userId: uid, productId, weekId, timestamp: new Date() })
  incrementMockLikeCount(productId)
  return getMockLikeCount(productId)
}

async function mockGetUserProfile(uid) {
  await delay(100)
  return {
    userId: uid,
    email: 'demo@example.com',
    displayName: 'Demo User',
    totalVotes: 3,
  }
}

// ─── Firebase Implementations ─────────────────────────────────────────────────

async function fbGetCurrentBoycottList() {
  const { db } = await import('./firebase.js')
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const q = query(collection(db, 'products'), where('status', '==', 'boycotted'))
  const snap = await getDocs(q)
  return snap.docs.map(doc => {
    const d = doc.data()
    return {
      ...d,
      productId: doc.id,
      displayVotes: calculateDisplayVotes(d.currentWeekVotes || 0, d.isPreviousBoycott),
    }
  })
}

async function fbGetVotableProducts() {
  const { db } = await import('./firebase.js')
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const q = query(collection(db, 'products'), where('status', 'in', ['boycotted', 'active']))
  const snap = await getDocs(q)
  return snap.docs.map(doc => {
    const d = doc.data()
    return {
      ...d,
      productId: doc.id,
      displayVotes: calculateDisplayVotes(d.currentWeekVotes || 0, d.isPreviousBoycott),
    }
  })
}

async function fbGetUserVoteThisWeek(uid) {
  const { db } = await import('./firebase.js')
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const weekId = getWeekId()
  const q = query(
    collection(db, 'votes'),
    where('userId', '==', uid),
    where('weekId', '==', weekId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { voteId: snap.docs[0].id, ...snap.docs[0].data() }
}

async function fbSubmitVote(uid, productIds) {
  const { db } = await import('./firebase.js')
  const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore')

  const weekId = getWeekId()

  // Create the vote document
  await addDoc(collection(db, 'votes'), {
    userId: uid,
    productIds,
    weekId,
    timestamp: serverTimestamp(),
  })

  // Increment vote counts on each product
  for (const pid of productIds) {
    const productRef = doc(db, 'products', pid)
    await updateDoc(productRef, {
      currentWeekVotes: increment(1),
      totalHistoricalVotes: increment(1),
    })
  }
}

async function fbGetUserLikedProducts(uid) {
  const { db } = await import('./firebase.js')
  const { collection, query, where, getDocs } = await import('firebase/firestore')

  const weekId = getWeekId()
  const q = query(
    collection(db, 'likes'),
    where('userId', '==', uid),
    where('weekId', '==', weekId)
  )
  const snap = await getDocs(q)
  return new Set(snap.docs.map(d => d.data().productId))
}

async function fbLikeProduct(uid, productId) {
  const { db } = await import('./firebase.js')
  const { collection, addDoc, doc, updateDoc, increment, query, where, getDocs, serverTimestamp } = await import('firebase/firestore')

  const weekId = getWeekId()

  // Check if already liked
  const q = query(
    collection(db, 'likes'),
    where('userId', '==', uid),
    where('productId', '==', productId),
    where('weekId', '==', weekId)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    throw new Error('Already liked this product this week')
  }

  await addDoc(collection(db, 'likes'), {
    userId: uid,
    productId,
    weekId,
    timestamp: serverTimestamp(),
  })

  // Increment like count on product
  const productRef = doc(db, 'products', productId)
  await updateDoc(productRef, { weeklyLikes: increment(1) })

  // Return updated count (read it back)
  const { getDoc } = await import('firebase/firestore')
  const updated = await getDoc(productRef)
  return updated.data()?.weeklyLikes || 0
}

async function fbGetUserProfile(uid) {
  const { db } = await import('./firebase.js')
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')

  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    return { userId: uid, ...snap.data() }
  }

  // Auto-create profile on first access
  const profile = {
    userId: uid,
    createdAt: serverTimestamp(),
    totalVotes: 0,
  }
  await setDoc(userRef, profile)
  return profile
}

// ─── Exported API ─────────────────────────────────────────────────────────────

export const getCurrentBoycottList = USE_MOCK ? mockGetCurrentBoycottList : fbGetCurrentBoycottList
export const getVotableProducts = USE_MOCK ? mockGetVotableProducts : fbGetVotableProducts
export const getUserVoteThisWeek = USE_MOCK ? mockGetUserVoteThisWeek : fbGetUserVoteThisWeek
export const submitVote = USE_MOCK ? mockSubmitVote : fbSubmitVote
export const getUserProfile = USE_MOCK ? mockGetUserProfile : fbGetUserProfile
export const getUserLikedProducts = USE_MOCK ? mockGetUserLikedProducts : fbGetUserLikedProducts
export const likeProduct = USE_MOCK ? mockLikeProduct : fbLikeProduct

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
