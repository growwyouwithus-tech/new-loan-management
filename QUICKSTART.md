# 🚀 Quick Start Guide

## Installation & Running (3 Simple Steps)

### Step 1: Install Dependencies
```bash
cd "d:/loan management/frontend"
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: **http://localhost:3000**

---

## 🔐 Login Credentials

### Admin Panel
```
Email: admin@lms.com
Password: admin123
```

### Shopkeeper Panel
```
Email: shopkeeper@lms.com
Password: shop123
```

---

## 📱 What You'll See

### Admin Panel (`/admin`)
- **Dashboard** - KPIs, charts, recent loans
- **Users** - Manage system users
- **Shopkeepers** - Manage merchants
- **Borrowers** - Customer profiles
- **Loans** - Loan origination & tracking
- **KYC** - Document verification
- **Repayments** - Payment management
- **Reports** - Export data
- **Audit Logs** - Activity tracking
- **Support** - Ticket management
- **Configuration** - System settings

### Shopkeeper Panel (`/shopkeeper`)
- **Dashboard** - Business overview
- **Apply Loan** - Create loan applications
- **Loans** - Track loan status
- **Collect Payment** - Record payments (works offline!)
- **Customers** - Customer database
- **Commission** - Earnings tracker
- **Notifications** - Alerts & reminders

---

## ✨ Key Features to Try

### 1. Dark Mode Toggle
Click the sun/moon icon in the header

### 2. Offline Payment Collection
1. Go to Shopkeeper → Collect Payment
2. Turn off internet
3. Record a payment
4. Turn on internet - it auto-syncs!

### 3. EMI Calculator
1. Go to Shopkeeper → Apply Loan
2. Enter amount and tenure
3. Click "Calculate EMI"

### 4. Data Tables
- Click column headers to sort
- Use search box to filter
- Navigate with pagination

### 5. Charts & Visualizations
- Hover over charts for details
- View trends over time
- Interactive pie charts

---

## 🛠️ Troubleshooting

### Port Already in Use?
Edit `vite.config.js` and change port:
```javascript
server: {
  port: 3001, // Change this
}
```

### Dependencies Won't Install?
```bash
npm cache clean --force
npm install
```

### Page Won't Load?
Check console for errors. Make sure you're on Node.js 18+:
```bash
node --version
```

---

## 📚 Full Documentation

- **SETUP.md** - Detailed setup instructions
- **FEATURES.md** - Complete feature list
- **README.md** - Project overview

---

## 🎯 Next Steps

1. **Explore the Admin Panel**
   - Create users, shopkeepers, borrowers
   - Process loan applications
   - Generate reports

2. **Try the Shopkeeper Panel**
   - Apply for loans
   - Collect payments
   - Track commissions

3. **Test Offline Mode**
   - Record payments offline
   - Watch auto-sync work

4. **Customize**
   - Modify colors in `tailwind.config.js`
   - Add your logo
   - Connect to your backend API

---

## 💡 Tips

- **Mock Data**: All data is currently mocked. Replace with real API calls.
- **Authentication**: Uses mock login. Integrate with your backend.
- **Responsive**: Try it on mobile - fully responsive!
- **Theme**: Dark mode preference is saved automatically.

---

## 🎉 You're Ready!

The application is fully functional with all features implemented.

**Happy coding!** 🚀
