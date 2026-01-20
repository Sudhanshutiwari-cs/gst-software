"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, Users, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { useEffect, useState } from "react"

// Types for customer data
interface Customer {
  id: number;
  name?: string;
  email?: string;
  mobile?: string;
  created_at?: string;
  updated_at?: string;
  // Use unknown or specific types for additional fields
  [key: string]: string | number | boolean | null | undefined;
}



interface DailyData {
  day: string;
  value: number;
  count: number;
}

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

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <CardTitle className="text-base font-medium text-gray-900">Total Customers</CardTitle>
            </div>
            <div className="mt-2 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-500 border-gray-300 bg-white"
              disabled
            >
              Weekly
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="text-gray-500">Loading customer data...</div>
          </div>
          <div className="mt-2 text-center animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <CardTitle className="text-base font-medium text-gray-900">Total Customers</CardTitle>
            </div>
            <div className="mt-2">
              <span className="text-sm text-red-500">Error: {error}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Failed to load customer data</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
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
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <CardTitle className="text-base font-medium text-gray-900">Total Customers</CardTitle>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{formatNumber(totalCustomers)}</span>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={`flex items-center ${growthPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </span>
              <span className="text-gray-600">
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
            className="text-gray-600 border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-blue-200 rounded-md shadow-lg z-10">
              {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`block w-full text-left px-3 py-2 text-sm capitalize hover:bg-blue-50 ${
                    timeRange === range 
                      ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500' 
                      : 'text-gray-700'
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
                barCategoryGap="35%" // Increased gap for smaller bars
                barGap={8} // Gap between bars
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  tickMargin={10}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [formatNumber(value), "Customers"]}
                  labelFormatter={(label) => `Day: ${label}`}
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "1px solid #e5e7eb",
                    backgroundColor: "white",
                    padding: "8px 12px",
                    fontSize: "12px"
                  }}
                  itemStyle={{ color: "#3b82f6", fontWeight: 500 }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[3, 3, 3, 3]} // Smaller radius
                  barSize={18} // Smaller bar width
                  name="Customers"
                >
                  {dailyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count === maxDailyCount && maxDailyCount > 0 ? "#2563eb" : "#93c5fd"} 
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <Users className="h-12 w-12 text-blue-200 mb-2" />
              <p className="text-gray-600 text-center">No customer data available</p>
              <p className="text-sm text-gray-400 mt-1">Customer data will appear here</p>
            </div>
          )}
        </div>
        
        {maxDailyCount > 0 && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(maxDailyCount)}
              </span>
              <span className="text-sm text-gray-600">
                customers on {dailyData.find(d => d.count === maxDailyCount)?.day || 'peak day'}
              </span>
            </div>
          </div>
        )}
        
        {/* Additional Stats */}
        {customers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(customers.filter(c => c.email).length)}
                </div>
                <div className="text-xs text-blue-600">With Email</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(customers.filter(c => c.mobile).length)}
                </div>
                <div className="text-xs text-blue-600">With Mobile</div>
              </div>
            </div>
            
            {/* Recent Customers Count */}
            <div className="mt-4 text-center">
              <div className="text-sm text-blue-600 font-medium">
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