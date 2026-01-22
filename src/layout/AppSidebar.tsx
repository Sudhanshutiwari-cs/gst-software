"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Package,
  FileText,
  PlusCircle,
  Eye,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Zap,
  FileCode,

  Receipt,
  
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      // Only apply system theme if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue as 'light' | 'dark';
        if (newTheme && (newTheme === 'light' || newTheme === 'dark')) {
          setTheme(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { theme, mounted };
};

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  badgeVariant?: "default" | "beta"
  active?: boolean
  children?: NavItem[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "GENERAL",
    items: [
      { 
        label: "Dashboard", 
        icon: <LayoutDashboard size={18} />, 
        href: "/dashboard", 
        active: true 
      },
      { 
        label: "Product", 
        icon: <Package size={18} />, 
        href: "/product",
        children: [
          { label: "Add Product", icon: <PlusCircle size={16} />, href: "/products/add-products" },
          { label: "View Products", icon: <Eye size={16} />, href: "/products" },
        ]
      },
      { 
        label: "Customers", 
        icon: <Users size={18} />, 
        href: "/customers",
        children: [
          { label: "All Customers", icon: <Users size={16} />, href: "/customer/view" },
          { label: "Add Customer", icon: <PlusCircle size={16} />, href: "/customer/add" },
        ]
      },
      { 
        label: "Sales", 
        icon: <CreditCard size={18} />,
        href: "/sales",
        children: [
          { label: "All Sales", icon: <FileText size={16} />, href: "/sales/invoice" },
          { label: "Make Sale", icon: <PlusCircle size={16} />, href: "/sales/create" },
        ]
      },
      { 
        label: "Templates", 
        icon: <FileCode size={18} />,
        href: "/templates",
        children: [
          { label: "Invoice Templates", icon: <Receipt size={16} />, href: "/templates" }
        ]
      },
    ],
  },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/product': true,
  })
  const [heights, setHeights] = useState<Record<string, number>>({})
  const submenuRefs = useRef<Record<string, HTMLUListElement | null>>({})
  const {  mounted } = useTheme()

  // Calculate heights when items are expanded
  useEffect(() => {
    const newHeights: Record<string, number> = {}
    Object.keys(submenuRefs.current).forEach(href => {
      const element = submenuRefs.current[href]
      if (element) {
        newHeights[href] = element.scrollHeight
      }
    })
    setHeights(newHeights)
  }, [expandedItems, collapsed])

  const toggleItem = (href: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [href]: !prev[href]
    }))
  }

  const renderNavItem = (item: NavItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[item.href] && !collapsed
    const isActive = item.active

    return (
      <li key={item.label}>
        <div className="space-y-1">
          {/* Parent Item */}
          <a
            href={hasChildren ? '#' : item.href}
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault()
                toggleItem(item.href)
              }
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
              isChild && "ml-4",
              collapsed && "justify-center px-2",
              hasChildren && "cursor-pointer"
            )}
          >
            <span className={cn(
              isActive 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400",
              "transition-colors duration-200",
              isExpanded && hasChildren && "text-blue-600 dark:text-blue-400"
            )}>
              {item.icon}
            </span>
            
            {!collapsed && (
              <>
                <span className="flex-1 transition-all duration-200">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-200",
                        item.badgeVariant === "beta"
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform duration-300 ease-in-out",
                        isExpanded ? "rotate-90 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                      )} 
                    />
                  )}
                </div>
              </>
            )}
          </a>

          {/* Child Items with Animation */}
          {hasChildren && !collapsed && item.children && (
            <ul 
              ref={(el) => {
                submenuRefs.current[item.href] = el
              }}
              className={cn(
                "ml-4 border-l border-gray-200 dark:border-gray-700 pl-2 space-y-1",
                "transition-all duration-300 ease-in-out overflow-hidden"
              )}
              style={{
                maxHeight: isExpanded ? `${heights[item.href] || 0}px` : '0px',
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)',
                transition: `max-height 300ms ease-in-out, opacity 300ms ease-in-out, transform 300ms ease-in-out`
              }}
            >
              {item.children.map((child) => (
                <li 
                  key={child.label}
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    !isExpanded && "opacity-0 -translate-x-2",
                    isExpanded && "opacity-100 translate-x-0"
                  )}
                  style={{
                    transitionDelay: isExpanded ? `${50 * (item.children?.indexOf(child) || 0)}ms` : '0ms'
                  }}
                >
                  <a
                    href={child.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      child.active
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <span className={cn(
                      child.active 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {child.icon}
                    </span>
                    <span className="flex-1">{child.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </li>
    )
  }

  if (!mounted) {
    return (
      <aside className="flex h-screen flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 sticky top-0 w-16">
        <div className="flex items-center justify-center border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 transition-all duration-300">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-all duration-300">GST</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-6", "transition-all duration-300")}>
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 transition-all duration-300">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => renderNavItem(item))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 transition-all duration-300">
        {/* Upgrade Button */}
        {!collapsed && (
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            Upgrade Plan
          </Button>
        )}

        {/* Copyright */}
        {!collapsed && (
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 transition-all duration-300">
            © 2026 GST, Inc.
          </p>
        )}
      </div>
    </aside>
  )
}