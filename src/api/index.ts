import api from "./client";

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
};

// ── DEPARTMENTS ───────────────────────────────────────────────────────────────
export const departmentApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/departments", { params }),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: unknown) => api.post("/departments", data),
  update: (id: string, data: unknown) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// ── POSITIONS ─────────────────────────────────────────────────────────────────
export const positionApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/positions", { params }),
  getById: (id: string) => api.get(`/positions/${id}`),
  create: (data: unknown) => api.post("/positions", data),
  update: (id: string, data: unknown) => api.put(`/positions/${id}`, data),
  delete: (id: string) => api.delete(`/positions/${id}`),
};

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
export const employeeApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get("/employees", { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post("/employees", data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  // Documents
  getDocuments: (id: string) => api.get(`/employees/${id}/documents`),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/employees/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteDocument: (id: string, docId: string) =>
    api.delete(`/employees/${id}/documents/${docId}`),
  // History
  getSalaryHistory: (id: string) => api.get(`/employees/${id}/salary-history`),
  getPositionHistory: (id: string) =>
    api.get(`/employees/${id}/position-history`),
};

// ── LOANS ─────────────────────────────────────────────────────────────────────
export const loanApi = {
  getAll: (params?: Record<string, unknown>) => api.get("/loans", { params }),
  getById: (id: string) => api.get(`/loans/${id}`),
  create: (data: unknown) => api.post("/loans", data),
  approve: (id: string, data?: unknown) =>
    api.put(`/loans/${id}/approve`, data),
  reject: (id: string) => api.put(`/loans/${id}/reject`),
  getPayments: (id: string) => api.get(`/loans/${id}/payments`),
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  getByPeriod: (params: { year: number; month: number; departmentId?: string }) =>
    api.get("/attendance", { params }),
  upsert: (data: unknown) => api.post("/attendance", data),
  bulkUpsert: (records: unknown[]) =>
    api.post("/attendance/bulk", { records }),
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  getBpjs: () => api.get("/settings/bpjs"),
  updateBpjs: (data: unknown) => api.put("/settings/bpjs", data),
  getTax: () => api.get("/settings/tax"),
  updateTax: (data: unknown) => api.put("/settings/tax", data),
  getCompany: () => api.get("/settings/company"),
  updateCompany: (data: unknown) => api.put("/settings/company", data),
};

// ── PAYROLL ───────────────────────────────────────────────────────────────────
export const payrollApi = {
  getPeriods: (params?: Record<string, unknown>) =>
    api.get("/payroll/periods", { params }),
  getPeriodById: (id: string) => api.get(`/payroll/periods/${id}`),
  createPeriod: (data: unknown) => api.post("/payroll/periods", data),
  processPeriod: (id: string) => api.post(`/payroll/periods/${id}/process`),
  finalizePeriod: (id: string) => api.post(`/payroll/periods/${id}/finalize`),
  getPeriodPayslips: (id: string) =>
    api.get(`/payroll/periods/${id}/payslips`),
  adjustPayslip: (periodId: string, payslipId: string, data: unknown) =>
    api.put(`/payroll/periods/${periodId}/payslips/${payslipId}/adjust`, data),
  previewCalculation: (data: unknown) =>
    api.post("/payroll/calculate-preview", data),
};

// ── PAYSLIPS ──────────────────────────────────────────────────────────────────
export const payslipApi = {
  getById: (id: string) => api.get(`/payslips/${id}`),
  downloadPdf: (id: string) =>
    api.get(`/payslips/${id}/pdf`, { responseType: "blob" }),
  sendEmail: (id: string) => api.post(`/payslips/${id}/send-email`),
  sendAllEmails: (periodId: string) =>
    api.post(`/payslips/period/${periodId}/send-all`),
};

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportApi = {
  getRekapGaji: (periodId: string) =>
    api.get(`/reports/rekap-gaji/${periodId}`),
  exportRekapGajiExcel: (periodId: string) =>
    api.get(`/reports/rekap-gaji/${periodId}/excel`, { responseType: "blob" }),
  exportBpjsExcel: (periodId: string) =>
    api.get(`/reports/bpjs/${periodId}/excel`, { responseType: "blob" }),
  exportPph21Excel: (periodId: string) =>
    api.get(`/reports/pph21/${periodId}/excel`, { responseType: "blob" }),
  exportOvertimeExcel: (periodId: string) =>
    api.get(`/reports/overtime/${periodId}/excel`, { responseType: "blob" }),
  getLoans: () => api.get("/reports/loans"),
  exportLoansExcel: () =>
    api.get("/reports/loans/excel", { responseType: "blob" }),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),
};
