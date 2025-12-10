// Mock data for development
export const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@lms.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Credit Manager', email: 'credit@lms.com', role: 'credit_manager', status: 'active' },
  { id: 3, name: 'Collections Officer', email: 'collections@lms.com', role: 'collections', status: 'active' },
]

export const mockShopkeepers = [
  { 
    id: 1, 
    name: 'Raj Electronics', 
    owner: 'Rajesh Kumar', 
    email: 'raj@electronics.com', 
    phone: '+91 9876543210',
    kycStatus: 'verified',
    totalLoans: 25,
    activeLoans: 8,
    creditLimit: 500000,
    availableCredit: 320000,
    status: 'active'
  },
  { 
    id: 2, 
    name: 'Sharma Mobiles', 
    owner: 'Amit Sharma', 
    email: 'amit@sharmamobiles.com', 
    phone: '+91 9876543211',
    kycStatus: 'pending',
    totalLoans: 12,
    activeLoans: 5,
    creditLimit: 300000,
    availableCredit: 180000,
    status: 'active'
  },
]

export const mockBorrowers = [
  {
    id: 1,
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '+91 9876543212',
    address: '123 MG Road, Mumbai',
    kycStatus: 'verified',
    totalLoans: 3,
    activeLoans: 1,
    totalBorrowed: 150000,
    totalRepaid: 100000,
    creditScore: 720,
    status: 'active'
  },
  {
    id: 2,
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '+91 9876543213',
    address: '456 Park Street, Delhi',
    kycStatus: 'verified',
    totalLoans: 5,
    activeLoans: 2,
    totalBorrowed: 300000,
    totalRepaid: 250000,
    creditScore: 680,
    status: 'active'
  },
]

export const mockLoans = [
  {
    id: 'LN001',
    borrower: 'Priya Patel',
    borrowerId: 1,
    shopkeeper: 'Raj Electronics',
    shopkeeperId: 1,
    amount: 50000,
    interestRate: 12,
    tenure: 12,
    emi: 4442,
    status: 'active',
    disbursedDate: '2024-01-15',
    dueDate: '2024-02-15',
    remainingAmount: 35000,
    paidAmount: 15000,
    overdueAmount: 0,
    purpose: 'Mobile Phone Purchase'
  },
  {
    id: 'LN002',
    borrower: 'Vikram Singh',
    borrowerId: 2,
    shopkeeper: 'Sharma Mobiles',
    shopkeeperId: 2,
    amount: 100000,
    interestRate: 14,
    tenure: 24,
    emi: 4850,
    status: 'overdue',
    disbursedDate: '2023-12-01',
    dueDate: '2024-01-01',
    remainingAmount: 85000,
    paidAmount: 15000,
    overdueAmount: 9700,
    purpose: 'Laptop Purchase'
  },
  {
    id: 'LN003',
    borrower: 'Priya Patel',
    borrowerId: 1,
    shopkeeper: 'Raj Electronics',
    shopkeeperId: 1,
    amount: 30000,
    interestRate: 12,
    tenure: 6,
    emi: 5170,
    status: 'pending_approval',
    disbursedDate: null,
    dueDate: null,
    remainingAmount: 30000,
    paidAmount: 0,
    overdueAmount: 0,
    purpose: 'Tablet Purchase'
  },
]

export const mockRepayments = [
  {
    id: 1,
    loanId: 'LN001',
    borrower: 'Priya Patel',
    amount: 4442,
    paymentDate: '2024-01-15',
    dueDate: '2024-01-15',
    status: 'paid',
    method: 'UPI',
    transactionId: 'TXN123456',
  },
  {
    id: 2,
    loanId: 'LN001',
    borrower: 'Priya Patel',
    amount: 4442,
    paymentDate: null,
    dueDate: '2024-02-15',
    status: 'pending',
    method: null,
    transactionId: null,
  },
]

export const mockDashboardStats = {
  totalLoans: 1250,
  activeLoans: 420,
  totalDisbursed: 25000000,
  totalCollected: 18500000,
  overdueAmount: 1250000,
  npaPercentage: 4.2,
  todayDisbursements: 5,
  todayCollections: 12,
  pendingApprovals: 24,
  kycPending: 18,
  monthlyEmiCollection: 2500000,
  pendingEmis: 156,
  collectedEmis: 342
}

export const mockChartData = {
  disbursements: [
    { date: '2024-01-01', amount: 250000 },
    { date: '2024-01-02', amount: 180000 },
    { date: '2024-01-03', amount: 320000 },
    { date: '2024-01-04', amount: 290000 },
    { date: '2024-01-05', amount: 410000 },
    { date: '2024-01-06', amount: 350000 },
    { date: '2024-01-07', amount: 280000 },
  ],
  collections: [
    { date: '2024-01-01', amount: 220000 },
    { date: '2024-01-02', amount: 190000 },
    { date: '2024-01-03', amount: 280000 },
    { date: '2024-01-04', amount: 310000 },
    { date: '2024-01-05', amount: 350000 },
    { date: '2024-01-06', amount: 290000 },
    { date: '2024-01-07', amount: 260000 },
  ],
  loansByStatus: [
    { name: 'Active', value: 89, color: '#3b82f6' },
    { name: 'Closed', value: 45, color: '#10b981' },
    { name: 'Overdue', value: 12, color: '#ef4444' },
    { name: 'Pending', value: 10, color: '#f59e0b' },
  ],
}

export const mockNotifications = [
  {
    id: 1,
    title: 'Loan Approved',
    message: 'Loan LN003 has been approved',
    type: 'success',
    read: false,
    timestamp: '2024-01-07T10:30:00',
  },
  {
    id: 2,
    title: 'Payment Overdue',
    message: 'Payment for LN002 is overdue by 7 days',
    type: 'warning',
    read: false,
    timestamp: '2024-01-07T09:15:00',
  },
  {
    id: 3,
    title: 'KYC Verification Required',
    message: '5 new customers need KYC verification',
    type: 'info',
    read: true,
    timestamp: '2024-01-06T16:45:00',
  },
]

export const mockAuditLogs = [
  {
    id: 1,
    user: 'Admin User',
    action: 'Loan Approved',
    entity: 'Loan',
    entityId: 'LN003',
    timestamp: '2024-01-07T10:30:00',
    details: 'Approved loan application for ₹30,000',
  },
  {
    id: 2,
    user: 'Credit Manager',
    action: 'User Created',
    entity: 'Shopkeeper',
    entityId: 'SH005',
    timestamp: '2024-01-07T09:15:00',
    details: 'Created new shopkeeper account',
  },
]

export const mockTickets = [
  {
    id: 'TKT001',
    title: 'Unable to make payment',
    description: 'Customer is facing issues with UPI payment',
    customer: 'Priya Patel',
    status: 'open',
    priority: 'high',
    assignedTo: 'Support Team',
    createdAt: '2024-01-07T10:00:00',
    updatedAt: '2024-01-07T10:00:00',
  },
  {
    id: 'TKT002',
    title: 'KYC document rejected',
    description: 'Need clarification on document rejection',
    customer: 'Vikram Singh',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Verification Team',
    createdAt: '2024-01-06T14:30:00',
    updatedAt: '2024-01-07T09:00:00',
  },
]
