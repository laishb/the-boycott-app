import { PRODUCT_STATUS } from '../utils/constants.js'

// Auto-generated from Shufersal government price data (store #113).
// In production: auto-imported weekly via Cloud Run Job.
// Products with "משקל" (by weight) removed — these require store scales and don't have fixed prices.

// Current week's boycott list (5 products)
export const MOCK_BOYCOTTED_PRODUCTS = [
  {
    productId: 'prod-001',
    name: "טיים רד פאקט",
    barcode: "7290000302027",
    priceRange: "₪333–497",
    currentWeekVotes: 900,
    weeklyLikes: 1100,
    totalHistoricalVotes: 2700,
    isPreviousBoycott: true,
    previousBoycottWeeks: ["2026-W07"],
    status: PRODUCT_STATUS.BOYCOTTED,
    createdAt: new Date('2026-02-01'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-002',
    name: "טיים רד ארוך פאקט",
    barcode: "7290000302041",
    priceRange: "₪371–459",
    currentWeekVotes: 800,
    weeklyLikes: 1000,
    totalHistoricalVotes: 2400,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.BOYCOTTED,
    createdAt: new Date('2026-02-01'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-004',
    name: "סלמון מעושן פסקאדו",
    barcode: "7290009957174",
    priceRange: "₪207–271",
    currentWeekVotes: 600,
    weeklyLikes: 800,
    totalHistoricalVotes: 1800,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.BOYCOTTED,
    createdAt: new Date('2026-02-01'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-007',
    name: "משולש מנצ'גו 39%",
    barcode: "7290002385738",
    priceRange: "₪144–234",
    currentWeekVotes: 585,
    weeklyLikes: 720,
    totalHistoricalVotes: 585,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.BOYCOTTED,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-011',
    name: "גאודה תום עיזים 30%",
    barcode: "7290000571188",
    priceRange: "₪155–203",
    currentWeekVotes: 525,
    weeklyLikes: 650,
    totalHistoricalVotes: 525,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.BOYCOTTED,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
]

// Active products - candidates for next week's boycott list
export const MOCK_ACTIVE_PRODUCTS = [
  {
    productId: 'prod-025',
    name: "אנטריקוט טרי מוכשר",
    barcode: "7290009393125",
    priceRange: "₪120–198",
    currentWeekVotes: 315,
    totalHistoricalVotes: 315,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-027',
    name: "נתחי סלמון טרי שופרסל",
    barcode: "7290009011128",
    priceRange: "₪132–168",
    currentWeekVotes: 285,
    totalHistoricalVotes: 285,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-032',
    name: "חזה אווז קפוא",
    barcode: "7290002403517",
    priceRange: "₪117–181",
    currentWeekVotes: 210,
    totalHistoricalVotes: 210,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-033',
    name: "וודקה ואן גוך אסאי 750ml",
    barcode: "633824913432",
    priceRange: "₪118–172",
    currentWeekVotes: 195,
    totalHistoricalVotes: 195,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-034',
    name: "פילה דג דניס טרי",
    barcode: "7290009013023",
    priceRange: "₪105–175",
    currentWeekVotes: 180,
    totalHistoricalVotes: 180,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-035',
    name: "פילה לברק טרי",
    barcode: "7290009392012",
    priceRange: "₪118–162",
    currentWeekVotes: 165,
    totalHistoricalVotes: 165,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-036',
    name: "סינתה טרי מוכשר",
    barcode: "7290009393101",
    priceRange: "₪114–166",
    currentWeekVotes: 150,
    totalHistoricalVotes: 150,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-037',
    name: "וויסקי שיבאס ריגאל 700ml",
    barcode: "80432402931",
    priceRange: "₪108–172",
    currentWeekVotes: 135,
    totalHistoricalVotes: 135,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-038',
    name: "כתף בקר מעושן",
    barcode: "7290000530444",
    priceRange: "₪112–166",
    currentWeekVotes: 120,
    totalHistoricalVotes: 120,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-046',
    name: "פילה דג ברמונדי טרי",
    barcode: "7290009391985",
    priceRange: "₪116–154",
    currentWeekVotes: 0,
    totalHistoricalVotes: 0,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-049',
    name: "וודקה גריי גוס 750ml",
    barcode: "5010677850100",
    priceRange: "₪104–156",
    currentWeekVotes: 0,
    totalHistoricalVotes: 0,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
  {
    productId: 'prod-050',
    name: "ג'ק דניאלס טנסי דבש 700ml",
    barcode: "5099873001370",
    priceRange: "₪109–151",
    currentWeekVotes: 0,
    totalHistoricalVotes: 0,
    isPreviousBoycott: false,
    previousBoycottWeeks: [],
    status: PRODUCT_STATUS.ACTIVE,
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-24'),
  },
]

// In-memory vote store (mock mode)
let mockVotes = []
export function getMockVotes() { return mockVotes }
export function addMockVote(vote) { mockVotes.push(vote) }
export function resetMockVotes() { mockVotes = [] }

let productVoteCounts = Object.fromEntries(
  [...MOCK_BOYCOTTED_PRODUCTS, ...MOCK_ACTIVE_PRODUCTS].map(p => [p.productId, p.currentWeekVotes])
)
export function getMockVoteCount(productId) { return productVoteCounts[productId] ?? 0 }
export function incrementMockVoteCounts(productIds) {
  productIds.forEach(id => { if (id in productVoteCounts) productVoteCounts[id] += 1 })
}

// In-memory like store (mock mode)
let mockLikes = []
export function getMockLikes() { return mockLikes }
export function addMockLike(like) { mockLikes.push(like) }
export function resetMockLikes() { mockLikes = [] }
export function hasUserLikedProduct(uid, productId, weekId) {
  return mockLikes.some(l => l.userId === uid && l.productId === productId && l.weekId === weekId)
}

let productLikeCounts = Object.fromEntries(
  MOCK_BOYCOTTED_PRODUCTS.map(p => [p.productId, p.weeklyLikes ?? 0])
)
export function getMockLikeCount(productId) { return productLikeCounts[productId] ?? 0 }
export function incrementMockLikeCount(productId) {
  if (productId in productLikeCounts) productLikeCounts[productId] += 1
}
