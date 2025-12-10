# Loan Management System - Frontend

A complete, production-ready Loan Management System built with React + Vite.

## Tech Stack

- **React 18** + **Vite** (JavaScript)
- **TailwindCSS** for styling
- **React Router v6** for routing
- **Zustand** for state management
- **React Query** for API caching
- **TanStack Table v8** for data tables
- **Recharts** for visualizations
- **React Hook Form** + **Zod** for forms
- **Dexie** for offline IndexedDB sync
- **Framer Motion** for animations
- **React Toastify** for notifications
- **JWT** authentication with refresh token logic

## Features

### Admin Panel
- Dashboard with KPI overview
- User & Shopkeeper Management
- Borrower/Customer Profiles
- Loan Origination & Processing
- KYC & Document Verification
- Repayment & Collections
- Late Fees & Penalties
- Notifications & Communication
- Accounting & Ledger
- Reports & Exports
- Audit Logs
- Dispute & Support Ticketing
- Configuration & Master Data

### Shopkeeper Panel
- Dashboard with loan overview
- Apply for Loan / Create Customer Loan
- Customer KYC Capture
- Loan Approval Status Tracking
- Collect Payments
- Repayment Schedule
- Commission & Incentives
- Customer List & History
- Offline Mode with Auto Sync

### 📱 Responsive Design
- **Mobile-First**: Optimized for phones (320px+)
- **Tablet-Ready**: Perfect on tablets (768px+)
- **Desktop-Enhanced**: Beautiful on large screens
- **Touch-Friendly**: 44px minimum touch targets
- **Hamburger Menu**: Slide-in sidebar on mobile
- **Responsive Tables**: Horizontal scroll on small screens
- **Adaptive Layouts**: Grids stack on mobile

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/              # API layer with Axios
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── lib/             # Utilities and helpers
├── pages/           # Page components
│   ├── admin/       # Admin panel pages
│   └── shopkeeper/  # Shopkeeper panel pages
├── store/           # Zustand stores
├── styles/          # Global styles
└── main.jsx         # Entry point
```

## Authentication

The app uses JWT-based authentication with:
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Automatic token refresh
- Role-based access control (RBAC)

### Default Roles
- **Admin**: Full system access
- **Credit Manager**: Loan approval and management
- **Collections**: Payment and collection management
- **Support**: Customer support and ticketing
- **Verifier**: KYC and document verification
- **Shopkeeper**: Merchant panel access

## API Configuration

Update the API base URL in `src/api/client.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## License

MIT
