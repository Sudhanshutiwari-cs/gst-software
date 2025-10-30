"use client";

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

interface ProductFormData {
  sku: string;
  product_name: string;
  price: number;
  barcode: string;
  category_id: number;
  brand: string;
  hsn_sac: string;
  unit: string;
  qty: number;
  reorder_level: number;
  purchase_price: number;
  sales_price: number;
  discount_percent: number;
  tax_percent: number;
  tax_inclusive: boolean;
  product_description: string;
  is_active: boolean;
}

interface Category {
  id: number;
  category_name: string;
}

interface ApiError {
  message?: string;
  success?: boolean;
}

export default function AddProductsPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    product_name: '',
    price: 0,
    barcode: '',
    category_id: 0,
    brand: '',
    hsn_sac: '',
    unit: 'pcs',
    qty: 0,
    reorder_level: 0,
    purchase_price: 0,
    sales_price: 0,
    discount_percent: 0,
    tax_percent: 0,
    tax_inclusive: false,
    product_description: '',
    is_active: true,
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const router = useRouter();
  const { theme } = useTheme();

  const getJwtToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || null;
  };

  const removeToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    const token = getJwtToken();
    if (!token) {
      setTokenValid(false);
      setError('No authentication token found. Please log in.');
      return false;
    }

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        setTokenValid(false);
        return false;
      }

      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          setTokenValid(false);
          setError('Your session has expired. Please log in again.');
          removeToken();
          return false;
        }
      } catch (decodeError) {
        console.warn('Error decoding token:', decodeError);
      }

      setTokenValid(true);
      // Fetch categories after token validation
      await fetchCategories();
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      return false;
    }
  }, []);

  const fetchCategories = async () => {
    const token = getJwtToken();
    if (!token) {
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    try {
      console.log('Fetching categories...');
      
      // Try multiple possible endpoints
      const endpoints = [
        'https://manhemdigitalsolutions.com/pos-admin/api/vendor/categories',
        'https://manhemdigitalsolutions.com/pos-admin/api/categories',
        'https://manhemdigitalsolutions.com/pos-admin/api/vendor/get-categories'
      ];

      let categoriesData = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: 10000,
          });

          console.log('Categories API response:', response.data);

          if (response.data.success) {
            // Handle different possible response structures
            categoriesData = response.data.categories || response.data.data || response.data;
            break;
          }
        } catch (endpointError: unknown) {
          const axiosError = endpointError as AxiosError;
          console.log(`Endpoint ${endpoint} failed:`, axiosError.response?.status, axiosError.message);
          continue;
        }
      }

      if (categoriesData) {
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        console.log('Categories loaded:', categoriesData);
      } else {
        console.warn('No categories found from any endpoint');
        setCategories([]);
      }

    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('Error fetching categories:', axiosError);
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      
      // Set empty categories array but don't show error to user
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Check token validity on component mount
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const handleLogout = (): void => {
    removeToken();
    router.push('/login');
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshResponse = await axios.post(
        'https://manhemdigitalsolutions.com/pos-admin/api/refresh-token',
        {},
        {
          headers: {
            'Authorization': `Bearer ${getJwtToken()}`,
          },
        }
      );

      if (refreshResponse.data.success && refreshResponse.data.token) {
        const newToken = refreshResponse.data.token;
        localStorage.setItem('authToken', newToken);
        setTokenValid(true);
        setError(null);
        return newToken;
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      setError('Session expired. Please log in again.');
      handleLogout();
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? parseFloat(value) || 0
          : value
    }));
  };

  const generateSKU = () => {
    const prefix = formData.brand ? formData.brand.substring(0, 3).toUpperCase() : 'PRO';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sku = `${prefix}-${random}`;
    setFormData(prev => ({ ...prev, sku }));
  };

  const calculateSalesPrice = () => {
    const { purchase_price, discount_percent, tax_percent, tax_inclusive } = formData;
    
    if (purchase_price > 0) {
      let calculatedPrice = purchase_price;
      
      // Apply discount if any
      if (discount_percent > 0) {
        calculatedPrice = purchase_price * (1 - discount_percent / 100);
      }
      
      // Apply tax if not inclusive
      if (!tax_inclusive && tax_percent > 0) {
        calculatedPrice = calculatedPrice * (1 + tax_percent / 100);
      }
      
      setFormData(prev => ({ ...prev, sales_price: parseFloat(calculatedPrice.toFixed(2)) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await checkTokenValidity())) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    const token = getJwtToken();
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    // Validation
    if (!formData.product_name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.sku.trim()) {
      setError('SKU is required');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await axios.post(
        'https://manhemdigitalsolutions.com/pos-admin/api/vendor/add-products',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Product added successfully!' });

        // Reset form
        setFormData({
          sku: '',
          product_name: '',
          price: 0,
          barcode: '',
          category_id: 0,
          brand: '',
          hsn_sac: '',
          unit: 'pcs',
          qty: 0,
          reorder_level: 0,
          purchase_price: 0,
          sales_price: 0,
          discount_percent: 0,
          tax_percent: 0,
          tax_inclusive: false,
          product_description: '',
          is_active: true,
        });

        router.push('/products');
      } else {
        setError(response.data.message || 'Failed to add product');
      }
    } catch (error: unknown) {
      console.error('Error adding product:', error);
      const axiosError = error as AxiosError<ApiError>;
      
      if (axiosError.response?.status === 401) {
        setTokenValid(false);
        const newToken = await refreshToken();
        if (newToken) {
          setError('Session refreshed. Please try again.');
        } else {
          setError('Your session has expired. Please log in again.');
          removeToken();
        }
      } else if (axiosError.code === 'NETWORK_ERROR' || axiosError.code === 'ECONNABORTED') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(axiosError.response?.data?.message || 'An error occurred while adding the product');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const profitCardClass = theme === 'dark'
    ? "mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
    : "mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200";

  const helpTextClass = theme === 'dark'
    ? "text-sm text-gray-400"
    : "text-sm text-gray-600";

  if (!tokenValid) {
    return (
      <div className={containerClass}>
        <div className="w-full max-w-7xl mx-auto">
          <div className={cardClass}>
            <div className={headerClass}>
              <h2 className={titleClass}>Session Expired</h2>
            </div>
            <div className="p-6 text-center">
              <div className={`mb-4 p-3 rounded-md border ${
                theme === 'dark' 
                  ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800/50'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                ⚠️ Your session has expired. Please log in again to continue.
              </div>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-all font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="w-full max-w-7xl mx-auto">
        <div className={cardClass}>
          {/* Header */}
          <div className={`${headerClass} flex justify-between items-center`}>
            <div>
              <h2 className={titleClass}>Add New Product</h2>
              <p className={subtitleClass}>Add a new product to your inventory</p>
            </div>
            <div className="flex items-center space-x-3">
              
              <button
                onClick={() => window.history.back()}
                className={buttonSecondaryClass}
              >
                ← Back to Products
              </button>
              
            </div>
          </div>

          <div className="p-8">
            {/* Messages */}
            {error && (
              <div className={errorClass}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
                {error.includes('expired') && (
                  <button
                    onClick={handleLogout}
                    className={`text-sm font-medium underline hover:opacity-80 ${
                      theme === 'dark' ? 'text-red-300' : 'text-red-600'
                    }`}
                  >
                    Login Again
                  </button>
                )}
              </div>
            )}

            {message && (
              <div className={successClass}>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Product Name */}
                  <div className="lg:col-span-2">
                    <label className={labelClass}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="Enter product name"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className={labelClass}>
                      SKU *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        required
                        className={inputClass}
                        placeholder="Product SKU"
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className={buttonSecondaryClass}
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className={labelClass}>
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Brand name"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className={labelClass}>
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={selectClass}
                      disabled={categoriesLoading}
                    >
                      <option value={0} className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                        {categoriesLoading ? 'Loading categories...' : 'Select category'}
                      </option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id} className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && !categoriesLoading && (
                      <p className={`text-sm mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        No categories available. Product will be uncategorized.
                      </p>
                    )}
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className={labelClass}>
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Barcode number"
                    />
                  </div>

                  {/* HSN/SAC */}
                  <div>
                    <label className={labelClass}>
                      HSN/SAC Code
                    </label>
                    <input
                      type="text"
                      name="hsn_sac"
                      value={formData.hsn_sac}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="HSN or SAC code"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className={labelClass}>
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      className={selectClass}
                    >
                      <option value="pcs" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Pieces</option>
                      <option value="kg" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Kilogram</option>
                      <option value="g" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Gram</option>
                      <option value="l" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Litre</option>
                      <option value="ml" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Millilitre</option>
                      <option value="m" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Meter</option>
                      <option value="cm" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Centimeter</option>
                      <option value="box" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Box</option>
                      <option value="pack" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Pack</option>
                      <option value="set" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Set</option>
                    </select>
                  </div>

                  {/* Product Description */}
                  <div className="lg:col-span-3">
                    <label className={labelClass}>
                      Product Description
                    </label>
                    <textarea
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleInputChange}
                      rows={3}
                      className={inputClass}
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Inventory Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Quantity */}
                  <div>
                    <label className={labelClass}>
                      Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className={labelClass}>
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorder_level"
                      value={formData.reorder_level}
                      onChange={handleInputChange}
                      min="0"
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className={labelClass}>
                      Product Status
                    </label>
                    <select
                      name="is_active"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                      className={selectClass}
                    >
                      <option value="true" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Active</option>
                      <option value="false" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className={sectionBorderClass}>
                <h3 className={`text-xl font-semibold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Pricing Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Purchase Price */}
                  <div>
                    <label className={labelClass}>
                      Purchase Price *
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>₹</span>
                      </div>
                      <input
                        type="number"
                        name="purchase_price"
                        value={formData.purchase_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className={`${inputClass} pl-12`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Base Price */}
                  <div>
                    <label className={labelClass}>
                      Base Price
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>₹</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`${inputClass} pl-12`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className={labelClass}>
                      Discount Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount_percent"
                        value={formData.discount_percent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`${inputClass} pr-12`}
                        placeholder="0.00"
                      />
                      <div className={`absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Percentage */}
                  <div>
                    <label className={labelClass}>
                      Tax Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="tax_percent"
                        value={formData.tax_percent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`${inputClass} pr-12`}
                        placeholder="0.00"
                      />
                      <div className={`absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Inclusive */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="tax_inclusive"
                      checked={formData.tax_inclusive}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_inclusive: e.target.checked }))}
                      className={`h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded ${
                        theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <label className={`ml-3 text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Price includes tax
                    </label>
                  </div>

                  {/* Sales Price */}
                  <div>
                    <label className={labelClass}>
                      Sales Price *
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span>₹</span>
                      </div>
                      <input
                        type="number"
                        name="sales_price"
                        value={formData.sales_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className={`${inputClass} pl-12`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Calculate Price Button */}
                  <div className="lg:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={calculateSalesPrice}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors font-medium"
                    >
                      Calculate Sales Price
                    </button>
                  </div>
                </div>

                {/* Profit Analysis */}
                {formData.purchase_price > 0 && formData.sales_price > 0 && (
                  <div className={profitCardClass}>
                    <h4 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Profit Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Profit Amount
                        </p>
                        <p className={`text-lg font-semibold ${
                          formData.sales_price > formData.purchase_price 
                            ? 'text-green-400' 
                            : formData.sales_price < formData.purchase_price 
                            ? 'text-red-400' 
                            : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          ₹{(formData.sales_price - formData.purchase_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Profit Margin
                        </p>
                        <p className={`text-lg font-semibold ${
                          formData.sales_price > formData.purchase_price 
                            ? 'text-green-400' 
                            : formData.sales_price < formData.purchase_price 
                            ? 'text-red-400' 
                            : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {formData.purchase_price > 0 
                            ? `${(((formData.sales_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Stock Value
                        </p>
                        <p className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          ₹{(formData.qty * formData.purchase_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Potential Revenue
                        </p>
                        <p className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          ₹{(formData.qty * formData.sales_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading || !tokenValid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg min-w-48"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Product...
                    </span>
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className={helpTextClass}>
                All fields marked with * are required. Ensure all information is accurate before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}