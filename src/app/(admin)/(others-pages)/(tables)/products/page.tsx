'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Edit, Trash2, Plus, Download, RefreshCw, Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';

// Define types
interface VendorProduct {
  id: number;
  name: string;
  unit: string;
  qty: number;
  category_id: number;
  category_name?: string;
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

// Theme types
type Theme = 'light' | 'dark';

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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'price' | 'quantity' | 'status' | ''>('');
  const router = useRouter();

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [quantityRange, setQuantityRange] = useState<[number, number]>([0, 1000]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: 'sales_price' | 'qty' | 'product_name' | 'category' | '';
    direction: 'asc' | 'desc';
  }>({ key: '', direction: 'asc' });

  // Theme state
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme and set up listeners
  useEffect(() => {
    const getInitialTheme = (): Theme => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          return savedTheme;
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'light';
    };

    const applyTheme = (newTheme: Theme) => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = (e.newValue as Theme) || 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
      observer.disconnect();
    };
  }, []);

  // Effect to update theme when state changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  // Calculate min and max values for filters
  const priceMinMax = products.length > 0 ? [
    Math.min(...products.map(p => p.sales_price)),
    Math.max(...products.map(p => p.sales_price))
  ] : [0, 10000];

  const quantityMinMax = products.length > 0 ? [
    Math.min(...products.map(p => p.qty)),
    Math.max(...products.map(p => p.qty))
  ] : [0, 1000];

  // Update ranges when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      setPriceRange([priceMinMax[0], priceMinMax[1]]);
      setQuantityRange([quantityMinMax[0], quantityMinMax[1]]);
    }
  }, [products]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.product_name?.toLowerCase().includes(searchTermLower) ||
        product.sku?.toLowerCase().includes(searchTermLower) ||
        product.category?.toLowerCase().includes(searchTermLower) ||
        product.name?.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.sales_price >= priceRange[0] && product.sales_price <= priceRange[1]
    );

    // Apply quantity range filter
    filtered = filtered.filter(product => 
      product.qty >= quantityRange[0] && product.qty <= quantityRange[1]
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => 
        statusFilter === 'active' ? product.is_active : !product.is_active
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'sales_price') {
          return sortConfig.direction === 'asc' ? a.sales_price - b.sales_price : b.sales_price - a.sales_price;
        } else if (sortConfig.key === 'qty') {
          return sortConfig.direction === 'asc' ? a.qty - b.qty : b.qty - a.qty;
        } else if (sortConfig.key === 'product_name') {
          return sortConfig.direction === 'asc' 
            ? a.product_name.localeCompare(b.product_name)
            : b.product_name.localeCompare(a.product_name);
        } else if (sortConfig.key === 'category') {
          return sortConfig.direction === 'asc'
            ? (a.category || '').localeCompare(b.category || '')
            : (b.category || '').localeCompare(a.category || '');
        }
        return 0;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange, quantityRange, statusFilter, sortConfig]);

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
    // Search is now handled in the useEffect above
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
        toast.success('Product status updated successfully!');
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

  const handleSort = (key: 'sales_price' | 'qty' | 'product_name' | 'category') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setActiveFilter(''); // Close filter dropdown when sorting
  };

  const handleFilterClick = (filterType: 'price' | 'quantity' | 'status') => {
    setActiveFilter(activeFilter === filterType ? '' : filterType);
  };

  const resetFilters = () => {
    setPriceRange([priceMinMax[0], priceMinMax[1]]);
    setQuantityRange([quantityMinMax[0], quantityMinMax[1]]);
    setStatusFilter('all');
    setSortConfig({ key: '', direction: 'asc' });
    setSearchTerm('');
    setActiveFilter('');
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        }`}>
        Active
      </span>
    ) : (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
        }`}>
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
      <div className={`min-h-screen p-8 flex items-center justify-center transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'
        }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'
      }`}>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              Products Dashboard
            </h1>
            <p className={`mt-1 text-sm md:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              View and manage all your product inventory in one place.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2 md:gap-3">
            {/* Export Button */}
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || products.length === 0}
              className={`relative px-3 md:px-4 py-1 h-8 rounded-md transition-all duration-200 
       text-[12px] md:text-[14px] font-medium flex items-center gap-1 md:gap-2 
       shadow-lg hover:shadow-xl 
       disabled:opacity-50 disabled:cursor-not-allowed 
       disabled:transform-none disabled:shadow-lg overflow-hidden ${theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                }`}></div>
              {exportLoading ? (
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Download className="w-3 h-3 md:w-4 md:h-4" />
              )}
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>

            {/* Import Button */}
            <button
              onClick={handleImportFromExcel}
              disabled={importLoading}
              className={`relative px-3 md:px-4 py-1 h-8 rounded-md transition-all duration-200 
       text-[12px] md:text-[14px] font-medium flex items-center gap-1 md:gap-2 
       shadow-lg hover:shadow-xl 
       disabled:opacity-50 disabled:cursor-not-allowed 
       disabled:transform-none disabled:shadow-lg overflow-hidden ${theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                }`}></div>
              {importLoading ? (
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Download className="w-3 h-3 md:w-4 md:h-4" />
              )}
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>

            {/* Add Product Button */}
            <button
              onClick={handleAddProduct}
              className={`relative px-3 md:px-4 py-1 h-8 rounded-md transition-all duration-200 
       text-[12px] md:text-[14px] font-medium flex items-center gap-1 md:gap-2 
       shadow-lg hover:shadow-xl 
       disabled:opacity-50 disabled:cursor-not-allowed 
       disabled:transform-none disabled:shadow-lg overflow-hidden ${theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                }`}></div>
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>
          </div>
        </div>

        {error && (
          <div className={`p-3 md:p-4 rounded-xl border ${theme === 'dark' ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            <p className="text-sm">
              Error loading data: {error}. Showing {products.length} product(s).
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`rounded-lg transition-all duration-200 p-3 border ${theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-gray-100 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,128,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,128,0.25)]'
                }`}
            >
              <div className={`text-lg md:text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                {stat.value}
              </div>
              <div className={`text-[10px] md:text-[11px] mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions Section */}
        <div className={`rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              Vendor Products
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white'
                    }`}
                />
              </form>

              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {/* Filter Button */}
                <button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                    }`}>
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchVendorProducts}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Reset Filters Button */}
                <button
                  onClick={resetFilters}
                  className={`px-3 md:px-4 py-2 md:py-3 border rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden">
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                <div className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                  No products found
                </div>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.product_image ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                              src={product.product_image}
                              alt={product.product_name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjRGNUY3Ii8+CjxwYXRoIGQ9Ik0yNCAxNkMyMC42ODYzIDE2IDE4IDE4LjY4NjMgMTggMjJDMTggMjUuMzEzNyAyMC42ODYzIDI4IDI0IDI4QzI3LjMxMzcgMjggMzAgMjUuMzEzNyAzMCAyMkMzMCAxOC42ODYzIDI3LjMxMzcgMTYgMjQgMTZaIiBmaWxsPSIjOEU5MEEwIi8+CjxwYXRoIGQ9Ik0zMyAyNkMzNCAyNi44OTU0IDM0IDI4LjEwNDYgMzMgMjlDMzEuODk1NCAzMCAzMC4xMDQ2IDMwIDI5IDMwQzI3Ljg5NTQgMzAgMjYuMTA0NiAzMCAyNSAyOUMyNCAyOC4xMDQ2IDI0IDI2Ljg5NTQgMjUgMjZDMjUuODk1NCAyNSAyNy43MDQ2IDI1IDI5IDI1QzMwLjI5NTQgMjUgMzIuMTA0NiAyNSAzMyAyNloiIGZpbGw9IiM4RTkwQTAiLz4KPC9zdmc+';
                              }}
                            />
                          ) : (
                            <div className={`h-12 w-12 rounded-lg border flex items-center justify-center ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-gray-100 border-gray-200'
                            }`}>
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                              }`}>
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {product.product_name}
                          </h3>
                          <p className={`text-xs mt-0.5 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className={`p-2 rounded-lg transition-all duration-200 border ${
                            theme === 'dark'
                              ? 'text-blue-400 hover:bg-blue-500 hover:text-white border-blue-800 hover:border-blue-500'
                              : 'text-blue-600 hover:bg-blue-500 hover:text-white border-blue-200 hover:border-blue-500'
                          }`}
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteLoading === product.id}
                          className={`p-2 rounded-lg transition-all duration-200 border ${
                            deleteLoading === product.id
                              ? theme === 'dark'
                                ? 'text-gray-500 border-gray-600 cursor-not-allowed'
                                : 'text-gray-400 border-gray-200 cursor-not-allowed'
                              : theme === 'dark'
                                ? 'text-red-400 hover:bg-red-500 hover:text-white border-red-800 hover:border-red-500'
                                : 'text-red-600 hover:bg-red-500 hover:text-white border-red-200 hover:border-red-500'
                          }`}
                          title="Delete product"
                        >
                          {deleteLoading === product.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Price:</span>
                        <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(product.sales_price)}
                        </div>
                      </div>
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Quantity:</span>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.qty === 0
                              ? theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                              : product.qty < 10
                                ? theme === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                                : theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.qty} {product.unit}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Category:</span>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.category || `Category ${product.category_name}`}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Status:</span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(product.is_active)}
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            disabled={toggleLoading === product.id}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              product.is_active
                                ? 'bg-green-500 hover:bg-green-600'
                                : theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                <div className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                  No products found
                </div>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
                </p>
              </div>
            ) : (
              <div className={`border rounded-2xl m-4 overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left uppercase tracking-wider text-xs ${theme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-50 text-gray-600'
                      }`}>
                      {/* Product Column */}
                      <th className="py-4 px-4 relative">
                        <button
                          onClick={() => handleSort('product_name')}
                          className="flex items-center gap-1 hover:underline focus:outline-none w-full text-left"
                        >
                          Product
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 -mb-1 ${sortConfig.key === 'product_name' && sortConfig.direction === 'asc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${sortConfig.key === 'product_name' && sortConfig.direction === 'desc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                          </div>
                        </button>
                      </th>

                      {/* SKU Column */}
                      <th className="py-4 px-4">
                        SKU
                      </th>

                      {/* Price Column with Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort('sales_price')}
                            className="flex items-center gap-1 hover:underline focus:outline-none text-left"
                          >
                            Price
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 -mb-1 ${sortConfig.key === 'sales_price' && sortConfig.direction === 'asc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${sortConfig.key === 'sales_price' && sortConfig.direction === 'desc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('price')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'price' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price Filter Dropdown */}
                        {activeFilter === 'price' && (
                          <div className={`absolute top-full left-0 right-0 mt-1 p-4 rounded-lg border z-10 ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200 shadow-lg'
                          }`}>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Price Range
                                </span>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <input
                                  type="range"
                                  min={priceMinMax[0]}
                                  max={priceMinMax[1]}
                                  value={priceRange[0]}
                                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}
                                />
                                <input
                                  type="range"
                                  min={priceMinMax[0]}
                                  max={priceMinMax[1]}
                                  value={priceRange[1]}
                                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}
                                />
                              </div>
                              
                              <div className="flex justify-between text-xs">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {formatPrice(priceMinMax[0])}
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {formatPrice(priceMinMax[1])}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>

                      {/* Quantity Column with Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort('qty')}
                            className="flex items-center gap-1 hover:underline focus:outline-none text-left"
                          >
                            Quantity
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 -mb-1 ${sortConfig.key === 'qty' && sortConfig.direction === 'asc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${sortConfig.key === 'qty' && sortConfig.direction === 'desc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('quantity')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'quantity' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Quantity Filter Dropdown */}
                        {activeFilter === 'quantity' && (
                          <div className={`absolute top-full left-0 right-0 mt-1 p-4 rounded-lg border z-10 ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200 shadow-lg'
                          }`}>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Quantity Range
                                </span>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {quantityRange[0]} - {quantityRange[1]} units
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <input
                                  type="range"
                                  min={quantityMinMax[0]}
                                  max={quantityMinMax[1]}
                                  value={quantityRange[0]}
                                  onChange={(e) => setQuantityRange([Number(e.target.value), quantityRange[1]])}
                                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}
                                />
                                <input
                                  type="range"
                                  min={quantityMinMax[0]}
                                  max={quantityMinMax[1]}
                                  value={quantityRange[1]}
                                  onChange={(e) => setQuantityRange([quantityRange[0], Number(e.target.value)])}
                                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                    theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}
                                />
                              </div>
                              
                              <div className="flex justify-between text-xs">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {quantityMinMax[0]}
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {quantityMinMax[1]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>

                      {/* Category Column */}
                      <th className="py-4 px-4">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1 hover:underline focus:outline-none w-full text-left"
                        >
                          Category
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 -mb-1 ${sortConfig.key === 'category' && sortConfig.direction === 'asc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${sortConfig.key === 'category' && sortConfig.direction === 'desc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                          </div>
                        </button>
                      </th>

                      {/* Status Column with Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <button
                            onClick={() => handleFilterClick('status')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'status' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status Filter Dropdown */}
                        {activeFilter === 'status' && (
                          <div className={`absolute top-full left-0 right-0 mt-1 p-4 rounded-lg border z-10 ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200 shadow-lg'
                          }`}>
                            <div className="space-y-2">
                              <label className={`flex items-center gap-2 text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <input
                                  type="radio"
                                  name="status"
                                  value="all"
                                  checked={statusFilter === 'all'}
                                  onChange={(e) => setStatusFilter(e.target.value as 'all')}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                All Status
                              </label>
                              <label className={`flex items-center gap-2 text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <input
                                  type="radio"
                                  name="status"
                                  value="active"
                                  checked={statusFilter === 'active'}
                                  onChange={(e) => setStatusFilter(e.target.value as 'active')}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                Active Only
                              </label>
                              <label className={`flex items-center gap-2 text-sm ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <input
                                  type="radio"
                                  name="status"
                                  value="inactive"
                                  checked={statusFilter === 'inactive'}
                                  onChange={(e) => setStatusFilter(e.target.value as 'inactive')}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                Inactive Only
                              </label>
                            </div>
                          </div>
                        )}
                      </th>

                      <th className="py-4 px-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`group transition-colors duration-150 ${index === filteredProducts.length - 1
                            ? ''
                            : `border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`
                          } ${theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-indigo-50/50'
                          }`}
                      >
                        {/* Product Name and Image */}
                        <td className="py-4 px-4 font-medium">
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
                                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600'
                                    : 'bg-gray-100 border-gray-200'
                                  }`}>
                                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                                    }`}>
                                    No Image
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                                {product.product_name}
                              </span>
                              <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                {product.unit}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className={`py-4 px-4 font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                          {product.sku}
                        </td>

                        {/* Price */}
                        <td className={`py-4 px-4 font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                          {formatPrice(product.sales_price)}
                        </td>

                        {/* Quantity */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.qty === 0
                              ? theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                              : product.qty < 10
                                ? theme === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                                : theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            }`}>
                            {product.qty} {product.unit}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {product.category || `Category ${product.category_name}`}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(product.is_active)}
                            <button
                              onClick={() => handleToggleStatus(product.id)}
                              disabled={toggleLoading === product.id}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${product.is_active
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                                } ${toggleLoading === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${product.is_active ? 'translate-x-5' : 'translate-x-1'
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
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${theme === 'dark'
                                  ? 'text-blue-400 hover:bg-blue-500 hover:text-white border-blue-800 hover:border-blue-500'
                                  : 'text-blue-600 hover:bg-blue-500 hover:text-white border-blue-200 hover:border-blue-500'
                                }`}
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                                }`}></div>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteLoading === product.id}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${deleteLoading === product.id
                                  ? theme === 'dark'
                                    ? 'text-gray-500 border-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : theme === 'dark'
                                    ? 'text-red-400 hover:bg-red-500 hover:text-white border-red-800 hover:border-red-500'
                                    : 'text-red-600 hover:bg-red-500 hover:text-white border-red-200 hover:border-red-500'
                                }`}
                              title="Delete product"
                            >
                              {deleteLoading === product.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                                }`}></div>
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