import { useState, useEffect, useRef, useCallback } from 'react'
import { haversineDistance } from '../utils/helpers.js'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const STORE_RADIUS_M = 100
const REQUERY_THRESHOLD_M = 50
const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
const OVERPASS_TIMEOUT_MS = 5_000

async function queryNearbyStore(lat, lon) {
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS)
  try {
    const query = `[out:json];node(around:${STORE_RADIUS_M},${lat},${lon})["shop"="supermarket"];out;`
    const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.elements ?? []
  } finally {
    clearTimeout(timerId)
  }
}

/**
 * Detects when the user is near a supermarket using the browser Geolocation API
 * and the Overpass (OpenStreetMap) API. User must call startTracking() to opt in.
 *
 * @returns {{
 *   isTracking: boolean,
 *   isNearStore: boolean,
 *   nearbyStore: string | null,
 *   error: string | null,
 *   permissionState: 'unknown' | 'prompt' | 'granted' | 'denied',
 *   startTracking: () => void,
 *   stopTracking: () => void,
 * }}
 */
export function useNearbyStore() {
  const [isTracking, setIsTracking] = useState(false)
  const [isNearStore, setIsNearStore] = useState(false)
  const [nearbyStore, setNearbyStore] = useState(null)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] = useState('unknown')

  const watchIdRef = useRef(null)
  const lastQueriedPosRef = useRef(null)

  // Check permission state on mount
  useEffect(() => {
    if (!navigator.permissions) return
    let statusHandle = null
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        setPermissionState(status.state)
        statusHandle = status
        const onChange = () => setPermissionState(status.state)
        status.addEventListener('change', onChange)
        statusHandle._onChange = onChange
      })
      .catch(() => {})

    return () => {
      if (statusHandle?._onChange) {
        statusHandle.removeEventListener('change', statusHandle._onChange)
      }
    }
  }, [])

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const handlePosition = useCallback(async (position) => {
    const { latitude: lat, longitude: lon } = position.coords
    const last = lastQueriedPosRef.current

    if (last !== null) {
      const moved = haversineDistance(last.lat, last.lon, lat, lon)
      if (moved < REQUERY_THRESHOLD_M) return
    }

    lastQueriedPosRef.current = { lat, lon }

    try {
      const elements = await queryNearbyStore(lat, lon)
      if (elements.length > 0) {
        setIsNearStore(true)
        setNearbyStore(elements[0].tags?.name ?? 'Supermarket')
      } else {
        setIsNearStore(false)
        setNearbyStore(null)
      }
    } catch {
      // Network error / timeout / rate-limit — fail silently
    }
  }, [])

  const startTracking = useCallback(() => {
    setError(null)

    if (!navigator.geolocation) {
      setError('Location is not supported by your browser.')
      return
    }
    if (permissionState === 'denied') {
      setError('Location access is blocked. Please enable it in your browser settings.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsTracking(true)
        handlePosition(position)
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermissionState('denied')
          setError('Location access was denied.')
          setIsTracking(false)
        }
        // TIMEOUT or POSITION_UNAVAILABLE — fail silently, keep watching
      },
      GEO_OPTIONS,
    )

    watchIdRef.current = watchId
  }, [permissionState, handlePosition])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    lastQueriedPosRef.current = null
    setIsTracking(false)
    setIsNearStore(false)
    setNearbyStore(null)
  }, [])

  return {
    isTracking,
    isNearStore,
    nearbyStore,
    error,
    permissionState,
    startTracking,
    stopTracking,
  }
}
