// src/app/(admin)/(others-pages)/sales/invoices/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import InvoiceTemplate from '@/components/templates/InvoiceTemplate';
import TemplateSelector from '@/components/templates/TemplateSelector';
import { fetchInvoice } from '@/lib/invoiceApi';
import { InvoiceData, InvoiceTemplate as TemplateType } from '../../../../../../../types/invoice';

// Sample data for ID 123
const sampleInvoiceData: InvoiceData = {
  id: "123",
  invoiceNumber: "INV-2023-00123",
  date: "2023-11-15",
  dueDate: "2023-12-15",
  status: "paid",
  from: {
    companyName: "Tech Solutions Inc.",
    address: "123 Business Ave, Suite 100",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    country: "USA",
    email: "billing@techsolutions.com",
    phone: "+1 (555) 123-4567"
  },
  to: {
    companyName: "Global Enterprises LLC",
    contactName: "John Smith",
    address: "456 Corporate Blvd",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    email: "john.smith@globalent.com",
    phone: "+1 (555) 987-6543"
  },
  items: [
    {
      id: "1",
      description: "Website Development Services",
      quantity: 40,
      unitPrice: 125.00,
      amount: 5000.00
    },
    {
      id: "2",
      description: "UI/UX Design",
      quantity: 25,
      unitPrice: 80.00,
      amount: 2000.00
    },
    {
      id: "3",
      description: "Technical Consultation",
      quantity: 10,
      unitPrice: 150.00,
      amount: 1500.00
    },
    {
      id: "4",
      description: "Project Management",
      quantity: 30,
      unitPrice: 75.00,
      amount: 2250.00
    }
  ],
  subtotal: 10750.00,
  tax: {
    rate: 8.5,
    amount: 913.75
  },
  discount: {
    type: "percentage",
    value: 10,
    amount: 1075.00
  },
  shipping: 0.00,
  total: 9588.75,
  currency: "USD",
  paymentTerms: "Net 30",
  notes: "Thank you for your business! Please make payment within 30 days of invoice date.",
  paymentInstructions: "Bank Transfer:\nAccount Name: Tech Solutions Inc.\nBank: First National Bank\nAccount #: 123456789\nRouting #: 021000021"
};

const InvoicePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const [useSampleData, setUseSampleData] = useState<boolean>(false);

  useEffect(() => {
    const getInvoice = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        // Check if we should use sample data for ID 123
        if (id === '123') {
          setUseSampleData(true);
          setInvoiceData(sampleInvoiceData);
        } else {
          const token = localStorage.getItem('authToken') || 'your-jwt-token-here';
          const data = await fetchInvoice(id, token);
          setInvoiceData(data);
          setUseSampleData(false);
        }
      } catch (err) {
        // If API fails and ID is 123, fall back to sample data
        if (id === '123') {
          setUseSampleData(true);
          setInvoiceData(sampleInvoiceData);
          setError(null);
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          setError(errorMessage);
          console.error('Error fetching invoice:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    getInvoice();
  }, [id]);

  const handlePrint = (): void => {
    window.print();
  };

  const handleDownloadPDF = (): void => {
    alert('PDF download functionality to be implemented');
  };

  const handleGoBack = (): void => {
    router.back();
  };

  const handleReloadFromAPI = async (): Promise<void> => {
    if (id !== '123') return;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken') || 'your-jwt-token-here';
      const data = await fetchInvoice(id, token);
      setInvoiceData(data);
      setUseSampleData(false);
    } catch (err) {
      // Fall back to sample data if API fails
      setInvoiceData(sampleInvoiceData);
      setUseSampleData(true);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`API failed, using sample data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !useSampleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error loading invoice</p>
          <p className="mt-2">{error}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            {id === '123' && (
              <button 
                onClick={() => {
                  setInvoiceData(sampleInvoiceData);
                  setUseSampleData(true);
                  setError(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Use Sample Data
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Sample Data Indicator */}
        {useSampleData && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-yellow-800 font-semibold">
                  Using Sample Data for Invoice #123
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  This is demo data. To test with real API data, make sure your backend is running.
                </p>
              </div>
              <button
                onClick={handleReloadFromAPI}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Try API Again
              </button>
            </div>
          </div>
        )}

        {/* Template Selector */}
        <TemplateSelector 
          selectedTemplate={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
        />

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Print Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
          <div className="flex gap-2">
            {useSampleData && (
              <button
                onClick={() => {
                  setInvoiceData(sampleInvoiceData);
                  setUseSampleData(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Reset Sample Data
              </button>
            )}
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>

        {/* Invoice Template */}
        {invoiceData && (
          <InvoiceTemplate 
            invoiceData={invoiceData} 
            selectedTemplate={selectedTemplate}
          />
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .bg-gray-100 {
            background-color: white !important;
          }
          button, .bg-white.rounded-lg {
            display: none !important;
          }
          .invoice-container, .bg-gradient-to-br {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;