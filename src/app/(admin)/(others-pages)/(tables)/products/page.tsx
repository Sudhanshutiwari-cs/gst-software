// app/vendor/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define types
interface VendorProduct {
  id: number;
  name: string;
  unit: string;
  qty: number;
  category_id: number;
  product_name: string;
  category: string;
  sku: string;
  is_active: boolean;
  price: number;
  quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface VendorProductsResponse {
  success: boolean;
  data: VendorProduct[];
  message?: string;
}

// API service function
async function getVendorProducts(token: string): Promise<VendorProductsResponse> {
  try {
    const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    throw error;
  }
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get JWT token from localStorage or your preferred storage
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      const response = await getVendorProducts(token);
      
      if (response.success) {
        setProducts(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId: number) => {
    // Implement edit functionality
    console.log('Edit product:', productId);
    // You can redirect to edit page or open a modal
    router.push(`/products/edit-product/${productId}`);
  };

  const handleDelete = async (productId: number) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        // Implement actual delete API call here
        console.log('Delete product:', productId);
        
        // Example delete implementation:
        // const token = localStorage.getItem('jwtToken') || '';
        // const response = await fetch(`https://manhemdigitalsolutions.com/pos-admin/api/vendor/products/${productId}`, {
        //   method: 'DELETE',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        
        // if (response.ok) {
        //   // Remove product from state
        //   setProducts(products.filter(product => product.id !== productId));
        // }
        
        // For now, just remove from local state
        setProducts(products.filter(product => product.id !== productId));
        
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: {
        light: 'bg-green-100 text-green-800 border border-green-200',
        dark: 'bg-green-900/30 text-green-300 border-green-700'
      },
      inactive: {
        light: 'bg-gray-100 text-gray-800 border border-gray-200',
        dark: 'bg-gray-700 text-gray-300 border-gray-600'
      },
      out_of_stock: {
        light: 'bg-red-100 text-red-800 border border-red-200',
        dark: 'bg-red-900/30 text-red-300 border-red-700'
      },
    };

    const statusLabels = {
      active: 'Active',
      inactive: 'Inactive',
      out_of_stock: 'Out of Stock',
    };

    const statusKey = status as keyof typeof statusClasses;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
        ${statusClasses[statusKey]?.light} 
        dark:${statusClasses[statusKey]?.dark}`}>
        {statusLabels[statusKey] || status}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Products</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={fetchVendorProducts}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendor Products</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your product inventory</p>
          </div>
          <button
            onClick={fetchVendorProducts}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    QTY
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">No products found</div>
                      <button
                        onClick={fetchVendorProducts}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition-colors"
                      >
                        Refresh products
                      </button>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Product Image and Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.image_url ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                src={product.image_url}
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjRGNUY3IiBjbGFzcz0iZGFyazpmbGwtZ3JheS03MDAiLz4KPHBhdGggZD0iTTI0IDE2QzIwLjY4NjMgMTYgMTggMTguNjg2MyAxOCAyMkMxOCAyNS4zMTM3IDIwLjY4NjMgMjggMjQgMjhDMjcuMzEzNyAyOCAzMCAyNS4zMTM3IDMwIDIyQzMwIDE4LjY4NjMgMjcuMzEzNyAxNiAyNCAxNloiIGZpbGw9IiM4RTkwQTAiIGNsYXNzPSJkYXJrOmZpbGwtZ3JheS01MDAiLz4KPHBhdGggZD0iTTMzIDI2QzM0IDI2Ljg5NTQgMzQgMjguMTA0NiAzMyAyOUMzMS44OTU0IDMwIDMwLjEwNDYgMzAgMjkgMzBDMjcuODk1NCAzMCAyNi4xMDQ2IDMwIDI1IDI5QzI0IDI4LjEwNDYgMjQgMjYuODk1NCAyNSAyNkMyNS44OTU0IDI1IDI3LjcwNDYgMjUgMjkgMjVDMzAuMjk1NCAyNSAzMi4xMDQ2IDI1IDMzIDI2WiIgZmlsbD0iIzhFOTBBMCIgY2xhc3M9ImRhcms6ZmlsbC1ncmF5LTUwMCIvPgo8L3N2Zz4=';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.product_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Category :{product.category_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 inline-block transition-colors">
                          {product.sku}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(product.price)}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium transition-colors ${
                          product.qty === 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : product.qty < 10 
                            ? 'text-orange-600 dark:text-orange-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {product.qty} {product.unit} 
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.is_active ? 'active' : 'inactive')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-red-200 dark:border-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {products.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{products.length}</span> product{products.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}