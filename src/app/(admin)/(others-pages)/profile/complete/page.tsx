"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from "next/navigation";
import { useTheme } from '@/context/ThemeContext';


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
  
  // Use theme context
  const { theme } = useTheme();

  // Theme-based styling classes
  const containerClass = theme === 'dark' 
    ? "min-h-screen bg-gray-900 p-6"
    : "min-h-screen bg-gray-50 p-6";

  const cardClass = theme === 'dark'
    ? "bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-700"
    : "bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200";

  const headerClass = theme === 'dark'
    ? "bg-gray-800 px-8 py-6 border-b border-gray-700"
    : "bg-white px-8 py-6 border-b border-gray-200";

  const titleClass = theme === 'dark'
    ? "text-2xl font-bold text-white"
    : "text-2xl font-bold text-gray-900";

  const subtitleClass = theme === 'dark'
    ? "text-gray-400 mt-1"
    : "text-gray-600 mt-1";

  const inputClass = theme === 'dark'
    ? "w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
    : "w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";

  const selectClass = theme === 'dark'
    ? "w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
    : "w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";

  const labelClass = theme === 'dark'
    ? "block text-sm font-medium text-gray-300 mb-2"
    : "block text-sm font-medium text-gray-700 mb-2";

  const sectionBorderClass = theme === 'dark'
    ? "border-b border-gray-700 pb-8"
    : "border-b border-gray-200 pb-8";

  const buttonSecondaryClass = theme === 'dark'
    ? "px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors font-medium border border-gray-600"
    : "px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors font-medium border border-gray-300";

  const errorClass = theme === 'dark'
    ? "mb-6 p-4 bg-red-900/20 text-red-200 rounded-lg flex items-center justify-between border border-red-800/30"
    : "mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-between border border-red-200";

  const successClass = theme === 'dark'
    ? "mb-6 p-4 bg-green-900/20 text-green-200 rounded-lg flex items-center border border-green-800/30"
    : "mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200";

  const loadingTextClass = theme === 'dark'
    ? "text-lg text-gray-300"
    : "text-lg text-gray-600";

  const loadingSubtextClass = theme === 'dark'
    ? "text-sm text-gray-400"
    : "text-sm text-gray-500";

  const logoPreviewClass = theme === 'dark'
    ? "bg-gray-700 border-gray-600 text-gray-400"
    : "bg-gray-200 border-gray-300 text-gray-500";

  const bannerPreviewClass = theme === 'dark'
    ? "bg-gray-700 border-gray-600 text-gray-400"
    : "bg-gray-200 border-gray-300 text-gray-500";

  const fileInputClass = theme === 'dark'
    ? "text-gray-300 file:bg-indigo-900 file:text-indigo-200 hover:file:bg-indigo-800"
    : "text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100";

  const helpTextClass = theme === 'dark'
    ? "text-xs text-gray-400"
    : "text-xs text-gray-500";

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      <div className={containerClass}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${loadingTextClass}`}>Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <ToastContainer 
        theme={theme}
        toastClassName={() => 
          `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`
        }
      />
      <div className="max-w-6xl mx-auto">
        <div className={cardClass}>
          {/* Header */}
          <div className={`${headerClass} flex justify-between items-center`}>
            <div>
              <h2 className={titleClass}>
                {vendor ? "Complete Profile" : "Create Vendor"}
              </h2>
              <p className={subtitleClass}>
                {vendor ? "Complete your vendor profile information" : "Create a new vendor profile"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              
              <button
                onClick={() => window.history.back()}
                className={buttonSecondaryClass}
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className={errorClass}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {message && (
              <div className={successClass}>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {fetchError && (
              <p className={`text-center mb-4 font-semibold ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                ⚠️ Unable to load categories or states. Please try again later.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Banner Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Shop Banner
                </h3>
                <div className="space-y-4">
                  <div className="flex-shrink-0">
                    {bannerPreview ? (
                      <img
                        src={bannerPreview}
                        alt="Shop banner preview"
                        className="h-40 w-full object-cover rounded-lg border-2 border-gray-300"
                      />
                    ) : (
                      <div className={`h-40 w-full rounded-lg flex items-center justify-center border-2 ${bannerPreviewClass}`}>
                        <span className="text-sm">No banner</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Upload Banner
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${fileInputClass}`}
                    />
                    <p className={helpTextClass}>
                      PNG, JPG, JPEG up to 5MB. Recommended: 1200x400px
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Shop Logo
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Shop logo preview"
                        className="h-20 w-20 object-cover rounded-full border-2 border-gray-300"
                      />
                    ) : (
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center border-2 ${logoPreviewClass}`}>
                        <span className="text-sm">No logo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${fileInputClass}`}
                    />
                    <p className={helpTextClass}>
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Business Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      name="shop_name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter shop name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Shop Type *
                    </label>
                    <input
                      type="text"
                      name="shop_type"
                      value={formData.shop_type}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter shop type"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Shop Category *
                    </label>
                    <select
                      name="shop_category"
                      value={formData.shop_category}
                      onChange={handleChange}
                      required
                      className={selectClass}
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
                    <label className={labelClass}>
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter owner name"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gst_number"
                      value={formData.gst_number}
                      onChange={handleChange}
                      placeholder="Enter GST Number (15 characters)"
                      className={inputClass}
                      maxLength={15}
                    />
                    {gstValidationMessage && (
                      <p
                        className={`text-sm mt-1 ${
                          gstValidationMessage.startsWith("✅")
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {gstValidating ? "🔄 Validating..." : gstValidationMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter PAN number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      FSSAI License
                    </label>
                    <input
                      type="text"
                      name="fssai_license"
                      value={formData.fssai_license}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter FSSAI license number"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>
                      Contact Number *
                    </label>
                    <input
                      type="text"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Alternate Number
                    </label>
                    <input
                      type="text"
                      name="alternate_number"
                      value={formData.alternate_number}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter alternate number"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className={`${inputClass} ${
                        theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                      }`}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter address line 1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter address line 2"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className={selectClass}
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
                    <label className={labelClass}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter pincode"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>

              {/* Status Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Status Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className={selectClass}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Payment Status *
                    </label>
                    <select
                      name="payment_status"
                      value={formData.payment_status}
                      onChange={handleChange}
                      required
                      className={selectClass}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading || gstValidating || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg min-w-48"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    'Complete Profile'
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