// Add these interfaces to your types/invoice.ts file
export interface InvoiceProduct {
  id?: number;
  invoice_id?: string;
  product_name: string;
  product_id?: number;
  product_sku?: string;
  qty: number;
  gross_amt: string;
  gst?: string;
  tax_inclusive?: boolean | number;
  discount?: string;
  total: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_id: string;
  vendor_id: string;
  currency: string;
  biller_name: string;
  issue_date: string;
  from_name: string;
  description: string | null;
  due_date: string;
  billing_to: string;
  to_email: string;
  from_address: string;
  from_email: string;
  billing_address: string;
  mobile: string | null;
  to_name: string;
  to_address: string | null;
  email: string;
  whatsapp_number: string | null;
  product_name: string;
  terms: string | null;
  notes: string | null;
  product_id: number;
  product_sku: string;
  qty: number;
  gross_amt: string;
  gst: string;
  tax_inclusive: boolean | number;
  discount: string;
  grand_total: string;
  payment_status: string;
  payment_mode: string | null;
  utr_number: string | null;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
  shipping_address: string | null;
  // Add products array for multiple products
  products?: InvoiceProduct[];
}