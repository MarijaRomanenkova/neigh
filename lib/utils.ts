import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import qs from 'query-string';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert prisma object into a regular JS object
export function convertToPlainObject<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle case where value is a Decimal object (has toNumber method)
  if (typeof value === 'object' && value !== null) {
    // Check if it's a Decimal object with toNumber method
    const valueObj = value as { toNumber?: () => number };
    if (valueObj.toNumber && typeof valueObj.toNumber === 'function') {
      return Number(valueObj.toNumber()) as unknown as T;
    }
    
    // If it's an array, map over each element
    if (Array.isArray(value)) {
      return value.map(item => convertToPlainObject(item)) as unknown as T;
    }
    
    // If it's a regular object, process each property
    if (typeof value === 'object' && value.constructor === Object) {
      const result: Record<string, unknown> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const objValue = value as Record<string, unknown>;
          result[key] = convertToPlainObject(objValue[key]);
        }
      }
      return result as unknown as T;
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value as T;
    }
  }
  
  // Use JSON.stringify and JSON.parse as a fallback for other cases
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.error('Error converting object to plain object:', error);
    return value;
  }
}

// Format number with decimal places
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split('.');
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : `${int}.00`;
}

// Format errors
export function formatError(error: unknown) {
  // Type guards for expected error types
  const isZodError = (err: unknown): err is { 
    name: string; 
    errors: Record<string, { message: string }> 
  } => {
    return typeof err === 'object' && 
           err !== null && 
           'name' in err && 
           err.name === 'ZodError' && 
           'errors' in err;
  };

  const isPrismaError = (err: unknown): err is { 
    name: string; 
    code: string; 
    meta?: { target?: string[] } 
  } => {
    return typeof err === 'object' && 
           err !== null && 
           'name' in err && 
           err.name === 'PrismaClientKnownRequestError' &&
           'code' in err;
  };

  // Check if the error has a message property
  const hasMessage = (err: unknown): err is { message: string } => {
    return typeof err === 'object' && 
           err !== null && 
           'message' in err;
  };

  if (isZodError(error)) {
    // Handle Zod error
    const fieldErrors = Object.keys(error.errors).map(
      (field) => error.errors[field].message
    );

    return fieldErrors.join('. ');
  } else if (isPrismaError(error) && error.code === 'P2002') {
    // Handle Prisma error
    const field = error.meta?.target ? error.meta.target[0] : 'Field';
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // Handle other errors
    if (hasMessage(error)) {
      return typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message);
    }
    return 'An unknown error occurred';
  }
}

// Round number to 2 decimal places
export function round2(value: number | string) {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === 'string') {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error('Value is not a number or string');
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
  minimumFractionDigits: 2,
});

// Format currency using the formatter above
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === 'number') {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === 'string') {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return 'NaN';
  }
}

// Format Number
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

// Shorten UUID
export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`;
}

// Format date and times
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    'en-US',
    dateTimeOptions
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    'en-US',
    dateOptions
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    'en-US',
    timeOptions
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

// Form the pagination links
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const query = qs.parse(params);

  query[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query,
    },
    {
      skipNull: true,
    }
  );
}
