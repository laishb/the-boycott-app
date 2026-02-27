/**
 * Returns the Monday (00:00:00 local) of the current week.
 * @returns {Date}
 */
export function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Returns the Monday (00:00:00 local) of next week.
 * @returns {Date}
 */
export function getWeekEnd() {
  const start = getWeekStart()
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return end
}

/**
 * Returns an ISO week string "YYYY-WXX".
 * @returns {string} e.g. "2026-W09"
 */
export function getWeekId() {
  const monday = getWeekStart()
  const year = monday.getFullYear()
  const weekNum = getISOWeekNumber(monday)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Returns the ISO week number for a given date.
 * @param {Date} date
 * @returns {number}
 */
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Returns a human-readable week label e.g. "Week of Feb 23, 2026".
 * @returns {string}
 */
export function getWeekLabel() {
  const monday = getWeekStart()
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

/**
 * Returns true if the given Firestore Timestamp or Date is within the current week.
 * @param {Date|{toDate: function}} dateOrTimestamp
 * @returns {boolean}
 */
export function isCurrentWeek(dateOrTimestamp) {
  const date = typeof dateOrTimestamp?.toDate === 'function'
    ? dateOrTimestamp.toDate()
    : new Date(dateOrTimestamp)
  const start = getWeekStart()
  const end = getWeekEnd()
  return date >= start && date < end
}
