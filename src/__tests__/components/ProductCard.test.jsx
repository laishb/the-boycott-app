import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from '../../components/ProductCard.jsx'

const mockProduct = {
  productId: 'test-001',
  name: 'Test Brand',

  priceRange: '₪12–25',
  currentWeekVotes: 1234,
  displayVotes: 1234,
  isPreviousBoycott: false,
  status: 'boycotted',
}

describe('ProductCard', () => {
  it('renders the product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
  })

  it('renders the price range', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('₪12–25')).toBeInTheDocument()
  })

  it('renders formatted vote count', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('does NOT show the "Previously boycotted" badge when isPreviousBoycott is false', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.queryByText(/previously boycotted/i)).not.toBeInTheDocument()
  })

  it('shows the "Previously boycotted" badge when isPreviousBoycott is true', () => {
    render(<ProductCard product={{ ...mockProduct, isPreviousBoycott: true }} />)
    expect(screen.getByText(/previously boycotted/i)).toBeInTheDocument()
  })

  it('shows a rank badge when rank is provided', () => {
    render(<ProductCard product={mockProduct} rank={3} />)
    expect(screen.getByLabelText('Rank 3')).toBeInTheDocument()
  })

  it('is not interactive when selectable is false', () => {
    render(<ProductCard product={mockProduct} />)
    const card = screen.getByText('Test Brand').closest('[role]')
    expect(card).toBeNull() // no role attribute on non-selectable card
  })

  it('has role=checkbox when selectable', () => {
    render(<ProductCard product={mockProduct} selectable />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('calls onToggle with productId when clicked in selectable mode', async () => {
    const onToggle = jest.fn()
    render(<ProductCard product={mockProduct} selectable onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('test-001')
  })

  it('shows checked state visually when isSelected=true', () => {
    render(<ProductCard product={mockProduct} selectable isSelected />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  describe('likeable mode', () => {
    it('renders a like button', () => {
      render(<ProductCard product={mockProduct} likeable likeCount={500} />)
      expect(screen.getByRole('button', { name: /i didn't buy this: test brand/i })).toBeInTheDocument()
    })

    it('shows the like count', () => {
      render(<ProductCard product={mockProduct} likeable likeCount={1500} />)
      expect(screen.getByText('1,500')).toBeInTheDocument()
    })

    it('calls onLike with productId when clicked', async () => {
      const onLike = jest.fn()
      render(<ProductCard product={mockProduct} likeable likeCount={500} onLike={onLike} />)
      await userEvent.click(screen.getByRole('button', { name: /i didn't buy this: test brand/i }))
      expect(onLike).toHaveBeenCalledWith('test-001')
    })

    it('shows liked state when isLiked=true', () => {
      render(<ProductCard product={mockProduct} likeable isLiked likeCount={501} />)
      expect(screen.getByRole('button', { name: /you boycotted: test brand/i })).toBeInTheDocument()
    })

    it('is disabled when already liked', () => {
      render(<ProductCard product={mockProduct} likeable isLiked likeCount={501} />)
      expect(screen.getByRole('button', { name: /you boycotted: test brand/i })).toBeDisabled()
    })

    it('does not call onLike when already liked', async () => {
      const onLike = jest.fn()
      render(<ProductCard product={mockProduct} likeable isLiked likeCount={501} onLike={onLike} />)
      await userEvent.click(screen.getByRole('button', { name: /you boycotted: test brand/i }))
      expect(onLike).not.toHaveBeenCalled()
    })

    it('renders like button without onLike when user is not logged in', () => {
      render(<ProductCard product={mockProduct} likeable likeCount={500} />)
      const btn = screen.getByRole('button', { name: /i didn't buy this: test brand/i })
      expect(btn).toBeInTheDocument()
    })
  })
})
