"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import { TotalSubscriber } from "@/components/dashboard/total-subscriber";
import { SalesDistribution } from "@/components/dashboard/sales-distribution";
import { IntegrationList } from "@/components/dashboard/integration-list";

// Define types for vendor status response
interface VendorStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: 'active' | 'inactive' | 'pending' | 'suspended';
  };
}

// Define the complete vendor profile type
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
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      if (!localStorage.getItem('theme')) {
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

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
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme
    }));
  };

  return { theme, toggleTheme, mounted };
};

export default function Ecommerce() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [vendorStatus, setVendorStatus] = useState<'active' | 'inactive' | 'pending' | 'suspended' | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const { mounted } = useTheme();
  const router = useRouter();

  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem("authToken") || 
           localStorage.getItem("jwtToken") || 
           sessionStorage.getItem("authToken") || 
           sessionStorage.getItem("jwtToken");
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Fetch vendor status
  useEffect(() => {
    async function fetchVendorStatus() {
      try {
        const token = getAuthToken();
        
        if (!token) {
          setStatusError("No authentication token found");
          setLoadingStatus(false);
          return;
        }

        console.log('Fetching vendor status...');
        
        const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        console.log('Status response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch vendor status: ${response.status}`);
        }

        const data: VendorStatusResponse = await response.json();
        console.log('Vendor status API Response:', data);
        
        if (data.success && data.data) {
          setVendorStatus(data.data.status);
        } else {
          throw new Error(data.message || 'Failed to fetch vendor status');
        }
        
      } catch (error) {
        console.error('Error fetching vendor status:', error);
        setStatusError(error instanceof Error ? error.message : 'Failed to fetch vendor status');
        // Set default status to inactive on error
        setVendorStatus('inactive');
      } finally {
        setLoadingStatus(false);
      }
    }

    fetchVendorStatus();
  }, []);

  // Fetch vendor profile
  useEffect(() => {
    async function fetchVendorProfile() {
      try {
        const token = getAuthToken();

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

        console.log('Profile response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        console.log('Profile API Response data:', data);
        
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

  // Check if profile is complete
  useEffect(() => {
    if (vendorProfile) {
      const complete = isVendorProfileComplete(vendorProfile);
      setIsProfileComplete(complete);
      console.log('Profile complete:', complete);
    }
  }, [vendorProfile]);

  // Function to check if vendor is active
  const isVendorActive = (): boolean => {
    return vendorStatus === 'active';
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

  // Account Status Warning Component
  const AccountStatusWarning = () => {
    if (loadingStatus || isVendorActive()) return null;

    const getStatusConfig = () => {
      switch (vendorStatus) {
        case 'inactive':
          return {
            title: 'Account Inactive',
            message: 'Your account is currently inactive. Please contact support to activate your account.',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            textColor: 'text-red-800 dark:text-red-200',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonColor: 'bg-red-600 hover:bg-red-700'
          };
        case 'pending':
          return {
            title: 'Account Pending Approval',
            message: 'Your account is pending approval. Our team will review your account shortly.',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-800 dark:text-blue-200',
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonColor: 'bg-blue-600 hover:bg-blue-700'
          };
        case 'suspended':
          return {
            title: 'Account Suspended',
            message: 'Your account has been suspended. Please contact support for more information.',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'border-orange-200 dark:border-orange-800',
            textColor: 'text-orange-800 dark:text-orange-200',
            iconColor: 'text-orange-600 dark:text-orange-400',
            buttonColor: 'bg-orange-600 hover:bg-orange-700'
          };
        default:
          return {
            title: 'Account Status Issue',
            message: 'There is an issue with your account status. Please contact support.',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            textColor: 'text-red-800 dark:text-red-200',
            iconColor: 'text-red-600 dark:text-red-400',
            buttonColor: 'bg-red-600 hover:bg-red-700'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div className={`mb-6 p-4 ${config.bgColor} border ${config.borderColor} rounded-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className={`w-5 h-5 ${config.iconColor} mr-2`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className={`${config.textColor} font-medium`}>
                {config.title}
              </p>
              <p className={`${config.textColor} text-sm mt-1 opacity-90`}>
                {config.message}
              </p>
              {statusError && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  Error: {statusError}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => router.push('/contact-support')}
            className={`px-4 py-2 z-50 ${config.buttonColor} text-white text-sm rounded-lg transition-colors duration-200 whitespace-nowrap`}
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  };

  // Greeting Component
  const GreetingMessage = () => {
    if (loading || loadingStatus) {
      return (
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      );
    }

    if (error || statusError) {
      return (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome!
          </h1>
          <p className="text-red-500 dark:text-red-400 mt-1">
            {error || statusError}
          </p>
        </div>
      );
    }

    const greeting = getGreeting();
    const ownerName = getOwnerName(vendorProfile);
    const isActive = isVendorActive();

    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {ownerName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isActive ? "Welcome back to your dashboard" : `Account status: ${vendorStatus}`}
        </p>
      </div>
    );
  };

  // Dashboard Content Component
  const DashboardContent = () => {
    if (!mounted) {
      return null;
    }

    if (loading || loadingStatus) {
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

    // Check if profile is complete AND vendor is active
    const canAccessDashboard = isProfileComplete && isVendorActive();

    if (!canAccessDashboard) {
      return (
        <div className="relative">
          {/* Warning messages above the blurred content */}
          {!isProfileComplete && <ProfileIncompleteWarning />}
          {!isVendorActive() && <AccountStatusWarning />}
          
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
                {!isVendorActive() ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Account Status: {vendorStatus?.toUpperCase()}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                      {vendorStatus === 'inactive' 
                        ? 'Your account is currently inactive. Please contact support to activate your account.'
                        : vendorStatus === 'pending'
                        ? 'Your account is pending approval. Our team will review your account shortly.'
                        : 'Your account has been suspended. Please contact support for more information.'
                      }
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/contact-support')}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                      >
                        Contact Support
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Active account status is required to access the dashboard
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

    // Full dashboard when profile is complete AND vendor is active
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