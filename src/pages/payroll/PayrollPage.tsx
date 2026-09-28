import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { payrollApi } from "../../api";
import { PageHeader, PageLoader, EmptyState, Pagination, Modal } from "../../components/ui";
import { formatDateShort, getMonthName, PERIOD_STATUS_MAP } from "../../utils";

export default function PayrollPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const currentDate = new Date();

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-periods", page],
    queryFn: () => payrollApi.getPeriods({ page, limit: 15 }).then(r => r.data),
  });

  const [form, setForm] = useState({
    name: `${getMonthName(currentDate.getMonth() + 1)} ${currentDate.getFullYear()}`,
    periodYear: String(currentDate.getFullYear()),
    periodMonth: String(currentDate.getMonth() + 1),
    startDate: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`,
    cutOffDate: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-25`,
    paymentDate: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-28`,
    workingDays: "22",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => payrollApi.createPeriod(d),
    onSuccess: () => {
      toast.success("Payroll period created successfully");
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });

  const periods = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Payroll Management"
        subtitle="Manage payroll periods and run employee payroll"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Period
          </button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : periods.length === 0 ? (
          <EmptyState
            title="No payroll periods yet"
            description="Create your first period to start the payroll process"
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Create Period
              </button>
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Period</th>
                  <th className="table-th">Cut-off Date</th>
                  <th className="table-th">Payment Date</th>
                  <th className="table-th">Working Days</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p: any) => {
                  const statusInfo = PERIOD_STATUS_MAP[p.status] || { label: p.status, className: "badge-inactive" };
                  return (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="table-td font-medium">{p.name}</td>
                      <td className="table-td text-gray-500">{formatDateShort(p.cutOffDate)}</td>
                      <td className="table-td text-gray-500">{formatDateShort(p.paymentDate)}</td>
                      <td className="table-td text-center">{p.workingDays} days</td>
                      <td className="table-td"><span className={statusInfo.className}>{statusInfo.label}</span></td>
                      <td className="table-td">
                        <Link to={`/payroll/${p.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg inline-flex">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Payroll Period" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Period Name *</label>
            <input className="input-base" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year *</label>
              <input type="number" className="input-base" value={form.periodYear}
                onChange={e => setForm(p => ({ ...p, periodYear: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Month *</label>
              <select className="input-base" value={form.periodMonth}
                onChange={e => setForm(p => ({ ...p, periodMonth: e.target.value }))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
              <input type="date" className="input-base" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cut-off Date *</label>
              <input type="date" className="input-base" value={form.cutOffDate}
                onChange={e => setForm(p => ({ ...p, cutOffDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date *</label>
              <input type="date" className="input-base" value={form.paymentDate}
                onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Period Working Days</label>
              <input type="number" className="input-base" value={form.workingDays}
                onChange={e => setForm(p => ({ ...p, workingDays: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea className="input-base" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Period"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
