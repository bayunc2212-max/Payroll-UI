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
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
  { value: "TK0", label: "TK/0 - Tidak Kawin, 0 tanggungan" },
  { value: "TK1", label: "TK/1 - Tidak Kawin, 1 tanggungan" },
  { value: "TK2", label: "TK/2 - Tidak Kawin, 2 tanggungan" },
  { value: "TK3", label: "TK/3 - Tidak Kawin, 3 tanggungan" },
  { value: "K0", label: "K/0 - Kawin, 0 tanggungan" },
  { value: "K1", label: "K/1 - Kawin, 1 tanggungan" },
  { value: "K2", label: "K/2 - Kawin, 2 tanggungan" },
  { value: "K3", label: "K/3 - Kawin, 3 tanggungan" },
  { value: "HB0", label: "HB/0 - Kawin (dua penghasilan), 0 tanggungan" },
];

export const EMPLOYEE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Aktif", className: "badge-active" },
  inactive: { label: "Tidak Aktif", className: "badge-inactive" },
  resigned: { label: "Resign", className: "badge-danger" },
  terminated: { label: "PHK", className: "badge-danger" },
};

export const LOAN_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "badge-pending" },
  approved: { label: "Disetujui", className: "badge-active" },
  rejected: { label: "Ditolak", className: "badge-danger" },
  ongoing: { label: "Aktif", className: "badge-active" },
  paid_off: { label: "Lunas", className: "badge-inactive" },
};

export const PERIOD_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "badge-inactive" },
  processing: { label: "Memproses", className: "badge-pending" },
  processed: { label: "Diproses", className: "badge-active" },
  finalized: { label: "Final", className: "badge-active" },
};
