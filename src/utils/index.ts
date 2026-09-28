import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat("id-ID").format(Number(amount || 0));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month - 1] || "";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const TAX_STATUS_OPTIONS = [
  { value: "TK0", label: "TK/0 - Unmarried, 0 dependents" },
  { value: "TK1", label: "TK/1 - Unmarried, 1 dependent" },
  { value: "TK2", label: "TK/2 - Unmarried, 2 dependents" },
  { value: "TK3", label: "TK/3 - Unmarried, 3 dependents" },
  { value: "K0", label: "K/0 - Married, 0 dependents" },
  { value: "K1", label: "K/1 - Married, 1 dependent" },
  { value: "K2", label: "K/2 - Married, 2 dependents" },
  { value: "K3", label: "K/3 - Married, 3 dependents" },
  { value: "HB0", label: "HB/0 - Married (dual income), 0 dependents" },
];

export const EMPLOYEE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "badge-active" },
  inactive: { label: "Inactive", className: "badge-inactive" },
  resigned: { label: "Resigned", className: "badge-danger" },
  terminated: { label: "Terminated", className: "badge-danger" },
};

export const LOAN_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "badge-pending" },
  approved: { label: "Approved", className: "badge-active" },
  rejected: { label: "Rejected", className: "badge-danger" },
  ongoing: { label: "Active", className: "badge-active" },
  paid_off: { label: "Paid Off", className: "badge-inactive" },
};

export const PERIOD_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "badge-inactive" },
  processing: { label: "Processing", className: "badge-pending" },
  processed: { label: "Processed", className: "badge-active" },
  finalized: { label: "Finalized", className: "badge-active" },
};
