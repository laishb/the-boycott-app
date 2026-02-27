const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { BOYCOTT_LIST_SIZE } = require('./constants.js')

/**
 * Runs every Monday at 00:00 UTC.
 * 1. Finds the top N products by currentWeekVotes.
 * 2. Sets those products' status to 'boycotted' (and marks isPreviousBoycott).
 * 3. Returns all other products to 'active'.
 * 4. Resets currentWeekVotes to 0 on all products.
 * 5. Archives old votes.
 */
exports.weeklyReset = onSchedule('every monday 00:00', async (event) => {
  const db = admin.firestore()
  const now = new Date()
  const weekId = getWeekId(now)

  // 1. Get all active + boycotted products
  const productsSnap = await db.collection('products')
    .where('status', 'in', ['active', 'boycotted'])
    .get()

  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // 2. Sort by currentWeekVotes descending
  products.sort((a, b) => (b.currentWeekVotes || 0) - (a.currentWeekVotes || 0))

  const top5 = products.slice(0, BOYCOTT_LIST_SIZE).map(p => p.id)
  const rest = products.slice(BOYCOTT_LIST_SIZE).map(p => p.id)

  // 3. Batch update all products
  const batch = db.batch()

  top5.forEach(productId => {
    const ref = db.collection('products').doc(productId)
    const product = products.find(p => p.id === productId)
    const prevWeeks = product.previousBoycottWeeks || []
    batch.update(ref, {
      status: 'boycotted',
      isPreviousBoycott: true,
      previousBoycottWeeks: [...prevWeeks, weekId],
      currentWeekVotes: 0,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  rest.forEach(productId => {
    const ref = db.collection('products').doc(productId)
    batch.update(ref, {
      status: 'active',
      currentWeekVotes: 0,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  await batch.commit()

  // 4. Archive votes from the previous week
  const prevWeekId = getWeekId(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  const votesSnap = await db.collection('votes')
    .where('weekId', '==', prevWeekId)
    .get()

  if (!votesSnap.empty) {
    const archiveBatch = db.batch()
    votesSnap.docs.forEach(doc => {
      const archiveRef = db.collection('votes_archive').doc(doc.id)
      archiveBatch.set(archiveRef, { ...doc.data(), archivedAt: admin.firestore.FieldValue.serverTimestamp() })
      archiveBatch.delete(doc.ref)
    })
    await archiveBatch.commit()
  }

  console.log(`[weeklyReset] Done. Week ${weekId}: boycotted=${top5.join(', ')}`)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekId(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}
