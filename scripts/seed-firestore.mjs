/**
 * Seed Firestore with product data from mockData.
 * Usage: FIREBASE_API_KEY=... node scripts/seed-firestore.mjs
 * Load from .env.local or set as environment variable
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: 'the-boycott-app.firebaseapp.com',
  projectId: 'the-boycott-app',
  storageBucket: 'the-boycott-app.firebasestorage.app',
  messagingSenderId: '615139729501',
  appId: '1:615139729501:web:f5745adaaef3ea53eb2db4',
}

if (!firebaseConfig.apiKey) {
  console.error('Error: FIREBASE_API_KEY environment variable not set. Set it in .env.local')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const BOYCOTTED = [
  { productId: 'prod-001', name: 'טיים רד פאקט', barcode: '7290000302027', priceRange: '₪333–497', currentWeekVotes: 900, weeklyLikes: 1100, totalHistoricalVotes: 2700, isPreviousBoycott: true, previousBoycottWeeks: ['2026-W07'], status: 'boycotted' },
  { productId: 'prod-002', name: 'טיים רד ארוך פאקט', barcode: '7290000302041', priceRange: '₪371–459', currentWeekVotes: 800, weeklyLikes: 1000, totalHistoricalVotes: 2400, isPreviousBoycott: false, previousBoycottWeeks: [], status: 'boycotted' },
  { productId: 'prod-003', name: 'חזה אווז מעושן משקל', barcode: '7290000365077', priceRange: '₪260–346', currentWeekVotes: 700, weeklyLikes: 900, totalHistoricalVotes: 2100, isPreviousBoycott: true, previousBoycottWeeks: ['2026-W07'], status: 'boycotted' },
  { productId: 'prod-004', name: 'סלמון מעושן פסקאדו', barcode: '7290009957174', priceRange: '₪207–271', currentWeekVotes: 600, weeklyLikes: 800, totalHistoricalVotes: 1800, isPreviousBoycott: false, previousBoycottWeeks: [], status: 'boycotted' },
  { productId: 'prod-005', name: 'גב.כבשים כמהין36% משקל', barcode: '7290002370789', priceRange: '₪180–278', currentWeekVotes: 500, weeklyLikes: 700, totalHistoricalVotes: 1500, isPreviousBoycott: true, previousBoycottWeeks: ['2026-W07'], status: 'boycotted' },
]

const ACTIVE = [
  { productId: 'prod-006', name: 'גב.ברי לה רוסטיק 31%משקל', barcode: '7290008461047', priceRange: '₪151–229', currentWeekVotes: 600, totalHistoricalVotes: 600 },
  { productId: 'prod-007', name: 'משולש מנצ#גו39% שקיל', barcode: '7290002385738', priceRange: '₪144–234', currentWeekVotes: 585, totalHistoricalVotes: 585 },
  { productId: 'prod-008', name: 'גב.סנט מור עיזים23% משקל', barcode: '7290008462310', priceRange: '₪167–211', currentWeekVotes: 570, totalHistoricalVotes: 570 },
  { productId: 'prod-009', name: 'פקורינו 36%משולש במשקל', barcode: '7290002385745', priceRange: '₪153–215', currentWeekVotes: 555, totalHistoricalVotes: 555 },
  { productId: 'prod-010', name: 'סלמי סרוולד אמיתי במשקל', barcode: '7290000318806', priceRange: '₪160–198', currentWeekVotes: 540, totalHistoricalVotes: 540 },
  { productId: 'prod-011', name: 'גאודה תום עיזים30% גד', barcode: '7290000571188', priceRange: '₪155–203', currentWeekVotes: 525, totalHistoricalVotes: 525 },
  { productId: 'prod-012', name: 'פינצ\'וס פלפלונים+גב.משקל', barcode: '7290003006120', priceRange: '₪147–211', currentWeekVotes: 510, totalHistoricalVotes: 510 },
  { productId: 'prod-013', name: 'גבינת ברי צרפתית32% משקל', barcode: '7290008403238', priceRange: '₪160–198', currentWeekVotes: 495, totalHistoricalVotes: 495 },
  { productId: 'prod-014', name: 'סלמי צרפתי מובחר במשקל', barcode: '7290000318929', priceRange: '₪152–198', currentWeekVotes: 480, totalHistoricalVotes: 480 },
  { productId: 'prod-015', name: 'ברי פקאן 22% משולש משקל', barcode: '7290001476208', priceRange: '₪140–210', currentWeekVotes: 465, totalHistoricalVotes: 465 },
  { productId: 'prod-016', name: 'משולש גבינת מנצ\'גו במשקל', barcode: '7290001258583', priceRange: '₪138–200', currentWeekVotes: 450, totalHistoricalVotes: 450 },
  { productId: 'prod-017', name: 'גאודה עיזים30% משקל', barcode: '7290004068585', priceRange: '₪146–192', currentWeekVotes: 435, totalHistoricalVotes: 435 },
  { productId: 'prod-018', name: 'גאודה עיזים30%משולש משקל', barcode: '7290004480349', priceRange: '₪137–201', currentWeekVotes: 420, totalHistoricalVotes: 420 },
  { productId: 'prod-019', name: 'גאודה עזים הולנדי34%משקל', barcode: '7290008403870', priceRange: '₪131–207', currentWeekVotes: 405, totalHistoricalVotes: 405 },
  { productId: 'prod-020', name: 'קשקבל 26% במשקל', barcode: '7290004480363', priceRange: '₪142–176', currentWeekVotes: 390, totalHistoricalVotes: 390 },
  { productId: 'prod-021', name: 'גאודת פסטו אדום32% במשקל', barcode: '7290008606608', priceRange: '₪123–195', currentWeekVotes: 375, totalHistoricalVotes: 375 },
  { productId: 'prod-022', name: 'גאודה+פסטו ירוק32% משקל', barcode: '7290008606615', priceRange: '₪126–192', currentWeekVotes: 360, totalHistoricalVotes: 360 },
  { productId: 'prod-023', name: 'גאודה עיזים 30.60% משקל', barcode: '7290008606639', priceRange: '₪134–184', currentWeekVotes: 345, totalHistoricalVotes: 345 },
  { productId: 'prod-024', name: 'גאודה עשבי תיבול 32%משקל', barcode: '7290008606950', priceRange: '₪139–179', currentWeekVotes: 330, totalHistoricalVotes: 330 },
  { productId: 'prod-025', name: 'אנטריקוט טרי מוכשר', barcode: '7290009393125', priceRange: '₪120–198', currentWeekVotes: 315, totalHistoricalVotes: 315 },
  { productId: 'prod-026', name: 'נקניק סרבלד במשקל', barcode: '7290000530192', priceRange: '₪129–175', currentWeekVotes: 300, totalHistoricalVotes: 300 },
  { productId: 'prod-027', name: 'נתחי סלמון טרי שופרסל לק', barcode: '7290009011128', priceRange: '₪132–168', currentWeekVotes: 285, totalHistoricalVotes: 285 },
  { productId: 'prod-028', name: 'גבינת פרמז\'ן 23% במשקל', barcode: '7290000046563', priceRange: '₪131–167', currentWeekVotes: 270, totalHistoricalVotes: 270 },
  { productId: 'prod-029', name: 'משולש גבינת רוקפור משקל', barcode: '7290001258040', priceRange: '₪115–183', currentWeekVotes: 255, totalHistoricalVotes: 255 },
  { productId: 'prod-030', name: 'גבינת גרנה פדנו במשקל', barcode: '7290002370246', priceRange: '₪120–178', currentWeekVotes: 240, totalHistoricalVotes: 240 },
  { productId: 'prod-031', name: 'קשקבל חצי קשה 31% במשקל', barcode: '7290002370284', priceRange: '₪116–182', currentWeekVotes: 225, totalHistoricalVotes: 225 },
  { productId: 'prod-032', name: 'חזה אווז קפוא', barcode: '7290002403517', priceRange: '₪117–181', currentWeekVotes: 210, totalHistoricalVotes: 210 },
  { productId: 'prod-033', name: 'וודקה ואן גוך אסאי 750מל', barcode: '633824913432', priceRange: '₪118–172', currentWeekVotes: 195, totalHistoricalVotes: 195 },
  { productId: 'prod-034', name: 'פילה דג דניס טרי', barcode: '7290009013023', priceRange: '₪105–175', currentWeekVotes: 180, totalHistoricalVotes: 180 },
  { productId: 'prod-035', name: 'פילה לברק טרי ארוז קג', barcode: '7290009392012', priceRange: '₪118–162', currentWeekVotes: 165, totalHistoricalVotes: 165 },
  { productId: 'prod-036', name: 'סינטה טרי מוכשר', barcode: '7290009393101', priceRange: '₪114–166', currentWeekVotes: 150, totalHistoricalVotes: 150 },
  { productId: 'prod-037', name: 'וויסקי שיבאס ריגאל 700מל', barcode: '80432402931', priceRange: '₪108–172', currentWeekVotes: 135, totalHistoricalVotes: 135 },
  { productId: 'prod-038', name: 'כתף בקר מעושן', barcode: '7290000530444', priceRange: '₪112–166', currentWeekVotes: 120, totalHistoricalVotes: 120 },
  { productId: 'prod-039', name: 'משולש גבינת קשקבל27%משקל', barcode: '7290001258736', priceRange: '₪107–171', currentWeekVotes: 105, totalHistoricalVotes: 105 },
  { productId: 'prod-040', name: 'גבינת עיזים רכה 29% משקל', barcode: '7290002370123', priceRange: '₪113–165', currentWeekVotes: 90, totalHistoricalVotes: 90 },
  { productId: 'prod-041', name: 'גבינת גאודה30%משולש משקל', barcode: '7290004480332', priceRange: '₪110–168', currentWeekVotes: 75, totalHistoricalVotes: 75 },
  { productId: 'prod-042', name: 'פטה עיזים 5% במשקל', barcode: '7290005992858', priceRange: '₪124–154', currentWeekVotes: 60, totalHistoricalVotes: 60 },
  { productId: 'prod-043', name: 'כתף בקר מעושן משקל', barcode: '7290000319704', priceRange: '₪116–154', currentWeekVotes: 45, totalHistoricalVotes: 45 },
  { productId: 'prod-044', name: 'רוסטביף חצוי במשקל', barcode: '7290000532585', priceRange: '₪115–155', currentWeekVotes: 30, totalHistoricalVotes: 30 },
  { productId: 'prod-045', name: 'כתף בקר בפלפל טורו במשקל', barcode: '7290000532721', priceRange: '₪119–151', currentWeekVotes: 15, totalHistoricalVotes: 15 },
  { productId: 'prod-046', name: 'פילה דג ברמונדי טרי קג', barcode: '7290009391985', priceRange: '₪116–154', currentWeekVotes: 0, totalHistoricalVotes: 0 },
  { productId: 'prod-047', name: 'כתף בקר מעושן במשקל', barcode: '7290000365046', priceRange: '₪115–147', currentWeekVotes: 0, totalHistoricalVotes: 0 },
  { productId: 'prod-048', name: 'כתף בקר מעושן במשקל', barcode: '7290009149814', priceRange: '₪111–149', currentWeekVotes: 0, totalHistoricalVotes: 0 },
  { productId: 'prod-049', name: 'וודקה גריי גוס 700 מ"ל', barcode: '5010677850100', priceRange: '₪104–156', currentWeekVotes: 0, totalHistoricalVotes: 0 },
  { productId: 'prod-050', name: "ג'ק דניאלס טנסי דבש 700", barcode: '5099873001370', priceRange: '₪109–151', currentWeekVotes: 0, totalHistoricalVotes: 0 },
]

async function seed() {
  const now = Timestamp.now()
  let count = 0

  for (const p of BOYCOTTED) {
    const { productId, ...data } = p
    await setDoc(doc(db, 'products', productId), {
      ...data,
      createdAt: now,
      lastModified: now,
      importSource: 'seed-script',
    })
    count++
    process.stdout.write(`\rSeeded ${count}/50`)
  }

  for (const p of ACTIVE) {
    const { productId, ...data } = p
    await setDoc(doc(db, 'products', productId), {
      ...data,
      status: 'active',
      isPreviousBoycott: false,
      previousBoycottWeeks: [],
      weeklyLikes: 0,
      createdAt: now,
      lastModified: now,
      importSource: 'seed-script',
    })
    count++
    process.stdout.write(`\rSeeded ${count}/50`)
  }

  console.log('\nDone! 50 products seeded to Firestore.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
