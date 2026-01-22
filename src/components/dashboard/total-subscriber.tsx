"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Users, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, TooltipProps } from "recharts"
import { useEffect, useState } from "react"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

// Types for customer data
interface Customer {
  id: number;
  name?: string;
  email?: string;
  mobile?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface DailyData {
  day: string;
  value: number;
  count: number;
}

// Type for CustomTooltip props
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: DailyData;
  }>;
  label?: string;
}

// Custom tooltip component for dark mode
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{`Day: ${label}`}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Customers: <span className="font-medium text-blue-600 dark:text-blue-400">
            {payload[0].value.toLocaleString()}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

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

export function TotalSubscriber() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [growthPercentage, setGrowthPercentage] = useState<number>(9.3);
  const [growthCount, setGrowthCount] = useState<number>(749);
  const [maxDailyCount, setMaxDailyCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('weekly'); // weekly, monthly, yearly
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const { theme, mounted } = useTheme();

  // Days of the week for chart
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        // Get JWT token from localStorage
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

        const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/customers', { 
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
          throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract customers array from response
        let customersArray: Customer[] = [];
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.customers && Array.isArray(data.customers)) {
          customersArray = data.customers;
        } else if (data.data && Array.isArray(data.data)) {
          customersArray = data.data;
        }

        setCustomers(customersArray);
        setTotalCustomers(customersArray.length);

        // Process data for chart
        processCustomerData(customersArray);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const processCustomerData = (customers: Customer[]) => {
    // Initialize daily data
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const dailyCounts: Record<string, number> = {};
    
    // Initialize all days with 0
    daysOfWeek.forEach(day => {
      dailyCounts[day] = 0;
    });

    // Count customers by day of week for the last 7 days
    customers.forEach(customer => {
      if (customer.created_at) {
        const createdDate = new Date(customer.created_at);
        
        // Only include customers from the last 7 days
        if (createdDate >= lastWeek) {
          const dayOfWeek = daysOfWeek[createdDate.getDay()];
          if (dailyCounts[dayOfWeek] !== undefined) {
            dailyCounts[dayOfWeek]++;
          }
        }
      }
    });

    // Convert to array format for chart
    const chartData = daysOfWeek.map(day => ({
      day,
      value: dailyCounts[day] || 0,
      count: dailyCounts[day] || 0
    }));

    setDailyData(chartData);

    // Find the day with maximum customers (for highlighting)
    const maxCount = Math.max(...chartData.map(item => item.count));
    setMaxDailyCount(maxCount);

    // Calculate growth (simplified - in real app, compare with previous period)
    if (customers.length > 0) {
      // For demo, we'll calculate a simple growth based on recent additions
      const last7DaysCount = Object.values(dailyCounts).reduce((a, b) => a + b, 0);
      const previousPeriodCount = Math.max(1, customers.length - last7DaysCount);
      
      if (previousPeriodCount > 0) {
        const growth = ((last7DaysCount - previousPeriodCount) / previousPeriodCount) * 100;
        setGrowthPercentage(growth);
        setGrowthCount(last7DaysCount - previousPeriodCount);
      }
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    setIsDropdownOpen(false);
    // In a real implementation, you would re-fetch or re-process data based on the time range
    console.log('Time range changed to:', range);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (!mounted || loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Total Customers</CardTitle>
            </div>
            <div className="mt-2 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              disabled
            >
              Weekly
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Loading customer data...</div>
          </div>
          <div className="mt-2 text-center animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Total Customers</CardTitle>
            </div> 
            <div className="mt-2">
              <span className="text-sm text-red-500 dark:text-red-400">Error: {error}</span>
            </div>
          </div>
        </CardHeader> 
        <CardContent> 
          <div className="h-[220px] flex items-center justify-center"> 
            <div className="text-center"> 
              <p className="text-gray-500 dark:text-gray-400 mb-4">Failed to load customer data</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Total Customers</CardTitle>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(totalCustomers)}</span>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={`flex items-center ${growthPercentage >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} font-medium`}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {growthCount >= 0 ? '+ ' : '- '}{formatNumber(Math.abs(growthCount))} {growthCount >= 0 ? 'increased' : 'decreased'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Time Range Dropdown */}
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-md shadow-lg z-10">
              {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`block w-full text-left px-3 py-2 text-sm capitalize hover:bg-blue-50 dark:hover:bg-gray-700 ${
                    timeRange === range 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-l-2 border-blue-500' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[220px]">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailyData} 
                barCategoryGap="35%"
                barGap={8}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ 
                    fill: theme === 'dark' ? '#d1d5db' : "#6b7280", 
                    fontSize: 12, 
                    fontWeight: 500 
                  }}
                  tickMargin={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[3, 3, 3, 3]}
                  barSize={18}
                  name="Customers"
                >
                  {dailyData.map((entry, index) => {
                    const isMaxDay = entry.count === maxDailyCount && maxDailyCount > 0;
                    const fillColor = theme === 'dark' 
                      ? (isMaxDay ? '#3b82f6' : '#60a5fa')  // Brighter colors for dark mode
                      : (isMaxDay ? '#2563eb' : '#93c5fd');
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={fillColor} 
                        className="transition-all duration-300"
                        style={{ 
                          opacity: isMaxDay ? 1 : 0.9,
                          filter: isMaxDay ? 'none' : 'brightness(0.95)'
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <Users className="h-12 w-12 text-blue-200 dark:text-blue-800 mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-center">No customer data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Customer data will appear here</p>
            </div>
          )}
        </div>
        
        {maxDailyCount > 0 && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatNumber(maxDailyCount)}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                customers on {dailyData.find(d => d.count === maxDailyCount)?.day || 'peak day'}
              </span>
            </div>
          </div>
        )}
        
        {/* Additional Stats */}
        {customers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(customers.filter(c => c.email).length)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">With Email</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(customers.filter(c => c.mobile).length)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">With Mobile</div>
              </div>
            </div>
            
            {/* Recent Customers Count */}
            <div className="mt-4 text-center">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {customers.filter(c => {
                  if (!c.created_at) return false;
                  const createdDate = new Date(c.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdDate >= weekAgo;
                }).length} new customers this week
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}