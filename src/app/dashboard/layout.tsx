"use client";

import Footer from "@/components/footer/Footer";
import AppHeader from "@/layout/AppHeader";
import { AppSidebar } from "@/layout/AppSidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Always visible */}
      <AppSidebar />
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Header */}
        <AppHeader />
        
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
          <Footer/>
        </div>
      </div>
    </div>
  );
}