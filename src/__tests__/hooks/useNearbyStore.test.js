import { renderHook, act, waitFor } from '@testing-library/react'
import { useNearbyStore } from '../../hooks/useNearbyStore.js'

const mockWatchPosition = jest.fn()
const mockClearWatch = jest.fn()
const mockFetch = jest.fn()
const mockPermissionsQuery = jest.fn()

function makePermissionStatus(state) {
  return {
    state,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }
}

function makeOverpassResponse(elements = []) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ elements }),
  })
}

beforeEach(() => {
  mockWatchPosition.mockReset()
  mockClearWatch.mockReset()
  mockFetch.mockReset()
  mockPermissionsQuery.mockReset()

  global.fetch = mockFetch

  Object.defineProperty(global.navigator, 'geolocation', {
    value: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    writable: true,
    configurable: true,
  })

  Object.defineProperty(global.navigator, 'permissions', {
    value: { query: mockPermissionsQuery },
    writable: true,
    configurable: true,
  })

  mockPermissionsQuery.mockResolvedValue(makePermissionStatus('prompt'))
})

// Helper: simulate a watchPosition success callback
function triggerPositionSuccess(lat, lon) {
  const successCb = mockWatchPosition.mock.calls[0][0]
  act(() => {
    successCb({ coords: { latitude: lat, longitude: lon } })
  })
}

// Helper: simulate a watchPosition error callback
function triggerPositionError(code) {
  const errorCb = mockWatchPosition.mock.calls[0][1]
  act(() => {
    errorCb({ code, PERMISSION_DENIED: 1 })
  })
}

describe('useNearbyStore', () => {
  it('has correct initial state', () => {
    const { result } = renderHook(() => useNearbyStore())
    expect(result.current.isTracking).toBe(false)
    expect(result.current.isNearStore).toBe(false)
    expect(result.current.nearbyStore).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.permissionState).toBe('unknown')
  })

  it('sets permissionState from navigator.permissions.query on mount', async () => {
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => {
      expect(result.current.permissionState).toBe('prompt')
    })
  })

  it('sets permissionState to denied when permissions.query returns denied', async () => {
    mockPermissionsQuery.mockResolvedValue(makePermissionStatus('denied'))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => {
      expect(result.current.permissionState).toBe('denied')
    })
  })

  it('startTracking calls watchPosition', async () => {
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })

    expect(mockWatchPosition).toHaveBeenCalledTimes(1)
  })

  it('startTracking when permissionState is denied does NOT call watchPosition and sets error', async () => {
    mockPermissionsQuery.mockResolvedValue(makePermissionStatus('denied'))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('denied'))

    act(() => { result.current.startTracking() })

    expect(mockWatchPosition).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })

  it('startTracking when navigator.geolocation is absent sets error', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    const { result } = renderHook(() => useNearbyStore())

    act(() => { result.current.startTracking() })

    expect(result.current.error).toBeTruthy()
  })

  it('isTracking becomes true only after first success callback', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([]))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    expect(result.current.isTracking).toBe(false)

    triggerPositionSuccess(32.0, 34.8)
    await waitFor(() => expect(result.current.isTracking).toBe(true))
  })

  it('sets isNearStore=true and nearbyStore when Overpass returns elements', async () => {
    mockFetch.mockReturnValue(
      makeOverpassResponse([{ tags: { name: 'Shufersal' } }])
    )
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)

    await waitFor(() => {
      expect(result.current.isNearStore).toBe(true)
      expect(result.current.nearbyStore).toBe('Shufersal')
    })
  })

  it('uses fallback name "Supermarket" when element has no tags.name', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([{ tags: {} }]))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)

    await waitFor(() => expect(result.current.nearbyStore).toBe('Supermarket'))
  })

  it('sets isNearStore=false when Overpass returns empty array', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([]))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)

    await waitFor(() => expect(result.current.isTracking).toBe(true))
    expect(result.current.isNearStore).toBe(false)
  })

  it('does NOT re-query Overpass when user moves less than 50m', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([]))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })

    // First position — triggers query
    triggerPositionSuccess(32.0, 34.8)
    await waitFor(() => expect(result.current.isTracking).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Second position ~10m away — should NOT trigger query
    triggerPositionSuccess(32.00005, 34.8)
    await waitFor(() => {}) // let any promises settle
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('re-queries Overpass when user moves more than 50m', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([]))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })

    // First position
    triggerPositionSuccess(32.0, 34.8)
    await waitFor(() => expect(result.current.isTracking).toBe(true))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Second position ~200m away
    triggerPositionSuccess(32.002, 34.8)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })

  it('fails silently on Overpass network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)

    await waitFor(() => expect(result.current.isTracking).toBe(true))
    // No error propagated to state
    expect(result.current.error).toBeNull()
    expect(result.current.isNearStore).toBe(false)
  })

  it('stopTracking calls clearWatch and resets state', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([{ tags: { name: 'Store' } }]))
    mockWatchPosition.mockReturnValue(42)
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)
    await waitFor(() => expect(result.current.isNearStore).toBe(true))

    act(() => { result.current.stopTracking() })

    expect(mockClearWatch).toHaveBeenCalledWith(42)
    expect(result.current.isTracking).toBe(false)
    expect(result.current.isNearStore).toBe(false)
    expect(result.current.nearbyStore).toBeNull()
  })

  it('calls clearWatch on unmount when tracking is active', async () => {
    mockFetch.mockReturnValue(makeOverpassResponse([]))
    mockWatchPosition.mockReturnValue(99)
    const { result, unmount } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionSuccess(32.0, 34.8)
    await waitFor(() => expect(result.current.isTracking).toBe(true))

    unmount()
    expect(mockClearWatch).toHaveBeenCalledWith(99)
  })

  it('sets permissionState=denied and error when watchPosition returns PERMISSION_DENIED', async () => {
    const { result } = renderHook(() => useNearbyStore())
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'))

    act(() => { result.current.startTracking() })
    triggerPositionError(1)

    expect(result.current.permissionState).toBe('denied')
    expect(result.current.error).toBeTruthy()
    expect(result.current.isTracking).toBe(false)
  })
})
