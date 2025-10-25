"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  unique_id?: string;
  logo_url?: string;
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
  const [vendor, setVendor] = useState<Vendor | null>(null);
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

  // Fetch vendor data and helper data
  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Get auth token
        const storedAuth = localStorage.getItem("authToken");
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
        const vendorResponse = await axios.get(
          `https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (vendorResponse.data) {
          setVendor(vendorResponse.data);
          setFormData({
            business_name: vendorResponse.data.business_name || "",
            shop_name: vendorResponse.data.shop_name || "",
            shop_type: vendorResponse.data.shop_type || "",
            shop_category: vendorResponse.data.shop_category || "",
            owner_name: vendorResponse.data.owner_name || "",
            gst_number: vendorResponse.data.gst_number || "",
            pan_number: vendorResponse.data.pan_number || "",
            fssai_license: vendorResponse.data.fssai_license || "",
            contact_number: vendorResponse.data.contact_number || "",
            alternate_number: vendorResponse.data.alternate_number || "",
            mobile_number: vendorResponse.data.mobile_number || "",
            address_line1: vendorResponse.data.address_line1 || "",
            address_line2: vendorResponse.data.address_line2 || "",
            city: vendorResponse.data.city || "",
            state: vendorResponse.data.state || "",
            pincode: vendorResponse.data.pincode || "",
            country: vendorResponse.data.country || "India",
            status: vendorResponse.data.status || "active",
            payment_status: vendorResponse.data.payment_status || "pending",
          });
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
            "x-client-id": "YOUR_CASHFREE_CLIENT_ID", // Replace with your actual client ID
            "x-client-secret": "YOUR_CASHFREE_CLIENT_SECRET", // Replace with your actual client secret
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
      formData.append(key, value);
    });

    if (logoFile) {
      formData.append("logo_url", logoFile);
}

    return formData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
          return;
        }
      }

      const storedAuth = localStorage.getItem("authToken");
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

      // Create multipart form data
      const multipartData = createFormData(formData);

      // Send as multipart/form-data
      await axios.post(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/complete-profile`,
        multipartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Profile Completed successfully !", {
        position: "bottom-right",
      });

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
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  if (loading && !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Edit Vendor
            </h2>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm"
            >
              ← Back
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {message}
              </div>
            )}

            {fetchError && (
              <p className="text-red-600 text-center mb-4 font-semibold">
                ⚠️ Unable to load categories or states. Please try again later.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Logo</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Shop logo preview"
                        className="h-20 w-20 object-cover rounded-full border-2 border-gray-300"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No logo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Type</label>
                  <input
                    type="text"
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop Category</label>
                  <select
                    name="shop_category"
                    value={formData.shop_category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    placeholder="Enter GST Number (15 characters)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={15}
                  />
                  {gstValidationMessage && (
                    <p
                      className={`text-sm mt-1 ${gstValidationMessage.startsWith("✅")
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {gstValidating ? "🔄 Validating..." : gstValidationMessage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI License</label>
                  <input
                    type="text"
                    name="fssai_license"
                    value={formData.fssai_license}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Number</label>
                  <input
                    type="text"
                    name="alternate_number"
                    value={formData.alternate_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"

                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || gstValidating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-all disabled:opacity-50"
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