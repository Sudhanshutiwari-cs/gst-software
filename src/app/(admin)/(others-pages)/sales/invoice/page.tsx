'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Play, Settings, Plus, Eye, Send, MoreVertical, ChevronLeft, ChevronRight, Filter, Menu, Search, Download, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'draft';
  mode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'wallet' | '';
  billNumber: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  daysSincePending?: number;
  customerEmail?: string;
  items?: number;
  tax?: number;
}

// Theme types
type Theme = 'light' | 'dark';
type TabType = 'all' | 'pending' | 'paid' | 'cancelled' | 'drafts';
type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

// Enhanced mock data with realistic transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 4000.0,
    status: 'pending',
    mode: 'upi',
    billNumber: 'INV-2024-1180',
    customer: 'Sudhanshu Tiwari',
    phone: '+919140048553',
    date: '16 Nov 2024',
    time: '12 hours ago',
    daysSincePending: 1,
    customerEmail: 'sudhanshu@example.com',
    items: 3,
    tax: 400
  },
  {
    id: '2',
    amount: 9500.0,
    status: 'pending',
    mode: 'card',
    billNumber: 'INV-2024-1179',
    customer: 'Aarav Sharma',
    phone: '+919140048554',
    date: '15 Nov 2024',
    time: 'Yesterday, 8:57 PM',
    daysSincePending: 2,
    customerEmail: 'aarav@example.com',
    items: 5,
    tax: 950
  },
  {
    id: '3',
    amount: 2500.0,
    status: 'paid',
    mode: 'cash',
    billNumber: 'INV-2024-1178',
    customer: 'Priya Patel',
    phone: '+919140048555',
    date: '14 Nov 2024',
    time: '2 days ago',
    customerEmail: 'priya@example.com',
    items: 2,
    tax: 250
  },
  {
    id: '4',
    amount: 12000.0,
    status: 'paid',
    mode: 'bank_transfer',
    billNumber: 'INV-2024-1177',
    customer: 'Rahul Kumar',
    phone: '+919140048556',
    date: '13 Nov 2024',
    time: '3 days ago',
    customerEmail: 'rahul@example.com',
    items: 8,
    tax: 1200
  },
  {
    id: '5',
    amount: 3500.0,
    status: 'cancelled',
    mode: 'wallet',
    billNumber: 'INV-2024-1176',
    customer: 'Neha Gupta',
    phone: '+919140048557',
    date: '12 Nov 2024',
    time: '4 days ago',
    customerEmail: 'neha@example.com',
    items: 4,
    tax: 350
  },
  {
    id: '6',
    amount: 1800.0,
    status: 'draft',
    mode: '',
    billNumber: 'INV-2024-1175',
    customer: 'Vikram Singh',
    phone: '+919140048558',
    date: '11 Nov 2024',
    time: '5 days ago',
    customerEmail: 'vikram@example.com',
    items: 2,
    tax: 180
  },
  {
    id: '7',
    amount: 6200.0,
    status: 'paid',
    mode: 'upi',
    billNumber: 'INV-2024-1174',
    customer: 'Ananya Reddy',
    phone: '+919140048559',
    date: '10 Nov 2024',
    time: '6 days ago',
    customerEmail: 'ananya@example.com',
    items: 6,
    tax: 620
  },
  {
    id: '8',
    amount: 8900.0,
    status: 'pending',
    mode: 'card',
    billNumber: 'INV-2024-1173',
    customer: 'Karan Malhotra',
    phone: '+919140048560',
    date: '9 Nov 2024',
    time: '1 week ago',
    daysSincePending: 7,
    customerEmail: 'karan@example.com',
    items: 7,
    tax: 890
  },
  {
    id: '9',
    amount: 1500.0,
    status: 'paid',
    mode: 'cash',
    billNumber: 'INV-2024-1172',
    customer: 'Sneha Joshi',
    phone: '+919140048561',
    date: '8 Nov 2024',
    time: '1 week ago',
    customerEmail: 'sneha@example.com',
    items: 1,
    tax: 150
  },
  {
    id: '10',
    amount: 4500.0,
    status: 'draft',
    mode: '',
    billNumber: 'INV-2024-1171',
    customer: 'Rohan Mehta',
    phone: '+919140048562',
    date: '7 Nov 2024',
    time: '1 week ago',
    customerEmail: 'rohan@example.com',
    items: 3,
    tax: 450
  }
];

// Mock data for dropdown options
const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const actionOptions = [
  { value: 'export', label: 'Export', icon: Download },
  { value: 'bulk_edit', label: 'Bulk Edit', icon: Edit },
  { value: 'bulk_delete', label: 'Bulk Delete', icon: Trash2 }
];

const paymentModeLabels = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  '': 'Not Selected'
};

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [theme, setTheme] = useState<Theme>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('year');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  // Filter transactions based on active tab, search, and time filter
  const filteredTransactions = mockTransactions.filter(transaction => {
    // Tab filter
    const tabMatch = activeTab === 'all' || transaction.status === activeTab;
    
    // Search filter
    const searchMatch = searchQuery === '' || 
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.phone.includes(searchQuery) ||
      transaction.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return tabMatch && searchMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const allTransactionCount = mockTransactions.length;
  const pendingCount = mockTransactions.filter(t => t.status === 'pending').length;
  const paidCount = mockTransactions.filter(t => t.status === 'paid').length;
  const cancelledCount = mockTransactions.filter(t => t.status === 'cancelled').length;
  const draftsCount = mockTransactions.filter(t => t.status === 'draft').length;

  const total = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const paid = mockTransactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pending = mockTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  // Theme management
  useEffect(() => {
    const getInitialTheme = (): Theme => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          return savedTheme;
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'light';
    };

    const applyTheme = (newTheme: Theme) => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = (e.newValue as Theme) || 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Mock functions for actions
  const handleCreateInvoice = () => {
    router.push("/sales/create");
    console.log('Creating new invoice...');
    // In a real app, this would navigate to invoice creation page
    alert('Navigate to invoice creation page');
  };

  const handlePosBilling = () => {
    console.log('Opening POS billing...');
    alert('Opening POS billing system');
  };

  const handleDocumentSettings = () => {
    console.log('Opening document settings...');
    alert('Opening document settings');
  };

  const handlePayment = (transactionId: string) => {
    console.log('Processing payment for:', transactionId);
    alert(`Processing payment for transaction ${transactionId}`);
  };

  const handleView = (transaction: Transaction) => {
    console.log('Viewing transaction:', transaction);
    alert(`Viewing transaction: ${transaction.billNumber}\nCustomer: ${transaction.customer}\nAmount: ₹${transaction.amount}`);
  };

  const handleSend = (transaction: Transaction) => {
    console.log('Sending transaction:', transaction);
    alert(`Sending invoice ${transaction.billNumber} to ${transaction.customerEmail}`);
  };

 

  const handleBulkAction = (action: string) => {
    if (selectedTransactions.length === 0) {
      alert('Please select transactions first');
      return;
    }
    console.log(`Performing ${action} on:`, selectedTransactions);
    alert(`Performing ${action} on ${selectedTransactions.length} transactions`);
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.length === paginatedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map(t => t.id));
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    const colors = {
      pending: theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
      paid: theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
      cancelled: theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800',
      draft: theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
    };
    return colors[status];
  };

  const getModeColor = (mode: Transaction['mode']) => {
    const colors = {
      cash: theme === 'dark' ? 'text-green-400' : 'text-green-600',
      card: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      upi: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
      bank_transfer: theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600',
      wallet: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
      '': theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
    };
    return colors[mode];
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-border bg-card'
      }`}>
        {/* Top Bar - Mobile & Desktop */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button 
              className="lg:hidden p-2 rounded-lg transition-colors duration-200 hover:bg-opacity-20 hover:bg-gray-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold sm:text-2xl">Sales</h1>
            <Play className={`h-5 w-5 sm:h-6 sm:w-6 ${
              theme === 'dark' ? 'fill-pink-400 text-pink-400' : 'fill-pink-500 text-pink-500'
            }`} />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <button 
              onClick={handleDocumentSettings}
              className={`flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 rounded-lg transition-colors duration-200 min-h-[40px] ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="text-sm xl:text-base">Document Settings</span>
            </button>

            <button 
              onClick={handlePosBilling}
              className={`px-3 py-2 xl:px-4 xl:py-2 rounded-lg font-medium transition-colors duration-200 min-h-[40px] text-sm xl:text-base ${
                theme === 'dark' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              POS Billing
            </button>

            <button 
              onClick={handleCreateInvoice}
              className={`px-3 py-2 xl:px-4 xl:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 min-h-[40px] text-sm xl:text-base ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>

          {/* Tablet Actions */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <button 
              onClick={handleCreateInvoice}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDocumentSettings}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={handleCreateInvoice}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t px-4 py-2 transition-colors duration-200 ${
            theme === 'dark' ? 'border-gray-700' : 'border-border'
          }`}>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleDocumentSettings}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors duration-200 text-sm ${
                  theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4" />
                Document Settings
              </button>
              <button 
                onClick={handlePosBilling}
                className={`px-3 py-3 rounded-lg font-medium transition-colors duration-200 text-sm text-left ${
                  theme === 'dark' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                POS Billing
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`border-t transition-colors duration-200 px-4 sm:px-6 ${
          theme === 'dark' ? 'border-gray-700' : 'border-border'
        }`}>
          <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all' as TabType, label: 'All', count: allTransactionCount, mobileLabel: 'All' },
              { id: 'pending' as TabType, label: 'Pending', count: pendingCount, mobileLabel: 'Pending' },
              { id: 'paid' as TabType, label: 'Paid', count: paidCount, mobileLabel: 'Paid' },
              { id: 'cancelled' as TabType, label: 'Cancelled', count: cancelledCount, mobileLabel: 'Cancel' },
              { id: 'drafts' as TabType, label: 'Drafts', count: draftsCount, mobileLabel: 'Drafts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex-shrink-0 border-b-2 px-2 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[48px] flex items-center ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    theme === 'dark' 
                      ? activeTab === tab.id ? 'bg-blue-900 text-blue-100' : 'bg-gray-600 text-gray-300'
                      : activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-4 sm:p-6">
        {/* Search + Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search transactions, customers, bill numbers..."
              className={`w-full border pl-10 pr-3 py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none min-h-[44px] cursor-pointer ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
              } border`}
            >
              {timeFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                if (e.target.value) {
                  handleBulkAction(e.target.value);
                  setSelectedAction('');
                }
              }}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none min-h-[44px] cursor-pointer ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
              } border`}
            >
              <option value="">Actions</option>
              {actionOptions.map(option => {
                
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>

            <button className={`rounded-lg border p-3 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTransactions.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg flex items-center justify-between transition-colors duration-200 ${
            theme === 'dark' ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-700'
          }`}>
            <span className="text-sm font-medium">
              {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="flex items-center gap-2 px-3 py-1 text-sm rounded transition-colors duration-200 hover:bg-blue-200 hover:bg-opacity-30"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => handleBulkAction('bulk_edit')}
                className="flex items-center gap-2 px-3 py-1 text-sm rounded transition-colors duration-200 hover:bg-blue-200 hover:bg-opacity-30"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleBulkAction('bulk_delete')}
                className="flex items-center gap-2 px-3 py-1 text-sm rounded transition-colors duration-200 hover:bg-red-200 hover:bg-opacity-30 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Table Container */}
        <div className={`rounded-lg border shadow-sm overflow-hidden transition-colors duration-200 ${
          theme === 'dark' 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className={`border-b transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <th className="px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                      onChange={selectAllTransactions}
                      className={`rounded transition-colors duration-200 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-gray-600 border-gray-500 text-blue-400' 
                          : 'bg-white border-gray-300 text-blue-500'
                      }`}
                    />
                  </th>
                  {['Amount', 'Status', 'Mode', 'Bill #', 'Customer', 'Date', 'Actions'].map((head) => (
                    <th key={head} className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        {head}
                        <ChevronDown className={`h-4 w-4 transition-colors duration-200 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className={`border-b transition-colors duration-200 ${
                      theme === 'dark' 
                        ? 'border-gray-700 hover:bg-gray-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => toggleTransactionSelection(transaction.id)}
                          className={`rounded transition-colors duration-200 cursor-pointer ${
                            theme === 'dark' 
                              ? 'bg-gray-600 border-gray-500 text-blue-400' 
                              : 'bg-white border-gray-300 text-blue-500'
                          }`}
                        />
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        ₹{transaction.amount.toFixed(2)}
                        {transaction.tax && (
                          <span className={`block text-xs font-normal ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Tax: ₹{transaction.tax}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium transition-colors duration-200 ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                          {transaction.status === 'pending' && transaction.daysSincePending && (
                            <span className="text-red-500">⚠</span>
                          )}
                        </div>
                        {transaction.daysSincePending && (
                          <p className={`text-xs transition-colors duration-200 mt-1 ${
                            theme === 'dark' ? 'text-red-400' : 'text-red-500'
                          }`}>
                            since {transaction.daysSincePending} day{transaction.daysSincePending !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-sm transition-colors duration-200 whitespace-nowrap ${getModeColor(transaction.mode)}`}>
                        {paymentModeLabels[transaction.mode]}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {transaction.billNumber}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <p className={`font-medium transition-colors duration-200 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {transaction.customer}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {transaction.phone}
                        </p>
                        {transaction.customerEmail && (
                          <p className={`text-xs transition-colors duration-200 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {transaction.customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <p className={`font-medium transition-colors duration-200 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {transaction.date}
                        </p>
                        <p className={`text-xs transition-colors duration-200 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {transaction.time}
                        </p>
                        {transaction.items && (
                          <p className={`text-xs transition-colors duration-200 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {transaction.items} item{transaction.items !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {transaction.status === 'pending' && (
                            <button 
                              onClick={() => handlePayment(transaction.id)}
                              className={`rounded p-2 transition-colors duration-200 min-h-[32px] min-w-[32px] flex items-center justify-center ${
                                theme === 'dark'
                                  ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                            >
                              <span className="text-xs font-medium">₹</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleView(transaction)}
                            className={`flex items-center gap-1 text-sm transition-colors duration-200 px-2 py-2 rounded hover:bg-opacity-20 hover:bg-gray-400 min-h-[32px] ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden lg:inline ml-1">View</span>
                          </button>
                          <button 
                            onClick={() => handleSend(transaction)}
                            className={`flex items-center gap-1 text-sm transition-colors duration-200 px-2 py-2 rounded hover:bg-opacity-20 hover:bg-gray-400 min-h-[32px] ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <Send className="h-4 w-4" />
                            <span className="hidden lg:inline ml-1">Send</span>
                          </button>
                          <button className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 hover:bg-gray-400 min-h-[32px] min-w-[32px] flex items-center justify-center ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className={`transition-colors duration-200 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <p className="text-lg font-medium mb-2">No transactions found</p>
                        <p className="text-sm">
                          {searchQuery ? 'Try adjusting your search criteria' : `No ${activeTab === 'all' ? '' : activeTab} transactions available`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary + Pagination */}
        <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg px-4 py-4 sm:px-6 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="flex gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ₹{total.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Paid
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                ₹{paid.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Pending
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${
                theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
              }`}>
                ₹{pending.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 hover:bg-gray-400 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className={`px-3 py-1 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Page {currentPage} of {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 hover:bg-gray-400 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed' 
                    : theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`rounded border px-3 py-2 text-sm transition-colors duration-200 cursor-pointer min-h-[36px] ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className={`text-sm transition-colors duration-200 hidden sm:inline ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                / page
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}