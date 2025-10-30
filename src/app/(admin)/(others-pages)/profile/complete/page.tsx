"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from "next/navigation";

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
  unique_id?: string;
  logo_url?: string;
  banner_url?: string;
}

interface VendorFormData {
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
  logo_url?: string;
  banner_url?: string;
}

interface VendorApiResponse {
  success: boolean;
  message: string;
  data: Vendor;
}

interface CashfreeGSTResponse {
  status: string;
  data?: {
    businessName?: string;
  };
}

interface AxiosError {
  response?: {
    status: number;
    data?: unknown;
  };
}

export default function EditVendorPage() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const router = useRouter();
  const [formData, setFormData] = useState<VendorFormData>({
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
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [gstValidating, setGstValidating] = useState(false);
  const [gstValidationMessage, setGstValidationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme and set up storage listener
  useEffect(() => {
    setIsClient(true);
    
    // Get initial theme from localStorage
    const getStoredTheme = () => {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      return storedTheme || 'light';
    };
    
    setTheme(getStoredTheme());
    applyTheme(getStoredTheme());

    // Listen for storage changes (theme changes from other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as 'light' | 'dark';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent<'light' | 'dark'>) => {
      setTheme(e.detail);
      applyTheme(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    // Set up interval to check for theme changes (fallback)
    const intervalId = setInterval(() => {
      const currentStoredTheme = getStoredTheme();
      if (currentStoredTheme !== theme) {
        setTheme(currentStoredTheme);
        applyTheme(currentStoredTheme);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
      clearInterval(intervalId);
    };
  }, [theme]);

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Function to change theme (can be used if you want to add a theme toggle in this component)
  const changeTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File type validation
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }

      // File size validation (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File type validation
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }

      // File size validation (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setBannerFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch vendor data and helper data
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get auth token
        const storedAuth = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
        if (!storedAuth) {
          setError("JWT token not found. Please log in first.");
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

        // Fetch vendor data
        const vendorResponse = await axios.get<VendorApiResponse>(
          `https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Vendor API Response:", vendorResponse.data);

        if (vendorResponse.data.success && vendorResponse.data.data) {
          const vendorData = vendorResponse.data.data;
          setVendor(vendorData);
          
          // Set form data with proper fallbacks
          setFormData({
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
            logo_url: vendorData.logo_url || "",
            banner_url: vendorData.banner_url || "",
          });

          // Set logo preview if logo_url exists
          if (vendorData.logo_url) {
            setLogoPreview(vendorData.logo_url);
          }

          if (vendorData.banner_url) {
            setBannerPreview(vendorData.banner_url);
          }

          console.log("Form data set:", {
            business_name: vendorData.business_name,
            shop_name: vendorData.shop_name,
            shop_type: vendorData.shop_type,
            shop_category: vendorData.shop_category,
            owner_name: vendorData.owner_name,
            gst_number: vendorData.gst_number,
            pan_number: vendorData.pan_number,
            fssai_license: vendorData.fssai_license,
          });
        } else {
          setError("Failed to load vendor data: " + (vendorResponse.data.message || "Unknown error"));
        }

        // Fetch helper data
        const [catRes, stateRes] = await Promise.all([
          axios.get<{ data?: Category[] }>("https://manhemdigitalsolutions.com/pos-admin/api/helper/categories"),
          axios.get<{ data?: State[] }>("https://manhemdigitalsolutions.com/pos-admin/api/helper/states"),
        ]);

        setCategories(catRes.data?.data ?? []);
        setStates(stateRes.data?.data ?? []);
        
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setFetchError(true);
        setError("Failed to load vendor data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isClient]);

  // GST validation function
  const validateGST = useCallback(async (gstNumber: string): Promise<boolean> => {
    if (!gstNumber || gstNumber.length < 15) {
      setGstValidationMessage("");
      return false;
    }

    setGstValidating(true);
    setGstValidationMessage("Validating GST...");

    try {
      // Cashfree GST verification API
      const response = await axios.get<CashfreeGSTResponse>(
        `https://api.cashfree.com/verification/gstin/${gstNumber}`,
        {
          headers: {
            "x-client-id": "YOUR_CASHFREE_CLIENT_ID",
            "x-client-secret": "YOUR_CASHFREE_CLIENT_SECRET",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "VALID") {
        setGstValidationMessage("✅ GST number is valid");

        // Auto-fill business name if available from GST data
        if (response.data.data?.businessName && !formData.business_name) {
          setFormData(prev => ({
            ...prev,
            business_name: response.data.data?.businessName || prev.business_name
          }));
        }

        return true;
      } else {
        setGstValidationMessage("❌ Invalid GST number");
        return false;
      }
    } catch (error: unknown) {
      console.error("GST validation error:", error);
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 400) {
        setGstValidationMessage("❌ Invalid GST format");
      } else if (axiosError.response?.status === 404) {
        setGstValidationMessage("❌ GST number not found");
      } else {
        setGstValidationMessage("❌ GST verification failed. Please check the number.");
      }
      return false;
    } finally {
      setGstValidating(false);
    }
  }, [formData.business_name]);

  // Debounced GST validation
  useEffect(() => {
    if (!formData.gst_number || formData.gst_number.length < 15) {
      setGstValidationMessage("");
      return;
    }

    const timeoutId = setTimeout(() => {
      validateGST(formData.gst_number);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.gst_number, validateGST]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to convert FormData object to multipart/form-data
  const createFormData = (data: VendorFormData): FormData => {
    const formData = new FormData();

    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (logoFile) {
      formData.append("logo_url", logoFile);
    }

    if (bannerFile) {
      formData.append("banner_url", bannerFile);
    }

    return formData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setLoading(true);
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      if (!isClient) return;

      // Validate GST before submission if GST number is provided
      if (formData.gst_number && formData.gst_number.length >= 15) {
        const isGstValid = await validateGST(formData.gst_number);
        if (!isGstValid) {
          setError("❌ Please enter a valid GST number before submitting.");
          setLoading(false);
          setIsSubmitting(false);
          return;
        }
      }

      const storedAuth = localStorage.getItem("authToken") || localStorage.getItem("jwtToken") || sessionStorage.getItem("authToken") || sessionStorage.getItem("jwtToken");
      if (!storedAuth) {
        setError("❌ JWT token not found. Please log in first.");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      let token = "";
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed?.access_token || parsed?.token || "";
      } catch {
        token = storedAuth;
      }

      // Create multipart form data
      const multipartData = createFormData(formData);

      // Send as multipart/form-data
      const response = await axios.post(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/complete-profile`,
        multipartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Check if the API call was successful
      if (response.data.success) {
        toast.success("Profile completed successfully!", {
          position: "bottom-right",
        });
        
        // Redirect to profile page after successful update
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }

    } catch (error: unknown) {
      console.error("Error:", error);
      const axiosError = error as AxiosError;
      const errorMsg =
        (typeof axiosError.response?.data === 'object' && axiosError.response.data !== null && 'message' in axiosError.response.data)
          ? (axiosError.response.data as { message?: string }).message
          : (typeof axiosError.response?.data === 'object' && axiosError.response.data !== null && 'error' in axiosError.response.data)
            ? (axiosError.response.data as { error?: string }).error
            : "❌ Failed to update vendor.";
      setError(errorMsg || "❌ Failed to update vendor.");
      
      toast.error("Failed to update profile!", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null;

  if (loading && !vendor) {
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors duration-300`}>
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-sm rounded-xl overflow-hidden transition-colors duration-300`}>
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-6 py-4 border-b flex justify-between items-center transition-colors duration-300`}>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {vendor ? "Complete Profile" : "Create Vendor"}
            </h2>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button (Optional) */}
              
              <button
                onClick={() => window.history.back()}
                className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-md text-sm transition-colors duration-300`}
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className={`mb-4 p-3 rounded-md ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} transition-colors duration-300`}>
                {error}
              </div>
            )}

            {message && (
              <div className={`mb-4 p-3 rounded-md ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'} transition-colors duration-300`}>
                {message}
              </div>
            )}

            {fetchError && (
              <p className={`text-center mb-4 font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} transition-colors duration-300`}>
                ⚠️ Unable to load categories or states. Please try again later.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="border-b pb-6 border-gray-300 dark:border-gray-600 transition-colors duration-300">
                <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Shop Banner</h3>
                <div className="space-y-4">
                  <div className="flex-shrink-0">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview}
                        alt="Shop banner preview"
                        className="h-40 w-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                      />
                    ) : (
                      <div className={`h-40 w-full rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-300`}>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No banner</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>
                      Upload Banner
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-gray-300 file:bg-indigo-900 file:text-indigo-200 hover:file:bg-indigo-800' 
                          : 'text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                      PNG, JPG, JPEG up to 5MB. Recommended: 1200x400px
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b pb-6 border-gray-300 dark:border-gray-600 transition-colors duration-300">
                <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Shop Logo</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Shop logo preview"
                        className="h-20 w-20 object-cover rounded-full border-2 border-gray-300 dark:border-gray-600 transition-colors duration-300"
                      />
                    ) : (
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-300`}>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>No logo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-gray-300 file:bg-indigo-900 file:text-indigo-200 hover:file:bg-indigo-800' 
                          : 'text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Shop Name</label>
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Shop Type</label>
                  <input
                    type="text"
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Shop Category</label>
                  <select
                    name="shop_category"
                    value={formData.shop_category}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.category_name || cat.name}>
                        {cat.category_name || cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Owner Name</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>GST Number</label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    placeholder="Enter GST Number (15 characters)"
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                    maxLength={15}
                  />
                  {gstValidationMessage && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-300 ${
                        gstValidationMessage.startsWith("✅")
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {gstValidating ? "🔄 Validating..." : gstValidationMessage}
                    </p>
                  )}
                </div>

                {/* ... rest of the form fields with similar theme transitions ... */}
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>FSSAI License</label>
                  <input
                    type="text"
                    name="fssai_license"
                    value={formData.fssai_license}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Alternate Number</label>
                  <input
                    type="text"
                    name="alternate_number"
                    value={formData.alternate_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Mobile Number</label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-600 text-gray-400' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Address Line 1</label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Address Line 2</label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map((st: State) => (
                      <option key={st.id} value={st.state_name || st.name}>
                        {st.state_name || st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} transition-colors duration-300`}>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                

              
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || gstValidating || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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