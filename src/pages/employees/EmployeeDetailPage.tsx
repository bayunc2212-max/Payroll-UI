import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ArrowLeft, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api";
import { PageLoader, ConfirmDialog } from "../../components/ui";
import { formatCurrency, formatDate, formatDateShort, EMPLOYEE_STATUS_MAP, TAX_STATUS_OPTIONS } from "../../utils";

const tabs = ["Info Pribadi", "Gaji & BPJS", "Dokumen", "Riwayat"];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const { data: emp, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ["employee-docs", id],
    queryFn: () => employeeApi.getDocuments(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 2,
  });

  const { data: salaryHistory } = useQuery({
    queryKey: ["salary-history", id],
    queryFn: () => employeeApi.getSalaryHistory(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 3,
  });

  const { data: positionHistory } = useQuery({
    queryKey: ["position-history", id],
    queryFn: () => employeeApi.getPositionHistory(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 3,
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => employeeApi.deleteDocument(id!, docId),
    onSuccess: () => {
      toast.success("Dokumen berhasil dihapus");
      setDeleteDocId(null);
      qc.invalidateQueries({ queryKey: ["employee-docs", id] });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "other");
    fd.append("name", file.name);
    try {
      await employeeApi.uploadDocument(id!, fd);
      toast.success("Dokumen berhasil diupload");
      qc.invalidateQueries({ queryKey: ["employee-docs", id] });
    } catch {}
    e.target.value = "";
  };

  if (isLoading) return <PageLoader />;
  if (!emp) return <div className="text-center py-12 text-gray-400">Karyawan tidak ditemukan</div>;

  const statusInfo = EMPLOYEE_STATUS_MAP[emp.status] || { label: emp.status, className: "badge-inactive" };
  const taxLabel = TAX_STATUS_OPTIONS.find(t => t.value === emp.taxStatus)?.label || emp.taxStatus;

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value || "-"}</dd>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/employees")} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
              {emp.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{emp.name}</h1>
              <p className="text-sm text-gray-500">{emp.employeeNumber} · {emp.positionName || "Jabatan belum diatur"}</p>
            </div>
            <span className={statusInfo.className}>{statusInfo.label}</span>
          </div>
        </div>
        <Link to={`/employees/${id}/edit`} className="btn-secondary">
          <Edit className="w-4 h-4" /> Edit
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Pribadi</h3>
            <dl>
              <InfoRow label="NIK" value={emp.nik} />
              <InfoRow label="Jenis Kelamin" value={emp.gender === "male" ? "Laki-laki" : emp.gender === "female" ? "Perempuan" : null} />
              <InfoRow label="Tempat Lahir" value={emp.birthPlace} />
              <InfoRow label="Tanggal Lahir" value={formatDate(emp.birthDate)} />
              <InfoRow label="Alamat" value={emp.address} />
              <InfoRow label="No. HP" value={emp.phone} />
              <InfoRow label="Email" value={emp.email} />
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Data Kepegawaian</h3>
            <dl>
              <InfoRow label="Departemen" value={emp.departmentName} />
              <InfoRow label="Jabatan" value={emp.positionName} />
              <InfoRow label="Tanggal Masuk" value={formatDate(emp.joinDate)} />
              <InfoRow label="Status Pernikahan" value={emp.maritalStatus} />
              <InfoRow label="Tanggungan" value={String(emp.dependents || 0)} />
              <InfoRow label="Status Pajak (PTKP)" value={taxLabel} />
              <InfoRow label="NPWP" value={emp.npwp} />
            </dl>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Komponen Gaji</h3>
            <dl>
              <InfoRow label="Gaji Pokok" value={formatCurrency(emp.basicSalary)} />
              <InfoRow label="Tunjangan Transport" value={formatCurrency(emp.allowanceTransport)} />
              <InfoRow label="Tunjangan Makan" value={formatCurrency(emp.allowanceMeal)} />
              <InfoRow label="Tunjangan Jabatan" value={formatCurrency(emp.allowancePosition)} />
              <InfoRow label="Tunjangan Lainnya" value={formatCurrency(emp.allowanceOther)} />
              <InfoRow label="Total Tunjangan" value={formatCurrency(
                (Number(emp.allowanceTransport) + Number(emp.allowanceMeal) +
                 Number(emp.allowancePosition) + Number(emp.allowanceOther))
              )} />
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">BPJS & Rekening</h3>
            <dl>
              <InfoRow label="BPJS Kesehatan" value={emp.isBpjsHealth ? "✅ Terdaftar" : "❌ Tidak"} />
              <InfoRow label="No. BPJS Kesehatan" value={emp.bpjsHealthNumber} />
              <InfoRow label="BPJS Ketenagakerjaan" value={emp.isBpjsEmployment ? "✅ Terdaftar" : "❌ Tidak"} />
              <InfoRow label="No. BPJS Ketenagakerjaan" value={emp.bpjsEmploymentNumber} />
              <InfoRow label="Bank" value={emp.bankName} />
              <InfoRow label="No. Rekening" value={emp.bankAccountNumber} />
              <InfoRow label="Nama Rekening" value={emp.bankAccountName} />
            </dl>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Dokumen Karyawan</h3>
            <label className="btn-secondary cursor-pointer text-sm">
              <Upload className="w-4 h-4" /> Upload Dokumen
              <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </label>
          </div>
          {documents?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Nama File</th>
                  <th className="table-th">Tipe</th>
                  <th className="table-th">Diupload</th>
                  <th className="table-th">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="table-td">
                      <a href={doc.filePath} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                        {doc.name}
                      </a>
                    </td>
                    <td className="table-td capitalize text-gray-500">{doc.type}</td>
                    <td className="table-td text-gray-500">{formatDateShort(doc.createdAt)}</td>
                    <td className="table-td">
                      <button onClick={() => setDeleteDocId(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">Belum ada dokumen</div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-700">Riwayat Gaji</h3>
            </div>
            {salaryHistory?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-th">Tanggal</th>
                  <th className="table-th">Gaji Pokok</th>
                  <th className="table-th">Keterangan</th>
                </tr></thead>
                <tbody>
                  {salaryHistory.map((h: any) => (
                    <tr key={h.id} className="border-t">
                      <td className="table-td text-sm">{formatDateShort(h.effectiveDate)}</td>
                      <td className="table-td font-medium">{formatCurrency(h.basicSalary)}</td>
                      <td className="table-td text-gray-500 text-xs">{h.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-8 text-center text-sm text-gray-400">Belum ada riwayat</div>}
          </div>
          <div className="card">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-700">Riwayat Jabatan</h3>
            </div>
            {positionHistory?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-th">Tanggal</th>
                  <th className="table-th">Jabatan</th>
                  <th className="table-th">Departemen</th>
                </tr></thead>
                <tbody>
                  {positionHistory.map((h: any) => (
                    <tr key={h.id} className="border-t">
                      <td className="table-td text-sm">{formatDateShort(h.effectiveDate)}</td>
                      <td className="table-td font-medium">{h.positionName || "-"}</td>
                      <td className="table-td text-gray-500">{h.departmentName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-8 text-center text-sm text-gray-400">Belum ada riwayat</div>}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        onConfirm={() => deleteDocId && deleteDocMutation.mutate(deleteDocId)}
        title="Hapus Dokumen"
        description="Dokumen akan dihapus permanen."
        loading={deleteDocMutation.isPending}
      />
    </div>
  );
}
