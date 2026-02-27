import { PRODUCT_NAME_MIN, PRODUCT_NAME_MAX, PRODUCT_REASON_MIN, PRODUCT_REASON_MAX } from './constants.js'

/**
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateProductName(name) {
  const trimmed = (name || '').trim()
  if (trimmed.length < PRODUCT_NAME_MIN) {
    return { valid: false, error: `Name must be at least ${PRODUCT_NAME_MIN} characters.` }
  }
  if (trimmed.length > PRODUCT_NAME_MAX) {
    return { valid: false, error: `Name must be ${PRODUCT_NAME_MAX} characters or fewer.` }
  }
  return { valid: true, error: null }
}

/**
 * @param {string} reason
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateProductReason(reason) {
  const trimmed = (reason || '').trim()
  if (trimmed.length < PRODUCT_REASON_MIN) {
    return { valid: false, error: `Reason must be at least ${PRODUCT_REASON_MIN} characters.` }
  }
  if (trimmed.length > PRODUCT_REASON_MAX) {
    return { valid: false, error: `Reason must be ${PRODUCT_REASON_MAX} characters or fewer.` }
  }
  return { valid: true, error: null }
}
