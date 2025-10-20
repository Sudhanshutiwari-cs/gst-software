"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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

interface FormData {
  business_name: string;
  shop_name: string;
  shop_type: string;
  shop_category: string;
  owner_name: string;
  gst_number: string;

  pan_number: string;
  contact_number: string;
  alternate_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;

  country: string;
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

export default function CompleteProfilePage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    shop_name: "",
    shop_type: "",
    shop_category: "",
    owner_name: "",
    gst_number: "",
    pan_number: "",
    contact_number: "",
    alternate_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [gstValidating, setGstValidating] = useState(false);
  const [gstValidationMessage, setGstValidationMessage] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // GST validation function wrapped in useCallback to avoid useEffect dependency issues
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

  useEffect(() => {
    if (!isClient) return;

    const fetchHelperData = async () => {
      try {
        const [catRes, stateRes] = await Promise.all([
          axios.get<{ data?: Category[] }>("https://manhemdigitalsolutions.com/pos-admin/api/helper/categories"),
          axios.get<{ data?: State[] }>("https://manhemdigitalsolutions.com/pos-admin/api/helper/states"),
        ]);
        setCategories(catRes.data?.data ?? []);
setStates(stateRes.data?.data ?? []);

      } catch (err) {
        console.error("❌ Error fetching helper data:", err);
        setFetchError(true);
      }
    };
    fetchHelperData();
  }, [isClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    try {
      if (!isClient) return;

      // Validate GST before submission if GST number is provided
      if (formData.gst_number && formData.gst_number.length >= 15) {
        const isGstValid = await validateGST(formData.gst_number);
        if (!isGstValid) {
          setMessage("❌ Please enter a valid GST number before submitting.");
          setLoading(false);
          return;
        }
      }

      const storedAuth = localStorage.getItem("authToken");
      if (!storedAuth) {
        setMessage("❌ JWT token not found. Please log in first.");
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

      const response = await axios.post(
        "https://manhemdigitalsolutions.com/pos-admin/api/vendor/complete-profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage("✅ Profile updated successfully!");
      console.log("Response:", response.data);
    } catch (error: unknown) {
      console.error("Error:", error);
      const axiosError = error as AxiosError;
      const errorMsg =
        (typeof axiosError.response?.data === 'object' && axiosError.response.data !== null && 'message' in axiosError.response.data) 
          ? (axiosError.response.data as { message?: string }).message
          : (typeof axiosError.response?.data === 'object' && axiosError.response.data !== null && 'error' in axiosError.response.data)
          ? (axiosError.response.data as { error?: string }).error
          : "❌ Failed to update profile.";
      setMessage(errorMsg || "❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit Vendor - <span className="text-indigo-600">VEN20250926J5UC</span>
          </h2>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
          >
            ← Back
          </button>
        </div>

        {fetchError && (
          <p className="text-red-600 text-center mb-4 font-semibold">
            ⚠️ Unable to load categories or states. Please try again later.
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1">Business Name</label>
            <input
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Enter Business Name"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Shop Name</label>
            <input
              name="shop_name"
              value={formData.shop_name}
              onChange={handleChange}
              placeholder="Enter Shop Name"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Shop Type</label>
            <input
              name="shop_type"
              value={formData.shop_type}
              onChange={handleChange}
              placeholder="Enter Shop Type"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Shop Category</label>
            <select
              name="shop_category"
              value={formData.shop_category}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
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
            <label className="block text-sm font-semibold mb-1">Owner Name</label>
            <input
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              placeholder="Enter Owner Name"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">GST Number</label>
            <input
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              placeholder="Enter GST Number (15 characters)"
              className="w-full border rounded-lg px-3 py-2"
              maxLength={15}
            />
            {gstValidationMessage && (
              <p
                className={`text-sm mt-1 ${
                  gstValidationMessage.startsWith("✅")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {gstValidating ? "🔄 Validating..." : gstValidationMessage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">PAN Number</label>
            <input
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              placeholder="Enter PAN Number"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Mobile Number</label>
            <input
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="Enter Contact Number"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Alternate Number</label>
            <input
              name="alternate_number"
              value={formData.alternate_number}
              onChange={handleChange}
              placeholder="Enter Alternate Number"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">Address Line 1</label>
            <input
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="Address Line 1"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">Address Line 2</label>
            <input
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Address Line 2"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter City"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">State</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
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
            <label className="block text-sm font-semibold mb-1">Pincode</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter Pincode"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Country</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading || gstValidating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Vendor"}
            </button>
          </div>
        </form>

        {message && (
          <p
            className={`mt-5 text-center font-semibold ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}