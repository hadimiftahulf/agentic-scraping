# Web Dashboard - Next.js

FB Marketplace Bot Dashboard built with Next.js 14, React Query, and Tailwind CSS.

## Features

- View and manage scraped products
- Filter products by status
- Trigger posting with one click
- Real-time status updates
- Batch post multiple products
- Configure bot settings
- View job logs

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type check
npm run typecheck

# Run linter
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── store/           # Zustand stores
└── types/           # TypeScript types
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack React Query
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
