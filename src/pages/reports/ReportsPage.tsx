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
      toast.error("Pilih periode terlebih dahulu");
      return;
    }
    setViewType(type);
    if (type === "rekap") refetchRekap();
    else refetchLoans();
  };

  const handleExport = async (type: string) => {
    if (!selectedPeriod) {
      toast.error("Pilih periode terlebih dahulu");
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
        toast.success("Laporan berhasil didownload");
      }
    } catch {
      toast.error("Gagal mengunduh laporan");
    }
  };

  const handleExportLoans = async () => {
    try {
      const res = await reportApi.exportLoansExcel();
      downloadBlob(new Blob([res.data]), "laporan-kasbon.xlsx");
      toast.success("Laporan kasbon berhasil didownload");
    } catch {
      toast.error("Gagal mengunduh laporan");
    }
  };

  const reports = [
    { id: "rekap", title: "Rekap Gaji", description: "Daftar gaji lengkap semua karyawan per periode", icon: "💰" },
    { id: "bpjs", title: "Laporan BPJS", description: "Iuran BPJS Kesehatan dan Ketenagakerjaan per periode", icon: "🏥" },
    { id: "pph21", title: "Bukti Potong PPh 21", description: "Data pemotongan PPh 21 karyawan per periode", icon: "📋" },
    { id: "overtime", title: "Laporan Lembur", description: "Data jam dan upah lembur karyawan per periode", icon: "⏰" },
  ];

  return (
    <div>
      <PageHeader title="Laporan" subtitle="Export laporan penggajian dalam format Excel" />

      {/* Period Selector */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Pilih Periode</h3>
        <div className="flex gap-3 items-center">
          <select
            className="input-base w-64"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            <option value="">-- Pilih Periode --</option>
            {finishedPeriods.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {finishedPeriods.length === 0 && (
            <p className="text-sm text-gray-400">Belum ada periode yang difinalisasi</p>
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
                Lihat
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
          <h3 className="text-sm font-semibold text-gray-800">Laporan Kasbon & Pinjaman</h3>
          <p className="text-xs text-gray-500 mt-0.5">Rekap semua data pinjaman dan status cicilan karyawan</p>
        </div>
        <button onClick={() => handleOpenView("loans")} className="btn-secondary">
          <Eye className="w-4 h-4" />
          Lihat
        </button>
        <button onClick={handleExportLoans} className="btn-secondary">
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      {/* View Rekap Modal */}
      <Modal open={viewType === "rekap"} onClose={() => setViewType(null)} title={`Rekap Gaji - ${rekapData?.period?.name || ""}`} size="xl">
        {rekapLoading ? <PageLoader /> : !rekapData?.payslips?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada data payslip untuk periode ini</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="table-th">No. Karyawan</th>
                  <th className="table-th">Nama</th>
                  <th className="table-th">Departemen</th>
                  <th className="table-th text-right">Bruto</th>
                  <th className="table-th text-right">Potongan</th>
                  <th className="table-th text-right">PPh 21</th>
                  <th className="table-th text-right">Bersih</th>
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
      <Modal open={viewType === "loans"} onClose={() => setViewType(null)} title="Laporan Kasbon & Pinjaman" size="xl">
        {loansLoading ? <PageLoader /> : !loanReportData?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada data pinjaman</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr>
                  <th className="table-th">Karyawan</th>
                  <th className="table-th text-right">Jumlah</th>
                  <th className="table-th text-right">Cicilan/Bln</th>
                  <th className="table-th text-center">Terbayar</th>
                  <th className="table-th text-right">Sisa</th>
                  <th className="table-th">Mulai</th>
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
