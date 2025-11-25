// components/invoice-templates/ProfessionalTemplate.tsx
import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface ProfessionalTemplateProps {
  invoiceData: InvoiceData | null;
}

const ProfessionalTemplate: React.FC<ProfessionalTemplateProps> = ({ invoiceData }) => {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '16 Nov 2025';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '16 Nov 2025';
    }
  };

  const formatCurrency = (amount?: number): string => {
    return (amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="invoice-container bg-white p-6 max-w-4xl mx-auto shadow-lg border border-gray-200">
      {/* Header */}
      <div className="invoice-header text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">INVOICE</h1>
        <p className="text-sm text-gray-600 mt-1">ORIGINAL FOR RECIPIENT</p>
      </div>

      {/* Company Details */}
      <div className="company-details mb-6">
        <h2 className="text-lg font-semibold">Shyam CMYK</h2>
        <p className="text-sm text-gray-700">Tatmil market, Ghantaghar</p>
        <p className="text-sm text-gray-700">Kanpur City, UTTAR PRADESH, 208015</p>
        <p className="text-sm text-gray-700">Mobile: +91 9856314765</p>
      </div>

      {/* Invoice Meta Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm"><strong>Invoice #:</strong> {invoiceData?.invoice_number || 'INV-1180'}</p>
          <p className="text-sm"><strong>Invoice Date:</strong> {formatDate(invoiceData?.invoice_date)}</p>
          <p className="text-sm"><strong>Due Date:</strong> {formatDate(invoiceData?.due_date)}</p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="customer-details mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Customer Details:</h3>
        <p className="text-sm">{invoiceData?.customer?.name || 'Sudhanshu Tiwari'}</p>
        <p className="text-sm">Ph: {invoiceData?.customer?.phone || '9140048553'}</p>
        <p className="text-sm">{invoiceData?.customer?.email || 'tiwarisudhanshu861@gmail.com'}</p>
      </div>

      {/* Items Table */}
      <div className="items-table mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left"># Item</th>
              <th className="border border-gray-300 p-2 text-left">HSN/SAC</th>
              <th className="border border-gray-300 p-2 text-left">Rate / Item</th>
              <th className="border border-gray-300 p-2 text-left">Qty</th>
              <th className="border border-gray-300 p-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items && invoiceData.items.length > 0 ? (
              invoiceData.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{item.description || 'PVR ID CARD COLOR'}</td>
                  <td className="border border-gray-300 p-2">{item.hsn_sac || '113569'}</td>
                  <td className="border border-gray-300 p-2">₹{formatCurrency(item.rate)}</td>
                  <td className="border border-gray-300 p-2">{item.quantity || '100'} PCS</td>
                  <td className="border border-gray-300 p-2">₹{formatCurrency((item.rate || 0) * (item.quantity || 0))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-gray-300 p-2">PVR ID CARD COLOR</td>
                <td className="border border-gray-300 p-2">113569</td>
                <td className="border border-gray-300 p-2">₹40.00</td>
                <td className="border border-gray-300 p-2">100 PCS</td>
                <td className="border border-gray-300 p-2">₹4,000.00</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="summary-section mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Total Items / Qty :</span>
          <span className="text-sm">
            {invoiceData?.total_items || 1} / {invoiceData?.total_quantity || 100}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            ₹{formatCurrency(invoiceData?.total_amount || 4000)}
          </span>
        </div>
        <div className="mb-2">
          <p className="text-sm">
            <strong>Total amount (in words):</strong> INR {invoiceData?.amount_in_words || 'Four Thousand Rupees Only'}.
          </p>
        </div>
        <div className="flex justify-between items-center border-t border-gray-300 pt-2">
          <span className="font-bold">Amount Payable:</span>
          <span className="font-bold">
            ₹{formatCurrency(invoiceData?.amount_payable || 4000)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="invoice-footer mt-8 pt-6 border-t border-gray-300">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-sm mb-4">For Shyam CMYK</p>
            <p className="text-sm">Authorized Signatory</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-600 mb-2">Powered By</p>
            <p className="text-sm font-semibold">Swipe | Simple Invoicing, Billing and Payments</p>
            <p className="text-xs text-blue-600">Visit getswipe.in</p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">Page 1 / 1 • This is a digitally signed document.</p>
          <p className="text-sm text-green-600 font-semibold mt-2">Ab Business karo tension free</p>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTemplate;