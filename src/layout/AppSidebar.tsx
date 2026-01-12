"use client"

import type React from "react"

import { useState } from "react"
import {
  LayoutDashboard,
  CreditCard,
  Users,
  MessageSquare,
  Package,
  FileText,
  BarChart3,
  Zap,
  Settings,
  Shield,
  HelpCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  List,
  Filter,
  Download,
  Upload,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
  badgeVariant?: "default" | "beta"
  active?: boolean
  children?: NavItem[] // Nested items
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
          { label: "Add Product", icon: <PlusCircle size={16} />, href: "/products/add" },
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
        icon: <CreditCard size={18} />,  // Changed from Users to CreditCard
        href: "/sales",  // Changed from /customers to /sales
        children: [
          { label: "All Sales", icon: <FileText size={16} />, href: "/sales/invoice" },
          { label: "Make Sale", icon: <PlusCircle size={16} />, href: "/sales/create" },
        ]
      },
    ],
  },
]

// Missing icon components (kept as-is)
const ArchiveIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="5" x="2" y="3" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
)

const GlobeIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const ClockIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CheckCircleIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const WorkflowIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </svg>
)

const HistoryIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
)

const UserIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const BellIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const KeyIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)

const MonitorIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
)

const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
)

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    '/product': true, // Keep product expanded by default
  })

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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-black hover:bg-muted hover:text-black", // Changed from text-muted-foreground to text-black
              isChild && "ml-4",
              collapsed && "justify-center px-2",
            )}
          >
            <span className={cn(isActive ? "text-blue-600" : "text-gray-600")}> {/* Changed inactive icon color */}
              {item.icon}
            </span>
            
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-medium",
                        item.badgeVariant === "beta"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-muted text-gray-600", // Changed badge text color
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 text-gray-600", // Added text color
                        isExpanded && "rotate-90"
                      )} 
                    />
                  )}
                </div>
              </>
            )}
          </a>

          {/* Child Items */}
          {hasChildren && !collapsed && isExpanded && (
            <ul className="space-y-1 ml-4 border-l border-gray-200 pl-2">
              {item.children.map((child) => renderNavItem(child, true))}
            </ul>
          )}
        </div>
      </li>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-black">GST</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600" // Changed text color
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && "mt-6")}>
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium tracking-wider text-gray-500"> {/* Changed text color */}
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
      <div className="border-t border-gray-200 p-3">
        {/* Upgrade Button */}
        {!collapsed && (
          <Button 
            variant="outline" 
            className="mt-3 w-full bg-transparent border-gray-300 text-black hover:text-black" // Added text colors
          >
            Upgrade Plan
          </Button>
        )}

        {/* Copyright */}
        {!collapsed && (
          <p className="mt-4 text-center text-xs text-gray-500"> {/* Changed text color */}
            © 2026 GST, Inc.
          </p>
        )}
      </div>
    </aside>
  )
}