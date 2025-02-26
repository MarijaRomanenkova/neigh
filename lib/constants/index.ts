export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Store App";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Store App using Next.js 15, PostgreSQL, Shadcn UI";
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_PRODUCTS_LIMIT = Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;
export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 10;

export const signInDefaultValues = {
  email: '',
  password: '',
};

export const signUpDefaultValues = {
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
};  
