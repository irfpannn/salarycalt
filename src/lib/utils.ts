import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a number or computed ref-like (with value) as MYR currency
export function formatMYR(val: number | { value: number }): string {
  const n = typeof val === 'number' ? val : (val?.value ?? 0)
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 2,
  }).format(n)
}

export function toPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}
