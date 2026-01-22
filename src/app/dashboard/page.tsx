"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import { TotalSubscriber } from "@/components/dashboard/total-subscriber";
import { SalesDistribution } from "@/components/dashboard/sales-distribution";
import { IntegrationList } from "@/components/dashboard/integration-list";

// Define the complete vendor profile type with is_verified
interface VendorProfile {
  // Profile fields
  business_name?: string | null;
  shop_name?: string | null;
  shop_type?: string | null;
  shop_category?: string | null;
  owner_name?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  contact_number?: string | null;
  alternate_number?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  
  // Verification status
  is_verified?: boolean;
  status?: {
    is_verified?: boolean;
  };
  
  // Possible nested structures
  data?: {
    business_name?: string | null;
    shop_name?: string | null;
    shop_type?: string | null;
    shop_category?: string | null;
    owner_name?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    contact_number?: string | null;
    alternate_number?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    is_verified?: boolean;
  };
  vendor?: {
    business_name?: string | null;
    shop_name?: string | null;
    shop_type?: string | null;
    shop_category?: string | null;
    owner_name?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    contact_number?: string | null;
    alternate_number?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    is_verified?: boolean;
  };
  profile?: {
    business_name?: string | null;
    shop_name?: string | null;
    shop_type?: string | null;
    shop_category?: string | null;
    owner_name?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    contact_number?: string | null;
    alternate_number?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    is_verified?: boolean;
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Dispatch a storage event to sync across tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme
    }));
  };

  return { theme, toggleTheme, mounted };
};

export default function Ecommerce() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const {  mounted } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    async function fetchVendorProfile() {
      try {
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
        console.log('API Response data:', data);
        
        setVendorProfile(data);
        
        // Check verification status
        const verified = checkVerificationStatus(data);
        setIsVerified(verified);
        
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    }

    fetchVendorProfile();
  }, []);

  // Check if profile is complete
  useEffect(() => {
    if (vendorProfile) {
      const complete = isVendorProfileComplete(vendorProfile);
      setIsProfileComplete(complete);
      console.log('Profile complete:', complete);
    }
  }, [vendorProfile]);

  // Function to check verification status from different possible response structures
  const checkVerificationStatus = (profile: VendorProfile): boolean => {
    // Check in various possible locations
    if (profile.is_verified !== undefined) {
      return profile.is_verified;
    }
    
    if (profile.status?.is_verified !== undefined) {
      return profile.status.is_verified;
    }
    
    if (profile.data?.is_verified !== undefined) {
      return profile.data.is_verified;
    }
    
    if (profile.vendor?.is_verified !== undefined) {
      return profile.vendor.is_verified;
    }
    
    if (profile.profile?.is_verified !== undefined) {
      return profile.profile.is_verified;
    }
    
    // Default to false if not found
    return false;
  };

  // Function to check if all required profile fields are filled
  const isVendorProfileComplete = (profile: VendorProfile): boolean => {
    const requiredFields = [
      'business_name',
      'shop_name', 
      'shop_type',
      'shop_category',
      'owner_name',
      'gst_number',
      'pan_number',
      'contact_number',
      'alternate_number',
      'address_line1',
      'address_line2',
      'city',
      'state',
      'pincode',
      'country'
    ];

    // Extract the actual profile data from possible nested structures
    const profileData = profile.data || profile.vendor || profile.profile || profile;

    for (const field of requiredFields) {
      const value = profileData[field as keyof typeof profileData];
      if (!value || value === null || value === '' || value === undefined) {
        console.log(`Missing field: ${field}`, value);
        return false;
      }
    }

    return true;
  };

  // Function to extract owner name from different possible response structures
  const getOwnerName = (profile: VendorProfile | null): string => {
    if (!profile) return "Owner";
    
    console.log('Profile structure:', profile);
    
    // Try different possible response structures
    const profileData = profile.data || profile.vendor || profile.profile || profile;
    
    if (profileData.owner_name) {
      return profileData.owner_name;
    }
    
    return "Owner";
  };

  // Profile Incomplete Warning Component
  const ProfileIncompleteWarning = () => {
    if (loading || isProfileComplete) return null;

    return (
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Complete your profile to unlock full dashboard
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Profile completion is required to access all dashboard features.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/profile/complete')}
            className="px-4 py-2 z-50 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors duration-200 whitespace-nowrap"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  };

  // Verification Required Warning Component
  const VerificationRequiredWarning = () => {
    if (loading || isVerified) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">
                Account Verification Required
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                Your account needs to be verified to access the dashboard. Please contact support.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/contact-support')}
            className="px-4 py-2 z-50 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors duration-200 whitespace-nowrap"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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

    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {ownerName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isVerified ? "Welcome back to your dashboard" : "Account verification pending"}
        </p>
      </div>
    );
  };

  // Dashboard Content Component
  const DashboardContent = () => {
    if (!mounted) {
      // Prevent flash of unstyled content
      return null;
    }

    if (loading) {
      return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Loading skeletons */}
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="col-span-12 xl:col-span-5">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      );
    }

    // Check if profile is complete AND verified
    const canAccessDashboard = isProfileComplete && isVerified;

    if (!canAccessDashboard) {
      return (
        <div className="relative">
          {/* Warning messages above the blurred content */}
          {!isProfileComplete && <ProfileIncompleteWarning />}
          {!isVerified && <VerificationRequiredWarning />}
          
          {/* Blurred Dashboard Content */}
          <div className="relative min-h-screen bg-[#f8f9fc] dark:bg-gray-900 p-6">
            <div className="blur-sm pointer-events-none">
              <div className="mx-auto max-w-7xl space-y-6">
                <StatsCards />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <SalesOverview />
                  <TotalSubscriber />
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <SalesDistribution />
                  <IntegrationList />
                </div>
              </div>
            </div>
            
            {/* Overlay with message */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
              <div className="text-center p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-4">
                {!isVerified ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Account Verification Required
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                      Your account needs to be verified by our team to access the dashboard.
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/contact-support')}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                      >
                        Contact Support for Verification
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Verification is mandatory for security purposes
                      </p>
                    </div>
                  </>
                ) : !isProfileComplete ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Complete Your Profile
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                      Profile completion is required to access your dashboard. Please provide all your business details to continue.
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/profile/complete')}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                      >
                        Complete Profile Now
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You must complete your profile to proceed
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Full dashboard when profile is complete AND verified
    return (
      <div className="min-h-screen bg-[#f8f9fc] dark:bg-gray-900 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <StatsCards />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SalesOverview />
            <TotalSubscriber />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SalesDistribution />
            <IntegrationList />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <GreetingMessage />
      <DashboardContent />
    </>
  );
}