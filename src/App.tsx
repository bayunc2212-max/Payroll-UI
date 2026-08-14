import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth.store";
import { authApi } from "./api";
import AppLayout from "./components/layout/AppLayout";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import EmployeeDetailPage from "./pages/employees/EmployeeDetailPage";
import EmployeeFormPage from "./pages/employees/EmployeeFormPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import LoansPage from "./pages/loans/LoansPage";
import OrganizationPage from "./pages/organization/OrganizationPage";
import PayrollPage from "./pages/payroll/PayrollPage";
import PayrollPeriodDetail from "./pages/payroll/PayrollPeriodDetail";
import PayslipDetailPage from "./pages/payroll/PayslipDetailPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SettingsPage from "./pages/settings/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setUser, isAuthenticated } = useAuthStore();

  // Verify auth on mount
  useEffect(() => {
    if (isAuthenticated) {
      authApi.me().then((res) => setUser(res.data.data)).catch(() => setUser(null));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/new" element={<EmployeeFormPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="payroll/:periodId" element={<PayrollPeriodDetail />} />
          <Route path="payslips/:id" element={<PayslipDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
