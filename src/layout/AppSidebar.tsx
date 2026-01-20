"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
        icon: <CreditCard size={18} />,
        href: "/sales",
        children: [
          { label: "All Sales", icon: <FileText size={16} />, href: "/sales/invoice" },
          { label: "Make Sale", icon: <PlusCircle size={16} />, href: "/sales/create" },
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
                : "text-black hover:bg-muted hover:text-black",
              isChild && "ml-4",
              collapsed && "justify-center px-2",
            )}
          >
            <span className={cn(isActive ? "text-blue-600" : "text-gray-600")}>
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
                          : "bg-muted text-gray-600",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 text-gray-600",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  )}
                </div>
              </>
            )}
          </a>

          {/* Child Items */}
          {hasChildren && !collapsed && isExpanded && item.children && (
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
          className="h-8 w-8 text-gray-600"
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
              <p className="mb-2 px-3 text-xs font-medium tracking-wider text-gray-500">
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
            className="mt-3 w-full bg-transparent border-gray-300 text-black hover:text-black"
          >
            Upgrade Plan
          </Button>
        )}

        {/* Copyright */}
        {!collapsed && (
          <p className="mt-4 text-center text-xs text-gray-500">
            © 2026 GST, Inc.
          </p>
        )}
      </div>
    </aside>
  )
}