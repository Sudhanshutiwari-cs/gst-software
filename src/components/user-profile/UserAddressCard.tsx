"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api"; // Axios instance

export default function UserAddressCard() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("Token not found in localStorage");
          return;
        }

        const response = await api.get("https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data.success) {
          setVendorData(response.data.data);
        } else {
          console.error("Unexpected response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  // Simple inline loader
  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );

  if (!vendorData)
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Address
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No vendor data found.
        </p>
      </div>
    );

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Address
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Country
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {vendorData.country || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                City / State
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {vendorData.city
                  ? `${vendorData.city}, ${vendorData.state}`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Postal Code
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {vendorData.pincode || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Address Line 1
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {vendorData.address_line1 || "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Address Line 2
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {vendorData.address_line2 || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
