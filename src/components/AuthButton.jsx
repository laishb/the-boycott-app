import { LogIn, LogOut } from 'lucide-react'

/**
 * Google sign-in / sign-out button.
 * @param {{ user: object|null, onSignIn: function, onSignOut: function }} props
 */
export default function AuthButton({ user, onSignIn, onSignOut }) {
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-9 h-9 rounded-full border-2 border-gray-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onSignIn}
      className="flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm"
      aria-label="Sign in with Google"
    >
      {/* Google "G" icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
        <path fill="rgba(255,255,255,0.85)" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
        <path fill="rgba(255,255,255,0.7)" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
        <path fill="rgba(255,255,255,0.85)" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      <span>Sign in with Google</span>
    </button>
  )
}
