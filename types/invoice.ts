// types/invoice.ts
export interface Customer {
  name?: string;
  phone?: string;
  email?: string;
} 

export interface InvoiceItem {
  id ?: string;
  unitPrice?: number;
  description?: string;
  hsn_sac?: string;
  rate?: number;
  quantity?: number;
  amount?: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber?: string;
  invoice_number?: string;
  date?: string;
  dueDate?: string;
  invoice_date?: string;
  due_date?: string;
  customer?: Customer;
   status?: string;
   from?: {
    companyName: string;
    address: string;
    city: string;
    zipCode: string;
    state: string;
    email: string;
    phone: string;
    country: string;
    
  }
  to: {
    companyName: string;
    address: string;
    city: string;
    contactName: string;
    zipCode: string;
    state: string;
    email: string;
    phone: string;
    country: string;
  };
  items?: InvoiceItem[];
  total_items?: number;
  subtotal?: number;
  total_quantity?: number;
  tax?: {
    rate?: number;
    amount?: number;
  };
  discount?: {
    type?: 'percentage' | 'fixed';
    rate?: number;
    value: number;
    amount?: number;
  };
  total_amount?: number;
  currency?: string;
  paymentTerms?: string;
  notes?: string;
  paymentInstructions?: string;
   shipping?: number;
   total  ?: number;
  amount_in_words?: string;
  amount_payable?: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export type InvoiceTemplate = 'modern' | 'classic' | 'minimal' | 'professional';