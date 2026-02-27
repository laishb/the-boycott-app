import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NearbyStoreAlert from '../../components/NearbyStoreAlert.jsx'

const mockProducts = [
  { productId: 'p1', name: 'AquaPure Water' },
  { productId: 'p2', name: 'FreshFarm Dairy' },
  { productId: 'p3', name: 'GreenLeaf Coffee' },
  { productId: 'p4', name: 'QuickShop Snacks' },
  { productId: 'p5', name: 'BrightSpark Energy' },
]

describe('NearbyStoreAlert', () => {
  it('has role="alert"', () => {
    render(<NearbyStoreAlert nearbyStore="Shufersal" products={mockProducts} onDismiss={jest.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders the store name', () => {
    render(<NearbyStoreAlert nearbyStore="Shufersal" products={mockProducts} onDismiss={jest.fn()} />)
    expect(screen.getByText(/you're in shufersal/i)).toBeInTheDocument()
  })

  it('falls back to "a supermarket" when nearbyStore is null', () => {
    render(<NearbyStoreAlert nearbyStore={null} products={mockProducts} onDismiss={jest.fn()} />)
    expect(screen.getByText(/you're in a supermarket/i)).toBeInTheDocument()
  })

  it('renders all product names', () => {
    render(<NearbyStoreAlert nearbyStore="Shufersal" products={mockProducts} onDismiss={jest.fn()} />)
    expect(screen.getByText(/AquaPure Water/)).toBeInTheDocument()
    expect(screen.getByText(/FreshFarm Dairy/)).toBeInTheDocument()
    expect(screen.getByText(/GreenLeaf Coffee/)).toBeInTheDocument()
    expect(screen.getByText(/QuickShop Snacks/)).toBeInTheDocument()
    expect(screen.getByText(/BrightSpark Energy/)).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = jest.fn()
    render(<NearbyStoreAlert nearbyStore="Shufersal" products={mockProducts} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss store alert/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismiss button has correct accessible label', () => {
    render(<NearbyStoreAlert nearbyStore="Shufersal" products={mockProducts} onDismiss={jest.fn()} />)
    expect(screen.getByRole('button', { name: /dismiss store alert/i })).toBeInTheDocument()
  })
})
