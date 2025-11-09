'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Edit, Trash2, Plus, Download, RefreshCw, Filter } from 'lucide-react';
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
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

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

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

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
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls';
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      try {
        setImportLoading(true);
        toast.success(`File "${file.name}" selected for import. Import functionality would be implemented here.`);
        
      } catch (err) {
        console.error('Error importing products:', err);
        toast.error(`Error importing products: ${err instanceof Error ? err.message : 'Please try again.'}`);
      } finally {
        setImportLoading(false);
        target.value = '';
      }
    };
    
    fileInput.click();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

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
  };

  const handleAddProduct = () => {
    router.push('/products/add-products');
  };

  const handleEdit = (productId: number) => {
    router.push(`/products/edit-product/${productId}`);
  };

  const handleDelete = async (productId: number) => {
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this product? This action cannot be undone.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleteLoading(productId);
      
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      const response = await deleteVendorProduct(token, productId);
      
      if (response.success) {
        setProducts(products.filter(product => product.id !== productId));
        toast.success('Product deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(`Error deleting product: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleStatus = async (productId: number) => {
    try {
      setToggleLoading(productId);
      
      const token = localStorage.getItem('authToken') || 
                    sessionStorage.getItem('authToken') || 
                    '';
      
      if (!token) {
        throw new Error('No JWT token found. Please log in again.');
      }

      const response = await toggleProductStatus(token, productId);
      
      if (response.success) {
        setProducts(products.map(product => 
          product.id === productId 
            ? { ...product, is_active: !product.is_active }
            : product
        ));
      } else {
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      toast.error(`Error updating product status: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setToggleLoading(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const stats = [
    { label: "Total Products", value: products.length.toString() },
    { label: "Active Products", value: products.filter(p => p.is_active).length.toString() },
    { label: "Out of Stock", value: products.filter(p => p.qty === 0).length.toString() },
    { label: "Low Stock", value: products.filter(p => p.qty > 0 && p.qty < 10).length.toString() }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Products Dashboard</h1>
            <p className="text-gray-600 mt-1">View and manage all your product inventory in one place.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {/* Export Button */}
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || products.length === 0}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              {exportLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Excel
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>

            {/* Import Button */}
            <button
              onClick={handleImportFromExcel}
              disabled={importLoading}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              {importLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Import Excel
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>

            {/* Add Product Button */}
            <button
              onClick={handleAddProduct}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <Plus className="w-4 h-4" />
              Add New Product
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">
              Error loading data: {error}. Showing {products.length} product(s).
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,128,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,128,0.25)] transition-all duration-200 p-3 border border-gray-100 hover:border-gray-200"
            >
              <div className="text-xl font-medium text-gray-900">{stat.value}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search and Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Vendor Products</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </form>
              
              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {/* Filter Button */}
                <button className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-700 flex items-center gap-2 text-sm font-medium">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchVendorProducts}
                  className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-700 flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Table with Light Outline */}
          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg font-medium text-gray-400">No products found</div>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl m-4 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600 uppercase tracking-wider text-xs">
                      <th className="py-4 px-4">Product</th>
                      <th className="py-4 px-4">SKU</th>
                      <th className="py-4 px-4">Price</th>
                      <th className="py-4 px-4">Quantity</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`group transition-colors duration-150 ${
                          index === filteredProducts.length - 1 
                            ? '' 
                            : 'border-b border-gray-100'
                        } hover:bg-indigo-50/50`}
                      >
                        {/* Product Name and Image */}
                        <td className="py-4 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.product_image ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                  src={product.product_image}
                                  alt={product.product_name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjRGNUY3Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMTggMjUuMzEzNyAyMC42ODYzIDI4IDI0IDI4QzI3LjMxMzcgMjggMzAgMjUuMzEzNyAzMCAyMkMzMCAxOC42ODYzIDI3LjMxMzcgMTYgMjQgMTZaIiBmaWxsPSIjOEU5MEEwIi8+CjxwYXRoIGQ9Ik0zMyAyNkMzNCAyNi44OTU0IDM0IDI4LjEwNDYgMzMgMjlDMzEuODk1NCAzMCAzMC4xMDQ2IDMwIDI5IDMwQzI3Ljg5NTQgMzAgMjYuMTA0NiAzMCAyNSAyOUMyNCAyOC4xMDQ2IDI0IDI2Ljg5NTQgMjUgMjZDMjUuODk1NCAyNSAyNy43MDQ2IDI1IDI5IDI1QzMwLjI5NTQgMjUgMzIuMTA0NiAyNSAzMyAyNloiIGZpbGw9IiM4RTkwQTAiLz4KPC9zdmc+';
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">{product.product_name}</span>
                              <div className="text-xs text-gray-500 mt-0.5">{product.unit}</div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-4 px-4 font-mono text-sm text-gray-600">
                          {product.sku}
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {formatPrice(product.sales_price)}
                        </td>

                        {/* Quantity */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.qty === 0 
                              ? 'bg-red-100 text-red-800' 
                              : product.qty < 10 
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.qty} {product.unit}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category || `Category ${product.category_id}`}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(product.is_active)}
                            <button
                              onClick={() => handleToggleStatus(product.id)}
                              disabled={toggleLoading === product.id}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                product.is_active
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-gray-300 hover:bg-gray-400'
                              } ${toggleLoading === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  product.is_active ? 'translate-x-5' : 'translate-x-1'
                                } ${toggleLoading === product.id ? 'animate-pulse' : ''}`}
                              />
                              {toggleLoading === product.id && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <RefreshCw className="w-3 h-3 text-white animate-spin" />
                                </div>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(product.id)}
                              className="group relative p-2.5 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-500 shadow-sm hover:shadow-md"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteLoading === product.id}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${
                                deleteLoading === product.id 
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                                  : 'text-red-600 hover:bg-red-500 hover:text-white border-red-200 hover:border-red-500'
                              }`}
                              title="Delete product"
                            >
                              {deleteLoading === product.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}