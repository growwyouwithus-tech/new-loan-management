# Loan Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Navigate to the frontend directory**
```bash
cd "d:/loan management/frontend"
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Access the application**
Open your browser and navigate to: `http://localhost:3000`

## 🔐 Login Credentials

### Admin Panel
- **Email:** admin@lms.com
- **Password:** admin123
- **Access:** Full system access with all modules

### Shopkeeper Panel
- **Email:** shopkeeper@lms.com
- **Password:** shop123
- **Access:** Merchant panel with loan and collection features

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client and mock data
│   │   ├── client.js          # Axios instance with interceptors
│   │   └── mockData.js        # Mock data for development
│   ├── components/            # Reusable components
│   │   ├── auth/              # Authentication components
│   │   ├── common/            # Common components (Header, Sidebar, etc.)
│   │   └── ui/                # UI components (Button, Card, Table, etc.)
│   ├── layouts/               # Layout components
│   │   ├── AdminLayout.jsx    # Admin panel layout
│   │   └── ShopkeeperLayout.jsx # Shopkeeper panel layout
│   ├── lib/                   # Utilities and helpers
│   │   ├── db.js              # Dexie IndexedDB setup
│   │   └── utils.js           # Utility functions
│   ├── pages/                 # Page components
│   │   ├── admin/             # Admin panel pages
│   │   ├── auth/              # Authentication pages
│   │   └── shopkeeper/        # Shopkeeper panel pages
│   ├── store/                 # Zustand state management
│   │   ├── authStore.js       # Authentication state
│   │   └── themeStore.js      # Theme state
│   ├── styles/                # Global styles
│   │   └── index.css          # Tailwind CSS imports
│   ├── App.jsx                # Main app component with routing
│   └── main.jsx               # Application entry point
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration
```

## 🎨 Features Implemented

### Admin Panel Features
✅ **Dashboard**
- KPI overview with stats cards
- Disbursement and collection charts
- Loan status distribution
- Recent loans and quick actions

✅ **User Management**
- Create, edit, delete users
- Role-based access control (Admin, Credit Manager, Collections, Support, Verifier)
- Send invite links

✅ **Shopkeeper Management**
- Manage merchant accounts
- KYC verification workflow
- Credit limit management
- View shopkeeper details and statistics

✅ **Borrower Management**
- Customer profiles with KYC status
- Credit score tracking
- Loan history

✅ **Loan Origination**
- Loan application processing
- Approval/rejection workflow
- Loan status tracking (Pending, Active, Overdue, Closed)

✅ **Loan Details**
- Complete loan information
- Repayment schedule
- Payment history

✅ **KYC Verification**
- Document verification workflow
- Approve/reject KYC requests

✅ **Repayment Management**
- Track all repayments
- Record manual payments
- View payment history

✅ **Notifications Management**
- System notifications
- Alert templates

✅ **Reports & Exports**
- Portfolio reports
- Disbursement reports
- Collection reports
- NPA reports
- Export to CSV/PDF

✅ **Audit Logs**
- Track all system activities
- User action history

✅ **Support Tickets**
- Customer support management
- Ticket status tracking

✅ **Configuration**
- Loan product settings
- Penalty rules configuration

### Shopkeeper Panel Features
✅ **Dashboard**
- Business overview with KPIs
- Collection trends
- Recent loans
- Quick actions

✅ **Apply for Loan**
- Customer loan application form
- EMI calculator
- Eligibility checker
- Form validation with Zod

✅ **Loan Tracking**
- View all loan applications
- Track loan status
- Monitor due dates

✅ **Collect Payment**
- Record customer payments
- Multiple payment methods (Cash, UPI, Card, Wallet)
- Offline support with IndexedDB
- Auto-sync when online

✅ **Customer List**
- Customer database
- Search and filter
- Customer loan history

✅ **Commission & Incentives**
- Track earnings
- Commission trends
- Pending payouts

✅ **Notifications**
- Payment reminders
- Loan status updates
- Important alerts

## 🛠️ Technology Stack

### Core
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **JavaScript** - Programming language

### Styling
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management

### Routing
- **React Router v6** - Client-side routing with RBAC

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Data Tables
- **TanStack Table v8** - Powerful table component with sorting, filtering, pagination

### Charts
- **Recharts** - Composable charting library

### Offline Support
- **Dexie** - IndexedDB wrapper for offline data storage

### API & Authentication
- **Axios** - HTTP client with interceptors
- **jwt-decode** - JWT token decoding
- **Refresh token logic** - Automatic token refresh

### Notifications
- **React Toastify** - Toast notifications

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🌐 API Integration

The application is configured to work with a backend API. Update the API URL in `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### API Endpoints Expected

```
POST   /api/auth/login          # User login
POST   /api/auth/refresh        # Refresh access token
GET    /api/users               # Get all users
POST   /api/users               # Create user
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
GET    /api/shopkeepers         # Get all shopkeepers
GET    /api/borrowers           # Get all borrowers
GET    /api/loans               # Get all loans
POST   /api/loans               # Create loan
PUT    /api/loans/:id           # Update loan
GET    /api/repayments          # Get repayments
POST   /api/repayments          # Record payment
```

## 🎯 Key Features

### Authentication & Security
- JWT-based authentication with access and refresh tokens
- Automatic token refresh on expiry
- Role-based access control (RBAC)
- Protected routes
- Secure logout

### Offline Support
- IndexedDB for local data storage
- Auto-sync when connection is restored
- Works offline for payment collection

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts
- Touch-friendly controls

### Dark Mode
- Light/Dark theme toggle
- Persistent theme preference
- System theme detection

### Performance
- Code splitting
- Lazy loading
- Optimized re-renders
- React Query caching

## 🐛 Troubleshooting

### Port already in use
If port 3000 is already in use, modify `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any available port
}
```

### Dependencies installation fails
Try clearing npm cache:
```bash
npm cache clean --force
npm install
```

### Build fails
Ensure you have the correct Node.js version:
```bash
node --version  # Should be 18+
```

## 📝 Development Notes

### Mock Data
The application uses mock data for development. Replace API calls in components with actual backend endpoints.

### Authentication
Currently using mock authentication. Integrate with your backend API by updating `src/store/authStore.js`.

### Offline Sync
Payment collection supports offline mode. Data is stored in IndexedDB and synced when online.

## 🚢 Production Deployment

### Build for production
```bash
npm run build
```

The build output will be in the `dist` folder.

### Deploy to hosting
Upload the `dist` folder to your hosting provider (Netlify, Vercel, etc.)

### Environment Variables
Set production environment variables:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 📞 Support

For issues or questions, refer to the documentation or contact the development team.

## 📄 License

MIT License - feel free to use this project for your needs.
