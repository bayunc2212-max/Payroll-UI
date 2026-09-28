import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, ArrowLeft, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api";
import { PageLoader, ConfirmDialog } from "../../components/ui";
import { formatCurrency, formatDate, formatDateShort, EMPLOYEE_STATUS_MAP, TAX_STATUS_OPTIONS } from "../../utils";

const tabs = ["Personal Info", "Salary & BPJS", "Documents", "History"];

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
      toast.success("Document deleted successfully");
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
      toast.success("Document uploaded successfully");
      qc.invalidateQueries({ queryKey: ["employee-docs", id] });
    } catch {}
    e.target.value = "";
  };

  if (isLoading) return <PageLoader />;
  if (!emp) return <div className="text-center py-12 text-gray-400">Employee not found</div>;

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
              <p className="text-sm text-gray-500">{emp.employeeNumber} · {emp.positionName || "Position not set"}</p>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Data</h3>
            <dl>
              <InfoRow label="NIK" value={emp.nik} />
              <InfoRow label="Gender" value={emp.gender === "male" ? "Male" : emp.gender === "female" ? "Female" : null} />
              <InfoRow label="Birth Place" value={emp.birthPlace} />
              <InfoRow label="Birth Date" value={formatDate(emp.birthDate)} />
              <InfoRow label="Address" value={emp.address} />
              <InfoRow label="Phone" value={emp.phone} />
              <InfoRow label="Email" value={emp.email} />
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Employment Data</h3>
            <dl>
              <InfoRow label="Department" value={emp.departmentName} />
              <InfoRow label="Position" value={emp.positionName} />
              <InfoRow label="Join Date" value={formatDate(emp.joinDate)} />
              <InfoRow label="Marital Status" value={emp.maritalStatus} />
              <InfoRow label="Dependents" value={String(emp.dependents || 0)} />
              <InfoRow label="Tax Status (PTKP)" value={taxLabel} />
              <InfoRow label="NPWP" value={emp.npwp} />
            </dl>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Salary Components</h3>
            <dl>
              <InfoRow label="Base Salary" value={formatCurrency(emp.basicSalary)} />
              <InfoRow label="Transport Allowance" value={formatCurrency(emp.allowanceTransport)} />
              <InfoRow label="Meal Allowance" value={formatCurrency(emp.allowanceMeal)} />
              <InfoRow label="Position Allowance" value={formatCurrency(emp.allowancePosition)} />
              <InfoRow label="Other Allowances" value={formatCurrency(emp.allowanceOther)} />
              <InfoRow label="Total Allowances" value={formatCurrency(
                (Number(emp.allowanceTransport) + Number(emp.allowanceMeal) +
                 Number(emp.allowancePosition) + Number(emp.allowanceOther))
              )} />
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">BPJS & Bank Account</h3>
            <dl>
              <InfoRow label="BPJS Kesehatan" value={emp.isBpjsHealth ? "✅ Registered" : "❌ No"} />
              <InfoRow label="BPJS Kesehatan No." value={emp.bpjsHealthNumber} />
              <InfoRow label="BPJS Ketenagakerjaan" value={emp.isBpjsEmployment ? "✅ Registered" : "❌ No"} />
              <InfoRow label="BPJS Ketenagakerjaan No." value={emp.bpjsEmploymentNumber} />
              <InfoRow label="Bank" value={emp.bankName} />
              <InfoRow label="Account Number" value={emp.bankAccountNumber} />
              <InfoRow label="Account Name" value={emp.bankAccountName} />
            </dl>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-sm font-semibold text-gray-700">Employee Documents</h3>
            <label className="btn-secondary cursor-pointer text-sm">
              <Upload className="w-4 h-4" /> Upload Document
              <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </label>
          </div>
          {documents?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">File Name</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Uploaded</th>
                  <th className="table-th">Actions</th>
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
            <div className="py-12 text-center text-sm text-gray-400">No documents yet</div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-700">Salary History</h3>
            </div>
            {salaryHistory?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Base Salary</th>
                  <th className="table-th">Notes</th>
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
            ) : <div className="py-8 text-center text-sm text-gray-400">No history yet</div>}
          </div>
          <div className="card">
            <div className="px-5 py-4 border-b">
              <h3 className="text-sm font-semibold text-gray-700">Position History</h3>
            </div>
            {positionHistory?.length > 0 ? (
              <table className="w-full">
                <thead><tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Position</th>
                  <th className="table-th">Department</th>
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
            ) : <div className="py-8 text-center text-sm text-gray-400">No history yet</div>}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        onConfirm={() => deleteDocId && deleteDocMutation.mutate(deleteDocId)}
        title="Delete Document"
        description="This document will be permanently deleted."
        loading={deleteDocMutation.isPending}
      />
    </div>
  );
}
