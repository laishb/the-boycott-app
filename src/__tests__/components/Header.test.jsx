import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '../../components/Header.jsx'

const defaultProps = {
  user: null,
  onSignIn: jest.fn(),
  onSignOut: jest.fn(),
  currentScreen: 'main',
  onNavigate: jest.fn(),
  weekLabel: 'Week of Feb 23, 2026',
}

describe('Header', () => {
  it('renders the app name', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('Weekly Boycott')).toBeInTheDocument()
  })

  it('renders the week label', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('Week of Feb 23, 2026')).toBeInTheDocument()
  })

  it('shows "Sign in with Google" when user is null', () => {
    render(<Header {...defaultProps} user={null} />)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('shows Sign Out when user is signed in', () => {
    const user = { uid: 'u1', displayName: 'Alice', email: 'a@b.com', photoURL: null }
    render(<Header {...defaultProps} user={user} />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('hides the Vote tab when not signed in', () => {
    render(<Header {...defaultProps} user={null} />)
    expect(screen.queryByRole('button', { name: /^vote$/i })).not.toBeInTheDocument()
  })

  it('shows the Vote tab when signed in', () => {
    const user = { uid: 'u1', displayName: 'Alice', email: 'a@b.com', photoURL: null }
    render(<Header {...defaultProps} user={user} />)
    expect(screen.getByRole('button', { name: /^vote$/i })).toBeInTheDocument()
  })

  it('calls onNavigate when a tab is clicked', async () => {
    const onNavigate = jest.fn()
    const user = { uid: 'u1', displayName: 'Alice', email: 'a@b.com', photoURL: null }
    render(<Header {...defaultProps} user={user} onNavigate={onNavigate} currentScreen="main" />)
    await userEvent.click(screen.getByRole('button', { name: /^vote$/i }))
    expect(onNavigate).toHaveBeenCalledWith('vote')
  })

  it('marks the active tab with aria-current=page', () => {
    const user = { uid: 'u1', displayName: 'Alice', email: 'a@b.com', photoURL: null }
    render(<Header {...defaultProps} user={user} currentScreen="vote" />)
    const voteTab = screen.getByRole('button', { name: /^vote$/i })
    expect(voteTab).toHaveAttribute('aria-current', 'page')
  })
})
