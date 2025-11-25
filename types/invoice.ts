// types/invoice.ts
export interface Invoice {
  id: number;
  invoice_id: string;
  vendor_id: string;
  biller_name: string;
  billing_to: string;
  mobile: string | null;
  email: string;
  whatsapp_number: string | null;
  product_name: string;
  product_id: number;
  product_sku: string;
  qty: number;
  gross_amt: string;
  gst: string;
  tax_inclusive: number;
  discount: string;
  grand_total: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_mode: string | null;
  utr_number: string | null;
  created_at: string;
  updated_at: string;
}