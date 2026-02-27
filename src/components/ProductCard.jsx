import { Ban, CheckCircle } from 'lucide-react'
import { formatVoteCount } from '../utils/helpers.js'

/**
 * Displays a single product — used in the boycott list and the vote screen.
 *
 * Modes (mutually exclusive):
 *  • Default     — read-only display, shows vote count
 *  • selectable  — vote-screen checkbox mode, shows vote count + selection circle
 *  • likeable    — boycott-list mode, shows a like button (one per product per week)
 *
 * @param {{
 *   product: object,
 *   rank?: number,
 *   isSelected?: boolean,
 *   onToggle?: function,
 *   selectable?: boolean,
 *   likeable?: boolean,
 *   isLiked?: boolean,
 *   onLike?: function,
 *   likeCount?: number,
 * }} props
 */
export default function ProductCard({
  product,
  rank,
  isSelected = false,
  onToggle,
  selectable = false,
  likeable = false,
  isLiked = false,
  onLike,
  likeCount,
}) {
  const {
    productId,
    name,
    priceRange,
    displayVotes,
    currentWeekVotes,
    isPreviousBoycott,
  } = product

  const votes = displayVotes ?? currentWeekVotes ?? 0

  const handleClick = () => {
    if (selectable && onToggle) onToggle(productId)
  }

  return (
    <div
      className={[
        'rounded-2xl border-2 p-4 transition-all',
        selectable ? 'cursor-pointer select-none' : '',
        isSelected
          ? 'border-red-500 bg-red-50'
          : selectable
            ? 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
            : 'border-gray-200 bg-white',
      ].join(' ')}
      onClick={handleClick}
      role={selectable ? 'checkbox' : undefined}
      aria-checked={selectable ? isSelected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick() } } : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Rank badge */}
        {rank != null && (
          <span
            className="flex-shrink-0 w-9 h-9 rounded-full bg-red-600 text-white text-base font-bold flex items-center justify-center"
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{name}</h3>
            {isPreviousBoycott && (
              <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                Previously boycotted
              </span>
            )}
          </div>
          {priceRange && (
            <span className="inline-block mt-1 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
              {priceRange}
            </span>
          )}
        </div>

        {/* Right side: like button OR vote count + checkbox */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {likeable ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); if (!isLiked && onLike) onLike(productId) }}
                disabled={isLiked}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-bold text-sm transition-colors',
                  isLiked
                    ? 'bg-red-500 border-red-500 text-white cursor-default'
                    : onLike
                      ? 'border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500 active:bg-red-50'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed',
                ].join(' ')}
                aria-label={isLiked ? `You boycotted: ${name}` : `I didn't buy this: ${name}`}
                aria-pressed={isLiked}
              >
                <Ban size={16} />
                <span>{formatVoteCount(likeCount ?? 0)}</span>
              </button>
              <p className="text-xs text-gray-400">boycotted</p>
            </>
          ) : (
            <>
              {selectable && (
                <div
                  className={[
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors',
                    isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-300',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isSelected && <CheckCircle size={22} />}
                </div>
              )}
              <div className="text-right">
                <span className="text-base font-bold text-red-600">{formatVoteCount(votes)}</span>
                <p className="text-xs text-gray-400">votes</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
