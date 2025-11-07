'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

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

  // Function to fetch vendor customers from API
  const fetchVendorCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual JWT token
      const token = localStorage.getItem('authToken') || 'your-jwt-token-here';
      
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
        // Transform API data to match your Client interface
        const transformedClients: Client[] = data.data.map((customer, index) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.mobile,
          email: customer.email,
          caseRef: `CASE-${index + 1}` ,// Generate case ref based on customer ID
          openedAt: new Date(customer.created_at).toLocaleDateString('en-GB'),
          city: customer.city,
          gstin: customer.gstin,
          source: 'Vendor',// Default source since API doesn't provide this
          serProvider: customer.vendor_id,
          services: ['Consultation'], // Default service
          amount: '$230.00', // Default amount
          selected: false
        }));

        setClients(transformedClients);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching vendor customers:', err);
      
      // Fallback to mock data if API fails
      
        } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorCustomers();
  }, []);

  const toggleClientSelection = (id: number) => {
    setClients(clients.map(client =>
      client.id === id ? { ...client, selected: !client.selected } : client
    ));
  };

  const stats = [
    { label: "Total Clients", value: clients.length.toString() },
    { label: "Selected", value: clients.filter(client => client.selected).length.toString() },
    { label: "Vendor Clients", value: clients.length.toString() },
    { label: "Active", value: clients.length.toString() } // You can modify this based on your business logic
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
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clients Dashboard</h1>
          <p className="text-gray-600 mt-1">View and manage all your client information in one place.</p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                Error loading data: {error}. Showing {clients.length} client(s).
              </p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100"
            >
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Vendor Clients</h2>
            <div className="flex gap-3 mt-3 md:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or case ref..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-72"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>
              <button
                onClick={fetchVendorCustomers}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No clients found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 uppercase tracking-wider text-xs">
                    <th className="py-3 px-4"><input type="checkbox" className="accent-indigo-600" /></th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">PAN Number</th>
                    <th className="py-3 px-4">Vendor ID</th>
                    
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-150 ${client.selected ? 'bg-indigo-50' : 'bg-white'
                        }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={client.selected}
                          onChange={() => toggleClientSelection(client.id)}
                          className="accent-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div>
                          <span>{client.name}</span>
                          <div className="text-xs text-gray-500">{client.phone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{client.email}</td>
                      <td className="py-3 px-4">{client.openedAt}</td>
                      <td className="py-3 px-4">{client.city}</td>
                      <td className="py-3 px-4">{client.gstin}</td>
                      <td className="py-3 px-4">{client.serProvider}</td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}