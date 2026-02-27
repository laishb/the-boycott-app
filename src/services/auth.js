// auth.js — Authentication service
// Mock mode: simulates Google sign-in instantly
// Firebase mode: uses Firebase Auth with Google provider

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const MOCK_USER = {
  uid: 'mock-user-001',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
}

// ─── Mock Implementation ──────────────────────────────────────────────────────

function mockSignInWithGoogle() {
  return Promise.resolve({ ...MOCK_USER })
}

function mockSignOut() {
  return Promise.resolve()
}

function mockOnAuthStateChanged(_callback) {
  // No-op in mock mode — auth state is managed by App component
  return () => {}
}

// ─── Firebase Implementation ──────────────────────────────────────────────────

async function firebaseSignInWithGoogle() {
  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
  const { auth } = await import('./firebase.js')
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

async function firebaseSignOutUser() {
  const { signOut: fbSignOut } = await import('firebase/auth')
  const { auth } = await import('./firebase.js')
  return fbSignOut(auth)
}

function firebaseOnAuthStateChanged(callback) {
  // Dynamic import is async, so we set up the listener once loaded
  let unsubscribe = () => {}
  import('firebase/auth').then(({ onAuthStateChanged: onAuth }) =>
    import('./firebase.js').then(({ auth }) => {
      unsubscribe = onAuth(auth, callback)
    })
  )
  return () => unsubscribe()
}

// ─── Exported API ─────────────────────────────────────────────────────────────

export const signInWithGoogle = USE_MOCK ? mockSignInWithGoogle : firebaseSignInWithGoogle
export const signOut = USE_MOCK ? mockSignOut : firebaseSignOutUser
export const onAuthStateChanged = USE_MOCK ? mockOnAuthStateChanged : firebaseOnAuthStateChanged
