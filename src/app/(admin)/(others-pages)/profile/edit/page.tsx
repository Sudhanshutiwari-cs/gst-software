"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';

// Define types for our data
interface Category {
  id: number;
  category_name?: string;
  name?: string;
}

interface State {
  id: number;
  state_name?: string;
  name?: string;
}

interface Vendor {
  id: number;
  business_name: string;
  shop_name: string;
  shop_type: string;
  shop_category: string;
  owner_name: string;
  gst_number: string;
  pan_number: string;
  fssai_license: string;
  contact_number: string;
  alternate_number: string;
  mobile_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: string;
  payment_status: string;
  email: string;
  unique_id?: string;
  logo_url?: string;
  banner_url?: string;
}

interface FormData {
  business_name: string;
  shop_name: string;
  shop_type: string;
  shop_category: string;
  owner_name: string;
  gst_number: string;
  pan_number: string;
  fssai_license: string;
  contact_number: string;
  alternate_number: string;
  mobile_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: string;
  payment_status: string;
  email: string;
  logo_url?: string;
  banner_url?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Vendor;
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  request?: unknown;
  message: string;
}

// Theme types
type Theme = 'light' | 'dark';

export default function EditVendorPage() {
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    shop_name: "",
    shop_type: "",
    shop_category: "",
    owner_name: "",
    gst_number: "",
    pan_number: "",
    fssai_license: "",
    contact_number: "",
    alternate_number: "",
    mobile_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    status: "active",
    payment_status: "pending",
    email: "",
    logo_url: "",
    banner_url: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Theme state - initialize with a function to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme and set up listeners - FIXED VERSION
  useEffect(() => {
    setIsClient(true);
    
    // Function to get initial theme
    const getInitialTheme = (): Theme => {
      // Check localStorage first
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          return savedTheme;
        }
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'light';
    };

    // Function to apply theme to DOM
    const applyTheme = (newTheme: Theme) => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Set initial theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for storage changes (theme changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = (e.newValue as Theme) || 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    // Set up mutation observer to watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
      observer.disconnect();
    };
  }, []);

  // Effect to update theme when state changes
  useEffect(() => {
    if (isClient) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, isClient]);

  // Fetch vendor data and helper data
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Get auth token
        const storedAuth = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
        console.log("🔐 Stored auth:", storedAuth);
        
        if (!storedAuth) {
          setError("JWT token not found. Please log in first.");
          setLoading(false);
          return;
        }

        let token = "";
        try {
          const parsed = JSON.parse(storedAuth);
          token = parsed?.access_token || parsed?.token || storedAuth;
          console.log("✅ Parsed token:", token ? "Token exists" : "No token");
        } catch {
          token = storedAuth;
          console.log("✅ Using raw token");
        }

        if (!token) {
          setError("Invalid token format");
          setLoading(false);
          return;
        }

        // Fetch vendor data
        console.log("🔄 Fetching vendor profile...");
        const vendorResponse = await axios.get<ApiResponse>(
          `https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📦 Full API Response:", vendorResponse.data);
        console.log("📦 Vendor Data:", vendorResponse.data.data);

        if (vendorResponse.data.success && vendorResponse.data.data) {
          const vendorData = vendorResponse.data.data;
          
          // Set form data directly without using vendor state
          const newFormData: FormData = {
            business_name: vendorData.business_name || "",
            shop_name: vendorData.shop_name || "",
            shop_type: vendorData.shop_type || "",
            shop_category: vendorData.shop_category || "",
            owner_name: vendorData.owner_name || "",
            gst_number: vendorData.gst_number || "",
            pan_number: vendorData.pan_number || "",
            fssai_license: vendorData.fssai_license || "",
            contact_number: vendorData.contact_number || "",
            alternate_number: vendorData.alternate_number || "",
            mobile_number: vendorData.mobile_number || "",
            address_line1: vendorData.address_line1 || "",
            address_line2: vendorData.address_line2 || "",
            city: vendorData.city || "",
            state: vendorData.state || "",
            pincode: vendorData.pincode || "",
            country: vendorData.country || "India",
            status: vendorData.status || "active",
            payment_status: vendorData.payment_status || "pending",
            email: vendorData.email || "",
            logo_url: vendorData.logo_url || "",
            banner_url: vendorData.banner_url || "",
          };

          console.log("🎯 Setting form data:", newFormData);
          setFormData(newFormData);
          
          // Set previews if URLs exist
          if (vendorData.logo_url) {
            setLogoPreview(vendorData.logo_url);
          }
          if (vendorData.banner_url) {
            setBannerPreview(vendorData.banner_url);
          }
        } else {
          console.warn("⚠️ No vendor data in response");
          setError("No vendor data received from server");
        }

        // Fetch helper data
        console.log("🔄 Fetching categories and states...");
        const [catRes, stateRes] = await Promise.all([
          axios.get("https://manhemdigitalsolutions.com/pos-admin/api/helper/categories"),
          axios.get("https://manhemdigitalsolutions.com/pos-admin/api/helper/states"),
        ]);
        
        console.log("📦 Categories:", catRes.data);
        console.log("📦 States:", stateRes.data);
        
        setCategories(catRes.data?.data ?? catRes.data ?? []);
        setStates(stateRes.data?.data ?? stateRes.data ?? []);
        
      } catch (err: unknown) {
        console.error("❌ Error fetching data:", err);
        const apiError = err as ApiError;
        console.error("❌ Error response:", apiError.response);
        
        if (apiError.response) {
          setError(`Server error: ${apiError.response.status} - ${apiError.response.data?.message || 'Unknown error'}`);
        } else if (apiError.request) {
          setError("Network error: Could not connect to server");
        } else {
          setError("Error: " + apiError.message);
        }
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      
      if (name === 'logo') {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else if (name === 'banner') {
        setBannerFile(file);
        setBannerPreview(previewUrl);
      }
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData(prev => ({ ...prev, logo_url: "" }));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    setFormData(prev => ({ ...prev, banner_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!isClient) return;

      const storedAuth = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
      if (!storedAuth) {
        setError("❌ JWT token not found. Please log in first.");
        setLoading(false);
        return;
      }

      let token = "";
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed?.access_token || parsed?.token || "";
      } catch {
        token = storedAuth;
      }

      console.log("📤 Submitting form data:", formData);

      // Create FormData object for multipart upload
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof FormData];
        if (value !== undefined && value !== null && value !== "") {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Append files if they exist
      if (logoFile) {
        formDataToSend.append('logo_url', logoFile);
      }
      
      if (bannerFile) {
        formDataToSend.append('banner_url', bannerFile);
      }

      // Log FormData contents for debugging
      console.log("📦 FormData contents:");
      for (const pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Using POST method instead of PUT
      const response = await axios.post(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/update-profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Update response:", response.data);
      
      if (response.data.success) {
        toast.success("Profile updated successfully!", {
          position: "bottom-right",
        });
        setMessage("Vendor profile updated successfully!");

        // Refresh previews if new files were uploaded
        if (response.data.data?.logo_url) {
          setLogoPreview(response.data.data.logo_url);
          setFormData(prev => ({ ...prev, logo_url: response.data.data.logo_url }));
        }
        if (response.data.data?.banner_url) {
          setBannerPreview(response.data.data.banner_url);
          setFormData(prev => ({ ...prev, banner_url: response.data.data.banner_url }));
        }

        // Update other fields if returned in response
        if (response.data.data) {
          setFormData(prev => ({
            ...prev,
            ...response.data.data
          }));
        }
      } else {
        throw new Error(response.data.message || "Update failed");
      }

    } catch (error: unknown) {
      console.error("Error:", error);
      const apiError = error as ApiError;
      const errorMsg = apiError.response?.data?.message || 
                      apiError.response?.data?.error || 
                      apiError.message || 
                      "❌ Failed to update vendor.";
      setError(errorMsg);
      toast.error("Failed to update profile", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a retry function
  const handleRetry = () => {
    setFetchError(false);
    setError("");
    window.location.reload();
  };

  if (!isClient) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Initializing...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors duration-200`}>
      <ToastContainer 
        theme={theme}
        toastClassName={() => 
          `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`
        }
      />
      <div className="max-w-8xl mx-auto">
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-sm rounded-xl overflow-hidden transition-colors duration-200`}>
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-6 py-4 border-b flex justify-between items-center transition-colors duration-200`}>
            <h2 className="text-xl font-bold">
              Edit Vendor 
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className={`px-4 py-2 rounded-md text-sm transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Retry
              </button>
              <button
                onClick={() => window.history.back()}
                className={`px-4 py-2 rounded-md text-sm transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Debug theme info - you can remove this later */}
            

            {error && (
              <div className={`mb-4 p-3 rounded-md ${
                theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {message && (
              <div className={`mb-4 p-3 rounded-md ${
                theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            {fetchError && (
              <div className={`mb-4 p-3 rounded-md ${
                theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-700'
              }`}>
                ⚠️ Unable to load some data. Please check your connection and try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo and Banner Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Logo Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Logo
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${
                    theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-32 h-32 object-contain mb-2 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = 
                              `<div class="w-32 h-32 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 mb-2">
                                 <span class="text-gray-500 dark:text-gray-400">Invalid Image</span>
                               </div>`;
                          }}
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className={`text-sm px-3 py-1 rounded-md ${
                            theme === 'dark'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-2 ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <span className={`text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            🏪
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Upload your shop logo
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      name="logo"
                      onChange={handleFileChange}
                      accept="image/*"
                      className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium ${
                        theme === 'dark'
                          ? 'file:bg-gray-700 file:text-white text-gray-300'
                          : 'file:bg-gray-100 file:text-gray-700 text-gray-900'
                      }`}
                    />
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Recommended: Square image, max 2MB
                    </p>
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Banner
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${
                    theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    {bannerPreview ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={bannerPreview} 
                          alt="Banner Preview" 
                          className="w-full h-32 object-cover mb-2 rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = 
                              `<div class="w-full h-32 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 mb-2">
                                 <span class="text-gray-500 dark:text-gray-400">Invalid Image</span>
                               </div>`;
                          }}
                        />
                        <button
                          type="button"
                          onClick={removeBanner}
                          className={`text-sm px-3 py-1 rounded-md ${
                            theme === 'dark'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          Remove Banner
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-2 ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <span className={`text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            🖼️
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Upload your shop banner
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      name="banner"
                      onChange={handleFileChange}
                      accept="image/*"
                      className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium ${
                        theme === 'dark'
                          ? 'file:bg-gray-700 file:text-white text-gray-300'
                          : 'file:bg-gray-100 file:text-gray-700 text-gray-900'
                      }`}
                    />
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Recommended: Landscape image, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email Field */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Email address"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Business name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Shop Name</label>
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Shop name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Shop Type</label>
                  <input
                    type="text"
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Shop type"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Shop Category</label>
                  <select
                    name="shop_category"
                    value={formData.shop_category}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.category_name || cat.name || ""}>
                        {cat.category_name || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Owner Name</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Owner name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>GST Number</label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="GST number"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="PAN number"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>FSSAI License</label>
                  <input
                    type="text"
                    name="fssai_license"
                    value={formData.fssai_license}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="FSSAI license"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Contact number"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Alternate Number</label>
                  <input
                    type="text"
                    name="alternate_number"
                    value={formData.alternate_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Alternate number"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Mobile Number</label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-600 text-gray-400' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Address Line 1</label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Address line 1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Address Line 2</label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Address line 2"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map((st: State) => (
                      <option key={st.id} value={st.state_name || st.name || ""}>
                        {st.state_name || st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Pincode"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Country"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Payment Status</label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md transition-all disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {loading ? "Updating..." : "Update Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}