import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.js'

/**
 * Returns auth state and actions from the nearest AuthContext.
 * @returns {{ user: object|null, signIn: function, signOut: function }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthContext.Provider')
  }
  return context
}
