'use client';
import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Download, RefreshCw, Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VendorCustomer {
  id: number;
  vendor_id: string;
  customer_id: string | null;
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: VendorCustomer[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface Client {
  id: number;
  gstin: string;
  name: string;
  phone: string;
  customer_id: string | null;
  caseRef: string;
  openedAt: string;
  city: string;
  email: string;
  source: string;
  serProvider: string;
  services: string[];
  amount: string;
  selected: boolean;
  created_at: string;
}

// Theme types
type Theme = 'light' | 'dark';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'city' | 'date' | 'vendor' | ''>('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter states
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'email' | 'city' | 'openedAt' | 'serProvider' | '';
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

  // Function to fetch vendor customers from API
  const fetchVendorCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('jwtToken') || sessionStorage.getItem('authToken') || sessionStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('https://manhemdigitalsolutions.com/pos-admin/api/vendor/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        const transformedClients: Client[] = data.data.map((customer, index) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.mobile,
          customer_id: customer.customer_id,
          email: customer.email,
          caseRef: `CASE-${index + 1}`,
          openedAt: new Date(customer.created_at).toLocaleDateString('en-GB'),
          city: customer.city,
          gstin: customer.gstin,
          source: 'Vendor',
          serProvider: customer.vendor_id,
          services: ['Consultation'],
          amount: '$230.00',
          selected: false,
          created_at: customer.created_at
        }));

        setClients(transformedClients);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vendor customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorCustomers();
  }, []);

  // Get unique values for filters
  const cities = Array.from(new Set(clients.map(client => client.city))).filter(Boolean);
  const vendors = Array.from(new Set(clients.map(client => client.serProvider))).filter(Boolean);

  // Calculate date range for filters
  const dateMinMax = clients.length > 0 ? [
    new Date(Math.min(...clients.map(c => new Date(c.created_at).getTime()))).toISOString().split('T')[0],
    new Date(Math.max(...clients.map(c => new Date(c.created_at).getTime()))).toISOString().split('T')[0]
  ] : ['', ''];

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTermLower) ||
        client.email.toLowerCase().includes(searchTermLower) ||
        client.caseRef.toLowerCase().includes(searchTermLower) ||
        client.phone.includes(searchTerm) ||
        client.gstin.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply city filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(client => client.city === cityFilter);
    }

    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(client => {
        const clientDate = new Date(client.created_at).toISOString().split('T')[0];
        return clientDate >= dateRange[0] && clientDate <= dateRange[1];
      });
    }

    // Apply vendor filter
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(client => client.serProvider === vendorFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortConfig.key === 'email') {
          return sortConfig.direction === 'asc'
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email);
        } else if (sortConfig.key === 'city') {
          return sortConfig.direction === 'asc'
            ? (a.city || '').localeCompare(b.city || '')
            : (b.city || '').localeCompare(a.city || '');
        } else if (sortConfig.key === 'openedAt') {
          return sortConfig.direction === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortConfig.key === 'serProvider') {
          return sortConfig.direction === 'asc'
            ? a.serProvider.localeCompare(b.serProvider)
            : b.serProvider.localeCompare(a.serProvider);
        }
        return 0;
      });
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, cityFilter, dateRange, vendorFilter, sortConfig]);

  const toggleClientSelection = (id: number) => {
    setClients(clients.map(client =>
      client.id === id ? { ...client, selected: !client.selected } : client
    ));
  };

  // Edit client function
  const handleEdit = (client: Client) => {
    router.push(`/customer/update/${client.id}`);
    console.log('Edit client:', client);
  };

  // Add new client function
  const handleAddNew = () => {
    console.log('Add new client clicked');
    alert('Add new client functionality would be implemented here');
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      setExportLoading(true);
      
      const exportData = filteredClients.map(client => ({
        'ID': client.id,
        'Name': client.name,
        'Phone': client.phone,
        'Email': client.email,
        'Customer ID': client.customer_id,
        'Case Reference': client.caseRef,
        'Created Date': client.openedAt,
        'City': client.city,
        'GSTIN/PAN': client.gstin,
        'Vendor ID': client.serProvider,
        'Source': client.source,
        'Services': client.services.join(', '),
        'Amount': client.amount
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert(`Exported ${filteredClients.length} clients successfully!`);
      
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Error exporting data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Export selected clients to Excel
  const handleExportSelectedToExcel = () => {
    const selectedClients = filteredClients.filter(client => client.selected);
    
    if (selectedClients.length === 0) {
      alert('Please select at least one client to export.');
      return;
    }

    try {
      setExportLoading(true);
      
      const exportData = selectedClients.map(client => ({
        'ID': client.id,
        'Name': client.name,
        'Phone': client.phone,
        'Email': client.email,
        'Customer ID': client.customer_id,
        'Case Reference': client.caseRef,
        'Created Date': client.openedAt,
        'City': client.city,
        'GSTIN/PAN': client.gstin,
        'Vendor ID': client.serProvider,
        'Source': client.source,
        'Services': client.services.join(', '),
        'Amount': client.amount
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_clients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert(`Exported ${selectedClients.length} selected clients successfully!`);
      
    } catch (err) {
      console.error('Error exporting selected clients to Excel:', err);
      alert('Error exporting selected data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Delete client function with API integration
  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(client.id);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `https://manhemdigitalsolutions.com/pos-admin/api/vendor/delete-customer/${client.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.status}`);
      }

      const data: DeleteResponse = await response.json();

      if (data.success) {
        setClients(clients.filter(c => c.id !== client.id));
        alert(`Client ${client.name} deleted successfully!`);
      } else {
        throw new Error(data.message || 'Failed to delete client');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the client';
      console.error('Error deleting client:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    const selectedClients = filteredClients.filter(client => client.selected);
    
    if (selectedClients.length === 0) {
      alert('Please select at least one client to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedClients.length} selected client(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      for (const client of selectedClients) {
        const response = await fetch(
          `https://manhemdigitalsolutions.com/pos-admin/api/vendor/delete-customer/${client.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete customer ${client.name}: ${response.status}`);
        }

        const data: DeleteResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || `Failed to delete client ${client.name}`);
        }
      }

      setClients(clients.filter(client => !client.selected));
      alert(`Successfully deleted ${selectedClients.length} client(s)!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting clients';
      console.error('Error in bulk delete:', err);
      alert(`Error: ${errorMessage}`);
      fetchVendorCustomers();
    }
  };

  const handleSort = (key: 'name' | 'email' | 'city' | 'openedAt' | 'serProvider') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setActiveFilter(''); // Close filter dropdown when sorting
  };

  const handleFilterClick = (filterType: 'city' | 'date' | 'vendor') => {
    setActiveFilter(activeFilter === filterType ? '' : filterType);
  };

  const resetFilters = () => {
    setCityFilter('all');
    setDateRange(['', '']);
    setVendorFilter('all');
    setSortConfig({ key: '', direction: 'asc' });
    setSearchTerm('');
    setActiveFilter('');
  };

  const stats = [
    { label: "Total Customers", value: clients.length.toString() },
    { label: "Selected", value: clients.filter(client => client.selected).length.toString() },
    { label: "Vendor Client", value: clients.length.toString() },
    { label: "Active", value: clients.length.toString() }
  ];

  // Button styling classes
  const buttonBaseClass = "px-4 py-1 h-8 rounded-md transition-all duration-200 text-[14px] font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg overflow-hidden";

  const buttonPrimaryClass = theme === 'dark'
    ? `${buttonBaseClass} bg-indigo-600 hover:bg-indigo-700 text-white`
    : `${buttonBaseClass} bg-indigo-600 hover:bg-indigo-700 text-white`;

  

  const buttonSuccessClass = theme === 'dark'
    ? `${buttonBaseClass} bg-green-600 hover:bg-green-700 text-white`
    : `${buttonBaseClass} bg-green-600 hover:bg-green-700 text-white`;

  
  const buttonDangerClass = theme === 'dark'
    ? `${buttonBaseClass} bg-red-600 hover:bg-red-700 text-white`
    : `${buttonBaseClass} bg-red-600 hover:bg-red-700 text-white`;

  const buttonOutlineClass = theme === 'dark'
    ? `${buttonBaseClass} bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white`
    : `${buttonBaseClass} bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700`;

  if (loading) {
    return (
      <div className={`min-h-screen p-8 flex items-center justify-center transition-colors duration-200 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Customers
            </h1>
            <p className={`mt-1 text-sm md:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              View and manage all your Customer information in one place.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {/* Export All Button */}
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || clients.length === 0}
              className={buttonSuccessClass}
            >
              {exportLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Export All</span>
              <span className="sm:hidden">Export</span>
            </button>

            {/* Add New Client Button */}
            <button
              onClick={handleAddNew}
              className={buttonPrimaryClass}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {error && (
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm">
              Error loading data: {error}. Showing {clients.length} client(s).
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`rounded-lg transition-all duration-200 p-3 border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-gray-100 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,128,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,128,0.25)]'
              }`}
            >
              <div className={`text-lg md:text-xl font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stat.value}
              </div>
              <div className={`text-[10px] md:text-[11px] mt-0.5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search and Actions Section */}
        <div className={`rounded-2xl shadow-sm border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Customer
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-80">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 md:py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white'
                  }`}
                />
              </div>
              
              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {/* Filter Button */}
                <button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={buttonOutlineClass}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchVendorCustomers}
                  className={buttonOutlineClass}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Reset Filters Button */}
                <button
                  onClick={resetFilters}
                  className={buttonOutlineClass}
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className={`p-4 md:p-6 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Filters
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${theme === 'dark'
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className={`p-1 rounded-md transition-colors ${theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    City
                  </label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange[0]}
                      onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                      className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="date"
                      value={dateRange[1]}
                      onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                      className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Vendor Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vendor
                  </label>
                  <select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {filteredClients.filter(client => client.selected).length > 0 && (
            <div className={`px-4 md:px-6 py-4 border-b ${
              theme === 'dark' ? 'bg-indigo-900 border-indigo-800' : 'bg-indigo-50 border-indigo-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'
                }`}>
                  {filteredClients.filter(client => client.selected).length} client(s) selected
                </div>
                <div className="flex gap-2">
                  {/* Export Selected Button */}
                  <button
                    onClick={handleExportSelectedToExcel}
                    disabled={exportLoading}
                    className={buttonSuccessClass}
                  >
                    {exportLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Export Selected</span>
                    <span className="sm:hidden">Export</span>
                  </button>

                  {/* Delete Selected Button */}
                  <button
                    onClick={handleBulkDelete}
                    className={buttonDangerClass}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete Selected</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table Container with Horizontal Scroll */}
          <div className="w-full overflow-x-auto">
            {filteredClients.length === 0 ? (
              <div className={`text-center py-12 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className={`text-lg font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  No clients found
                </div>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
                </p>
              </div>
            ) : (
              <div className={`min-w-[1024px] border rounded-2xl m-4 overflow-hidden ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left uppercase tracking-wider text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <th className="py-4 px-4">
                        <input 
                          type="checkbox" 
                          className={`rounded ${
                            theme === 'dark' ? 'accent-indigo-500' : 'accent-indigo-600'
                          }`}
                          checked={filteredClients.length > 0 && filteredClients.every(client => client.selected)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setClients(clients.map(client => ({ 
                              ...client, 
                              selected: filteredClients.some(fc => fc.id === client.id) ? isChecked : client.selected 
                            })));
                          }}
                        />
                      </th>
                      
                      {/* Name Column with Sort */}
                      <th className="py-4 px-4 relative">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:underline focus:outline-none w-full text-left"
                        >
                          Name
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 -mb-1 ${sortConfig.key === 'name' && sortConfig.direction === 'asc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${sortConfig.key === 'name' && sortConfig.direction === 'desc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                          </div>
                        </button>
                      </th>

                      {/* Email Column with Sort */}
                      <th className="py-4 px-4 relative">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center gap-1 hover:underline focus:outline-none w-full text-left"
                        >
                          Email
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 -mb-1 ${sortConfig.key === 'email' && sortConfig.direction === 'asc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${sortConfig.key === 'email' && sortConfig.direction === 'desc' 
                                ? 'text-indigo-500' 
                                : 'text-gray-400'}`} 
                            />
                          </div>
                        </button>
                      </th>

                      {/* Created Column with Sort and Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort('openedAt')}
                            className="flex items-center gap-1 hover:underline focus:outline-none text-left"
                          >
                            Created
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 -mb-1 ${sortConfig.key === 'openedAt' && sortConfig.direction === 'asc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${sortConfig.key === 'openedAt' && sortConfig.direction === 'desc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('date')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'date' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Date Filter Dropdown */}
                        {activeFilter === 'date' && (
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
                                  Date Range
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={dateRange[0]}
                                  onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                                  className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    theme === 'dark'
                                      ? 'bg-gray-700 border-gray-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                                <input
                                  type="date"
                                  value={dateRange[1]}
                                  onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                                  className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    theme === 'dark'
                                      ? 'bg-gray-700 border-gray-600 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {dateMinMax[0]}
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                  {dateMinMax[1]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>

                      {/* City Column with Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort('city')}
                            className="flex items-center gap-1 hover:underline focus:outline-none text-left"
                          >
                            City
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 -mb-1 ${sortConfig.key === 'city' && sortConfig.direction === 'asc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${sortConfig.key === 'city' && sortConfig.direction === 'desc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('city')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'city' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* City Filter Dropdown */}
                        {activeFilter === 'city' && (
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
                                  name="city"
                                  value="all"
                                  checked={cityFilter === 'all'}
                                  onChange={(e) => setCityFilter(e.target.value)}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                All Cities
                              </label>
                              {cities.map(city => (
                                <label key={city} className={`flex items-center gap-2 text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  <input
                                    type="radio"
                                    name="city"
                                    value={city}
                                    checked={cityFilter === city}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  {city}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>

                      <th className="py-4 px-4">PAN Number</th>

                      {/* Vendor Column with Filter */}
                      <th className="py-4 px-4 relative">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSort('serProvider')}
                            className="flex items-center gap-1 hover:underline focus:outline-none text-left"
                          >
                            Vendor ID
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`w-3 h-3 -mb-1 ${sortConfig.key === 'serProvider' && sortConfig.direction === 'asc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 ${sortConfig.key === 'serProvider' && sortConfig.direction === 'desc' 
                                  ? 'text-indigo-500' 
                                  : 'text-gray-400'}`} 
                              />
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('vendor')}
                            className={`p-1 rounded transition-colors ${
                              activeFilter === 'vendor' 
                                ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Vendor Filter Dropdown */}
                        {activeFilter === 'vendor' && (
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
                                  name="vendor"
                                  value="all"
                                  checked={vendorFilter === 'all'}
                                  onChange={(e) => setVendorFilter(e.target.value)}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                All Vendors
                              </label>
                              {vendors.map(vendor => (
                                <label key={vendor} className={`flex items-center gap-2 text-sm ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  <input
                                    type="radio"
                                    name="vendor"
                                    value={vendor}
                                    checked={vendorFilter === vendor}
                                    onChange={(e) => setVendorFilter(e.target.value)}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                  />
                                  {vendor}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </th>

                      <th className="py-4 px-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client, index) => (
                      <tr
                        key={client.id}
                        className={`group transition-colors duration-150 ${
                          client.selected 
                            ? theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-50' 
                            : theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        } ${
                          index === filteredClients.length - 1 
                            ? '' 
                            : `border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`
                        } ${
                          theme === 'dark' 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-indigo-50/50'
                        }`}
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={client.selected}
                            onChange={() => toggleClientSelection(client.id)}
                            className={`rounded ${
                              theme === 'dark' ? 'accent-indigo-500' : 'accent-indigo-600'
                            }`}
                          />
                        </td>
                        <td className="py-4 px-4 font-medium">
                          <div>
                            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                              {client.name}
                            </span>
                            <div className={`text-xs mt-0.5 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {client.phone}
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-4 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {client.email}
                        </td>
                        <td className={`py-4 px-4 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {client.openedAt}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {client.city}
                          </span>
                        </td>
                        <td className={`py-4 px-4 font-mono text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {client.gstin}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.serProvider}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(client)}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${theme === 'dark'
                                  ? 'text-blue-400 hover:bg-blue-500 hover:text-white border-blue-800 hover:border-blue-500'
                                  : 'text-blue-600 hover:bg-blue-500 hover:text-white border-blue-200 hover:border-blue-500'
                                }`}
                              title="Edit client"
                            >
                              <Edit className="w-4 h-4" />
                              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200 ${theme === 'dark' ? 'bg-white' : 'bg-white'
                                }`}></div>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(client)}
                              disabled={deleteLoading === client.id}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${deleteLoading === client.id
                                  ? theme === 'dark'
                                    ? 'text-gray-500 border-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : theme === 'dark'
                                    ? 'text-red-400 hover:bg-red-500 hover:text-white border-red-800 hover:border-red-500'
                                    : 'text-red-600 hover:bg-red-500 hover:text-white border-red-200 hover:border-red-500'
                                }`}
                              title="Delete client"
                            >
                              {deleteLoading === client.id ? (
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