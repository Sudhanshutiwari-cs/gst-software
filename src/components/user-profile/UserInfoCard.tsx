"use client";
import React, { useEffect, useState } from "react";

export default function UserInfoCard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        console.error("No token found");
        return;
      }

      const res = await fetch(
        "https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        console.error("Unexpected API response:", data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-5 text-center border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-5 text-center border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-gray-600 dark:text-gray-300">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Owner Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.owner_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Is Verified
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.is_verified ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Shop Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.shop_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Shop Type
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.shop_type || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Shop Category
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.shop_category || "N/A"}
              </p>
            </div>


            <div>
              {profile.shop_category?.toLowerCase() === "medical" ? (
                <>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Medical License Number
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.medical_license || "N/A"}
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    FSSAI License Number
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profile.fssai_license || "N/A"}
                  </p>
                </>
              )}
            </div>



            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Business Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.business_name || "N/A"}
              </p>
            </div>

              <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Pan Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.pan_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Shop Registration Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.shop_registration_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                MSME Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.msme_number || "N/A"}
              </p>
            </div>


            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Mobile Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.mobile_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Alternate Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.alternate_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Payment Status
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.payment_status || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                City
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.city || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                State
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.state || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Country
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.country || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Pincode
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile.pincode || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
