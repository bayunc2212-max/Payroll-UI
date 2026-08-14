import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { payslipApi } from "../../api";
import { PageLoader } from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils";

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: slip, isLoading } = useQuery({
    queryKey: ["payslip", id],
    queryFn: () => payslipApi.getById(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const downloadMutation = useMutation({
    mutationFn: () => payslipApi.downloadPdf(id!),
    onSuccess: (res) => {
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slip-gaji-${slip?.employeeNumber}-${slip?.periodName?.replace(/\s/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil didownload");
    },
  });

  const emailMutation = useMutation({
    mutationFn: () => payslipApi.sendEmail(id!),
    onSuccess: () => {
      toast.success("Email slip gaji berhasil dikirim");
      qc.invalidateQueries({ queryKey: ["payslip", id] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (!slip) return <div className="text-center py-12 text-gray-400">Payslip tidak ditemukan</div>;

  const Row = ({ label, value, bold = false, color = "" }: any) => (
    <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${bold ? "font-semibold" : ""}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Slip Gaji</h1>
          <p className="text-sm text-gray-500">{slip.periodName} · {slip.employeeName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => emailMutation.mutate()}
            disabled={emailMutation.isPending}
            className="btn-secondary"
          >
            {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {slip.emailSentAt ? "Kirim Ulang" : "Kirim Email"}
          </button>
          <button
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className="btn-primary"
          >
            {downloadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Payslip Web View */}
      <div className="max-w-3xl mx-auto">
        {/* Company Header */}
        <div className="bg-primary-800 text-white rounded-t-xl px-6 py-5">
          <h2 className="text-xl font-bold">SLIP GAJI</h2>
          <p className="text-primary-200 text-sm mt-0.5">{slip.periodName}</p>
        </div>

        <div className="card rounded-t-none p-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              ["Nama Karyawan", slip.employeeName],
              ["No. Karyawan", slip.employeeNumber],
              ["Jabatan", slip.positionName || "-"],
              ["Departemen", slip.departmentName || "-"],
              ["Status Pajak", slip.taxStatus || "-"],
              ["NPWP", slip.npwp || "-"],
              ["Rekening", slip.bankName ? `${slip.bankName} - ${slip.bankAccountNumber}` : "-"],
              ["Tanggal Bayar", formatDate(slip.paymentDate)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-gray-400">{l}</p>
                <p className="text-sm font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          {/* Attendance */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Kehadiran</h3>
            <div className="grid grid-cols-6 gap-3">
              {[
                ["Hari Kerja", slip.workingDays],
                ["Hadir", slip.presentDays],
                ["Sakit", slip.sickDays],
                ["Izin", slip.permissionDays],
                ["Alpha", slip.absentDays],
                ["Lembur (jam)", slip.overtimeHours],
              ].map(([l, v]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="text-lg font-bold text-gray-900">{v || 0}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pendapatan */}
          <div>
            <h3 className="text-sm font-semibold text-primary-700 mb-2">Pendapatan</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-2">
              <Row label="Gaji Pokok" value={formatCurrency(slip.basicSalary)} />
              {Number(slip.allowanceTransport) > 0 && <Row label="Tunjangan Transport" value={formatCurrency(slip.allowanceTransport)} />}
              {Number(slip.allowanceMeal) > 0 && <Row label="Tunjangan Makan" value={formatCurrency(slip.allowanceMeal)} />}
              {Number(slip.allowancePosition) > 0 && <Row label="Tunjangan Jabatan" value={formatCurrency(slip.allowancePosition)} />}
              {Number(slip.allowanceOther) > 0 && <Row label="Tunjangan Lainnya" value={formatCurrency(slip.allowanceOther)} />}
              {Number(slip.overtimePay) > 0 && <Row label="Upah Lembur" value={formatCurrency(slip.overtimePay)} />}
              {Number(slip.bonus) > 0 && <Row label="Bonus" value={formatCurrency(slip.bonus)} />}
              {Number(slip.thr) > 0 && <Row label="THR" value={formatCurrency(slip.thr)} />}
              <Row label="TOTAL PENDAPATAN BRUTO" value={formatCurrency(slip.grossSalary)} bold />
            </div>
          </div>

          {/* Potongan */}
          <div>
            <h3 className="text-sm font-semibold text-red-600 mb-2">Potongan</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-2">
              {Number(slip.bpjsHealthEmployee) > 0 && <Row label="BPJS Kesehatan (karyawan 1%)" value={formatCurrency(slip.bpjsHealthEmployee)} />}
              {Number(slip.bpjsEmploymentJht) > 0 && <Row label="BPJS Ketenagakerjaan JHT (2%)" value={formatCurrency(slip.bpjsEmploymentJht)} />}
              {Number(slip.bpjsEmploymentJp) > 0 && <Row label="BPJS Ketenagakerjaan JP (1%)" value={formatCurrency(slip.bpjsEmploymentJp)} />}
              {Number(slip.pph21) > 0 && <Row label="PPh 21" value={formatCurrency(slip.pph21)} />}
              {Number(slip.loanDeduction) > 0 && <Row label="Cicilan Pinjaman/Kasbon" value={formatCurrency(slip.loanDeduction)} />}
              {Number(slip.otherDeduction) > 0 && <Row label="Potongan Lainnya" value={formatCurrency(slip.otherDeduction)} />}
              <Row label="TOTAL POTONGAN" value={formatCurrency(slip.totalDeduction)} bold color="text-red-600" />
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-primary-800 rounded-xl p-5 text-white text-center">
            <p className="text-sm text-primary-200 mb-1">GAJI BERSIH (TAKE HOME PAY)</p>
            <p className="text-3xl font-bold">{formatCurrency(slip.netSalary)}</p>
          </div>

          {/* Kontribusi Perusahaan */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Kontribusi Perusahaan (Info)</h3>
            <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-800">
              {Number(slip.bpjsHealthCompany) > 0 && <Row label="BPJS Kesehatan (4%)" value={formatCurrency(slip.bpjsHealthCompany)} />}
              {Number(slip.bpjsEmploymentJkkCompany) > 0 && <Row label="JKK" value={formatCurrency(slip.bpjsEmploymentJkkCompany)} />}
              {Number(slip.bpjsEmploymentJkmCompany) > 0 && <Row label="JKM" value={formatCurrency(slip.bpjsEmploymentJkmCompany)} />}
              {Number(slip.bpjsEmploymentJhtCompany) > 0 && <Row label="JHT (3.7%)" value={formatCurrency(slip.bpjsEmploymentJhtCompany)} />}
              {Number(slip.bpjsEmploymentJpCompany) > 0 && <Row label="JP (2%)" value={formatCurrency(slip.bpjsEmploymentJpCompany)} />}
            </div>
          </div>

          {slip.notes && (
            <p className="text-sm text-gray-500 italic">Catatan: {slip.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
