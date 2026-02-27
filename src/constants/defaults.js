// Default supply categories
export const DEFAULT_SUPPLY_CATEGORIES = [
  { id: 'lighting', name: 'Lighting' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'hardware', name: 'Hardware' },
  { id: 'packaging', name: 'Packaging' }
];

// Initial team members
export const DEFAULT_TEAM = [
  { id: 'member1', name: 'Partner 1' },
  { id: 'member2', name: 'Partner 2' }
];

// Default stores
export const DEFAULT_STORES = [
  { id: 'store1', name: 'Main Store', color: '#10b981' }
];

// Default printers
export const DEFAULT_PRINTERS = [
  { id: 'printer1', name: 'Printer 1', totalHours: 0, ownerId: null }
];

// Production stages
export const PRODUCTION_STAGES = [
  { id: 'printing', name: 'Printing', color: '#6366f1', icon: 'Printer' },
  { id: 'curing', name: 'Curing', color: '#ff9f43', icon: 'Clock' },
  { id: 'assembly', name: 'Assembly', color: '#8b5cf6', icon: 'Box' },
  { id: 'qc', name: 'QC', color: '#2ed573', icon: 'Check' },
  { id: 'packed', name: 'Packed', color: '#10b981', icon: 'Package' }
];

// Etsy fee constants
export const TRANSACTION_FEE_RATE = 0.065; // 6.5%
export const PAYMENT_PROCESSING_RATE = 0.03; // 3%
export const PAYMENT_PROCESSING_FLAT = 0.25; // $0.25
export const SALES_TAX_RATE = 0.0752; // 7.52% (fallback if no actual tax)
