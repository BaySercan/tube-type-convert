import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Language code to full name mapping
const languageMap: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  // Add more languages as they are supported elsewhere in the app
};

export function getLanguageName(code: string): string {
  return languageMap[code] || code; // Fallback to code if not found
}
