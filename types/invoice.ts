// types/invoice.ts
export interface Customer {
  name?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  description?: string;
  hsn_sac?: string;
  rate?: number;
  quantity?: number;
  amount?: number;
}

export interface InvoiceData {
  id?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  customer?: Customer;
  items?: InvoiceItem[];
  total_items?: number;
  total_quantity?: number;
  total_amount?: number;
  amount_in_words?: string;
  amount_payable?: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export type InvoiceTemplate = 'modern' | 'classic' | 'minimal' | 'professional';