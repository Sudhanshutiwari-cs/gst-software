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
  email: string;
  shop_registration_number: string;
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
  fssai_license_number?: string;
  drug_license_number?: string;
  country?: string;
  msme_number?: string;
}

interface Category {
  id: number;
  name: string;
}

interface State {
  id: number;
  name: string;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Get JWT token from localStorage (adjust based on your auth setup)
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('jwtToken');
    }
    return null;
  };

  // Fetch categories and states
  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      console.log('Fetching categories and states...');

      // Fetch categories
      const categoriesResponse = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/helper/categories');
      console.log('Categories response status:', categoriesResponse.status);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        console.log('Categories API response:', categoriesData);

        // Handle different response structures
        let categoriesArray: Category[] = [];

        if (categoriesData.data && Array.isArray(categoriesData.data)) {
          categoriesArray = categoriesData.data;
        } else if (Array.isArray(categoriesData)) {
          categoriesArray = categoriesData;
        } else if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
          categoriesArray = categoriesData.categories;
        } else {
          console.error('Unexpected categories response structure:', categoriesData);
        }

        console.log('Processed categories:', categoriesArray);
        setCategories(categoriesArray);
      } else {
        console.error('Categories API failed:', categoriesResponse.status);
      }

      // Fetch states
      const statesResponse = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/helper/states');
      console.log('States response status:', statesResponse.status);

      if (statesResponse.ok) {
        const statesData = await statesResponse.json();
        console.log('States API response:', statesData);

        // Handle different response structures
        let statesArray: State[] = [];

        if (statesData.data && Array.isArray(statesData.data)) {
          statesArray = statesData.data;
        } else if (Array.isArray(statesData)) {
          statesArray = statesData;
        } else if (statesData.states && Array.isArray(statesData.states)) {
          statesArray = statesData.states;
        } else {
          console.error('Unexpected states response structure:', statesData);
        }

        console.log('Processed states:', statesArray);
        setStates(statesArray);
      } else {
        console.error('States API failed:', statesResponse.status);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    } finally {
      setLoadingOptions(false);
    }
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
        method: 'PUT',
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

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData) {
        console.error('No form data available');
        return;
      }

      const success = await updateProfile(formData);

      if (success) {
        console.log("Profile saved successfully");
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

  const handleSelectChange = (field: keyof VendorProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    fetchProfile();
    fetchOptions();
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
                src="https://res.cloudinary.com/doficc2yl/image/upload/v1760900581/Gemini_Generated_Image_y5sovhy5sovhy5so_pssgla.png"
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData?.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Name</Label>
                    <Input
                      type="text"
                      value={formData?.shop_name || "NA"}
                      onChange={(e) => handleInputChange('shop_name', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Type</Label>
                    <div className="relative">
                      <select
                        value={formData?.shop_type || ""}
                        onChange={(e) => handleSelectChange('shop_type', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-theme dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none bg-white dark:bg-gray-800"
                      >
                        <option value="">Select Shop Type</option>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Service">Service</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Category</Label>
                    <div className="relative">
                      <select
                        value={formData?.shop_category || ""}
                        onChange={(e) => handleSelectChange('shop_category', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-theme dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none bg-white dark:bg-gray-800"
                        disabled={loadingOptions}
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name || category.category_name}>
                            {category.name || category.category_name}
                          </option>
                        ))}

                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {loadingOptions && (
                      <p className="mt-1 text-xs text-gray-500">Loading categories...</p>
                    )}
                    {!loadingOptions && categories.length === 0 && (
                      <p className="mt-1 text-xs text-red-500">No categories available</p>
                    )}
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

                  <div className="col-span-2 lg:col-span-1">
                    {formData?.shop_category?.toLowerCase() === "medical" ? (
                      <>
                        <Label>Drug License Number</Label>
                        <Input
                          type="text"
                          value={formData?.drug_license_number || ""}
                          onChange={(e) =>
                            handleInputChange("drug_license_number", e.target.value)
                          }
                        />
                      </>
                    ) : (
                      <>
                        <Label>FSSAI License Number</Label>
                        <Input
                          type="text"
                          value={formData?.fssai_license_number || ""}
                          onChange={(e) =>
                            handleInputChange("fssai_license_number", e.target.value)
                          }
                        />
                      </>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Shop Registration Number</Label>
                    <Input
                      type="text"
                      value={formData?.shop_registration_number || ""}
                      onChange={(e) => handleInputChange('shop_registration_number', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>MSME Number</Label>
                    <Input
                      type="text"
                      value={formData?.msme_number || ""}
                      onChange={(e) => handleInputChange('msme_number', e.target.value)}
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
                    <div className="relative">
                      <select
                        value={formData?.state || ""}
                        onChange={(e) => handleSelectChange('state', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-theme dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none bg-white dark:bg-gray-800"
                        disabled={loadingOptions}
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {loadingOptions && (
                      <p className="mt-1 text-xs text-gray-500">Loading states...</p>
                    )}
                    {!loadingOptions && states.length === 0 && (
                      <p className="mt-1 text-xs text-red-500">No states available</p>
                    )}
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
                      value={formData?.country || "India"}
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