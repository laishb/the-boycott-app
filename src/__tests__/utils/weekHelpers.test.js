import { getWeekStart, getWeekEnd, getWeekId, getWeekLabel, isCurrentWeek } from '../../utils/weekHelpers.js'

describe('weekHelpers', () => {
  describe('getWeekStart', () => {
    it('returns a Monday', () => {
      const start = getWeekStart()
      expect(start.getDay()).toBe(1) // 1 = Monday
    })

    it('returns midnight (00:00:00)', () => {
      const start = getWeekStart()
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
      expect(start.getMilliseconds()).toBe(0)
    })

    it('returns a date <= today', () => {
      const start = getWeekStart()
      expect(start.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('getWeekEnd', () => {
    it('is exactly 7 days after getWeekStart', () => {
      const start = getWeekStart()
      const end = getWeekEnd()
      const diff = end.getTime() - start.getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('is also a Monday', () => {
      expect(getWeekEnd().getDay()).toBe(1)
    })
  })

  describe('getWeekId', () => {
    it('returns a string matching YYYY-WXX format', () => {
      const id = getWeekId()
      expect(id).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('week number is between 1 and 53', () => {
      const id = getWeekId()
      const weekNum = parseInt(id.split('-W')[1], 10)
      expect(weekNum).toBeGreaterThanOrEqual(1)
      expect(weekNum).toBeLessThanOrEqual(53)
    })
  })

  describe('getWeekLabel', () => {
    it('contains a month name and year', () => {
      const label = getWeekLabel()
      expect(label).toMatch(/[A-Za-z]+ \d{1,2}, \d{4}/)
    })

    it('starts with "Week of"', () => {
      expect(getWeekLabel()).toMatch(/^Week of /)
    })
  })

  describe('isCurrentWeek', () => {
    it('returns true for now', () => {
      expect(isCurrentWeek(new Date())).toBe(true)
    })

    it('returns false for a date far in the past', () => {
      expect(isCurrentWeek(new Date('2020-01-01'))).toBe(false)
    })

    it('returns false for a date far in the future', () => {
      expect(isCurrentWeek(new Date('2099-01-01'))).toBe(false)
    })

    it('returns true for the week start', () => {
      expect(isCurrentWeek(getWeekStart())).toBe(true)
    })
  })
})
