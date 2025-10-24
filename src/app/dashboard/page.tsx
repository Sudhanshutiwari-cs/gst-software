"use client";


import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { useEffect, useState } from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";

import { useRouter } from "next/navigation";
import DemographicCard from "@/components/ecommerce/DemographicCard";

// Define the API response type
interface VendorProfile {
  owner_name: string;
  // Add other possible response structures
  data?: {
    owner_name: string;
  };
  vendor?: {
    owner_name: string;
  };
  profile?: {
    owner_name: string;
  };
}

// Function to get greeting based on time
function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

export default function Ecommerce() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    async function fetchVendorProfile() {
      try {
        // Get JWT token from localStorage or sessionStorage
        let token = null;
        
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('authToken') || 
                  localStorage.getItem('jwtToken') || 
                  sessionStorage.getItem('authToken') ||
                  sessionStorage.getItem('jwtToken');
        }

        console.log('Token found:', token ? 'Yes' : 'No');

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          router.push("/login");
          return;
        }

        const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response data:', data); // Debug log
        
        setVendorProfile(data);
        
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    }

    fetchVendorProfile();
  }, []);

  // Function to extract owner name from different possible response structures
  const getOwnerName = (profile: VendorProfile | null): string => {
    if (!profile) return "Owner";
    
    console.log('Profile structure:', profile); // Debug log
    
    // Try different possible response structures
    if (profile.owner_name) {
      return profile.owner_name;
    }
    if (profile.data?.owner_name) {
      return profile.data.owner_name;
    }
    if (profile.vendor?.owner_name) {
      return profile.vendor.owner_name;
    }
    if (profile.profile?.owner_name) {
      return profile.profile.owner_name;
    }
    
    // If none of the above, check all keys
    const keys = Object.keys(profile);
    console.log('All keys in response:', keys);
    
    return "Owner";
  };

  // Greeting Component
  const GreetingMessage = () => {
    if (loading) {
      return (
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mb-6">
          <h1 className="text-2-xl font-bold text-gray-900 dark:text-white">
            Welcome!
          </h1>
          <p className="text-red-500 dark:text-red-400 mt-1">
            Unable to load profile: {error}
          </p>
        </div>
      );
    }

    const greeting = getGreeting();
    const ownerName = getOwnerName(vendorProfile);

    console.log('Final owner name:', ownerName); // Debug log

    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {ownerName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back to your dashboard
        </p>
      </div>
    );
  };

  return (
    <>
      <GreetingMessage />
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}