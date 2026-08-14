import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Edit, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api";
import {
  PageHeader, PageLoader, EmptyState, Pagination, ConfirmDialog,
} from "../../components/ui";
import { formatCurrency, formatDateShort, EMPLOYEE_STATUS_MAP } from "../../utils";

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", page, search, status],
    queryFn: () => employeeApi.getAll({ page, limit: 15, search, status }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      toast.success("Karyawan berhasil dinonaktifkan");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const employees = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Manajemen Karyawan"
        subtitle={`${pagination?.total || 0} karyawan terdaftar`}
        action={
          <Link to="/employees/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah Karyawan
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, no. karyawan..."
            className="input-base pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-base w-40"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
          <option value="resigned">Resign</option>
          <option value="terminated">PHK</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : employees.length === 0 ? (
          <EmptyState
            title="Belum ada karyawan"
            description="Tambahkan karyawan pertama untuk memulai"
            action={
              <Link to="/employees/new" className="btn-primary">
                <Plus className="w-4 h-4" /> Tambah Karyawan
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">No. Karyawan</th>
                    <th className="table-th">Nama</th>
                    <th className="table-th">Departemen</th>
                    <th className="table-th">Jabatan</th>
                    <th className="table-th">Bergabung</th>
                    <th className="table-th">Gaji Pokok</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: any) => {
                    const statusInfo = EMPLOYEE_STATUS_MAP[emp.status] || { label: emp.status, className: "badge-inactive" };
                    return (
                      <tr key={emp.id} className="border-t hover:bg-gray-50">
                        <td className="table-td font-mono text-xs">{emp.employeeNumber}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                              {emp.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{emp.name}</p>
                              <p className="text-xs text-gray-400">{emp.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-gray-500">{emp.departmentName || "-"}</td>
                        <td className="table-td text-gray-500">{emp.positionName || "-"}</td>
                        <td className="table-td text-gray-500">{formatDateShort(emp.joinDate)}</td>
                        <td className="table-td font-medium">{formatCurrency(emp.basicSalary)}</td>
                        <td className="table-td">
                          <span className={statusInfo.className}>{statusInfo.label}</span>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/employees/${emp.id}`}
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Link>
                            <Link
                              to={`/employees/${emp.id}/edit`}
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Link>
                            {emp.status === "active" && (
                              <button
                                onClick={() => setDeleteId(emp.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg"
                                title="Nonaktifkan"
                              >
                                <UserX className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Nonaktifkan Karyawan"
        description="Karyawan akan dinonaktifkan. Data tidak akan dihapus permanen."
        confirmLabel="Nonaktifkan"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
