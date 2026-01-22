"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Eye, DollarSign, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Custom hook for theme management
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      // Only apply system theme if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as 'light' | 'dark';
        if (newTheme && (newTheme === 'light' || newTheme === 'dark')) {
          setTheme(newTheme);
          applyTheme(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return { theme, mounted };
};

// Types for API responses
interface InvoiceProduct {
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
  mobile: string;
  email: string;
  whatsapp_number: string | null;
  grand_total: string;
  payment_status: string;
  payment_mode: string | null;
  utr_number: string | null;
  created_at: string;
  products: InvoiceProduct[];
}

interface Product {
  id: number;
  [key: string]: unknown;
}

interface Customer {
  id: number;
  [key: string]: unknown;
}

interface ApiResponse<T> {
  data?: T[];
  products?: T[];
  customers?: T[];
  invoices?: T[];
  [key: string]: unknown;
}

interface ApiStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
}

// Helper function to extract array from API response
function extractArrayFromResponse<T>(data: unknown, possibleKeys: string[]): T[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  if (typeof data === 'object' && data !== null) {
    const dataObj = data as Record<string, unknown>;
    for (const key of possibleKeys) {
      const value = dataObj[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }
  
  return [];
}

// Helper function to format INR currency
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol'
  }).format(amount);
}

export function StatsCards() {
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { theme, mounted } = useTheme()

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true)
        
        const token = localStorage.getItem('jwt_token') || 
                     localStorage.getItem('authToken') || 
                     localStorage.getItem('token')
        
        if (!token) {
          setError("No authentication token found. Please log in.")
          setLoading(false)
          return
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        const [productsRes, customersRes, invoicesRes] = await Promise.all([
          fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/products', { headers }),
          fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/customers', { headers }),
          fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices', { headers })
        ])

        if (productsRes.status === 401 || customersRes.status === 401 || invoicesRes.status === 401) {
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('token')
          setError("Session expired. Please log in again.")
          setLoading(false)
          return
        }

        if (!productsRes.ok || !customersRes.ok || !invoicesRes.ok) {
          throw new Error(`Failed to fetch data: ${productsRes.status} ${productsRes.statusText}`)
        }

        const productsData = await productsRes.json() as ApiResponse<Product>
        const customersData = await customersRes.json() as ApiResponse<Customer>
        const invoicesData = await invoicesRes.json() as ApiResponse<Invoice>

        const productsArray = extractArrayFromResponse<Product>(productsData, ['products', 'data'])
        const customersArray = extractArrayFromResponse<Customer>(customersData, ['customers', 'data'])
        const invoicesArray = extractArrayFromResponse<Invoice>(invoicesData, ['invoices', 'data'])

        const totalProducts = productsArray.length
        const totalCustomers = customersArray.length
        
        const totalSales = invoicesArray.reduce((sum, invoice) => {
          const invoiceTotal = parseFloat(invoice.grand_total) || 0
          return sum + invoiceTotal
        }, 0)

        setStats({
          totalSales,
          totalCustomers,
          totalProducts,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatsData()
  }, [])

  // Handle login redirect
  const handleLoginRedirect = () => {
    router.push('/login')
  }

  // Handle retry
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="animate-pulse space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="rounded-md p-1.5 bg-gray-200 dark:bg-gray-700 w-8 h-8"></div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 col-span-3">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-red-500 dark:text-red-400 text-sm mb-1.5">{error}</p>
              <div className="flex justify-center gap-2 mt-2">
                {error.includes("Session expired") || error.includes("No authentication token") ? (
                  <button
                    onClick={handleLoginRedirect}
                    className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 col-span-3">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
              No statistics data available
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsCards = [
    {
      title: "Total Sales",
      value: formatINR(stats.totalSales),
      icon: DollarSign,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Eye,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: TrendingUp,
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {statsCards.map((stat) => (
        <Card 
          key={stat.title} 
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </span>
              <div className={`rounded-lg p-2 ${stat.iconBg} transition-all duration-300 hover:scale-105`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 block">
                {stat.value}
              </span>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Live updated data
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}