import { Card, CardContent } from "@/components/ui/card"
import { Eye, DollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Types for API responses (keep your existing types here)
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
  [key: string]: any;
}

interface Customer {
  id: number;
  [key: string]: any;
}

interface ApiResponse<T> {
  data?: T[];
  products?: T[];
  customers?: T[];
  invoices?: T[];
  [key: string]: any;
}

interface ApiStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  salesChange?: number;
  customersChange?: number;
  productsChange?: number;
}

// Helper function to extract array from API response
function extractArrayFromResponse<T>(data: any, possibleKeys: string[]): T[] {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data;
  }
  
  for (const key of possibleKeys) {
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
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
          const errorText = await productsRes.text().catch(() => 'Unknown error')
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

        const calculateChange = (current: number, previous?: number): number => {
          if (!previous || previous === 0) return 0
          return ((current - previous) / previous) * 100
        }

        const previousStatsStr = localStorage.getItem('previous_stats')
        const previousStats = previousStatsStr ? JSON.parse(previousStatsStr) : null
        
        const salesChange = calculateChange(totalSales, previousStats?.totalSales)
        const customersChange = calculateChange(totalCustomers, previousStats?.totalCustomers)
        const productsChange = calculateChange(totalProducts, previousStats?.totalProducts)

        const currentStats = {
          totalSales,
          totalCustomers,
          totalProducts,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('previous_stats', JSON.stringify(currentStats))

        setStats({
          totalSales,
          totalCustomers,
          totalProducts,
          salesChange,
          customersChange,
          productsChange
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

  // Format percentage change
  const formatChange = (change: number | undefined) => {
    if (change === undefined || isNaN(change)) return "0%"
    const sign = change >= 0 ? "+" : ""
    return `${sign}${Math.abs(change).toFixed(1)}%`
  }

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="animate-pulse space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-gray-200 rounded w-20"></div>
                  <div className="rounded-md p-1.5 bg-gray-200 w-8 h-8"></div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-10"></div>
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
        <Card className="bg-card col-span-3">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-red-500 text-sm mb-1.5">{error}</p>
              <div className="flex justify-center gap-2 mt-2">
                {error.includes("Session expired") || error.includes("No authentication token") ? (
                  <button
                    onClick={handleLoginRedirect}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
        <Card className="bg-card col-span-3">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center text-muted-foreground text-sm">
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
      change: formatChange(stats.salesChange),
      isPositive: (stats.salesChange || 0) >= 0,
      icon: DollarSign,
      iconBg: (stats.salesChange || 0) >= 0 ? "bg-emerald-100" : "bg-red-100",
      iconColor: (stats.salesChange || 0) >= 0 ? "text-emerald-600" : "text-red-500",
      changeColor: (stats.salesChange || 0) >= 0 ? "text-emerald-500" : "text-red-500",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      change: formatChange(stats.customersChange),
      isPositive: (stats.customersChange || 0) >= 0,
      icon: Eye,
      iconBg: (stats.customersChange || 0) >= 0 ? "bg-emerald-100" : "bg-red-100",
      iconColor: (stats.customersChange || 0) >= 0 ? "text-emerald-600" : "text-red-500",
      changeColor: (stats.customersChange || 0) >= 0 ? "text-emerald-500" : "text-red-500",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      change: formatChange(stats.productsChange),
      isPositive: (stats.productsChange || 0) >= 0,
      icon: TrendingUp,
      iconBg: (stats.productsChange || 0) >= 0 ? "bg-emerald-100" : "bg-red-100",
      iconColor: (stats.productsChange || 0) >= 0 ? "text-emerald-600" : "text-red-500",
      changeColor: (stats.productsChange || 0) >= 0 ? "text-emerald-500" : "text-red-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {statsCards.map((stat) => (
        <Card key={stat.title} className="bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
              <div className={`rounded-md p-2 ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              <span className={`text-sm font-medium ${stat.changeColor}`}>
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}