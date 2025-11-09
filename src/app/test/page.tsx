'use client';
import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Download, RefreshCw, Filter } from 'lucide-react';

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to fetch vendor customers from API
  const fetchVendorCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
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
    { label: "Total Clients", value: clients.length.toString() },
    { label: "Selected", value: clients.filter(client => client.selected).length.toString() },
    { label: "Vendor Clients", value: clients.length.toString() },
    { label: "Active", value: clients.length.toString() }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clients Dashboard</h1>
            <p className="text-gray-600 mt-1">View and manage all your client information in one place.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {/* Export All Button */}
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || clients.length === 0}
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              {exportLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export All
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>

            {/* Add New Client Button */}
            <button
              onClick={handleAddNew}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <Plus className="w-4 h-4" />
              Add New Client
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">
              Error loading data: {error}. Showing {clients.length} client(s).
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
            <h2 className="text-lg font-semibold text-gray-900">Vendor Clients</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or case ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>
              
              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {/* Filter Button */}
                <button className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-700 flex items-center gap-2 text-sm font-medium">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchVendorCustomers}
                  className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 text-gray-600 hover:text-gray-700 flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {clients.filter(client => client.selected).length > 0 && (
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-indigo-700 text-sm font-medium">
                  {clients.filter(client => client.selected).length} client(s) selected
                </div>
                <div className="flex gap-2">
                  {/* Export Selected Button */}
                  <button
                    onClick={handleExportSelectedToExcel}
                    disabled={exportLoading}
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
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
                    className="group relative px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
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
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg font-medium text-gray-400">No clients found</div>
                <p className="text-sm mt-1">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl m-4 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600 uppercase tracking-wider text-xs">
                      <th className="py-4 px-4">
                        <input 
                          type="checkbox" 
                          className="accent-indigo-600 rounded" 
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
                          client.selected ? 'bg-indigo-50' : 'bg-white'
                        } ${
                          index === filteredClients.length - 1 
                            ? '' 
                            : 'border-b border-gray-100'
                        } hover:bg-indigo-50/50`}
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={client.selected}
                            onChange={() => toggleClientSelection(client.id)}
                            className="accent-indigo-600 rounded"
                          />
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900">
                          <div>
                            <span className="font-semibold">{client.name}</span>
                            <div className="text-xs text-gray-500 mt-0.5">{client.phone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{client.email}</td>
                        <td className="py-4 px-4">{client.openedAt}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {client.city}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-sm">{client.gstin}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {client.serProvider}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(client)}
                              className="group relative p-2.5 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-500 shadow-sm hover:shadow-md"
                              title="Edit client"
                            >
                              <Edit className="w-4 h-4" />
                              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(client)}
                              disabled={deleteLoading === client.id}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${
                                deleteLoading === client.id 
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                                  : 'text-red-600 hover:bg-red-500 hover:text-white border-red-200 hover:border-red-500'
                              }`}
                              title="Delete client"
                            >
                              {deleteLoading === client.id ? (
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