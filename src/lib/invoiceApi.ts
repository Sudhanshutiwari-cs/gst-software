// lib/invoiceApi.ts
import { InvoiceData, ApiResponse } from '../../types/invoice';

const API_BASE_URL = 'https://manhemdigitalsolutions.com/pos-admin/api/vendor';

export const fetchInvoice = async (id: string, token: string): Promise<InvoiceData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Add cache configuration if needed
      cache: 'no-store', // or 'force-cache' for static data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.status}`);
    }

    const result: ApiResponse<InvoiceData> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch invoice');
    }

    return result.data || {};
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};