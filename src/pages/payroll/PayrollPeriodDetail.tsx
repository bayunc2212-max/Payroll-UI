import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Lock, Send, Eye, Mail, SlidersHorizontal, Calculator, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { payrollApi, payslipApi } from "../../api";
import { PageLoader, ConfirmDialog, Modal } from "../../components/ui";
import { formatCurrency, formatDateShort, PERIOD_STATUS_MAP } from "../../utils";
import { useState } from "react";

const ResultRow = ({ label, value, bold = false, color = "" }: any) => (
  <div className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${bold ? "font-semibold" : ""}`}>
    <span className="text-sm text-gray-600">{label}</span>
    <span className={`text-sm font-medium ${color}`}>{value}</span>
  </div>
);

export default function PayrollPeriodDetail() {
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<"process" | "finalize" | "sendAll" | null>(null);

  // Adjust state
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ bonus: "0", thr: "0", otherDeduction: "0", notes: "" });

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState({ employeeId: "", bonus: "0", thr: "0", otherDeduction: "0" });
  const [previewResult, setPreviewResult] = useState<any>(null);

  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ["payroll-period", periodId],
    queryFn: () => payrollApi.getPeriodById(periodId!).then(r => r.data.data),
    enabled: !!periodId,
  });

  const { data: payslips, isLoading: payslipsLoading, refetch } = useQuery({
    queryKey: ["period-payslips", periodId],
    queryFn: () => payrollApi.getPeriodPayslips(periodId!).then(r => r.data.data),
    enabled: !!periodId,
  });

  const processMutation = useMutation({
    mutationFn: () => payrollApi.processPeriod(periodId!),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ["payroll-period", periodId] });
      qc.invalidateQueries({ queryKey: ["period-payslips", periodId] });
      setConfirmAction(null);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => payrollApi.finalizePeriod(periodId!),
    onSuccess: () => {
      toast.success("Periode berhasil difinalisasi");
      qc.invalidateQueries({ queryKey: ["payroll-period", periodId] });
      qc.invalidateQueries({ queryKey: ["period-payslips", periodId] });
      setConfirmAction(null);
    },
  });

  const sendAllMutation = useMutation({
    mutationFn: () => payslipApi.sendAllEmails(periodId!),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refetch();
      setConfirmAction(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (d: any) => payrollApi.adjustPayslip(periodId!, d.payslipId, d.payload),
    onSuccess: () => {
      toast.success("Payslip berhasil diperbarui");
      setAdjustTarget(null);
      qc.invalidateQueries({ queryKey: ["period-payslips", periodId] });
    },
  });

  const previewMutation = useMutation({
    mutationFn: (d: any) => payrollApi.previewCalculation(d).then(r => r.data.data),
    onSuccess: (res) => setPreviewResult(res),
  });

  const openAdjust = (slip: any) => {
    setAdjustTarget(slip);
    setAdjustForm({ bonus: "0", thr: "0", otherDeduction: "0", notes: "" });
  };

  const openPreview = () => {
    setPreviewForm({
      employeeId: payslips?.[0]?.employeeId || "",
      bonus: "0",
      thr: "0",
      otherDeduction: "0",
    });
    setPreviewResult(null);
    setShowPreview(true);
  };

  const handleAdjust = () => {
    if (!adjustTarget) return;
    adjustMutation.mutate({
      payslipId: adjustTarget.id,
      payload: {
        bonus: adjustForm.bonus,
        thr: adjustForm.thr,
        otherDeduction: adjustForm.otherDeduction,
        notes: adjustForm.notes,
      },
    });
  };

  const handlePreview = () => {
    if (!previewForm.employeeId) {
      toast.error("Pilih karyawan terlebih dahulu");
      return;
    }
    previewMutation.mutate({
      employeeId: previewForm.employeeId,
      periodId,
      bonus: previewForm.bonus,
      thr: previewForm.thr,
      otherDeduction: previewForm.otherDeduction,
    });
  };

  if (periodLoading) return <PageLoader />;
  if (!period) return <div className="text-center py-12 text-gray-400">Periode tidak ditemukan</div>;

  const statusInfo = PERIOD_STATUS_MAP[period.status] || { label: period.status, className: "badge-inactive" };
  const totalGross = payslips?.reduce((s: number, p: any) => s + Number(p.grossSalary || 0), 0) || 0;
  const totalNet = payslips?.reduce((s: number, p: any) => s + Number(p.netSalary || 0), 0) || 0;
  const totalDeduction = payslips?.reduce((s: number, p: any) => s + Number(p.totalDeduction || 0), 0) || 0;
  const previewEmployee = payslips?.find((p: any) => p.employeeId === previewForm.employeeId);
  const canAdjust = period.status !== "finalized";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/payroll")} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{period.name}</h1>
            <span className={statusInfo.className}>{statusInfo.label}</span>
          </div>
          <p className="text-sm text-gray-500">
            Cut-off: {formatDateShort(period.cutOffDate)} · Bayar: {formatDateShort(period.paymentDate)} · {period.workingDays} hari kerja
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openPreview} className="btn-secondary">
            <Calculator className="w-4 h-4" /> Preview Gaji
          </button>
          {period.status === "draft" && (
            <button onClick={() => setConfirmAction("process")} className="btn-primary">
              <Play className="w-4 h-4" /> Proses Gaji
            </button>
          )}
          {period.status === "processed" && (
            <>
              <button onClick={() => setConfirmAction("process")} className="btn-secondary">
                <Play className="w-4 h-4" /> Proses Ulang
              </button>
              <button onClick={() => setConfirmAction("finalize")} className="btn-primary">
                <Lock className="w-4 h-4" /> Finalisasi
              </button>
            </>
          )}
          {period.status === "finalized" && (
            <button onClick={() => setConfirmAction("sendAll")} className="btn-primary">
              <Mail className="w-4 h-4" /> Kirim Semua Email
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {payslips && payslips.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Gaji Bruto</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalGross)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Potongan</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalDeduction)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Gaji Bersih</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totalNet)}</p>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-700">
            Daftar Slip Gaji {payslips ? `(${payslips.length} karyawan)` : ""}
          </h3>
        </div>
        {payslipsLoading ? <PageLoader /> : !payslips?.length ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {period.status === "draft" ? "Klik \"Proses Gaji\" untuk menghitung gaji semua karyawan" : "Belum ada data payslip"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Karyawan</th>
                <th className="table-th text-right">Gaji Bruto</th>
                <th className="table-th text-right">Potongan</th>
                <th className="table-th text-right">Gaji Bersih</th>
                <th className="table-th">Status</th>
                <th className="table-th">Email</th>
                <th className="table-th">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((slip: any) => (
                <tr key={slip.id} className="border-t hover:bg-gray-50">
                  <td className="table-td">
                    <p className="font-medium">{slip.employeeName}</p>
                    <p className="text-xs text-gray-400">{slip.employeeNumber}</p>
                  </td>
                  <td className="table-td text-right font-medium">{formatCurrency(slip.grossSalary)}</td>
                  <td className="table-td text-right text-red-600">{formatCurrency(slip.totalDeduction)}</td>
                  <td className="table-td text-right font-semibold text-green-700">{formatCurrency(slip.netSalary)}</td>
                  <td className="table-td">
                    <span className={slip.status === "finalized" ? "badge-active" : "badge-inactive"}>
                      {slip.status === "finalized" ? "Final" : "Draft"}
                    </span>
                  </td>
                  <td className="table-td">
                    {slip.emailSentAt ? (
                      <span className="badge-active">✓ Terkirim</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      {canAdjust && (
                        <button onClick={() => openAdjust(slip)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Atur Bonus/Potongan">
                          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      <Link to={`/payslips/${slip.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg inline-flex" title="Lihat Detail">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Modal */}
      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Atur Slip Gaji - ${adjustTarget?.employeeName || ""}`} size="md">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-400">Gaji Bruto</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(adjustTarget?.grossSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Potongan</p>
              <p className="text-sm font-semibold text-red-600">{formatCurrency(adjustTarget?.totalDeduction)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Bersih</p>
              <p className="text-sm font-semibold text-green-700">{formatCurrency(adjustTarget?.netSalary)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bonus</label>
              <input type="number" className="input-base" value={adjustForm.bonus}
                onChange={e => setAdjustForm(p => ({ ...p, bonus: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">THR</label>
              <input type="number" className="input-base" value={adjustForm.thr}
                onChange={e => setAdjustForm(p => ({ ...p, thr: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Potongan Lain</label>
              <input type="number" className="input-base" value={adjustForm.otherDeduction}
                onChange={e => setAdjustForm(p => ({ ...p, otherDeduction: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
            <textarea className="input-base" rows={2} value={adjustForm.notes}
              onChange={e => setAdjustForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAdjustTarget(null)} className="btn-secondary">Batal</button>
            <button onClick={handleAdjust} className="btn-primary" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Preview Perhitungan Gaji" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Karyawan *</label>
              <select
                className="input-base"
                value={previewForm.employeeId}
                onChange={e => {
                  setPreviewForm(p => ({ ...p, employeeId: e.target.value }));
                  setPreviewResult(null);
                }}
              >
                <option value="">-- Pilih Karyawan --</option>
                {payslips?.map((p: any) => (
                  <option key={p.employeeId} value={p.employeeId}>{p.employeeName} ({p.employeeNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bonus</label>
              <input type="number" className="input-base" value={previewForm.bonus}
                onChange={e => setPreviewForm(p => ({ ...p, bonus: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">THR</label>
              <input type="number" className="input-base" value={previewForm.thr}
                onChange={e => setPreviewForm(p => ({ ...p, thr: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Potongan Lain</label>
              <input type="number" className="input-base" value={previewForm.otherDeduction}
                onChange={e => setPreviewForm(p => ({ ...p, otherDeduction: e.target.value }))} placeholder="0" />
            </div>
            <div className="flex items-end">
              <button onClick={handlePreview} className="btn-primary w-full" disabled={previewMutation.isPending}>
                {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Hitung
              </button>
            </div>
          </div>

          {previewResult && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-primary-700 mb-2">Pendapatan</h3>
                <div className="bg-gray-50 rounded-lg px-4 py-2">
                  <ResultRow label="Gaji Pokok (prorate)" value={formatCurrency(previewResult.proratedBasicSalary)} />
                  {Number(previewResult.allowanceTransport) > 0 && <ResultRow label="Tunj. Transport" value={formatCurrency(previewResult.allowanceTransport)} />}
                  {Number(previewResult.allowanceMeal) > 0 && <ResultRow label="Tunj. Makan" value={formatCurrency(previewResult.allowanceMeal)} />}
                  {Number(previewResult.allowancePosition) > 0 && <ResultRow label="Tunj. Jabatan" value={formatCurrency(previewResult.allowancePosition)} />}
                  {Number(previewResult.allowanceOther) > 0 && <ResultRow label="Tunj. Lainnya" value={formatCurrency(previewResult.allowanceOther)} />}
                  {Number(previewResult.overtimePay) > 0 && <ResultRow label="Upah Lembur" value={formatCurrency(previewResult.overtimePay)} />}
                  {Number(previewResult.bonus) > 0 && <ResultRow label="Bonus" value={formatCurrency(previewResult.bonus)} />}
                  {Number(previewResult.thr) > 0 && <ResultRow label="THR" value={formatCurrency(previewResult.thr)} />}
                  <ResultRow label="TOTAL BRUTO" value={formatCurrency(previewResult.grossSalary)} bold />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2">Potongan</h3>
                <div className="bg-gray-50 rounded-lg px-4 py-2">
                  {Number(previewResult.bpjsHealthEmployee) > 0 && <ResultRow label="BPJS Kesehatan" value={formatCurrency(previewResult.bpjsHealthEmployee)} />}
                  {Number(previewResult.bpjsEmploymentJht) > 0 && <ResultRow label="BPJS JHT" value={formatCurrency(previewResult.bpjsEmploymentJht)} />}
                  {Number(previewResult.bpjsEmploymentJp) > 0 && <ResultRow label="BPJS JP" value={formatCurrency(previewResult.bpjsEmploymentJp)} />}
                  {Number(previewResult.pph21Monthly) > 0 && <ResultRow label="PPh 21" value={formatCurrency(previewResult.pph21Monthly)} />}
                  {Number(previewResult.loanDeduction) > 0 && <ResultRow label="Cicilan Pinjaman" value={formatCurrency(previewResult.loanDeduction)} />}
                  {Number(previewResult.otherDeduction) > 0 && <ResultRow label="Potongan Lain" value={formatCurrency(previewResult.otherDeduction)} />}
                  <ResultRow label="TOTAL POTONGAN" value={formatCurrency(previewResult.totalDeduction)} bold color="text-red-600" />
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Rincian PPh 21</h3>
                <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-800">
                  <ResultRow label="Penghasilan Bruto Tahunan" value={formatCurrency(previewResult.pph21Calculation?.annualGross)} />
                  <ResultRow label="Biaya Jabatan" value={formatCurrency(previewResult.pph21Calculation?.biayaJabatan)} />
                  <ResultRow label="Iuran BPJS Tahunan" value={formatCurrency(previewResult.pph21Calculation?.annualBpjs)} />
                  <ResultRow label="Netto" value={formatCurrency(previewResult.pph21Calculation?.netto)} />
                  <ResultRow label="PTKP" value={formatCurrency(previewResult.pph21Calculation?.ptkp)} />
                  <ResultRow label="PKP" value={formatCurrency(previewResult.pph21Calculation?.pkp)} />
                  <ResultRow label="PPh 21 Tahunan" value={formatCurrency(previewResult.pph21Calculation?.annualTax)} />
                  <ResultRow label="PPh 21 Bulanan" value={formatCurrency(previewResult.pph21Calculation?.monthlyTax)} bold />
                </div>
              </div>
              <div className="md:col-span-2 bg-primary-800 rounded-xl p-5 text-white text-center">
                <p className="text-sm text-primary-200 mb-1">GAJI BERSIH (ESTIMASI) — {previewEmployee?.employeeName || ""}</p>
                <p className="text-3xl font-bold">{formatCurrency(previewResult.netSalary)}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setShowPreview(false)} className="btn-secondary">
              <X className="w-4 h-4" /> Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction === "process"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => processMutation.mutate()}
        title="Proses Penggajian"
        description="Sistem akan menghitung gaji untuk semua karyawan aktif. Data yang sudah ada akan diperbarui."
        confirmLabel="Proses Sekarang"
        variant="primary"
        loading={processMutation.isPending}
      />
      <ConfirmDialog
        open={confirmAction === "finalize"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => finalizeMutation.mutate()}
        title="Finalisasi Periode"
        description="Setelah difinalisasi, data gaji tidak bisa diubah lagi dan cicilan pinjaman akan otomatis diproses."
        confirmLabel="Finalisasi"
        variant="primary"
        loading={finalizeMutation.isPending}
      />
      <ConfirmDialog
        open={confirmAction === "sendAll"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => sendAllMutation.mutate()}
        title="Kirim Email Slip Gaji"
        description="Slip gaji akan dikirim ke email semua karyawan yang memiliki alamat email terdaftar."
        confirmLabel="Kirim Semua"
        variant="primary"
        loading={sendAllMutation.isPending}
      />
    </div>
  );
}
