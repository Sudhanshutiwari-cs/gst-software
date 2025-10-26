"use client";

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter, useParams } from 'next/navigation';

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

interface Product extends ProductFormData {
  id: number;
}

export default function EditProductPage() {
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
  const [productLoading, setProductLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

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

  const fetchProduct = async () => {
    if (!productId) {
      setError('Product ID is missing');
      setProductLoading(false);
      return;
    }

    const token = getJwtToken();
    if (!token) {
      setError('Authentication required');
      setProductLoading(false);
      return;
    }

    setProductLoading(true);
    try {
      // First try to get the specific product
      const productResponse = await axios.get(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (productResponse.data.success && productResponse.data.product) {
        const product = productResponse.data.product;
        setFormData({
          sku: product.sku || '',
          product_name: product.product_name || '',
          price: product.price || 0,
          barcode: product.barcode || '',
          category_id: product.category_id || 0,
          brand: product.brand || '',
          hsn_sac: product.hsn_sac || '',
          unit: product.unit || 'pcs',
          qty: product.qty || 0,
          reorder_level: product.reorder_level || 0,
          purchase_price: product.purchase_price || 0,
          sales_price: product.sales_price || 0,
          discount_percent: product.discount_percent || 0,
          tax_percent: product.tax_percent || 0,
          tax_inclusive: product.tax_inclusive || false,
          product_description: product.product_description || '',
          is_active: product.is_active !== undefined ? product.is_active : true,
        });
      } else {
        // If specific product endpoint fails, try to get from products list
        const productsResponse = await axios.get(
          'https://manhemdigitalsolutions.com/pos-admin/api/vendor/products',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: 10000,
          }
        );

        if (productsResponse.data.success && productsResponse.data.products) {
          const products = productsResponse.data.products;
          const product = products.find((p: Product) => p.id === parseInt(productId));
          
          if (product) {
            setFormData({
              sku: product.sku || '',
              product_name: product.product_name || '',
              price: product.price || 0,
              barcode: product.barcode || '',
              category_id: product.category_id || 0,
              brand: product.brand || '',
              hsn_sac: product.hsn_sac || '',
              unit: product.unit || 'pcs',
              qty: product.qty || 0,
              reorder_level: product.reorder_level || 0,
              purchase_price: product.purchase_price || 0,
              sales_price: product.sales_price || 0,
              discount_percent: product.discount_percent || 0,
              tax_percent: product.tax_percent || 0,
              tax_inclusive: product.tax_inclusive || false,
              product_description: product.product_description || '',
              is_active: product.is_active !== undefined ? product.is_active : true,
            });
          } else {
            setError('Product not found');
          }
        } else {
          setError('Failed to fetch product data');
        }
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      console.error('Error fetching product:', axiosError);
      
      if (axiosError.response?.status === 404) {
        setError('Product not found');
      } else if (axiosError.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load product data');
      }
    } finally {
      setProductLoading(false);
    }
  };

  // Check token validity and load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      const tokenValid = await checkTokenValidity();
      if (tokenValid) {
        await Promise.all([fetchCategories(), fetchProduct()]);
      }
    };
    
    initializeData();
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
      const response = await axios.put(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/update-products/${productId}`,
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
        setMessage({ type: 'success', text: 'Product updated successfully!' });
        // Redirect to products list after 2 seconds
        setTimeout(() => {
          router.push('/products'); // Adjust the route as needed
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to update product');
      }
    } catch (error: unknown) {
      console.error('Error updating product:', error);
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
      } else if (axiosError.response?.status === 404) {
        setError('Product not found. It may have been deleted.');
      } else {
        setError(axiosError.response?.data?.message || 'An error occurred while updating the product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-gray-800 shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Session Expired</h2>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 p-3 bg-yellow-900/30 text-yellow-200 rounded-md">
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

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-gray-800 shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-8 py-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Edit Product</h2>
            </div>
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-lg text-gray-300">Loading product data...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-gray-800 shadow-sm rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-8 py-6 border-b border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Product</h2>
              <p className="text-gray-400 mt-1">Update product information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors font-medium"
              >
                ← Back to Products
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg text-sm transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
                {error.includes('expired') && (
                  <button
                    onClick={handleLogout}
                    className="text-red-300 underline text-sm font-medium"
                  >
                    Login Again
                  </button>
                )}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-800 text-green-200 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="border-b border-gray-700 pb-8">
                <h3 className="text-xl font-semibold text-white mb-6">Basic Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Product Name */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Enter product name"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SKU *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        required
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="Product SKU"
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg text-sm transition-colors font-medium"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Brand name"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      disabled={categoriesLoading}
                    >
                      <option value={0} className="bg-gray-700">
                        {categoriesLoading ? 'Loading categories...' : 'Select category'}
                      </option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id} className="bg-gray-700">
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && !categoriesLoading && (
                      <p className="text-sm text-gray-400 mt-1">
                        No categories available. Product will be uncategorized.
                      </p>
                    )}
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Barcode number"
                    />
                  </div>

                  {/* HSN/SAC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      HSN/SAC Code
                    </label>
                    <input
                      type="text"
                      name="hsn_sac"
                      value={formData.hsn_sac}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="HSN or SAC code"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    >
                      <option value="pcs" className="bg-gray-700">Pieces</option>
                      <option value="kg" className="bg-gray-700">Kilogram</option>
                      <option value="g" className="bg-gray-700">Gram</option>
                      <option value="l" className="bg-gray-700">Litre</option>
                      <option value="ml" className="bg-gray-700">Millilitre</option>
                      <option value="m" className="bg-gray-700">Meter</option>
                      <option value="cm" className="bg-gray-700">Centimeter</option>
                      <option value="box" className="bg-gray-700">Box</option>
                      <option value="pack" className="bg-gray-700">Pack</option>
                      <option value="set" className="bg-gray-700">Set</option>
                    </select>
                  </div>

                  {/* Product Description */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Description
                    </label>
                    <textarea
                      name="product_description"
                      value={formData.product_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Information Section */}
              <div className="border-b border-gray-700 pb-8">
                <h3 className="text-xl font-semibold text-white mb-6">Inventory Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="0"
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorder_level"
                      value={formData.reorder_level}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="0"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Status
                    </label>
                    <select
                      name="is_active"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    >
                      <option value="true" className="bg-gray-700">Active</option>
                      <option value="false" className="bg-gray-700">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className="border-b border-gray-700 pb-8">
                <h3 className="text-xl font-semibold text-white mb-6">Pricing Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Purchase Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">₹</span>
                      </div>
                      <input
                        type="number"
                        name="purchase_price"
                        value={formData.purchase_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Base Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Base Price
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">₹</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">%</span>
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
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700 rounded"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-300">
                      Price includes tax
                    </label>
                  </div>

                  {/* Sales Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sales Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400">₹</span>
                      </div>
                      <input
                        type="number"
                        name="sales_price"
                        value={formData.sales_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
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
                  <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4">Profit Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Profit Amount</p>
                        <p className={`text-lg font-semibold ${
                          formData.sales_price > formData.purchase_price 
                            ? 'text-green-400' 
                            : formData.sales_price < formData.purchase_price 
                            ? 'text-red-400' 
                            : 'text-gray-300'
                        }`}>
                          ₹{(formData.sales_price - formData.purchase_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Profit Margin</p>
                        <p className={`text-lg font-semibold ${
                          formData.sales_price > formData.purchase_price 
                            ? 'text-green-400' 
                            : formData.sales_price < formData.purchase_price 
                            ? 'text-red-400' 
                            : 'text-gray-300'
                        }`}>
                          {formData.purchase_price > 0 
                            ? `${(((formData.sales_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Stock Value</p>
                        <p className="text-lg font-semibold text-white">
                          ₹{(formData.qty * formData.purchase_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Potential Revenue</p>
                        <p className="text-lg font-semibold text-white">
                          ₹{(formData.qty * formData.sales_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4 space-x-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all font-semibold text-lg min-w-32"
                >
                  Cancel
                </button>
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
                      Updating...
                    </span>
                  ) : (
                    'Update Product'
                  )}
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                All fields marked with * are required. Ensure all information is accurate before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}