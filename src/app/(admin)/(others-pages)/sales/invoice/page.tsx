'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Play, Settings, Plus, Eye, Send, MoreVertical, ChevronLeft, ChevronRight, Filter, Menu, Search, Download, Edit, Trash2, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';

// Updated interfaces to match API response
interface Product {
  id: number;
  invoice_id: string;
  product_name: string;
  product_id: number;
  product_sku: string;
  qty: number;
  gross_amt: string;
  gst: string;
  tax_inclusive: number;
  discount: string;
  total: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: number;
  invoice_id: string;
  biller_name: string;
  billing_to: string;
  mobile: string | null;
  email: string;
  whatsapp_number: string | null;
  grand_total: string;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'draft';
  payment_mode: string | null;
  utr_number: string | null;
  created_at: string;
  updated_at: string;
  products: Product[]; // Array of products
}

interface ApiResponse {
  success: boolean;
  data: Invoice[];
  message?: string;
}

// Theme types
type Theme = 'light' | 'dark';
type TabType = 'all' | 'pending' | 'paid' | 'cancelled' | 'drafts';
type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

// Payment mode labels mapping
const paymentModeLabels: { [key: string]: string } = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  '': 'Not Selected'
};

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

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [theme, setTheme] = useState<Theme>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('year');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Dispatch storage event to sync across tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme,
      oldValue: theme,
      storageArea: localStorage
    }));
  };

  // API Integration
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token from localStorage or your auth context
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setInvoices(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total quantity for an invoice
  const calculateTotalQuantity = (products: Product[]): number => {
    return products.reduce((sum, product) => sum + product.qty, 0);
  };

  // Calculate total GST for an invoice
  const calculateTotalGST = (products: Product[]): number => {
    return products.reduce((sum, product) => sum + parseFloat(product.gst), 0);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time ago for display
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Calculate days since pending
  const getDaysSincePending = (dateString: string, status: string) => {
    if (status !== 'pending') return undefined;

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays;
  };

  // Filter invoices based on active tab, search, and time filter
  const filteredInvoices = invoices.filter(invoice => {
    // Tab filter
    const tabMatch = activeTab === 'all' || invoice.payment_status === activeTab;

    // Search filter
    const searchMatch = searchQuery === '' ||
      invoice.billing_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.mobile && invoice.mobile.includes(searchQuery)) ||
      invoice.email.toLowerCase().includes(searchQuery.toLowerCase());

    return tabMatch && searchMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const allInvoiceCount = invoices.length;
  const pendingCount = invoices.filter(t => t.payment_status === 'pending').length;
  const paidCount = invoices.filter(t => t.payment_status === 'paid').length;
  const cancelledCount = invoices.filter(t => t.payment_status === 'cancelled').length;
  const draftsCount = invoices.filter(t => t.payment_status === 'draft').length;

  const total = invoices.reduce((sum, t) => sum + parseFloat(t.grand_total), 0);
  const paid = invoices.filter(t => t.payment_status === 'paid').reduce((sum, t) => sum + parseFloat(t.grand_total), 0);
  const pending = invoices.filter(t => t.payment_status === 'pending').reduce((sum, t) => sum + parseFloat(t.grand_total), 0);

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

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    // Set up mutation observer to watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Mock functions for actions
  const handleCreateInvoice = () => {
    router.push("/sales/create");
  };

  const handlePosBilling = () => {
    console.log('Opening POS billing...');
    alert('Opening POS billing system');
  };

  const handleDocumentSettings = () => {
    console.log('Opening document settings...');
    alert('Opening document settings');
  };

  const handleEdit = (invoiceId: number) => {
    console.log('Editing invoice:', invoiceId);
    // Redirect to the update page with the invoice ID
    router.push(`/sales/update/${invoiceId}`);
  };

  const handleView = (invoice: Invoice) => {
    console.log('Viewing invoice:', invoice);
    // Redirect to the invoice detail page
    router.push(`/sales/invoices/${invoice.id}`);
  };

  const handleSend = (invoice: Invoice) => {
    console.log('Sending invoice:', invoice);
    alert(`Sending invoice ${invoice.invoice_id} to ${invoice.email}`);
  };

  const handleBulkAction = (action: string) => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices first');
      return;
    }
    console.log(`Performing ${action} on:`, selectedInvoices);
    alert(`Performing ${action} on ${selectedInvoices.length} invoices`);
  };

  const toggleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map(t => t.id));
    }
  };

  const getStatusColor = (status: Invoice['payment_status']) => {
    const colors = {
      pending: theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
      paid: theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
      cancelled: theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800',
      draft: theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
    };
    return colors[status];
  };

  const getModeColor = (mode: string | null) => {
    const modeKey = mode || '';
    const colors: { [key: string]: string } = {
      cash: theme === 'dark' ? 'text-green-400' : 'text-green-600',
      card: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      upi: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
      bank_transfer: theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600',
      wallet: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
      '': theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
    };
    return colors[modeKey] || colors[''];
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'
        }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'
        }`}>
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error loading invoices</div>
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchInvoices}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'
      }`}>
      <ToastContainer 
        position="bottom-right"
        theme={theme}
        toastClassName={() => 
          `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`
        }
      />
      
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-border bg-card'
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
            <Play className={`h-5 w-5 sm:h-6 sm:w-6 ${theme === 'dark' ? 'fill-pink-400 text-pink-400' : 'fill-pink-500 text-pink-500'
              }`} />
          </div>

          {/* Desktop Actions - Including Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={handleDocumentSettings}
              className={`flex items-center gap-2 px-3 py-2 xl:px-4 xl:py-2 rounded-lg transition-colors duration-200 min-h-[40px] ${theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Settings className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="text-sm xl:text-base">Document Settings</span>
            </button>

            <button
              onClick={handlePosBilling}
              className={`px-3 py-2 xl:px-4 xl:py-2 rounded-lg font-medium transition-colors duration-200 min-h-[40px] text-sm xl:text-base ${theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
            >
              POS Billing
            </button>

            <button
              onClick={handleCreateInvoice}
              className={`px-3 py-2 xl:px-4 xl:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 min-h-[40px] text-sm xl:text-base ${theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>

          {/* Tablet Actions - Including Theme Toggle */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={handleCreateInvoice}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={handleDocumentSettings}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Actions - Including Theme Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={handleCreateInvoice}
              className={`p-2 rounded-lg transition-colors duration-200 ${theme === 'dark'
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
          <div className={`lg:hidden border-t px-4 py-2 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-700' : 'border-border'
            }`}>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDocumentSettings}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors duration-200 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Settings className="h-4 w-4" />
                Document Settings
              </button>
              <button
                onClick={handlePosBilling}
                className={`px-3 py-3 rounded-lg font-medium transition-colors duration-200 text-sm text-left ${theme === 'dark'
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
        <div className={`border-t transition-colors duration-200 px-4 sm:px-6 ${theme === 'dark' ? 'border-gray-700' : 'border-border'
          }`}>
          <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all' as TabType, label: 'All', count: allInvoiceCount, mobileLabel: 'All' },
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
                className={`flex-shrink-0 border-b-2 px-2 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap min-h-[48px] flex items-center ${activeTab === tab.id
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
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${theme === 'dark'
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
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search invoices, customers, bill numbers..."
              className={`w-full border pl-10 pr-3 py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none min-h-[44px] cursor-pointer ${theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
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
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none min-h-[44px] cursor-pointer ${theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                } border`}
            >
              <option value="">Actions</option>
              {actionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className={`rounded-lg border p-3 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200 hover:border-blue-400'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-blue-500'
              }`}>
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedInvoices.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg flex items-center justify-between transition-colors duration-200 ${theme === 'dark' 
              ? 'bg-blue-900/80 text-blue-100 border border-blue-700' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
            <span className="text-sm font-medium">
              {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('export')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors duration-200 ${theme === 'dark'
                    ? 'bg-blue-800 hover:bg-blue-700 text-blue-100'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => handleBulkAction('bulk_edit')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors duration-200 ${theme === 'dark'
                    ? 'bg-blue-800 hover:bg-blue-700 text-blue-100'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleBulkAction('bulk_delete')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors duration-200 ${theme === 'dark'
                    ? 'bg-red-900/50 hover:bg-red-800/70 text-red-200'
                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Table Container */}
        <div className={`rounded-lg border shadow-sm overflow-hidden transition-colors duration-200 ${theme === 'dark'
            ? 'border-gray-700 bg-gray-800'
            : 'border-gray-200 bg-white'
          }`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className={`border-b transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                  <th className="px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                      onChange={selectAllInvoices}
                      className={`rounded transition-colors duration-200 cursor-pointer ${theme === 'dark'
                          ? 'bg-gray-600 border-gray-500 text-blue-400 focus:ring-2 focus:ring-blue-900'
                          : 'bg-white border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-100'
                        } focus:ring-offset-0`}
                    />
                  </th>
                  {['Amount', 'Status', 'Mode', 'Invoice #', 'Customer', 'Date', 'Actions'].map((head) => (
                    <th 
                      key={head} 
                      className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {head}
                        <ChevronDown className={`h-4 w-4 transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                          }`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((invoice) => {
                    const daysSincePending = getDaysSincePending(invoice.created_at, invoice.payment_status);
                    const totalQuantity = calculateTotalQuantity(invoice.products);
                    const totalGST = calculateTotalGST(invoice.products);

                    return (
                      <tr key={invoice.id} className={`border-b transition-colors duration-200 ${theme === 'dark'
                          ? 'border-gray-700 hover:bg-gray-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => toggleInvoiceSelection(invoice.id)}
                            className={`rounded transition-colors duration-200 cursor-pointer ${theme === 'dark'
                                ? 'bg-gray-600 border-gray-500 text-blue-400 focus:ring-2 focus:ring-blue-900'
                                : 'bg-white border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-100'
                              } focus:ring-offset-0`}
                          />
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                          ₹{parseFloat(invoice.grand_total).toFixed(2)}
                          <span className={`block text-xs font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            Tax: ₹{totalGST.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium transition-colors duration-200 ${getStatusColor(invoice.payment_status)}`}>
                              {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                            </span>
                            {invoice.payment_status === 'pending' && daysSincePending && (
                              <span className="text-red-500">⚠</span>
                            )}
                          </div>
                          {invoice.payment_status === 'pending' && daysSincePending !== undefined && (
                            <p className={`text-xs transition-colors duration-200 mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'
                              }`}>
                              since {daysSincePending} day{daysSincePending !== 1 ? 's' : ''}
                            </p>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-sm transition-colors duration-200 whitespace-nowrap ${getModeColor(invoice.payment_mode)}`}>
                          {paymentModeLabels[invoice.payment_mode || '']}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                          {invoice.invoice_id}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <p className={`font-medium transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            {invoice.billing_to}
                          </p>
                          <p className={`text-xs transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {invoice.mobile || 'No phone'}
                          </p>
                          {invoice.email && (
                            <p className={`text-xs transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {invoice.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <p className={`font-medium transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            {formatDate(invoice.created_at)}
                          </p>
                          <p className={`text-xs transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {formatTimeAgo(invoice.created_at)}
                          </p>
                          <p className={`text-xs transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(invoice.id)}
                              className={`flex items-center gap-1 text-sm transition-colors duration-200 px-2 py-2 rounded hover:bg-opacity-20 min-h-[32px] ${theme === 'dark'
                                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                }`}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden lg:inline ml-1">Edit</span>
                            </button>
                            <button
                              onClick={() => handleView(invoice)}
                              className={`flex items-center gap-1 text-sm transition-colors duration-200 px-2 py-2 rounded hover:bg-opacity-20 min-h-[32px] ${theme === 'dark'
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden lg:inline ml-1">View</span>
                            </button>
                            <button
                              onClick={() => handleSend(invoice)}
                              className={`flex items-center gap-1 text-sm transition-colors duration-200 px-2 py-2 rounded hover:bg-opacity-20 min-h-[32px] ${theme === 'dark'
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                              <Send className="h-4 w-4" />
                              <span className="hidden lg:inline ml-1">Send</span>
                            </button>
                            <button className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 min-h-[32px] min-w-[32px] flex items-center justify-center ${theme === 'dark'
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}>
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className={`transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <p className="text-lg font-medium mb-2">No invoices found</p>
                        <p className="text-sm">
                          {searchQuery ? 'Try adjusting your search criteria' : `No ${activeTab === 'all' ? '' : activeTab} invoices available`}
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
        <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg px-4 py-4 sm:px-6 transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
          <div className="flex gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Total
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                ₹{total.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Paid
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                ₹{paid.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className={`text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Pending
              </p>
              <p className={`text-lg font-bold transition-colors duration-200 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
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
                className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 min-h-[36px] min-w-[36px] flex items-center justify-center ${currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className={`px-3 py-1 text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 transition-colors duration-200 rounded hover:bg-opacity-20 min-h-[36px] min-w-[36px] flex items-center justify-center ${currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                className={`rounded border px-3 py-2 text-sm transition-colors duration-200 cursor-pointer min-h-[36px] ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-900'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className={`text-sm transition-colors duration-200 hidden sm:inline ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
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