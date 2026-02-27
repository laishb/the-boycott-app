import { X, MapPin } from 'lucide-react'

/**
 * Fixed-bottom alert banner shown when the user is near a supermarket.
 * Displays the current week's boycotted products.
 *
 * @param {{
 *   nearbyStore: string | null,
 *   products: Array<{ productId: string, name: string }>,
 *   onDismiss: () => void,
 * }} props
 */
export default function NearbyStoreAlert({ nearbyStore, products, onDismiss }) {
  const storeName = nearbyStore ?? 'a supermarket'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-0 left-0 right-0 z-40 bg-red-600 text-white shadow-lg"
    >
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <MapPin size={24} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-lg font-bold leading-snug">You're in {storeName}!</p>
            <p className="text-base font-medium mt-0.5">This week's boycotted products:</p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss store alert"
            className="flex-shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Boycotted products">
          {products.map((p) => (
            <li key={p.productId} className="text-base font-semibold">
              • {p.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
