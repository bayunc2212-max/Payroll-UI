import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { loanApi, employeeApi } from "../../api";
import { PageHeader, PageLoader, EmptyState, Pagination, Modal, ConfirmDialog } from "../../components/ui";
import { formatCurrency, formatDateShort, LOAN_STATUS_MAP } from "../../utils";

export default function LoansPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["loans", page, status],
    queryFn: () => loanApi.getAll({ page, limit: 15, status: status || undefined }).then(r => r.data),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["loan-detail", detailId],
    queryFn: () => loanApi.getById(detailId!).then(r => r.data.data),
    enabled: !!detailId,
  });

  const { data: detailPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["loan-payments", detailId],
    queryFn: () => loanApi.getPayments(detailId!).then(r => r.data.data),
    enabled: !!detailId,
  });

  const { data: empData } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: () => employeeApi.getAll({ limit: 200, status: "active" }).then(r => r.data.data),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => loanApi.create(data),
    onSuccess: () => {
      toast.success("Pinjaman berhasil dibuat");
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => loanApi.approve(id, { status: "ongoing" }),
    onSuccess: () => {
      toast.success("Pinjaman disetujui");
      setApproveId(null);
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => loanApi.reject(id),
    onSuccess: () => {
      toast.success("Pinjaman ditolak");
      setRejectId(null);
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const [form, setForm] = useState({
    employeeId: "", amount: "", installmentAmount: "", totalInstallments: "", startDate: "", notes: "",
  });

  const handleCreate = () => {
    if (!form.employeeId || !form.amount || !form.installmentAmount || !form.totalInstallments) {
      toast.error("Lengkapi semua field yang wajib"); return;
    }
    createMutation.mutate(form);
  };

  const loans = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Manajemen Kasbon & Pinjaman"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Pinjaman
          </button>
        }
      />

      <div className="flex gap-3 mb-4">
        <select className="input-base w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="ongoing">Aktif</option>
          <option value="paid_off">Lunas</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : loans.length === 0 ? (
          <EmptyState title="Belum ada data pinjaman" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Karyawan</th>
                    <th className="table-th">Jumlah Pinjaman</th>
                    <th className="table-th">Cicilan/Bln</th>
                    <th className="table-th">Progress</th>
                    <th className="table-th">Sisa</th>
                    <th className="table-th">Mulai</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan: any) => {
                    const statusInfo = LOAN_STATUS_MAP[loan.status] || { label: loan.status, className: "badge-inactive" };
                    const progress = loan.totalInstallments > 0
                      ? Math.round((loan.paidInstallments / loan.totalInstallments) * 100) : 0;
                    return (
                      <tr key={loan.id} className="border-t hover:bg-gray-50">
                        <td className="table-td">
                          <p className="font-medium">{loan.employeeName}</p>
                          <p className="text-xs text-gray-400">{loan.employeeNumber}</p>
                        </td>
                        <td className="table-td font-medium">{formatCurrency(loan.amount)}</td>
                        <td className="table-td">{formatCurrency(loan.installmentAmount)}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-primary-500 rounded-full h-1.5" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {loan.paidInstallments}/{loan.totalInstallments}
                            </span>
                          </div>
                        </td>
                        <td className="table-td font-medium text-red-600">{formatCurrency(loan.remainingAmount)}</td>
                        <td className="table-td text-gray-500">{formatDateShort(loan.startDate)}</td>
                        <td className="table-td"><span className={statusInfo.className}>{statusInfo.label}</span></td>
                        <td className="table-td">
                          <div className="flex gap-1">
                            <button onClick={() => setDetailId(loan.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg" title="Detail">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {loan.status === "pending" && (
                              <>
                                <button onClick={() => setApproveId(loan.id)}
                                  className="p-1.5 hover:bg-green-50 rounded-lg" title="Setujui">
                                  <Check className="w-4 h-4 text-green-600" />
                                </button>
                                <button onClick={() => setRejectId(loan.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg" title="Tolak">
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tambah Pinjaman" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Karyawan *</label>
            <select className="input-base" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}>
              <option value="">-- Pilih Karyawan --</option>
              {empData?.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.employeeNumber})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Pinjaman *</label>
              <input type="number" className="input-base" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="5000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cicilan per Bulan *</label>
              <input type="number" className="input-base" value={form.installmentAmount}
                onChange={e => setForm(p => ({ ...p, installmentAmount: e.target.value }))} placeholder="500000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Cicilan (bulan) *</label>
              <input type="number" className="input-base" value={form.totalInstallments}
                onChange={e => setForm(p => ({ ...p, totalInstallments: e.target.value }))} placeholder="10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mulai Cicilan</label>
              <input type="date" className="input-base" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan</label>
            <textarea className="input-base" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Batal</button>
            <button onClick={handleCreate} className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!approveId} onClose={() => setApproveId(null)}
        onConfirm={() => approveId && approveMutation.mutate(approveId)}
        title="Setujui Pinjaman" description="Pinjaman akan disetujui dan cicilan mulai berjalan."
        confirmLabel="Setujui" variant="primary" loading={approveMutation.isPending} />

      <ConfirmDialog open={!!rejectId} onClose={() => setRejectId(null)}
        onConfirm={() => rejectId && rejectMutation.mutate(rejectId)}
        title="Tolak Pinjaman" description="Pinjaman akan ditolak."
        confirmLabel="Tolak" loading={rejectMutation.isPending} />

      {/* Detail Modal */}
      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Detail Pinjaman" size="lg">
        {detailLoading ? <PageLoader /> : detailData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Karyawan</p>
                <p className="text-sm font-medium text-gray-900">{detailData.employeeName || detailData.employeeId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Jumlah Pinjaman</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(detailData.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={(LOAN_STATUS_MAP[detailData.status] || { label: detailData.status, className: "badge-inactive" }).className}>
                  {(LOAN_STATUS_MAP[detailData.status] || { label: detailData.status, className: "badge-inactive" }).label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Cicilan per Bulan</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(detailData.installmentAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Cicilan Terbayar</p>
                <p className="text-sm font-medium text-gray-900">{detailData.paidInstallments} / {detailData.totalInstallments}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sisa Pinjaman</p>
                <p className="text-sm font-medium text-red-600">{formatCurrency(detailData.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Mulai Cicilan</p>
                <p className="text-sm font-medium text-gray-900">{detailData.startDate ? formatDateShort(detailData.startDate) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Disetujui</p>
                <p className="text-sm font-medium text-gray-900">{detailData.approvedAt ? formatDateShort(detailData.approvedAt) : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Dibuat</p>
                <p className="text-sm font-medium text-gray-900">{formatDateShort(detailData.createdAt)}</p>
              </div>
            </div>
            {detailData.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">Catatan: {detailData.notes}</p>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Cicilan</h3>
              {paymentsLoading ? <PageLoader /> : (detailPayments || detailData.payments || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  Belum ada pembayaran cicilan. Cicilan otomatis dicatat saat periode gaji difinalisasi.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Cicilan Ke-</th>
                      <th className="table-th">Tanggal Bayar</th>
                      <th className="table-th text-right">Jumlah</th>
                      <th className="table-th">Sumber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailPayments || detailData.payments || []).map((pm: any) => (
                      <tr key={pm.id} className="border-t">
                        <td className="table-td font-medium">#{pm.installmentNumber}</td>
                        <td className="table-td text-gray-500">{formatDateShort(pm.paymentDate)}</td>
                        <td className="table-td text-right font-medium text-green-700">{formatCurrency(pm.amount)}</td>
                        <td className="table-td text-gray-500">{pm.payslipId ? "Potongan gaji" : "Manual"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Data tidak ditemukan</div>
        )}
      </Modal>
    </div>
  );
}
