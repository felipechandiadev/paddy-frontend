declare global {
  interface Global {
    __activeTab?:
      | 'products'
      | 'categories'
      | 'units'
      | 'accounts-receivable'
      | 'received-payments'
      | 'general-ledger'
      | 'bank-transactions'
      | 'salesperson-cash'
      | 'sale-notes'
      | 'sales'
      | 'credit-notes';
  }

  // Extend globalThis to include the custom property
  var globalThis: Global;
}

export {};