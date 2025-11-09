"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';

// Define types for our data
interface State {
  id: number;
  state_name?: string;
  name?: string;
}



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

  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch helper data
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

        // Fetch states
        console.log("🔄 Fetching states...");
        const stateRes = await axios.get("https://manhemdigitalsolutions.com/pos-admin/api/helper/states", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        console.log("📦 States:", stateRes.data);
        
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Add New Customer
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm"
              >
                ← Back
              </button>
            </div>
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
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
                ⚠️ Unable to load some data. Please check your connection and try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mobile number"
                    maxLength={10}
                    minLength={10}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email address"
                  />
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="GST number"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Full address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="City"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Pincode"
                    maxLength={6}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md transition-all mr-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-all disabled:opacity-50 flex items-center"
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

            {/* API Information */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">API Information</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Endpoint:</strong> POST /api/vendor/add-customers</p>
                <p><strong>Required Fields:</strong> name, mobile</p>
                <p><strong>Optional Fields:</strong> email, gstin, address, city, pincode</p>
                <p><strong>Authentication:</strong> JWT Token Required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}