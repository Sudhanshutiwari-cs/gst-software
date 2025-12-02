// data/sampleInvoice.ts
import { Invoice } from "../../../types/invoice"

export const sampleInvoice: Invoice = {
  id: 123,
  invoice_id: "INV20251124VH48",
  vendor_id: "VEN20251025M5IP",
  biller_name: "Kodekalesh",
  billing_to: "Virender Shaaaaarma",
  mobile: null,
  email: "amit.sharma@example.com",
  whatsapp_number: null,
  product_name: "MALLOC",
  product_id: 7,
  product_sku: "PRO-KAQS24",
  qty: 1,
  gross_amt: "323.00",
  gst: "0.00",
  tax_inclusive: 0,
  discount: "0.00",
  grand_total: "323.00",
  payment_status: "pending",
  payment_mode: null,
  utr_number: null,
  created_at: "2025-11-24T16:41:33.000000Z",
  updated_at: "2025-11-24T16:41:33.000000Z",
  
  // Add the missing properties based on the Invoice interface
  invoice_number: "INV20251124VH48",
  currency: "USD",
  issue_date: "2025-11-24",
  from_name: "Kodekalesh",
  description: "Payment for MALLOC product",
  due_date: "2025-12-24",
  to_email: "amit.sharma@example.com",
  from_address: "123 Business Street, Mumbai, Maharashtra 400001, India",
  from_email: "billing@kodekalesh.com",
  billing_address: "456 Customer Avenue, Delhi, Delhi 110001, India",
  to_name: "Virender Shaaaaarma",
  to_address: "456 Customer Avenue, Delhi, Delhi 110001, India",
  
  // Add the missing properties that TypeScript is complaining about:
  terms: "Payment due within 30 days. Late fees may apply.",
  notes: "Thank you for your business!",
  shipping_address: "456 Customer Avenue, Delhi, Delhi 110001, India"
}