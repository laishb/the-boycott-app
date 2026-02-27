import AuthButton from './AuthButton.jsx'
import { APP_NAME } from '../utils/constants.js'

/**
 * App header with title, week label, tab navigation, and auth button.
 * @param {{ user, onSignIn, onSignOut, currentScreen, onNavigate, weekLabel }} props
 */
export default function Header({ user, onSignIn, onSignOut, currentScreen, onNavigate, weekLabel }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-red-600 leading-none">{APP_NAME}</h1>
            {weekLabel && (
              <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
            )}
          </div>
          <AuthButton user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 -mb-px" aria-label="Main navigation">
          <TabButton
            label="Boycott List"
            active={currentScreen === 'main'}
            onClick={() => onNavigate('main')}
          />
          {user && (
            <TabButton
              label="Vote"
              active={currentScreen === 'vote'}
              onClick={() => onNavigate('vote')}
            />
          )}
        </nav>
      </div>
    </header>
  )
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'min-h-[44px] px-5 text-base font-semibold border-b-2 transition-colors',
        active
          ? 'border-red-600 text-red-600'
          : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  )
}
