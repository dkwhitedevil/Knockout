import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shorten an address/ID to format: 0x1234...abcd
 */
export function shortenId(id: string, startChars = 6, endChars = 4): string {
  if (id.length <= startChars + endChars + 3) return id;
  return `${id.slice(0, startChars)}...${id.slice(-endChars)}`;
}
