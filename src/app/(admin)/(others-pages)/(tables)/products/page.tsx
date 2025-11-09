'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

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
  sales_price: number;
  is_active: boolean;
  quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image_url?: string;
  created_at: string;
  updated_at: string;
  product_image: string;
}

interface VendorProductsResponse {
  success: boolean;
  data: VendorProduct[];
  message?: string;
}

interface DeleteProductResponse {
  success: boolean;
  message: string;
}

interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data?: {
    is_active: boolean;
  };
}

// API service functions
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

// Delete product API function
async function deleteVendorProduct(token: string, productId: number): Promise<DeleteProductResponse> {
  try {
    const response = await fetch(`https://manhemdigitalsolutions.com/pos-admin/api/vendor/delete-products/${productId}`, {
      method: 'DELETE',
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
    console.error('Error deleting vendor product:', error);
    throw error;
  }
}

// Toggle product status API function
async function toggleProductStatus(token: string, productId: number): Promise<ToggleStatusResponse> {
  try {
    const response = await fetch(`https://manhemdigitalsolutions.com/pos-admin/api/vendor/products/${productId}/change-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    toast.success('Product status updated successfully!');

    return await response.json();
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw error;
  }
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  useEffect(() => {
    // Initialize filtered products with all products when products change
    setFilteredProducts(products);
  }, [products]);

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
        setFilteredProducts(response.data);
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

  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      
      // Get JWT token
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      // Prepare data for export
      const exportData = filteredProducts.map(product => ({
        'Product Name': product.product_name,
        'SKU': product.sku,
        'Category': product.category,
        'Price': product.sales_price,
        'Quantity': product.qty,
        'Unit': product.unit,
        'Status': product.is_active ? 'Active' : 'Inactive',
        'Created At': new Date(product.created_at).toLocaleDateString(),
        'Updated At': new Date(product.updated_at).toLocaleDateString()
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Products exported successfully!');
    } catch (err) {
      console.error('Error exporting products:', err);
      toast.error(`Error exporting products: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportFromExcel = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls';
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      try {
        setImportLoading(true);
        
        // Here you would typically:
        // 1. Parse the Excel/CSV file
        // 2. Validate the data
        // 3. Send to your API endpoint
        
        // For now, we'll just show a success message
        toast.success(`File "${file.name}" selected for import. Import functionality would be implemented here.`);
        
        // Example implementation would include:
        // const formData = new FormData();
        // formData.append('file', file);
        // 
        // const token = localStorage.getItem('authToken') || '';
        // const response = await fetch('/api/vendor/import-products', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        //   body: formData,
        // });
        // 
        // if (response.ok) {
        //   toast.success('Products imported successfully!');
        //   fetchVendorProducts(); // Refresh the list
        // } else {
        //   throw new Error('Import failed');
        // }
        
      } catch (err) {
        console.error('Error importing products:', err);
        toast.error(`Error importing products: ${err instanceof Error ? err.message : 'Please try again.'}`);
      } finally {
        setImportLoading(false);
        // Reset file input
        target.value = '';
      }
    };
    
    fileInput.click();
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search term is empty, show all products
      setFilteredProducts(products);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filtered = products.filter(product => 
      product.product_name?.toLowerCase().includes(searchTermLower) ||
      product.sku?.toLowerCase().includes(searchTermLower) ||
      product.category?.toLowerCase().includes(searchTermLower) ||
      product.name?.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredProducts(filtered);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredProducts(products);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddProduct = () => {
    // Redirect to add product page
    router.push('/products/add-products');
  };

  const handleEdit = (productId: number) => {
    // Implement edit functionality
    console.log('Edit product:', productId);
    // You can redirect to edit page or open a modal
    router.push(`/products/edit-product/${productId}`);
  };

  const handleDelete = async (productId: number) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this product? This action cannot be undone.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleteLoading(productId);
      
      // Get JWT token
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      // Call the delete API
      const response = await deleteVendorProduct(token, productId);
      
      if (response.success) {
        // Remove product from state on successful deletion
        setProducts(products.filter(product => product.id !== productId));
        
        // Optional: Show success message
        alert('Product deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(`Error deleting product: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleStatus = async (productId: number) => {
    try {
      setToggleLoading(productId);
      
      // Get JWT token
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      // Call the toggle status API
      const response = await toggleProductStatus(token, productId);
      
      if (response.success) {
        // Update product status in state
        setProducts(products.map(product => 
          product.id === productId 
            ? { ...product, is_active: !product.is_active }
            : product
        ));
        
        // Show success message
        const newStatus = !products.find(p => p.id === productId)?.is_active ? 'active' : 'inactive';
        
        alert(`Product status updated to ${newStatus} successfully!`);
      } else {
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert(`Error updating product status: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setToggleLoading(null);
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
      currency: 'INR',
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
          <div className="flex space-x-3">
            {/* Import/Export Buttons */}
            <button
              onClick={handleImportFromExcel}
              disabled={importLoading}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Import Excel
                </>
              )}
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || filteredProducts.length === 0}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Excel
                </>
              )}
            </button>
            {/* Add Product Button */}
            <button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
            {/* Refresh Button */}
            <button
              onClick={fetchVendorProducts}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Search Results Info */}
          {isSearching && searchTerm && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {filteredProducts.length === 0 ? (
                <span>
                  No products found matching &ldquo;<span className="font-semibold text-gray-900 dark:text-white">{searchTerm}</span>&rdquo;
                </span>
              ) : (
                <span>
                  Found <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''} matching &ldquo;<span className="font-semibold text-gray-900 dark:text-white">{searchTerm}</span>&rdquo;
                </span>
              )}
            </div>
          )}
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
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400 mb-2">
                        {searchTerm ? 'No products found matching your search' : 'No products found'}
                      </div>
                      {searchTerm ? (
                        <button
                          onClick={handleClearSearch}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition-colors"
                        >
                          Clear search and show all products
                        </button>
                      ) : (
                        <button
                          onClick={fetchVendorProducts}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition-colors"
                        >
                          Refresh products
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Product Image and Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.product_image ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                src={product.product_image}
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
                          {formatPrice(product.sales_price)}
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

                      {/* Status with Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(product.is_active ? 'active' : 'inactive')}
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            disabled={toggleLoading === product.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              product.is_active
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                            } ${toggleLoading === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.is_active ? 'translate-x-6' : 'translate-x-1'
                              } ${toggleLoading === product.id ? 'animate-pulse' : ''}`}
                            />
                            {toggleLoading === product.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              </div>
                            )}
                          </button>
                        </div>
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
                            disabled={deleteLoading === product.id}
                            className={`flex items-center justify-center min-w-[80px] ${
                              deleteLoading === product.id
                                ? 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                            } px-3 py-2 rounded-md text-sm font-medium transition-colors border border-red-200 dark:border-red-800`}
                          >
                            {deleteLoading === product.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
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
        {filteredProducts.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm && (
                <span> (filtered from {products.length} total)</span>
              )}
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