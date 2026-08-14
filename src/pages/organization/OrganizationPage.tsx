import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { departmentApi, positionApi } from "../../api";
import { PageHeader, PageLoader, EmptyState, Modal, ConfirmDialog } from "../../components/ui";

const tabs = ["Departemen", "Jabatan"];

export default function OrganizationPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Departments
  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentApi.getAll({ limit: 100 }).then(r => r.data.data),
  });

  // Positions
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ["positions", "all"],
    queryFn: () => positionApi.getAll({ limit: 100 }).then(r => r.data.data),
  });

  const deptList = deptData || [];
  const posList = posData || [];

  const [form, setForm] = useState({ name: "", description: "", departmentId: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", departmentId: "" });
    setShowModal(true);
  };

  const openEdit = async (item: any) => {
    setEditing(item);
    try {
      const fresh = activeTab === 0
        ? await departmentApi.getById(item.id).then(r => r.data.data)
        : await positionApi.getById(item.id).then(r => r.data.data);
      setForm({
        name: fresh.name,
        description: fresh.description || "",
        departmentId: fresh.departmentId || "",
      });
    } catch {
      setForm({
        name: item.name,
        description: item.description || "",
        departmentId: item.departmentId || "",
      });
    }
    setShowModal(true);
  };

  const deptMutation = useMutation({
    mutationFn: (d: any) => editing
      ? departmentApi.update(editing.id, d).then(r => r.data.data)
      : departmentApi.create(d).then(r => r.data.data),
    onSuccess: () => {
      toast.success(editing ? "Departemen berhasil diperbarui" : "Departemen berhasil dibuat");
      setShowModal(false);
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const posMutation = useMutation({
    mutationFn: (d: any) => editing
      ? positionApi.update(editing.id, d).then(r => r.data.data)
      : positionApi.create(d).then(r => r.data.data),
    onSuccess: () => {
      toast.success(editing ? "Jabatan berhasil diperbarui" : "Jabatan berhasil dibuat");
      setShowModal(false);
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      toast.success("Departemen berhasil dihapus");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const deletePosMutation = useMutation({
    mutationFn: (id: string) => positionApi.delete(id),
    onSuccess: () => {
      toast.success("Jabatan berhasil dihapus");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (activeTab === 0) deptMutation.mutate({ ...form });
    else {
      if (!form.departmentId) {
        toast.error("Pilih departemen terlebih dahulu");
        return;
      }
      posMutation.mutate({ ...form });
    }
  };

  const filteredDepts = deptList.filter((d: any) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPos = posList.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Organisasi"
        subtitle="Kelola departemen dan jabatan perusahaan"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Tambah {activeTab === 0 ? "Departemen" : "Jabatan"}
          </button>
        }
      />

      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setSearch(""); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 0 ? "Cari departemen..." : "Cari jabatan..."}
            className="input-base pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          {activeTab === 0 ? `${filteredDepts.length} departemen` : `${filteredPos.length} jabatan`}
        </div>
      </div>

      {activeTab === 0 && (
        <div className="card overflow-hidden">
          {deptLoading ? <PageLoader /> : filteredDepts.length === 0 ? (
            <EmptyState title="Belum ada departemen" description="Tambahkan departemen untuk struktur organisasi" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Nama</th>
                  <th className="table-th">Deskripsi</th>
                  <th className="table-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map((d: any) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="table-td font-medium">{d.name}</td>
                    <td className="table-td text-gray-500">{d.description || "-"}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Hapus">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="card overflow-hidden">
          {posLoading ? <PageLoader /> : filteredPos.length === 0 ? (
            <EmptyState title="Belum ada jabatan" description="Tambahkan jabatan untuk struktur organisasi" />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Nama</th>
                  <th className="table-th">Departemen</th>
                  <th className="table-th">Deskripsi</th>
                  <th className="table-th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPos.map((p: any) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td text-gray-500">{p.departmentName || "-"}</td>
                    <td className="table-td text-gray-500">{p.description || "-"}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Hapus">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit ${activeTab === 0 ? "Departemen" : "Jabatan"}` : `Tambah ${activeTab === 0 ? "Departemen" : "Jabatan"}`} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama *</label>
            <input
              className="input-base"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={activeTab === 0 ? "Contoh: Finance" : "Contoh: Staff Finance"}
            />
          </div>
          {activeTab === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Departemen *</label>
              <select
                className="input-base"
                value={form.departmentId}
                onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}
              >
                <option value="">-- Pilih Departemen --</option>
                {deptList.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              className="input-base"
              rows={2}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={deptMutation.isPending || posMutation.isPending}>
              {(deptMutation.isPending || posMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && (activeTab === 0 ? deleteDeptMutation.mutate(deleteId) : deletePosMutation.mutate(deleteId))}
        title={`Hapus ${activeTab === 0 ? "Departemen" : "Jabatan"}`}
        description={`${activeTab === 0 ? "Departemen" : "Jabatan"} akan dihapus permanen. Departemen/jabatan yang masih dipakai karyawan tidak bisa dihapus.`}
        confirmLabel="Hapus"
        loading={deleteDeptMutation.isPending || deletePosMutation.isPending}
      />
    </div>
  );
}
