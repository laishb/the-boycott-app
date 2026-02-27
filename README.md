# Weekly Boycott App 🚫

A community-driven web app that empowers users to democratically decide which products to boycott each week based on voting.

## Features

- **Weekly Boycott List**: Display top 5 most voted products for the current week (public, no login required)
- **Democratic Voting**: Users can vote for products to boycott next week (requires Google sign-in)
- **Social Sharing**: Share boycotted products on WhatsApp, Facebook, Instagram, Telegram, or copy to clipboard
- **Store Alerts**: Get notified when near a supermarket (geolocation-based)
- **Elderly-Friendly**: Optimized for users 60+ with large text, clear navigation, max 3 clicks per action
- **Automatic Product Import**: Weekly automated import of products from Israeli government price data

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Lucide React icons
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, Hosting)
- **Authentication**: Google OAuth 2.0
- **Testing**: Jest + React Testing Library
- **Product Data**: Israeli government price data (Shufersal, Rami Levy, Victory, Yeinot Bitan)

## Project Structure

```
src/
├── components/        # React components (MainScreen, VoteScreen, ShareSheet, etc.)
├── hooks/            # Custom React hooks (useAuth, useShare, useVoting, etc.)
├── services/         # Firebase API integration (auth.js, voting.js, api.js)
├── utils/            # Utilities (constants, helpers, validators, weekHelpers, shareHelpers)
├── data/             # Mock data for development
└── styles/           # Global CSS and Tailwind config
functions/            # Firebase Cloud Functions (Node.js)
├── import-products/  # Python Cloud Run Job for weekly product import
└── index.js          # Weekly reset function

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (optional for development, required for production)
- Python 3.8+ (for product import job only)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/boycott.git
   cd boycott
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase config (or leave VITE_USE_MOCK=true for mock data)
   ```

4. **Run development server**
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch
```

### Building for Production

```bash
npm run build
npm run preview
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `true` | Use mock data (true) or Firebase (false) |
| `VITE_FIREBASE_API_KEY` | — | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | — | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | — | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | — | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | — | Firebase app ID |
| `VITE_APP_URL` | `https://boycott.app` | App URL for sharing |

Copy `.env.example` to `.env.local` and fill in your values.

## Core Business Logic

### One Vote Per Week
Users can vote once per week. The system checks if a vote exists within the current week window (Monday 00:00 to next Monday 00:00 local time).

### Boycott Bonus
Products that were boycotted in the previous week receive a 1.5x vote multiplier to maintain continuity.

### Week Reset
Every Monday at 00:00 local time, the top 5 voted products become the new boycott list for the week.

### Product Import Pipeline
A Cloud Run Job runs weekly (Sunday 22:00 UTC) to:
1. Download PriceFull XML files from 4 major Israeli supermarket chains
2. Parse and deduplicate products by barcode
3. Clean product names (remove chain names from product titles)
4. Filter to products appearing in 2+ chains (ensures price comparison validity)
5. Upsert to Firestore `products` collection

## Accessibility & UX

- **Text**: Minimum 16px font size
- **Touch Targets**: Minimum 44px for interactive elements
- **RTL Support**: Full support for Hebrew text (RTL layout)
- **Keyboard Navigation**: All modals support Escape key and Tab navigation
- **ARIA Labels**: All interactive elements properly labeled for screen readers
- **Color Contrast**: WCAG AA compliant color combinations

## Social Sharing

Users can share boycotted products on:
- **WhatsApp** — Primary platform (green button)
- **Facebook** — Alternative sharing (blue button)
- **Web Share API** — Native sharing (Instagram, Telegram, SMS on supported devices)
- **Copy to Clipboard** — Universal fallback

Share text includes:
- Product names and price ranges
- Personal note (optional, max 140 chars)
- App URL and hashtag (#חרם_שבועי)

## Database Schema

### `users` collection
```
{
  userId: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  lastVoteWeek: string,
  totalVotes: number
}
```

### `products` collection
```
{
  productId: string,
  name: string (Hebrew),
  barcode: string,
  priceRange: string (e.g., "₪100–150"),
  category: string,
  currentWeekVotes: number,
  totalHistoricalVotes: number,
  isPreviousBoycott: boolean,
  previousBoycottWeeks: string[],
  status: "active" | "boycotted" | "archived",
  suppliers: string[],
  importSource: "government-price-data" | "seed-script",
  lastImportedAt: timestamp,
  createdAt: timestamp
}
```

### `votes` collection
```
{
  userId: string,
  timestamp: timestamp,
  weekId: string (e.g., "2026-W09"),
  productIds: string[]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and commit (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Functional components only (no class components)
- Custom hooks for reusable logic
- Tailwind CSS for styling (no inline styles)
- Explicit code over clever abstractions
- Clear variable and function names

## Security

- Never commit `.env.local` (add to `.gitignore`)
- Validate all user input at boundaries
- Use prepared statements for any database queries
- Implement proper Firebase security rules
- No API keys or secrets in code or comments

## License

[Specify your license here]

## Contact

[Add contact information or links]
