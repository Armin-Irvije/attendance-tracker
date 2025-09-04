import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to get current date in local timezone (YYYY-MM-DD format)
// This fixes the timezone issue where toISOString() converts to UTC,
// which can cause the date to shift by one day depending on your timezone
export const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to get current timestamp in Pacific timezone
export const getCurrentPacificTimestamp = () => {
  const now = new Date();
  // Convert to Pacific timezone (PST/PDT)
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  return pacificTime.toISOString();
};

// Utility function to format timestamp for display in Pacific timezone
export const formatTimestampForPacific = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Utility function to get Pacific timezone offset
export const getPacificTimezoneOffset = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pacific = new Date(utc + (0 * 3600000)); // Pacific timezone offset
  return pacific.getTimezoneOffset();
};
