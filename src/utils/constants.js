export const APP_NAME = 'Weekly Boycott'

export const WEEK_VOTE_LIMIT = 5 // max products a user can select per vote submission
export const PREVIOUS_BOYCOTT_MULTIPLIER = 1.5
export const BOYCOTT_LIST_SIZE = 5 // how many products are in each week's boycott list

export const MIN_FONT_SIZE = 16 // px
export const MIN_TOUCH_TARGET = 44 // px

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  BOYCOTTED: 'boycotted',
  ARCHIVED: 'archived',
}

export const PRODUCT_NAME_MIN = 2
export const PRODUCT_NAME_MAX = 80
export const PRODUCT_REASON_MIN = 10
export const PRODUCT_REASON_MAX = 300

// Social sharing
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://boycott.app'
export const SHARE_NOTE_MAX = 140
export const SHARE_HASHTAG = '#חרם_שבועי'
