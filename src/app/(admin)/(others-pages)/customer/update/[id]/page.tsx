"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import { useRouter, useParams } from 'next/navigation';

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

interface Customer {
  id: number;
  vendor_id: string;
  customer_id: string | null;
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

interface CustomerResponse {
  success: boolean;
  data: Customer[] | Customer; // Can be array or single object
  message?: string;
}

// Theme types
type Theme = 'light' | 'dark';

export default function EditCustomerPage() {
  const [isClient, setIsClient] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

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

  // Fetch customer data - FIXED ENDPOINT
  useEffect(() => {
    if (!isClient || !customerId) return;

    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError("");

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

        console.log("🔄 Fetching customers list to find customer with ID:", customerId);

        // FIX: Use the correct GET endpoint that returns all customers
        const response = await axios.get<CustomerResponse>(
          `https://manhemdigitalsolutions.com/pos-admin/api/vendor/customers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("✅ Customers API Response:", response.data);

        if (response.data.success && response.data.data) {
          let customerData: Customer | null = null;

          // Handle both array and single object responses
          if (Array.isArray(response.data.data)) {
            // Find the specific customer from the list
            customerData = response.data.data.find(
              (customer: Customer) => customer.id.toString() === customerId
            ) || null;
          } else {
            // If it's a single object, check if it matches the ID
            customerData = (response.data.data as Customer).id.toString() === customerId 
              ? (response.data.data as Customer) 
              : null;
          }

          if (customerData) {
            setCustomer(customerData);
            
            // Set form data with customer data
            setFormData({
              name: customerData.name || "",
              mobile: customerData.mobile || "",
              email: customerData.email || "",
              gstin: customerData.gstin || "",
              address: customerData.address || "",
              city: customerData.city || "",
              pincode: customerData.pincode || "",
            });

            console.log("🎯 Form data set with customer data:", customerData);
          } else {
            throw new Error("Customer not found in the list");
          }
        } else {
          throw new Error(response.data.message || "Failed to load customers data");
        }

      } catch (err: unknown) {
        console.error("❌ Error fetching customer data:", err);
        const apiError = err as ApiError;
        const errorMsg = apiError.response?.data?.message || apiError.response?.data?.error || "❌ Failed to load customer data.";
        setError(errorMsg);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [isClient, customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");
    setError("");

    // Basic validation
    if (!formData.name.trim()) {
      setError("Customer name is required");
      setUpdating(false);
      return;
    }

    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      setUpdating(false);
      return;
    }

    // Mobile number validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit mobile number");
      setUpdating(false);
      return;
    }

    // Email validation (optional field)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      setUpdating(false);
      return;
    }

    try {
      if (!isClient || !customerId) return;

      const storedAuth = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
      if (!storedAuth) {
        setError("❌ JWT token not found. Please log in first.");
        setUpdating(false);
        return;
      }

      let token = "";
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed?.access_token || parsed?.token || "";
      } catch {
        token = storedAuth;
      }

      console.log("📤 Updating customer data:", formData);
      console.log("🆔 Customer ID:", customerId);

      // Use PUT API for updating customer - CORRECT ENDPOINT
      const response = await axios.put(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/update-customer/${customerId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Update customer response:", response.data);
      
      if (response.data.success) {
        toast.success("Customer updated successfully!", {
          position: "bottom-right",
        });
        setMessage("Customer updated successfully!");
        
        // Update local customer state
        if (customer) {
          setCustomer({
            ...customer,
            ...formData,
            updated_at: new Date().toISOString(),
          });
        }

        // Optionally redirect back to customers list after a delay
        setTimeout(() => {
          router.push('/customers');
        }, 2000);
        
      } else {
        throw new Error(response.data.message || "Failed to update customer");
      }

    } catch (error: unknown) {
      console.error("Error:", error);
      const apiError = error as ApiError;
      const errorMsg = apiError.response?.data?.message || apiError.response?.data?.error || "❌ Failed to update customer.";
      setError(errorMsg);
      toast.error("Failed to update customer", {
        position: "bottom-right",
      });
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center transition-colors duration-200 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading customer data...</p>
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
            <div>
              <h2 className="text-xl font-bold">
                Edit Customer
              </h2>
              {customer && (
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Customer ID: {customer.id} | Vendor ID: {customer.vendor_id}
                </p>
              )}
            </div>
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
                onClick={() => router.push('/customers')}
                className={`px-4 py-2 rounded-md text-sm transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
              Back
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
                ⚠️ Unable to load customer data. Please check your connection and try again.
              </div>
            )}

            {!customer && !loading && (
              <div className={`mb-4 p-3 rounded-md ${
                theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
                ❌ Customer not found. Please check the customer ID.
              </div>
            )}

            {customer && (
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
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      minLength={10}
                      pattern="[0-9]{10}"
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
                      placeholder="6-digit pincode"
                      maxLength={6}
                      minLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>
                </div>

                <div className={`flex justify-end pt-4 border-t ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => router.push('/customers')}
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
                    disabled={updating}
                    className={`px-6 py-2 rounded-md transition-all disabled:opacity-50 flex items-center ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Customer"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}