import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '../../context/AuthContext.js'
import VoteScreen from '../../components/VoteScreen.jsx'

// Mock services and hooks to avoid import.meta.env in Jest
jest.mock('../../services/api.js', () => ({}))

jest.mock('../../hooks/useVoting.js', () => ({
  useVoting: jest.fn(),
}))

import { useVoting } from '../../hooks/useVoting.js'

const mockBoycottedProducts = [
  { productId: 'p1', name: 'Currently Boycotted A', priceRange: '₪10–20', displayVotes: 500, currentWeekVotes: 500, isPreviousBoycott: false, status: 'boycotted' },
  { productId: 'p2', name: 'Currently Boycotted B', priceRange: '₪8–14', displayVotes: 300, currentWeekVotes: 300, isPreviousBoycott: false, status: 'boycotted' },
]
const mockActiveProducts = [
  { productId: 'p3', name: 'Active Candidate C', priceRange: '₪5–15', displayVotes: 400, currentWeekVotes: 400, isPreviousBoycott: false, status: 'active' },
  { productId: 'p4', name: 'Active Candidate D', priceRange: '₪8–12', displayVotes: 2, currentWeekVotes: 2, isPreviousBoycott: false, status: 'active' },
  { productId: 'p5', name: 'Zero Vote Product E', priceRange: '₪9–18', displayVotes: 0, currentWeekVotes: 0, isPreviousBoycott: false, status: 'active' },
]

const defaultVotingState = {
  boycottedProducts: mockBoycottedProducts,
  activeProducts: mockActiveProducts,
  isLoading: false,
  error: null,
  selectedIds: new Set(),
  toggleProduct: jest.fn(),
  handleSubmitVote: jest.fn(),
  hasVoted: false,
  isSubmitting: false,
  submitError: null,
  selectionCount: 0,
}

function renderWithAuth(ui, user = null) {
  const signIn = jest.fn()
  const signOut = jest.fn()
  return render(
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {ui}
    </AuthContext.Provider>
  )
}

const authUser = { uid: 'u1', displayName: 'Alice', email: 'a@b.com', photoURL: null }

describe('VoteScreen', () => {
  beforeEach(() => {
    useVoting.mockReset()
    useVoting.mockReturnValue(defaultVotingState)
  })

  it('shows sign-in prompt when user is not authenticated', () => {
    renderWithAuth(<VoteScreen />, null)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('shows the vote form when user is authenticated', () => {
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getByRole('heading', { name: /vote for next week/i })).toBeInTheDocument()
  })

  it('renders boycotted and active sections when authenticated', () => {
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getAllByText('Currently Boycotted A').length).toBeGreaterThan(0)
    expect(screen.getByText(/continue boycotting/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /add to next week/i })).toBeInTheDocument()
  })

  it('shows all active products including 0-vote ones', () => {
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getAllByText('Active Candidate C').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Active Candidate D').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zero Vote Product E').length).toBeGreaterThan(0)
  })

  it('does not show vote summary panel when nothing is selected', () => {
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.queryByRole('button', { name: /expand vote list/i })).not.toBeInTheDocument()
  })

  it('shows vote summary panel when items are selected', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getByText(/1\/5 selected/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand vote list/i })).toBeInTheDocument()
  })

  it('panel is collapsed by default — selected products not visible', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    // Product name only appears in the boycotted list, NOT in an expanded panel
    expect(screen.queryByRole('button', { name: /remove currently boycotted a/i })).not.toBeInTheDocument()
  })

  it('expands panel when + button is clicked', async () => {
    useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    await userEvent.click(screen.getByRole('button', { name: /expand vote list/i }))
    expect(screen.getByRole('button', { name: /remove currently boycotted a/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collapse vote list/i })).toBeInTheDocument()
  })

  it('removes product when remove button is clicked in expanded panel', async () => {
    const toggleProduct = jest.fn()
    useVoting.mockReturnValue({ ...defaultVotingState, toggleProduct, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    await userEvent.click(screen.getByRole('button', { name: /expand vote list/i }))
    await userEvent.click(screen.getByRole('button', { name: /remove currently boycotted a/i }))
    expect(toggleProduct).toHaveBeenCalledWith('p1')
  })

  it('selected product disappears from its original section', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    const boycottList = screen.getByRole('list', { name: /currently boycotted products/i })
    expect(boycottList).not.toHaveTextContent('Currently Boycotted A')
  })

  it('shows confirmation screen when hasVoted=true', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, hasVoted: true })
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getByRole('heading', { name: /vote submitted/i })).toBeInTheDocument()
  })

  it('calls toggleProduct when a product is clicked in the main list', async () => {
    const toggleProduct = jest.fn()
    useVoting.mockReturnValue({ ...defaultVotingState, toggleProduct })
    renderWithAuth(<VoteScreen />, authUser)
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0])
    expect(toggleProduct).toHaveBeenCalled()
  })

  it('shows submit button in panel when items are selected', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1']), selectionCount: 1 })
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeInTheDocument()
  })

  it('shows error message on submit failure', () => {
    useVoting.mockReturnValue({ ...defaultVotingState, submitError: 'Vote failed', selectionCount: 1, selectedIds: new Set(['p1']) })
    renderWithAuth(<VoteScreen />, authUser)
    expect(screen.getByRole('alert')).toHaveTextContent('Vote failed')
  })

  it('filters section 3 by search term', async () => {
    renderWithAuth(<VoteScreen />, authUser)
    const searchInput = screen.getByRole('searchbox', { name: /search active products/i })
    await userEvent.type(searchInput, 'Active Candidate C')
    expect(screen.getAllByText('Active Candidate C').length).toBeGreaterThan(0)
    expect(screen.queryByText('Active Candidate D')).not.toBeInTheDocument()
    expect(screen.queryByText('Zero Vote Product E')).not.toBeInTheDocument()
  })

  describe('incomplete vote confirmation', () => {
    it('shows confirmation dialog when submitting with fewer than 5 selections', async () => {
      const handleSubmitVote = jest.fn()
      useVoting.mockReturnValue({ ...defaultVotingState, handleSubmitVote, selectedIds: new Set(['p1']), selectionCount: 1 })
      renderWithAuth(<VoteScreen />, authUser)
      await userEvent.click(screen.getByRole('button', { name: /submit vote/i }))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/you still have/i)).toBeInTheDocument()
      expect(handleSubmitVote).not.toHaveBeenCalled()
    })

    it('skips confirmation dialog when all 5 slots are filled', async () => {
      const handleSubmitVote = jest.fn()
      useVoting.mockReturnValue({
        ...defaultVotingState,
        handleSubmitVote,
        selectedIds: new Set(['p1', 'p2', 'p3', 'p4', 'p5']),
        selectionCount: 5,
      })
      renderWithAuth(<VoteScreen />, authUser)
      await userEvent.click(screen.getByRole('button', { name: /submit vote/i }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(handleSubmitVote).toHaveBeenCalledTimes(1)
    })

    it('"Submit anyway" calls handleSubmitVote and closes dialog', async () => {
      const handleSubmitVote = jest.fn()
      useVoting.mockReturnValue({ ...defaultVotingState, handleSubmitVote, selectedIds: new Set(['p1']), selectionCount: 1 })
      renderWithAuth(<VoteScreen />, authUser)
      await userEvent.click(screen.getByRole('button', { name: /submit vote/i }))
      await userEvent.click(screen.getByRole('button', { name: /submit anyway/i }))
      expect(handleSubmitVote).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('"Keep selecting" closes dialog without submitting', async () => {
      const handleSubmitVote = jest.fn()
      useVoting.mockReturnValue({ ...defaultVotingState, handleSubmitVote, selectedIds: new Set(['p1']), selectionCount: 1 })
      renderWithAuth(<VoteScreen />, authUser)
      await userEvent.click(screen.getByRole('button', { name: /submit vote/i }))
      await userEvent.click(screen.getByRole('button', { name: /keep selecting/i }))
      expect(handleSubmitVote).not.toHaveBeenCalled()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('shows correct remaining count in dialog message', async () => {
      useVoting.mockReturnValue({ ...defaultVotingState, selectedIds: new Set(['p1', 'p2']), selectionCount: 2 })
      renderWithAuth(<VoteScreen />, authUser)
      await userEvent.click(screen.getByRole('button', { name: /submit vote/i }))
      expect(screen.getByText(/3 votes left/i)).toBeInTheDocument()
    })
  })
})
