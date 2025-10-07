// Application constants
export const APPLICATION_CONSTANTS = {
  PAYMENT: {
    PROCESSING_DELAY_MS: 1000,
  },
  VALIDATION: {
    MIN_ORDER_ITEMS: 1,
    MIN_QUANTITY: 1,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  ORDER: {
    EMPTY_ORDER: 'Order must have at least one item',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    INVALID_PAYMENT_STATUS_TRANSITION: 'Invalid payment status transition',
    ORDER_ID_REQUIRED: 'Order ID is required',
    CREATION_DATE_REQUIRED: 'Order creation date is required',
  },
  CUSTOMER: {
    INVALID_CPF: 'Invalid CPF',
    CPF_ALREADY_REGISTERED: 'CPF já cadastrado',
    EMAIL_ALREADY_REGISTERED: 'Email já cadastrado',
  },
  PRODUCT: {
    NOT_FOUND: 'Product not found',
  },
} as const;

// API Response messages
export const API_MESSAGES = {
  SUCCESS: {
    ORDER_CREATED: 'Order created successfully',
    STATUS_UPDATED: 'Status updated successfully',
    PAYMENT_STATUS_UPDATED: 'Payment status updated successfully',
  },
  ERROR: {
    ORDER_NOT_FOUND: 'Order not found',
    CUSTOMER_NOT_FOUND: 'Customer not found',
    PRODUCT_NOT_FOUND: 'Product not found',
  },
} as const; 