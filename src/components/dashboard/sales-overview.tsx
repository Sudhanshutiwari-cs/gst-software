"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download, MoreVertical, ChevronUp, ChevronDown, TrendingUp } from "lucide-react"
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, ComposedChart, Cell } from "recharts"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Types for invoice data
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
  products: Product[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  [key: string]: unknown;
}

interface ApiResponse {
  data?: Invoice[];
  invoices?: Invoice[];
  [key: string]: unknown;
}

interface MonthlyData {
  month: string;
  totalSales: number;
  growth?: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: MonthlyData;
  }>;
  label?: string;
}

// Helper function to format INR
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '₹ ');
}

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

// Blue gradient colors for bars - adjusted for dark mode
const BLUE_GRADIENT_COLORS = {
  light: [
    '#3b82f6', // Blue 500
    '#60a5fa', // Blue 400
    '#2563eb', // Blue 600
    '#1d4ed8', // Blue 700
    '#93c5fd', // Blue 300
    '#1e40af', // Blue 800
    '#0284c7', // Sky 600
    '#0ea5e9', // Sky 500
    '#38bdf8', // Sky 400
    '#0369a1', // Sky 700
    '#0c4a6e', // Sky 900
    '#7dd3fc', // Sky 300
  ],
  dark: [
    '#60a5fa', // Blue 400 - brighter for dark mode
    '#3b82f6', // Blue 500
    '#93c5fd', // Blue 300
    '#2563eb', // Blue 600
    '#1d4ed8', // Blue 700
    '#38bdf8', // Sky 400
    '#0ea5e9', // Sky 500
    '#0284c7', // Sky 600
    '#7dd3fc', // Sky 300
    '#0369a1', // Sky 700
    '#1e40af', // Blue 800
    '#0c4a6e', // Sky 900
  ]
};

export function SalesOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [growthPercentage, setGrowthPercentage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('year');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { theme, mounted } = useTheme();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('jwt_token') || 
                     localStorage.getItem('authToken') || 
                     localStorage.getItem('token');
        
        if (!token) {
          setError("No authentication token found. Please log in.");
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/invoices', { 
          headers 
        });

        if (response.status === 401) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
          setError("Session expired. Please log in again.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        
        let invoicesArray: Invoice[] = [];
        if (Array.isArray(data)) {
          invoicesArray = data;
        } else if (data.invoices && Array.isArray(data.invoices)) {
          invoicesArray = data.invoices;
        } else if (data.data && Array.isArray(data.data)) {
          invoicesArray = data.data;
        }

        setInvoices(invoicesArray);
        processInvoiceData(invoicesArray);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const processInvoiceData = (invoices: Invoice[]) => {
    const total = invoices.reduce((sum, invoice) => {
      return sum + (parseFloat(invoice.grand_total) || 0);
    }, 0);
    setTotalSales(total);

    const monthlySales: Record<string, number> = {};
    const currentYear = new Date().getFullYear();
    
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const invoiceYear = invoiceDate.getFullYear();
      
      if (invoiceYear === currentYear) {
        const monthYear = `${invoiceDate.toLocaleString('default', { month: 'short' })} ${invoiceYear}`;
        
        if (!monthlySales[monthYear]) {
          monthlySales[monthYear] = 0;
        }
        monthlySales[monthYear] += parseFloat(invoice.grand_total) || 0;
      }
    });

    const chartData = Object.entries(monthlySales).map(([monthYear, sales], index) => {
      const [month] = monthYear.split(' ');
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        totalSales: sales,
        color: BLUE_GRADIENT_COLORS[theme][index % BLUE_GRADIENT_COLORS.light.length],
      };
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    chartData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

    // Calculate growth for each month
    const dataWithGrowth = chartData.map((item, index, array) => {
      if (index === 0) return { ...item, growth: 0 };
      const prevMonthSales = array[index - 1].totalSales;
      const growth = prevMonthSales > 0 ? ((item.totalSales - prevMonthSales) / prevMonthSales) * 100 : 0;
      return { ...item, growth };
    });

    setMonthlyData(dataWithGrowth);

    if (chartData.length >= 2) {
      const lastMonth = chartData[chartData.length - 1].totalSales;
      const prevMonth = chartData[chartData.length - 2].totalSales;
      
      if (prevMonth > 0) {
        const growth = ((lastMonth - prevMonth) / prevMonth) * 100;
        setGrowthPercentage(growth);
      }
    }
  };

  // Update monthly data colors when theme changes
  useEffect(() => {
    if (monthlyData.length > 0) {
      const updatedData = monthlyData.map((item, index) => ({
        ...item,
        color: BLUE_GRADIENT_COLORS[theme][index % BLUE_GRADIENT_COLORS[theme].length]
      }));
      setMonthlyData(updatedData);
    }
  }, [theme]);

  const handleExport = () => {
    console.log('Export data');
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sales: <span className="font-medium text-blue-600 dark:text-blue-400">{formatINR(payload[0].value)}</span>
          </p>
          {data.growth !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Growth: <span className={`font-medium ${data.growth >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderLoadingState = () => (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse"></div>
        <div className="mt-4 flex justify-center gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={`pulse-${i}`} className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!mounted || loading) return renderLoadingState();

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <div className="w-6 h-6 text-red-600 dark:text-red-400">!</div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales Overview</CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">₹0</span>
                <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                  No data
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="icon" disabled className="border-gray-300 dark:border-gray-600">
              <Download className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No Sales Data Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start creating invoices to see your sales analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 animate-pulse" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sales Overview
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatINR(totalSales)}
              </span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`gap-1 ${growthPercentage >= 0 ? 
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                  }`}
                >
                  {growthPercentage >= 0 ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  vs last period
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="week" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">This Week</SelectItem>
                <SelectItem value="month" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">This Month</SelectItem>
                <SelectItem value="quarter" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">This Quarter</SelectItem>
                <SelectItem value="year" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExport}
              className="border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Metrics Tabs */}
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="mb-6">
          <TabsList className="bg-blue-50 dark:bg-blue-900/20 p-1 rounded-lg">
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="growth" 
              className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Growth
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chart */}
        <div className="h-[260px] mt-2">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#d1d5db' : "#374151", fontSize: 12, fontWeight: 500 }}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme === 'dark' ? '#d1d5db' : "#374151", fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `₹${(value/1000000).toFixed(1)}M`;
                    if (value >= 1000) return `₹${(value/1000).toFixed(0)}k`;
                    return `₹${value}`;
                  }}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalSales"
                  fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                />
                <Bar 
                  dataKey="totalSales" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={hoveredBar === index ? 
                        (theme === 'dark' ? '#93c5fd' : '#2563eb') : 
                        entry.color
                      }
                      style={{ transition: 'fill 0.3s ease' }}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">No data available for selected period</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {monthlyData.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Performance</h4>
              <span className="text-xs text-blue-600 dark:text-blue-400">Click on bars for details</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {monthlyData.slice(0, 6).map((data) => (
                <div 
                  key={data.month} 
                  className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer border border-blue-100 dark:border-blue-800/30"
                  onClick={() => console.log('Month clicked:', data.month)}
                >
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                    {data.month}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatINR(data.totalSales)}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {data.growth && data.growth !== 0 && (
                      <>
                        {data.growth > 0 ? (
                          <ChevronUp className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-red-500 dark:text-red-400" />
                        )}
                        <span className={`text-xs ${data.growth > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {Math.abs(data.growth).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t border-blue-100 dark:border-blue-900/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Invoices</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{invoices.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">Avg. Order Value</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatINR(invoices.length > 0 ? totalSales / invoices.length : 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">Current Month</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatINR(monthlyData[monthlyData.length - 1]?.totalSales || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">Best Month</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatINR(monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.totalSales)) : 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}