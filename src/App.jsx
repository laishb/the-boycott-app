import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import MainScreen from './components/MainScreen.jsx'
import VoteScreen from './components/VoteScreen.jsx'
import NearbyStoreAlert from './components/NearbyStoreAlert.jsx'
import { AuthContext } from './context/AuthContext.js'
import { signInWithGoogle, signOut as authSignOut, onAuthStateChanged } from './services/auth.js'
import { getWeekLabel } from './utils/weekHelpers.js'
import { useBoycottData } from './hooks/useBoycottData.js'
import { useNearbyStore } from './hooks/useNearbyStore.js'

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('main') // 'main' | 'vote'
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState(null)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // Restore auth state on page refresh (Firebase mode)
  useEffect(() => {
    return onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
    })
  }, [])

  const { products, isLoading, error: dataError, weekLabel } = useBoycottData()

  const {
    isTracking,
    isNearStore,
    nearbyStore,
    error: locationError,
    permissionState,
    startTracking,
    stopTracking,
  } = useNearbyStore()

  // Re-show alert when user re-enters a store after dismissing
  useEffect(() => {
    if (!isNearStore) setAlertDismissed(false)
  }, [isNearStore])

  const showAlert = isTracking && isNearStore && !alertDismissed

  const signIn = async () => {
    setAuthError(null)
    try {
      const u = await signInWithGoogle()
      setUser(u)
    } catch (err) {
      setAuthError(err.message || 'Sign in failed. Please try again.')
    }
  }

  const signOut = async () => {
    await authSignOut()
    setUser(null)
    setScreen('main')
  }

  const weekLabelStr = getWeekLabel()

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <div className="min-h-screen bg-gray-50">
        <Header
          user={user}
          onSignIn={signIn}
          onSignOut={signOut}
          currentScreen={screen}
          onNavigate={setScreen}
          weekLabel={weekLabelStr}
        />

        <main className={['max-w-2xl mx-auto px-4 py-6', showAlert ? 'pb-36' : ''].join(' ')}>
          {authError && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-base" role="alert">
              {authError}
            </div>
          )}

          {screen === 'main' ? (
            <MainScreen
              onNavigate={setScreen}
              products={products}
              isLoading={isLoading}
              error={dataError}
              weekLabel={weekLabel}
              isTracking={isTracking}
              permissionState={permissionState}
              locationError={locationError}
              onEnableTracking={startTracking}
              onStopTracking={stopTracking}
            />
          ) : (
            <VoteScreen />
          )}
        </main>

        {showAlert && (
          <NearbyStoreAlert
            nearbyStore={nearbyStore}
            products={products}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}
      </div>
    </AuthContext.Provider>
  )
}
