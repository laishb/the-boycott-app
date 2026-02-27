import ProductCard from './ProductCard.jsx'
import { useBoycottLikes } from '../hooks/useBoycottLikes.js'
import { useAuth } from '../hooks/useAuth.js'
import { Ban, ChevronRight, AlertCircle, MapPin, Share2 } from 'lucide-react'

/**
 * Main screen — shows the current week's 5 boycotted products.
 * Data is lifted from App.jsx (products, isLoading, error, weekLabel).
 * Location tracking props are also passed from App.jsx.
 *
 * @param {{
 *   onNavigate: function,
 *   products: Array,
 *   isLoading: boolean,
 *   error: string | null,
 *   weekLabel: string,
 *   isTracking: boolean,
 *   permissionState: string,
 *   locationError: string | null,
 *   onEnableTracking: () => void,
 *   onStopTracking: () => void,
 *   onOpenShare: () => void,
 * }} props
 */
export default function MainScreen({
  onNavigate,
  products,
  isLoading,
  error,
  weekLabel,
  isTracking,
  permissionState,
  locationError,
  onEnableTracking,
  onStopTracking,
  onOpenShare,
}) {
  const { user } = useAuth()
  const { likedIds, likeCounts, handleLike } = useBoycottLikes(user, products)

  // Calculate total votes for this week
  const weeklyTotalVotes = products.reduce((sum, product) => sum + (product.currentWeekVotes || 0), 0)

  return (
    <section aria-labelledby="boycott-heading">
      <div className="mb-6">
        <h2 id="boycott-heading" className="text-2xl font-extrabold text-gray-900">
          This Week's Boycott List
        </h2>
        <p className="text-base text-gray-500 mt-1">{weekLabel}</p>
        <p className="text-sm text-gray-500 mt-2">
          Skipped a product in store this week? Tap the{' '}
          <Ban size={13} className="inline-block align-middle mx-0.5" aria-hidden="true" />
          {' '}button to mark it.
        </p>
      </div>

      {weeklyTotalVotes > 0 && !isLoading && (
        <p className="text-center text-sm text-red-600 font-semibold mb-4">
          🔥 {weeklyTotalVotes.toLocaleString('he-IL')} אנשים הצביעו השבוע
        </p>
      )}

      {isLoading && <LoadingSkeleton />}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700" role="alert">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-base">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <ol className="flex flex-col gap-4" aria-label="Boycotted products">
            {products.map((product, i) => (
              <li key={product.productId}>
                <ProductCard
                  product={product}
                  rank={i + 1}
                  likeable
                  isLiked={likedIds.has(product.productId)}
                  onLike={user ? handleLike : undefined}
                  likeCount={likeCounts[product.productId] ?? product.weeklyLikes ?? 0}
                />
              </li>
            ))}
          </ol>

          {products.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={onOpenShare}
                className="flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl border-2 border-red-200 text-red-600 bg-red-50 text-base font-semibold hover:border-red-400 hover:bg-red-100 active:bg-red-200 transition-colors"
              >
                <Share2 size={20} aria-hidden="true" />
                שתף את החרם שלי
              </button>
            </div>
          )}

          <div className="mt-6">
            <LocationToggle
              isTracking={isTracking}
              permissionState={permissionState}
              locationError={locationError}
              onEnableTracking={onEnableTracking}
              onStopTracking={onStopTracking}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => onNavigate('vote')}
              className="flex items-center gap-2 min-h-[52px] px-8 py-3 rounded-2xl bg-red-600 text-white text-lg font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-md"
            >
              Vote for next week
              <ChevronRight size={22} />
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function LocationToggle({ isTracking, permissionState, locationError, onEnableTracking, onStopTracking }) {
  if (permissionState === 'denied') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-base" role="status">
        <MapPin size={20} className="flex-shrink-0 mt-0.5 text-gray-400" aria-hidden="true" />
        <p>Location access is blocked in your browser settings. Enable it to receive supermarket alerts.</p>
      </div>
    )
  }

  if (locationError) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-base" role="alert">
        <MapPin size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>{locationError}</p>
      </div>
    )
  }

  if (isTracking) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
        <MapPin size={20} className="text-green-600 flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-base font-semibold text-green-700">Store alerts: ON</span>
        <button
          onClick={onStopTracking}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-green-300 text-green-700 text-base font-medium hover:bg-green-100 active:bg-green-200 transition-colors"
        >
          Stop
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onEnableTracking}
      className="w-full flex items-center justify-center gap-2 min-h-[52px] px-6 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 text-lg font-semibold hover:border-red-300 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
    >
      <MapPin size={22} aria-hidden="true" />
      Enable store alerts
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <ol className="flex flex-col gap-4" aria-label="Loading" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i}>
          <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-5 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-2/5" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-3/5" />
              </div>
              <div className="w-14 h-8 bg-gray-200 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
