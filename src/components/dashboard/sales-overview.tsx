"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download, MoreVertical, ChevronUp, ChevronDown } from "lucide-react"
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

// Blue gradient colors for bars
const BLUE_GRADIENT_COLORS = [
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
];

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
        color: BLUE_GRADIENT_COLORS[index % BLUE_GRADIENT_COLORS.length],
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

  const handleExport = () => {
    console.log('Export data');
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Sales: <span className="font-medium text-blue-600">{formatINR(payload[0].value)}</span>
          </p>
          {data.growth !== undefined && (
            <p className="text-sm">
              Growth: <span className={`font-medium ${data.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
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
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="mt-4 flex justify-center gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={`pulse-${i}`} className="h-2 bg-gray-200 rounded w-8 animate-pulse"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return renderLoadingState();

  if (error) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-6 h-6 text-red-600">!</div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-gray-300"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">₹0</span>
                <Badge variant="outline" className="text-gray-600">
                  No data
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="icon" disabled>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No Sales Data Yet</h3>
          <p className="text-gray-600">
            Start creating invoices to see your sales analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 animate-pulse" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Sales Overview
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatINR(totalSales)}
              </span>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`gap-1 ${growthPercentage >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                >
                  {growthPercentage >= 0 ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-600">
                  vs last period
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] border-gray-300 bg-white">
                <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExport}
              className="border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Metrics Tabs */}
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="mb-6">
          <TabsList className="bg-blue-50 p-1 rounded-lg">
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-3"
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-3"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="growth" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-3"
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
                  stroke="#e5e7eb"
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#374151", fontSize: 12 }}
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
                  fill="rgba(59, 130, 246, 0.1)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                />
                <Bar 
                  dataKey="totalSales" 
                  radius={[4, 4, 0, 0]}
                  barSize={24} // Smaller bar width
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={hoveredBar === index ? '#2563eb' : entry.color}
                      style={{ transition: 'fill 0.3s ease' }}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-gray-600">No data available for selected period</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {monthlyData.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Monthly Performance</h4>
              <span className="text-xs text-blue-600">Click on bars for details</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {monthlyData.slice(0, 6).map((data) => (
                <div 
                  key={data.month} 
                  className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100"
                  onClick={() => console.log('Month clicked:', data.month)}
                >
                  <span className="text-xs font-medium text-blue-700 mb-1">
                    {data.month}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatINR(data.totalSales)}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {data.growth && data.growth !== 0 && (
                      <>
                        {data.growth > 0 ? (
                          <ChevronUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={`text-xs ${data.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
        <div className="mt-6 pt-6 border-t border-blue-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-blue-600">Total Invoices</p>
              <p className="text-lg font-semibold text-gray-900">{invoices.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600">Avg. Order Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatINR(invoices.length > 0 ? totalSales / invoices.length : 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600">Current Month</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatINR(monthlyData[monthlyData.length - 1]?.totalSales || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-blue-600">Best Month</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatINR(monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.totalSales)) : 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}