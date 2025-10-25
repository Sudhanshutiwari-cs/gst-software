"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface ProductFormData {
  product_name: string;
  unit: string;
  qty: number;
  purchase_price: number;
  sales_price: number;
}

export default function AddProductsPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    unit: '',
    qty: 0,
    purchase_price: 0,
    sales_price: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean>(true);
  const router = useRouter();

  // Check token validity on component mount
  useEffect(() => {
    checkTokenValidity();
  }, []);

  const getJwtToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || null;
  };

  const removeToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  const checkTokenValidity = async (): Promise<boolean> => {
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
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'product_name' || name === 'unit' 
        ? value 
        : parseFloat(value) || 0
    }));
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
        setFormData({
          product_name: '',
          unit: '',
          qty: 0,
          purchase_price: 0,
          sales_price: 0,
        });
      } else {
        setError(response.data.message || 'Failed to add product');
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      
      if (error.response?.status === 401) {
        setTokenValid(false);
        const newToken = await refreshToken();
        if (newToken) {
          setError('Session refreshed. Please try again.');
        } else {
          setError('Your session has expired. Please log in again.');
          removeToken();
        }
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.response?.data?.message || 'An error occurred while adding the product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="bg-white px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Session Expired</h2>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Full Width Container */}
      <div className="w-full">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          {/* Header - Full Width */}
          <div className="bg-white px-8 py-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
              <p className="text-gray-600 mt-1">Add a new product to your inventory</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors font-medium"
              >
                ← Back to Products
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
                {error.includes('expired') && (
                  <button
                    onClick={handleLogout}
                    className="text-red-700 underline text-sm font-medium"
                  >
                    Login Again
                  </button>
                )}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Product Information Section - Full Width Grid */}
              <div className="border-b pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Product Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Product Name - Full Width */}
                  <div className="lg:col-span-2 xl:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-lg"
                      placeholder="Enter product name"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select unit</option>
                      <option value="Box">Box</option>
                      <option value="Piece">Piece</option>
                      <option value="Pack">Pack</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Unit">Unit</option>
                      <option value="Kg">Kilogram</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="ML">Milliliter</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="qty"
                      value={formData.qty}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="0"
                    />
                  </div>

                  {/* Empty columns for spacing */}
                  <div className="hidden xl:block"></div>
                  <div className="hidden xl:block"></div>
                </div>
              </div>

              {/* Pricing Section - Full Width Grid */}
              <div className="border-b pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Pricing Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        name="purchase_price"
                        value={formData.purchase_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Sales Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg">₹</span>
                      </div>
                      <input
                        type="number"
                        name="sales_price"
                        value={formData.sales_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Profit Margin Display */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-lg p-4 h-full">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Profit Analysis</h4>
                      {formData.purchase_price > 0 && formData.sales_price > 0 ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Profit:</span>
                            <span className={`ml-2 font-semibold text-lg ${
                              formData.sales_price > formData.purchase_price 
                                ? 'text-green-600' 
                                : formData.sales_price < formData.purchase_price 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                            }`}>
                              ₹{(formData.sales_price - formData.purchase_price).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Margin:</span>
                            <span className={`ml-2 font-semibold text-lg ${
                              formData.sales_price > formData.purchase_price 
                                ? 'text-green-600' 
                                : formData.sales_price < formData.purchase_price 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                            }`}>
                              {formData.purchase_price > 0 
                                ? `${(((formData.sales_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Enter prices to see profit analysis</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Summary - Full Width */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Product Name</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      {formData.product_name || 'Not specified'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Unit & Quantity</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      {formData.qty} {formData.unit || 'units'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Stock Value</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      ₹{(formData.qty * formData.purchase_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Potential Revenue</p>
                    <p className="font-semibold text-gray-900 text-lg mt-1">
                      ₹{(formData.qty * formData.sales_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button - Centered */}
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
              <p className="text-sm text-gray-500">
                All fields marked with * are required. Ensure all information is accurate before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}