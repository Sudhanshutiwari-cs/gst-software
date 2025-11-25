// components/invoice-templates/MinimalTemplate.tsx
import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface MinimalTemplateProps {
  invoiceData: InvoiceData | null;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ invoiceData }) => {
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
    <div className="bg-white p-6 max-w-4xl mx-auto">
      {/* Simple Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-light text-gray-800">INVOICE</h1>
        <div className="w-20 h-0.5 bg-gray-300 mx-auto mt-2"></div>
      </div>

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
        <div>
          <p className="font-medium text-gray-500">From</p>
          <p className="mt-1">Shyam CMYK</p>
          <p>Kanpur City, UP</p>
          <p>+91 9856314765</p>
        </div>
        <div>
          <p className="font-medium text-gray-500">Bill To</p>
          <p className="mt-1">{invoiceData?.customer?.name || 'Sudhanshu Tiwari'}</p>
          <p>{invoiceData?.customer?.phone || '9140048553'}</p>
          <p>{invoiceData?.customer?.email || 'tiwarisudhanshu861@gmail.com'}</p>
        </div>
        <div>
          <p className="font-medium text-gray-500">Invoice Details</p>
          <p className="mt-1">#{invoiceData?.invoice_number || 'INV-1180'}</p>
          <p>Date: {formatDate(invoiceData?.invoice_date)}</p>
          <p>Due: {formatDate(invoiceData?.due_date)}</p>
        </div>
      </div>

      {/* Simple Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left pb-2 font-medium">Item</th>
              <th className="text-right pb-2 font-medium">Rate</th>
              <th className="text-center pb-2 font-medium">Qty</th>
              <th className="text-right pb-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3">
                  <div>
                    <p className="font-medium">{item.description || 'PVR ID CARD COLOR'}</p>
                    <p className="text-xs text-gray-500">HSN: {item.hsn_sac || '113569'}</p>
                  </div>
                </td>
                <td className="text-right py-3">₹{formatCurrency(item.rate)}</td>
                <td className="text-center py-3">{item.quantity || '100'}</td>
                <td className="text-right py-3 font-medium">
                  ₹{formatCurrency((item.rate || 0) * (item.quantity || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Total Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="max-w-xs ml-auto space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{formatCurrency(invoiceData?.total_amount || 4000)}</span>
          </div>
          <div className="flex justify-between text-lg font-medium">
            <span>Total</span>
            <span>₹{formatCurrency(invoiceData?.amount_payable || 4000)}</span>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="mt-12 text-center text-xs text-gray-400">
        <p>Thank you for your business</p>
        <p className="mt-1">This is a digitally signed document</p>
      </div>
    </div>
  );
};

export default MinimalTemplate;