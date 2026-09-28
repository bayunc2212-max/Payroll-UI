import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { payrollApi, reportApi } from "../../api";
import { PageHeader, PageLoader, Modal } from "../../components/ui";
import { formatCurrency, formatDateShort, downloadBlob, LOAN_STATUS_MAP } from "../../utils";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [viewType, setViewType] = useState<"rekap" | "loans" | null>(null);

  const { data: periodsData } = useQuery({
    queryKey: ["payroll-periods-all"],
    queryFn: () => payrollApi.getPeriods({ limit: 100 }).then(r => r.data.data),
  });

  const { data: rekapData, isLoading: rekapLoading, refetch: refetchRekap } = useQuery({
    queryKey: ["report-rekap", selectedPeriod],
    queryFn: () => reportApi.getRekapGaji(selectedPeriod).then(r => r.data.data),
    enabled: viewType === "rekap" && !!selectedPeriod,
  });

  const { data: loanReportData, isLoading: loansLoading, refetch: refetchLoans } = useQuery({
    queryKey: ["report-loans"],
    queryFn: () => reportApi.getLoans().then(r => r.data.data),
    enabled: viewType === "loans",
  });

  const finishedPeriods = periodsData?.filter((p: any) =>
    p.status === "finalized" || p.status === "processed"
  ) || [];

  const handleOpenView = (type: "rekap" | "loans") => {
    if (type === "rekap" && !selectedPeriod) {
      toast.error("Select a period first");
      return;
    }
    setViewType(type);
    if (type === "rekap") refetchRekap();
    else refetchLoans();
  };

  const handleExport = async (type: string) => {
    if (!selectedPeriod) {
      toast.error("Select a period first");
      return;
    }

    try {
      let res: any;
      let filename = "";

      switch (type) {
        case "rekap":
          res = await reportApi.exportRekapGajiExcel(selectedPeriod);
          filename = "rekap-gaji.xlsx";
          break;
        case "bpjs":
          res = await reportApi.exportBpjsExcel(selectedPeriod);
          filename = "laporan-bpjs.xlsx";
          break;
        case "pph21":
          res = await reportApi.exportPph21Excel(selectedPeriod);
          filename = "bukti-potong-pph21.xlsx";
          break;
        case "overtime":
          res = await reportApi.exportOvertimeExcel(selectedPeriod);
          filename = "laporan-lembur.xlsx";
          break;
      }

      if (res) {
        downloadBlob(new Blob([res.data]), filename);
        toast.success("Report downloaded successfully");
      }
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleExportLoans = async () => {
    try {
      const res = await reportApi.exportLoansExcel();
      downloadBlob(new Blob([res.data]), "laporan-kasbon.xlsx");
      toast.success("Loan report downloaded successfully");
    } catch {
      toast.error("Failed to download report");
    }
  };

  const reports = [
    { id: "rekap", title: "Salary Recap", description: "Complete salary list for all employees per period", icon: "💰" },
    { id: "bpjs", title: "BPJS Report", description: "BPJS Health and Employment contributions per period", icon: "🏥" },
    { id: "pph21", title: "PPh 21 Withholding Evidence", description: "Employee PPh 21 withholding data per period", icon: "📋" },
    { id: "overtime", title: "Overtime Report", description: "Employee overtime hours and pay per period", icon: "⏰" },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export payroll reports in Excel format" />

      {/* Period Selector */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Period</h3>
        <div className="flex gap-3 items-center">
          <select
            className="input-base w-64"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            <option value="">-- Select Period --</option>
            {finishedPeriods.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {finishedPeriods.length === 0 && (
            <p className="text-sm text-gray-400">No finalized periods yet</p>
          )}
        </div>
      </div>

      {/* Laporan per periode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {reports.map(r => (
          <div key={r.id} className="card p-5 flex items-center gap-4">
            <div className="text-3xl">{r.icon}</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
            </div>
            {r.id === "rekap" && (
              <button
                onClick={() => handleOpenView("rekap")}
                disabled={!selectedPeriod}
                className="btn-secondary disabled:opacity-40"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            )}
            <button
              onClick={() => handleExport(r.id)}
              disabled={!selectedPeriod}
              className="btn-secondary disabled:opacity-40"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        ))}
      </div>

      {/* Laporan kasbon */}
      <div className="card p-5 flex items-center gap-4">
        <div className="text-3xl">💳</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">Cash Advance & Loan Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">Recap of all loan data and employee installment status</p>
        </div>
        <button onClick={() => handleOpenView("loans")} className="btn-secondary">
          <Eye className="w-4 h-4" />
          View
        </button>
        <button onClick={handleExportLoans} className="btn-secondary">
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      {/* View Rekap Modal */}
      <Modal open={viewType === "rekap"} onClose={() => setViewType(null)} title={`Salary Recap - ${rekapData?.period?.name || ""}`} size="xl">
        {rekapLoading ? <PageLoader /> : !rekapData?.payslips?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">No payslip data for this period</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="table-th">Employee No.</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Department</th>
                  <th className="table-th text-right">Gross</th>
                  <th className="table-th text-right">Deductions</th>
                  <th className="table-th text-right">PPh 21</th>
                  <th className="table-th text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {rekapData.payslips.map((row: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="table-td font-mono text-xs">{row.employeeNumber}</td>
                    <td className="table-td font-medium">{row.employeeName}</td>
                    <td className="table-td text-gray-500">{row.departmentName || "-"}</td>
                    <td className="table-td text-right">{formatCurrency(row.grossSalary)}</td>
                    <td className="table-td text-right text-red-600">{formatCurrency(row.totalDeduction)}</td>
                    <td className="table-td text-right">{formatCurrency(row.pph21)}</td>
                    <td className="table-td text-right font-semibold text-green-700">{formatCurrency(row.netSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* View Loans Modal */}
      <Modal open={viewType === "loans"} onClose={() => setViewType(null)} title="Cash Advance & Loan Report" size="xl">
        {loansLoading ? <PageLoader /> : !loanReportData?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">No loan data yet</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th text-right">Installment/Mo</th>
                  <th className="table-th text-center">Paid</th>
                  <th className="table-th text-right">Remaining</th>
                  <th className="table-th">Start</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {loanReportData.map((loan: any) => {
                  const statusInfo = LOAN_STATUS_MAP[loan.status] || { label: loan.status, className: "badge-inactive" };
                  return (
                    <tr key={loan.id} className="border-t hover:bg-gray-50">
                      <td className="table-td">
                        <p className="font-medium">{loan.employeeName}</p>
                        <p className="text-xs text-gray-400">{loan.employeeNumber}</p>
                      </td>
                      <td className="table-td text-right font-medium">{formatCurrency(loan.amount)}</td>
                      <td className="table-td text-right">{formatCurrency(loan.installmentAmount)}</td>
                      <td className="table-td text-center">{loan.paidInstallments}/{loan.totalInstallments}</td>
                      <td className="table-td text-right text-red-600">{formatCurrency(loan.remainingAmount)}</td>
                      <td className="table-td text-gray-500">{loan.startDate ? formatDateShort(loan.startDate) : "-"}</td>
                      <td className="table-td"><span className={statusInfo.className}>{statusInfo.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
