"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState } from "react"

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

// Define proper type that satisfies both our needs and Recharts requirements
interface SalesDataItem {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature to satisfy Recharts
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SalesDataItem;
    value: number;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: data.color as string }}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Value: <span className="font-medium text-blue-600 dark:text-blue-400">${data.value.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Color: <span className="font-medium" style={{ color: data.color as string }}>{data.color}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function SalesDistribution() {
  const { theme, mounted } = useTheme();
  
  // Initialize data with proper type
  const [salesData] = useState<SalesDataItem[]>([
    { name: "Website", value: 374.82, color: "#8b5cf6" },
    { name: "Mobile App", value: 241.6, color: "#22d3ee" },
    { name: "Other", value: 213.42, color: "#c4b5fd" },
  ]);

  const [totalSales, setTotalSales] = useState(0);
  const [timeRange] = useState('Monthly');

  useEffect(() => {
    // Calculate total sales whenever data changes
    const total = salesData.reduce((sum, item) => sum + item.value, 0);
    setTotalSales(total);
  }, [salesData]);

  // Calculate percentages for display
  const getPercentage = (value: number) => {
    return totalSales > 0 ? ((value / totalSales) * 100).toFixed(1) : '0';
  };

  if (!mounted) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative h-[160px] w-[160px]">
              <div className="h-full w-full rounded-full bg-gray-100 dark:bg-gray-900 animate-pulse"></div>
            </div>
            <div className="flex flex-1 justify-around">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600" />
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
              Sales Distribution
            </CardTitle>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold text-violet-600 dark:text-violet-400">${totalSales.toFixed(2)}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700"
        >
          {timeRange}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          {/* Pie Chart */}
          <div className="relative h-[180px] w-[180px] lg:h-[160px] lg:w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={salesData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={theme === 'dark' ? 45 : 50} 
                  outerRadius={theme === 'dark' ? 75 : 70} 
                  paddingAngle={2} 
                  dataKey="value"
                  strokeWidth={2}
                  stroke={theme === 'dark' ? '#374151' : '#f8fafc'}
                >
                  {salesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label with total */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalSales.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Legend and Values */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-3 gap-4">
              {salesData.map((item) => (
                <div 
                  key={item.name} 
                  className="group cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  onClick={() => console.log(`Clicked ${item.name}: $${item.value}`)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="h-2 w-6 rounded-full transition-all duration-300 group-hover:scale-110" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        ${item.value.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {getPercentage(item.value)}% of total
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Stats */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Largest Share</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {salesData.reduce((max, item) => item.value > max.value ? item : max, salesData[0]).name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Growth Rate</div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    +12.5%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">Website sales</span> lead with ${salesData[0].value.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Last updated: Today
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}