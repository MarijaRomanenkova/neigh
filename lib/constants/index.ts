export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Neigh";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Neigh is a platform for connecting neighbors and finding tasks to do around the house.";
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_TASKS_LIMIT = Number(process.env.LATEST_TASKS_LIMIT) || 12;
export const signInDefaultValues = {
  email: '',
  password: '',
};

export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const shippingAddressDefaultValues = {
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ')
  : ['PayPal', 'Stripe', 'CashOnDelivery'];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || 'PayPal';

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

export const taskDefaultValues = {
  name: '',
  slug: '',
  categoryId: '',  // Changed from category
  images: [] as string[],  // Added type annotation
  description: '',
  price: 0
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(', ')
  : ['admin', 'user'];


export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

