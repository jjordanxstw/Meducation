import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names safely — resolves conflicting utilities
 * (e.g. `px-2 px-4` → `px-4`) and supports conditional class objects.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
