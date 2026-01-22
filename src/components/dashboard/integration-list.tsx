"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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

interface Integration {
  name: string;
  type: string;
  rate: number;
  profit: string;
  color: string;
  colorDark: string;
  icon: string;
  iconBg: string;
  iconBgDark: string;
  iconColor: string;
  iconColorDark: string;
}

const integrations: Integration[] = [
  {
    name: "Stripe",
    type: "Finance",
    rate: 40,
    profit: "$650.00",
    color: "#8b5cf6", // violet-500
    colorDark: "#7c3aed", // violet-600
    icon: "S",
    iconBg: "bg-violet-100",
    iconBgDark: "bg-violet-900/30",
    iconColor: "text-violet-600",
    iconColorDark: "text-violet-400",
  },
  {
    name: "Zapier",
    type: "CRM",
    rate: 60,
    profit: "$720.50",
    color: "#f97316", // orange-500
    colorDark: "#ea580c", // orange-600
    icon: "Z",
    iconBg: "bg-orange-100",
    iconBgDark: "bg-orange-900/30",
    iconColor: "text-orange-600",
    iconColorDark: "text-orange-400",
  },
  {
    name: "Shopify",
    type: "Marketplace",
    rate: 20,
    profit: "$432.25",
    color: "#22c55e", // green-500
    colorDark: "#16a34a", // green-600
    icon: "S",
    iconBg: "bg-green-100",
    iconBgDark: "bg-green-900/30",
    iconColor: "text-green-600",
    iconColorDark: "text-green-400",
  },
  {
    name: "Google Analytics",
    type: "Analytics",
    rate: 80,
    profit: "$890.75",
    color: "#3b82f6", // blue-500
    colorDark: "#2563eb", // blue-600
    icon: "G",
    iconBg: "bg-blue-100",
    iconBgDark: "bg-blue-900/30",
    iconColor: "text-blue-600",
    iconColorDark: "text-blue-400",
  },
  {
    name: "Mailchimp",
    type: "Email Marketing",
    rate: 45,
    profit: "$325.60",
    color: "#ec4899", // pink-500
    colorDark: "#db2777", // pink-600
    icon: "M",
    iconBg: "bg-pink-100",
    iconBgDark: "bg-pink-900/30",
    iconColor: "text-pink-600",
    iconColorDark: "text-pink-400",
  },
  {
    name: "QuickBooks",
    type: "Accounting",
    rate: 35,
    profit: "$548.90",
    color: "#06b6d4", // cyan-500
    colorDark: "#0891b2", // cyan-600
    icon: "Q",
    iconBg: "bg-cyan-100",
    iconBgDark: "bg-cyan-900/30",
    iconColor: "text-cyan-600",
    iconColorDark: "text-cyan-400",
  },
];

export function IntegrationList() {
  const { theme, mounted } = useTheme();
  const [totalProfit, setTotalProfit] = useState(0);
  const [averageRate, setAverageRate] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [integrationsToShow, setIntegrationsToShow] = useState<Integration[]>([]);

  useEffect(() => {
    // Calculate statistics
    const total = integrations.reduce((sum, integration) => {
      const profit = parseFloat(integration.profit.replace('$', ''));
      return sum + profit;
    }, 0);
    
    const avgRate = integrations.reduce((sum, integration) => sum + integration.rate, 0) / integrations.length;
    
    setTotalProfit(total);
    setAverageRate(avgRate);
    setIntegrationsToShow(showAll ? integrations : integrations.slice(0, 3));
  }, [showAll]);

  const getIntegrationColor = (integration: Integration) => {
    return theme === 'dark' ? integration.colorDark : integration.color;
  };

  const getIconBg = (integration: Integration) => {
    return theme === 'dark' ? integration.iconBgDark : integration.iconBg;
  };

  const getIconColor = (integration: Integration) => {
    return theme === 'dark' ? integration.iconColorDark : integration.iconColor;
  };

  if (!mounted) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse ml-auto"></div>
              </div>
            ))}
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
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500" />
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
              Integration List
            </CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total Profit: <span className="font-semibold text-green-600 dark:text-green-400">${totalProfit.toFixed(2)}</span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Avg. Rate: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{averageRate.toFixed(1)}%</span>
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline transition-colors"
        >
          {showAll ? "Show Less" : "See All"}
        </button>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Header Row */}
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-500 dark:text-gray-400 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
          <span className="font-medium">APPLICATION</span>
          <span className="font-medium">TYPE</span>
          <span className="font-medium">RATE</span>
          <span className="font-medium text-right">PROFIT</span>
        </div>
        
        {/* Integration List */}
        <div className="space-y-1">
          {integrationsToShow.map((integration) => {
            const integrationColor = getIntegrationColor(integration);
            const iconBgClass = getIconBg(integration);
            const iconColorClass = getIconColor(integration);
            
            return (
              <div 
                key={integration.name} 
                className="grid grid-cols-4 gap-4 items-center py-3 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200 group cursor-pointer"
                onClick={() => console.log(`Clicked ${integration.name}`)}
              >
                {/* Application */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105 ${iconBgClass}`}>
                    <span className={`text-sm font-bold ${iconColorClass}`}>
                      {integration.icon}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {integration.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {integration.rate}% completion
                    </span>
                  </div>
                </div>
                
                {/* Type */}
                <div>
                  <span className="text-sm px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {integration.type}
                  </span>
                </div>
                
                {/* Rate with Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress
                      value={integration.rate}
                      className="h-2"
                      style={{
                        backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        // @ts-expect-error Custom CSS property for progress color
                        "--progress-color": integrationColor,
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium min-w-[35px] ${
                    integration.rate >= 70 ? 'text-green-600 dark:text-green-400' :
                    integration.rate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {integration.rate}%
                  </span>
                </div>
                
                {/* Profit */}
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {integration.profit}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg 
                      className="w-4 h-4 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Integrations</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {integrations.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {integrations.filter(i => i.rate >= 50).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">High Profit</div>
              <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {integrations.filter(i => parseFloat(i.profit.replace('$', '')) > 500).length}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{integrations.length} integrations</span> connected
            </div>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-800/50 transition-colors">
                Add New
              </button>
              <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Manage
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}