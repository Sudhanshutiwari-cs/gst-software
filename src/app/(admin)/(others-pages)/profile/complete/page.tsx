"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CompleteProfilePage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
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
    country: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Ensure rendering only on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Fetch categories and states only when client is ready
  useEffect(() => {
    if (!isClient) return;

    const fetchHelperData = async () => {
      try {
        const [catRes, stateRes] = await Promise.all([
          axios.get(
            "https://manhemdigitalsolutions.com/pos-admin/api/helper/categories"
          ),
          axios.get(
            "https://manhemdigitalsolutions.com/pos-admin/api/helper/states"
          ),
        ]);

        setCategories(catRes.data?.data || catRes.data || []);
        setStates(stateRes.data?.data || stateRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching helper data:", err);
        setFetchError(true);
      }
    };

    fetchHelperData();
  }, [isClient]);

  // ✅ Input Change Handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!isClient) return;

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

      if (!token) {
        setMessage("❌ Access token missing. Please log in again.");
        setLoading(false);
        return;
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

      setMessage("✅ Profile completed successfully!");
      console.log("Response:", response.data);
    } catch (error: any) {
      console.error("Error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "❌ Failed to complete profile.";
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Avoid rendering SSR mismatched UI
  if (!isClient) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Complete Your Vendor Profile
      </h2>

      {fetchError && (
        <p className="text-red-600 text-center mb-4 font-semibold">
          ⚠️ Unable to load categories or states. Please try again later.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {Object.keys(formData).map((field) => {
          if (field === "shop_category") {
            return (
              <div key={field} className="flex flex-col">
                <label className="font-semibold mb-1" htmlFor={field}>
                  Shop Category
                </label>
                <select
                  id={field}
                  name={field}
                  value={formData.shop_category}
                  onChange={handleChange}
                  className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => {
                    const categoryName = cat.category_name || cat.name || "";
                    const categoryId = cat.id || categoryName;
                    return (
                      <option key={categoryId} value={categoryName}>
                        {categoryName}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          }

          if (field === "state") {
            return (
              <div key={field} className="flex flex-col">
                <label className="font-semibold mb-1" htmlFor={field}>
                  State
                </label>
                <select
                  id={field}
                  name={field}
                  value={formData.state}
                  onChange={handleChange}
                  className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
                  required
                >
                  <option value="">Select State</option>
                  {states.map((st: any) => {
                    const stateName = st.state_name || st.name || "";
                    const stateId = st.id || stateName;
                    return (
                      <option key={stateId} value={stateName}>
                        {stateName}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          }

          return (
            <div key={field} className="flex flex-col">
              <label className="capitalize font-semibold mb-1" htmlFor={field}>
                {field.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                value={(formData as any)[field]}
                onChange={handleChange}
                placeholder={`Enter ${field.replace(/_/g, " ")}`}
                className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
                required
              />
            </div>
          );
        })}

        <div className="col-span-2 flex justify-center mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-70"
          >
            {loading ? "Submitting..." : "Submit Profile"}
          </button>
        </div>
      </form>

      {message && (
        <p
          className={`mt-4 text-center font-semibold ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}