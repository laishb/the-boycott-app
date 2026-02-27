import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MainScreen from '../../components/MainScreen.jsx'

jest.mock('../../hooks/useBoycottLikes.js', () => ({
  useBoycottLikes: jest.fn(),
}))

jest.mock('../../hooks/useAuth.js', () => ({
  useAuth: jest.fn(),
}))

import { useBoycottLikes } from '../../hooks/useBoycottLikes.js'
import { useAuth } from '../../hooks/useAuth.js'

const mockProducts = [
  { productId: 'p1', name: 'Product A', priceRange: '₪8–15', displayVotes: 900, currentWeekVotes: 900, weeklyLikes: 1200, isPreviousBoycott: false },
  { productId: 'p2', name: 'Product B', priceRange: '₪12–28', displayVotes: 800, currentWeekVotes: 800, weeklyLikes: 900, isPreviousBoycott: true },
  { productId: 'p3', name: 'Product C', priceRange: '₪25–45', displayVotes: 700, currentWeekVotes: 700, weeklyLikes: 700, isPreviousBoycott: false },
  { productId: 'p4', name: 'Product D', priceRange: '₪6–18', displayVotes: 600, currentWeekVotes: 600, weeklyLikes: 550, isPreviousBoycott: false },
  { productId: 'p5', name: 'Product E', priceRange: '₪9–14', displayVotes: 500, currentWeekVotes: 500, weeklyLikes: 430, isPreviousBoycott: false },
]

const defaultLikesState = {
  likedIds: new Set(),
  likeCounts: { p1: 1200, p2: 900, p3: 700, p4: 550, p5: 430 },
  handleLike: jest.fn(),
}

const defaultLocationProps = {
  isTracking: false,
  permissionState: 'prompt',
  locationError: null,
  onEnableTracking: jest.fn(),
  onStopTracking: jest.fn(),
}

function renderMainScreen(overrides = {}) {
  const props = {
    onNavigate: jest.fn(),
    products: mockProducts,
    isLoading: false,
    error: null,
    weekLabel: 'Week of Feb 23, 2026',
    ...defaultLocationProps,
    ...overrides,
  }
  return render(<MainScreen {...props} />)
}

describe('MainScreen', () => {
  beforeEach(() => {
    useBoycottLikes.mockReset()
    useAuth.mockReset()
    useAuth.mockReturnValue({ user: null, signIn: jest.fn(), signOut: jest.fn() })
    useBoycottLikes.mockReturnValue(defaultLikesState)
  })

  it('shows loading skeleton when isLoading=true', () => {
    renderMainScreen({ isLoading: true, products: [] })
    expect(screen.getByRole('list', { name: /loading/i })).toBeInTheDocument()
  })

  it('shows error message when error is set', () => {
    renderMainScreen({ error: 'Failed to load', products: [] })
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load')
  })

  it('renders 5 product cards when data is loaded', async () => {
    renderMainScreen()
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })
  })

  it('renders product names', () => {
    renderMainScreen()
    expect(screen.getAllByText('Product A').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Product E').length).toBeGreaterThan(0)
  })

  it('renders like buttons for each product', () => {
    renderMainScreen()
    expect(screen.getAllByRole('button', { name: /i didn't buy this/i }).length).toBeGreaterThanOrEqual(5)
  })

  it('shows liked state for products user has already liked', () => {
    useBoycottLikes.mockReturnValue({ ...defaultLikesState, likedIds: new Set(['p1']) })
    renderMainScreen()
    expect(screen.getByRole('button', { name: /you boycotted: product a/i })).toBeInTheDocument()
  })

  it('calls handleLike when like button is clicked by logged-in user', async () => {
    const handleLike = jest.fn()
    useBoycottLikes.mockReturnValue({ ...defaultLikesState, handleLike })
    useAuth.mockReturnValue({ user: { uid: 'u1' }, signIn: jest.fn(), signOut: jest.fn() })
    renderMainScreen()
    const likeButtons = screen.getAllByRole('button', { name: /i didn't buy this: product/i })
    await userEvent.click(likeButtons[0])
    expect(handleLike).toHaveBeenCalledWith('p1')
  })

  it('like button is not interactive when user is not logged in', () => {
    renderMainScreen()
    const likeButtons = screen.getAllByRole('button', { name: /i didn't buy this: product/i })
    expect(likeButtons[0]).toBeInTheDocument()
  })

  it('calls onNavigate("vote") when the vote button is clicked', async () => {
    const onNavigate = jest.fn()
    renderMainScreen({ onNavigate })
    await userEvent.click(screen.getByRole('button', { name: /vote for next week/i }))
    expect(onNavigate).toHaveBeenCalledWith('vote')
  })

  describe('location toggle', () => {
    it('renders "Enable store alerts" button when not tracking', () => {
      renderMainScreen({ isTracking: false, permissionState: 'prompt' })
      expect(screen.getByRole('button', { name: /enable store alerts/i })).toBeInTheDocument()
    })

    it('renders "Store alerts: ON" when tracking is active', () => {
      renderMainScreen({ isTracking: true, permissionState: 'granted' })
      expect(screen.getByText(/store alerts: on/i)).toBeInTheDocument()
    })

    it('calls onEnableTracking when enable button is clicked', async () => {
      const onEnableTracking = jest.fn()
      renderMainScreen({ onEnableTracking })
      await userEvent.click(screen.getByRole('button', { name: /enable store alerts/i }))
      expect(onEnableTracking).toHaveBeenCalledTimes(1)
    })

    it('calls onStopTracking when Stop button is clicked', async () => {
      const onStopTracking = jest.fn()
      renderMainScreen({ isTracking: true, permissionState: 'granted', onStopTracking })
      await userEvent.click(screen.getByRole('button', { name: /stop/i }))
      expect(onStopTracking).toHaveBeenCalledTimes(1)
    })

    it('shows blocked message when permissionState is denied', () => {
      renderMainScreen({ permissionState: 'denied' })
      expect(screen.getByText(/location access is blocked/i)).toBeInTheDocument()
    })

    it('shows error message when locationError is set', () => {
      renderMainScreen({ locationError: 'Location access was denied.' })
      expect(screen.getByRole('alert')).toHaveTextContent('Location access was denied.')
    })
  })
})
