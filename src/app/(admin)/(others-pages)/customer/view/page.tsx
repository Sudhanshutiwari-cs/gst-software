'use client';
import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Download, RefreshCw, Filter } from 'lucide-react';
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
}

// Theme types
type Theme = 'light' | 'dark';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const router = useRouter();
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Theme state
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize theme and set up listeners
  useEffect(() => {
    // Function to get initial theme
    const getInitialTheme = (): Theme => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          return savedTheme;
        }
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      return 'light';
    };

    // Function to apply theme to DOM
    const applyTheme = (newTheme: Theme) => {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Set initial theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for storage changes (theme changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = (e.newValue as Theme) || 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);

    // Set up mutation observer to watch for theme class changes
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
          selected: false
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

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.caseRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const toggleClientSelection = (id: number) => {
    setClients(clients.map(client =>
      client.id === id ? { ...client, selected: !client.selected } : client
    ));
  };

  // Edit client function
  const handleEdit = (client: Client) => {
    router.push(`/customer/update/${client.id}`);
    console.log('Edit client:', client);
    alert(`Edit functionality for ${client.name} would be implemented here`);
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
      
      const exportData = clients.map(client => ({
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
      
      alert(`Exported ${clients.length} clients successfully!`);
      
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Error exporting data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Export selected clients to Excel
  const handleExportSelectedToExcel = () => {
    const selectedClients = clients.filter(client => client.selected);
    
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
    const selectedClients = clients.filter(client => client.selected);
    
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

  const buttonSecondaryClass = theme === 'dark'
    ? `${buttonBaseClass} bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600`
    : `${buttonBaseClass} bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300`;

  const buttonSuccessClass = theme === 'dark'
    ? `${buttonBaseClass} bg-green-600 hover:bg-green-700 text-white`
    : `${buttonBaseClass} bg-green-600 hover:bg-green-700 text-white`;

  const buttonInfoClass = theme === 'dark'
    ? `${buttonBaseClass} bg-blue-600 hover:bg-blue-700 text-white`
    : `${buttonBaseClass} bg-blue-600 hover:bg-blue-700 text-white`;

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
    <div className={`min-h-screen p-8 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Customers
            </h1>
            <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
              Export All
            </button>

            {/* Add New Client Button */}
            <button
              onClick={handleAddNew}
              className={buttonPrimaryClass}
            >
              <Plus className="w-4 h-4" />
              Add New Customer
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`rounded-lg transition-all duration-200 p-3 border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-gray-100 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,128,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,128,0.25)]'
              }`}
            >
              <div className={`text-xl font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {stat.value}
              </div>
              <div className={`text-[11px] mt-0.5 ${
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
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  placeholder="Search by name, email, or case ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white'
                  }`}
                />
              </div>
              
              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {/* Filter Button */}
                <button className={buttonOutlineClass}>
                  <Filter className="w-4 h-4" />
                  Filter
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchVendorCustomers}
                  className={buttonOutlineClass}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {clients.filter(client => client.selected).length > 0 && (
            <div className={`px-6 py-4 border-b ${
              theme === 'dark' ? 'bg-indigo-900 border-indigo-800' : 'bg-indigo-50 border-indigo-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'
                }`}>
                  {clients.filter(client => client.selected).length} client(s) selected
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
                    Export Selected
                  </button>

                  {/* Delete Selected Button */}
                  <button
                    onClick={handleBulkDelete}
                    className={buttonDangerClass}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table with Light Outline */}
          <div className="overflow-x-auto">
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
              <div className={`border rounded-2xl m-4 overflow-hidden ${
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
                          checked={clients.length > 0 && clients.every(client => client.selected)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setClients(clients.map(client => ({ ...client, selected: isChecked })));
                          }}
                        />
                      </th>
                      <th className="py-4 px-4">Name</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Created</th>
                      <th className="py-4 px-4">City</th>
                      <th className="py-4 px-4">PAN Number</th>
                      <th className="py-4 px-4">Vendor ID</th>
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
                              className={`${buttonBaseClass} ${
                                theme === 'dark'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              title="Edit client"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(client)}
                              disabled={deleteLoading === client.id}
                              className={`${buttonBaseClass} ${
                                deleteLoading === client.id 
                                  ? theme === 'dark'
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : theme === 'dark'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                              title="Delete client"
                            >
                              {deleteLoading === client.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
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