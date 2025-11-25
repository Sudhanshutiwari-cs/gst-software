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
  updated_at: "2025-11-24T16:41:33.000000Z"
}