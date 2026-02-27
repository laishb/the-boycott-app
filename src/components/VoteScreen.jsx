import { useState } from 'react'
import ProductCard from './ProductCard.jsx'
import AuthButton from './AuthButton.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useVoting } from '../hooks/useVoting.js'
import { WEEK_VOTE_LIMIT } from '../utils/constants.js'
import { CheckCircle2, AlertCircle, Search, Plus, Minus, X, Share2 } from 'lucide-react'

/**
 * Vote screen — authenticated users vote for next week's boycott list.
 *
 * Sticky top panel (red, collapsed by default):
 *   [n/5 selected]  [Submit]  [+]
 *   Pressing + expands a dropdown showing selected products with remove buttons.
 *
 * Main content (single column):
 *   • "Continue boycotting?" — unselected boycotted products, ~2 visible, scrollable
 *   • "Add to next week"     — ALL unselected active products, ~5 visible, scrollable + search
 */
export default function VoteScreen({ onOpenShare }) {
  const { user, signIn } = useAuth()
  const {
    boycottedProducts,
    activeProducts,
    isLoading,
    error,
    selectedIds,
    toggleProduct,
    handleSubmitVote,
    hasVoted,
    isSubmitting,
    submitError,
    selectionCount,
  } = useVoting(user)

  const [voteExpanded, setVoteExpanded] = useState(false)
  const [activeSearch, setActiveSearch] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!user) {
    return <SignInPrompt onSignIn={signIn} />
  }

  if (hasVoted) {
    return <VoteConfirmation onOpenShare={onOpenShare} />
  }

  const handleSubmitClick = () => {
    if (selectionCount < WEEK_VOTE_LIMIT) {
      setConfirmOpen(true)
    } else {
      handleSubmitVote()
    }
  }

  const allVotable = [...boycottedProducts, ...activeProducts]
  const selectedProducts = allVotable.filter(p => selectedIds.has(p.productId))

  const unselectedBoycotted = boycottedProducts.filter(p => !selectedIds.has(p.productId))
  const unselectedActive = activeProducts
    .filter(p => !selectedIds.has(p.productId))
    .filter(p => p.name.toLowerCase().includes(activeSearch.toLowerCase()))

  return (
    <section aria-labelledby="vote-heading">
      <div className="mb-6">
        <h2 id="vote-heading" className="text-2xl font-extrabold text-gray-900">
          Vote for Next Week
        </h2>
        <p className="text-base text-gray-500 mt-1">
          Select up to {WEEK_VOTE_LIMIT} products you want boycotted next week.
        </p>
      </div>

      {/* ── Sticky vote summary panel ── */}
      {confirmOpen && (
        <ConfirmSubmitDialog
          selectionCount={selectionCount}
          onConfirm={() => { setConfirmOpen(false); handleSubmitVote() }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {selectionCount > 0 && (
        <VoteSummaryPanel
          products={selectedProducts}
          selectionCount={selectionCount}
          isExpanded={voteExpanded}
          onToggleExpand={() => setVoteExpanded(v => !v)}
          onSubmit={handleSubmitClick}
          isSubmitting={isSubmitting}
          onRemove={toggleProduct}
        />
      )}

      {submitError && (
        <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700" role="alert">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-base">{submitError}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700" role="alert">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-base">{error}</p>
        </div>
      )}

      {isLoading && <p className="text-base text-gray-500 animate-pulse">Loading products…</p>}

      {!isLoading && !error && (
        <>
          {/* Section: Continue boycotting? */}
          {unselectedBoycotted.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-1">🔁 Continue boycotting?</h3>
              <p className="text-sm text-gray-400 mb-3">These are currently boycotted. Select any to keep next week.</p>
              <div className="max-h-[220px] overflow-y-auto pr-1 rounded-xl">
                <ul className="flex flex-col gap-3" aria-label="Currently boycotted products">
                  {unselectedBoycotted.map(product => (
                    <li key={product.productId}>
                      <ProductCard
                        product={product}
                        isSelected={false}
                        onToggle={toggleProduct}
                        selectable
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section: Add to next week */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 mb-1">➕ Add to next week</h3>
            <p className="text-sm text-gray-400 mb-3">All products sorted by votes. Select any to add.</p>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search products…"
                value={activeSearch}
                onChange={e => setActiveSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Search active products"
              />
            </div>

            {unselectedActive.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto pr-1 rounded-xl">
                <ul className="flex flex-col gap-3" aria-label="Products to add to boycott">
                  {unselectedActive.map(product => (
                    <li key={product.productId}>
                      <ProductCard
                        product={product}
                        isSelected={false}
                        onToggle={toggleProduct}
                        selectable
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                {activeSearch ? 'No products match your search.' : 'All products are in your vote.'}
              </p>
            )}
          </div>

          {selectionCount === 0 && (
            <p className="mt-2 text-center text-base text-gray-400">
              Tap a product to select it, then submit your vote.
            </p>
          )}
        </>
      )}
    </section>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Modal asking the user to confirm submission when fewer than WEEK_VOTE_LIMIT products are selected.
 */
function ConfirmSubmitDialog({ selectionCount, onConfirm, onCancel }) {
  const remaining = WEEK_VOTE_LIMIT - selectionCount
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onCancel} aria-hidden="true" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
        >
          <h2 id="confirm-dialog-title" className="text-lg font-extrabold text-gray-900 mb-2">
            Submit incomplete vote?
          </h2>
          <p id="confirm-dialog-desc" className="text-base text-gray-500 mb-6">
            You still have{' '}
            <strong className="text-red-600">{remaining} vote{remaining !== 1 ? 's' : ''} left</strong> —
            adding more products increases your impact.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Keep selecting
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 active:bg-red-800 transition-colors"
            >
              Submit anyway
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Sticky collapsed panel showing vote count + submit.
 * Pressing + expands a dropdown list of selected products with remove buttons.
 */
function VoteSummaryPanel({ products, selectionCount, isExpanded, onToggleExpand, onSubmit, isSubmitting, onRemove }) {
  return (
    <div className="sticky top-20 z-10 mb-4 rounded-2xl bg-red-600 text-white shadow-md overflow-hidden">
      {/* Always-visible header row */}
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="flex-1 text-base font-semibold">
          {selectionCount}/{WEEK_VOTE_LIMIT} selected
        </span>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="min-h-[44px] px-5 py-2 bg-white text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 active:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Vote'}
        </button>
        <button
          onClick={onToggleExpand}
          className="min-h-[44px] w-11 flex items-center justify-center bg-red-700 rounded-xl hover:bg-red-800 active:bg-red-900 transition-colors"
          aria-label={isExpanded ? 'Collapse vote list' : 'Expand vote list'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <Minus size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Expandable selected-products list */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-1 border-t border-red-500 max-h-64 overflow-y-auto"
          aria-label="Selected products"
        >
          <ul className="flex flex-col gap-2">
            {products.map(product => (
              <li key={product.productId}>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm font-semibold truncate">{product.name}</span>
                  <button
                    onClick={() => onRemove(product.productId)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                    aria-label={`Remove ${product.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SignInPrompt({ onSignIn }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-4xl" role="img" aria-label="Lock">🔒</span>
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Sign in to vote</h2>
        <p className="mt-2 text-base text-gray-500 max-w-xs">
          Your vote is anonymous. We only need your Google account to enforce one vote per week.
        </p>
      </div>
      <AuthButton user={null} onSignIn={onSignIn} onSignOut={() => {}} />
    </div>
  )
}

function VoteConfirmation({ onOpenShare }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <CheckCircle2 size={72} className="text-green-500" />
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Vote submitted!</h2>
        <p className="mt-2 text-base text-gray-500 max-w-xs">
          Thank you. The top 5 voted products will become next week's boycott list on Monday.
        </p>
      </div>
      {onOpenShare && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">Help us reach more people</p>
          <button
            onClick={onOpenShare}
            className="flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            <Share2 size={20} aria-hidden="true" />
            שתף את החרם שלי
          </button>
        </div>
      )}
    </div>
  )
}
