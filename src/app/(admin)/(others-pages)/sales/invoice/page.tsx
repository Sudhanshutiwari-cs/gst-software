'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Play, Settings, Plus, Eye, Send, MoreVertical, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'draft';
  mode?: string;
  billNumber: string;
  customer: string;
  phone: string;
  date: string;
  time: string;
  daysSincePending?: number;
}

// Theme types
type Theme = 'light' | 'dark';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 4000.0,
    status: 'pending',
    billNumber: 'INV-1180',
    customer: 'Sudhanshu Tiwari',
    phone: '+919140048553',
    date: '16 Nov 2025',
    time: '12 hours ago',
  },
  {
    id: '2',
    amount: 9500.0,
    status: 'pending',
    billNumber: 'INV-1179',
    customer: 'Sudhanshu Tiwari',
    phone: '+919140048553',
    date: '15 Nov 2025',
    time: 'Yesterday, 8:57 PM',
    daysSincePending: 1,
  },
];

type TabType = 'all' | 'pending' | 'paid' | 'cancelled' | 'drafts';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Theme state
  const [theme, setTheme] = useState<Theme>('light');

  const allTransactionCount = mockTransactions.length;

  const filteredTransactions =
    activeTab === 'all'
      ? mockTransactions
      : mockTransactions.filter((t) => t.status === activeTab);

  const total = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const paid = mockTransactions.filter((t) => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pending = mockTransactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  // Initialize theme and set up listeners
  useEffect(() => {
    // Function to get initial theme
    const getInitialTheme = (): Theme => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          return savedTheme;
        }
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'light';
    };

    // Function to apply theme to DOM
    const applyTheme = (newTheme: Theme) => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Set initial theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for storage changes (theme changes in other tabs/windows)
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

  // Effect to update theme when state changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-border bg-card'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Sales</h1>
            <Play className={`h-6 w-6 ${
              theme === 'dark' ? 'fill-pink-400 text-pink-400' : 'fill-pink-500 text-pink-500'
            }`} />
          </div>

          {/* Replaced ShadCN Buttons */}
          <div className="flex items-center gap-3">
            <button className={`flex items-center gap-2 px-4 py-2 transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <Settings className="h-5 w-5" />
              <span>Document Settings</span>
            </button>

            <button className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              theme === 'dark' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}>
              POS Billing
            </button>

            <button className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
              <Plus className="h-4 w-4" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-t transition-colors duration-200 px-6 ${
          theme === 'dark' ? 'border-gray-700' : 'border-border'
        }`}>
          <div className="flex gap-8">
            {[
              { id: 'all' as TabType, label: 'All Transactions', count: allTransactionCount },
              { id: 'pending' as TabType, label: 'Pending', count: 0 },
              { id: 'paid' as TabType, label: 'Paid', count: 0 },
              { id: 'cancelled' as TabType, label: 'Cancelled', count: 0 },
              { id: 'drafts' as TabType, label: 'Drafts', count: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-0 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : theme === 'dark'
                    ? 'border-transparent text-gray-400 hover:text-gray-200'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.id === 'all' && (
                  <span className={`ml-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
      <main className="p-6">
        {/* Search + Filters */}
        <div className="mb-6 flex gap-4">
          <input
            placeholder="Search by transaction, customers, invoice #..."
            className={`flex-1 border px-3 py-2 rounded-lg transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            }`}
          />

          <div className="flex gap-2">
            <button className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              This Year
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              Actions
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className={`rounded-lg border p-2 transition-colors duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Card → Replaced with plain div */}
        <div className={`rounded-lg border shadow-sm overflow-hidden transition-colors duration-200 ${
          theme === 'dark' 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  {['Amount', 'Status', 'Mode', 'Bill #', 'Customer', 'Date', 'Actions'].map((head) => (
                    <th key={head} className={`px-6 py-3 text-left text-sm font-semibold transition-colors duration-200 ${
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

              {/* Rows */}
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className={`border-b transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      ₹{t.amount.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-red-500">⚠</span>
                      </div>
                      {t.daysSincePending && (
                        <p className={`text-xs transition-colors duration-200 ${
                          theme === 'dark' ? 'text-red-400' : 'text-red-500'
                        }`}>
                          since {t.daysSincePending} day
                        </p>
                      )}
                    </td>

                    <td className={`px-6 py-4 text-sm transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      -
                    </td>
                    
                    <td className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {t.billNumber}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className={`font-medium transition-colors duration-200 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t.customer}
                      </p>
                      <p className={`text-xs transition-colors duration-200 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {t.phone}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <p className={`font-medium transition-colors duration-200 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t.date}
                      </p>
                      <p className={`text-xs transition-colors duration-200 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {t.time}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className={`rounded p-1 transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}>
                          <span className="text-xs font-medium">₹</span>
                        </button>

                        <button className={`flex items-center gap-1 text-sm transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}>
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        <button className={`flex items-center gap-1 text-sm transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}>
                          <Send className="h-4 w-4" />
                          Send
                        </button>

                        <button className={`p-1 transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}>
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary + Pagination */}
        <div className={`mt-6 flex items-center justify-between rounded-lg px-6 py-4 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="flex gap-8">
            <div>
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
            <div>
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
            <div>
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

          <div className="flex items-center gap-4">
            <button className={`p-1 transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button className={`h-8 w-8 rounded font-semibold transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              1
            </button>

            <button className={`p-1 transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}>
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={`rounded border px-2 py-1 text-sm transition-colors duration-200 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className={`text-sm transition-colors duration-200 ${
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