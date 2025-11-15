"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';

// Define types for our data
interface FormData {
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  pincode: string;
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

export default function AddCustomerPage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Theme state
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme and set up listeners
  useEffect(() => {
    setIsClient(true);
    
    // Function to get initial theme
    const getInitialTheme = (): Theme => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // Basic validation
    if (!formData.name.trim()) {
      setError("Customer name is required");
      setLoading(false);
      return;
    }

    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      setLoading(false);
      return;
    }

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

      console.log("📤 Submitting customer data:", formData);

      const response = await axios.post(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/add-customers`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Create customer response:", response.data);
      
      if (response.data.success) {
        toast.success("Customer created successfully!", {
          position: "bottom-right",
        });
        setMessage("Customer created successfully!");
        
        // Reset form
        setFormData({
          name: "",
          mobile: "",
          email: "",
          gstin: "",
          address: "",
          city: "",
          pincode: "",
        });
      } else {
        throw new Error(response.data.message || "Failed to create customer");
      }

    } catch (error: unknown) {
      console.error("Error:", error);
      const apiError = error as ApiError;
      const errorMsg = apiError.response?.data?.message || apiError.response?.data?.error || "❌ Failed to create customer.";
      setError(errorMsg);
      toast.error("Failed to create customer", {
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
      <div className={`min-h-screen p-6 flex items-center justify-center transition-colors duration-200 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <ToastContainer 
        theme={theme}
        toastClassName={() => 
          `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`
        }
      />
      <div className="max-w-6xl mx-auto">
        <div className={`shadow-sm rounded-xl overflow-hidden transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`}>
          <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-200 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold">
              Add New Customer
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Name */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Mobile number"
                    maxLength={10}
                    minLength={10}
                  />
                </div>

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

                {/* GST Number */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>GST Number</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="GST number"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Full address"
                  />
                </div>

                {/* City */}
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

                {/* Pincode */}
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
                    maxLength={6}
                    minLength={6}
                  />
                </div>
              </div>

              <div className={`flex justify-end pt-4 border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className={`px-6 py-2 rounded-md transition-all mr-4 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md transition-all disabled:opacity-50 flex items-center ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}