"use client";
import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";

interface VendorProfile {
  business_name: string;
  shop_name: string;
  shop_type: string;
  shop_category: string;
  owner_name: string;
  gst_number?: string;
  pan_number?: string;
  contact_number: string;
  alternate_number?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  // Get JWT token from localStorage (adjust based on your auth setup)
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('jwtToken');
    }
    return null;
  };

  // Fetch vendor profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        console.error('No JWT token found');
        return;
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
if (data.success && data.data) {
  setProfile(data.data);
  setFormData(data.data);
} else {
  console.error("Unexpected response format:", data);
}

      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<VendorProfile>) => {
    try {
      const token = getToken();
      
      if (!token) {
        console.error('No JWT token found');
        return false;
      }

      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/update-profile', {
        method: 'PUT', // or 'PUT' depending on your API
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        console.error('Failed to update profile', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  // Complete profile (for initial setup)
  const completeProfile = async (data: VendorProfile) => {
    try {
      const token = getToken();
      
      if (!token) {
        console.error('No JWT token found');
        return false;
      }

      const response = await fetch('http://127.0.0.1:8000/api/vendor/complete-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        console.error('Failed to complete profile');
        return false;
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      return false;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!formData) {
        console.error('No form data available');
        return;
      }

      let success = false;
      
      if (profile) {
        // Update existing profile
        success = await updateProfile(formData);
      } else {
        // Complete profile (initial setup) - ensure all required fields are present
        const completeData = formData as VendorProfile;
        success = await completeProfile(completeData);
      }

      if (success) {
        console.log("Profile saved successfully");
        // Refresh profile data
        await fetchProfile();
        closeModal();
      } else {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof VendorProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData(profile);
    }
  }, [isOpen, profile]);

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src="/tailadmin-nextjs/images/user/owner.jpg"
                alt="user"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile?.owner_name || "Musharof Chowdhury"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.shop_type || "Team Manager"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.city && profile?.state 
                    ? `${profile.city}, ${profile.state}` 
                    : "Arizona, United States"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Owner Name</Label>
                    <Input 
                      type="text" 
                      value={formData?.owner_name || ""}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Business Name</Label>
                    <Input 
                      type="text" 
                      value={formData?.business_name || ""}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Name</Label>
                    <Input 
                      type="text" 
                      value={formData?.shop_name || ""}
                      onChange={(e) => handleInputChange('shop_name', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Type</Label>
                    <Input 
                      type="text" 
                      value={formData?.shop_type || ""}
                      onChange={(e) => handleInputChange('shop_type', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Category</Label>
                    <Input 
                      type="text" 
                      value={formData?.shop_category || ""}
                      onChange={(e) => handleInputChange('shop_category', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Contact Number</Label>
                    <Input 
                      type="text" 
                      value={formData?.contact_number || ""}
                      onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Alternate Number</Label>
                    <Input 
                      type="text" 
                      value={formData?.alternate_number || ""}
                      onChange={(e) => handleInputChange('alternate_number', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>GST Number</Label>
                    <Input 
                      type="text" 
                      value={formData?.gst_number || ""}
                      onChange={(e) => handleInputChange('gst_number', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>PAN Number</Label>
                    <Input 
                      type="text" 
                      value={formData?.pan_number || ""}
                      onChange={(e) => handleInputChange('pan_number', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 1</Label>
                    <Input 
                      type="text" 
                      value={formData?.address_line1 || ""}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 2</Label>
                    <Input 
                      type="text" 
                      value={formData?.address_line2 || ""}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>City</Label>
                    <Input 
                      type="text" 
                      value={formData?.city || ""}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>State</Label>
                    <Input 
                      type="text" 
                      value={formData?.state || ""}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Pincode</Label>
                    <Input 
                      type="text" 
                      value={formData?.pincode || ""}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Country</Label>
                    <Input 
                      type="text" 
                      value={formData?.country || ""}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={saving}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}