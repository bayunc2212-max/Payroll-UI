import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { attendanceApi, departmentApi } from "../../api";
import { PageHeader, PageLoader } from "../../components/ui";
import { getMonthName } from "../../utils";

const currentDate = new Date();

export default function AttendancePage() {
  const qc = useQueryClient();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [departmentId, setDepartmentId] = useState("");
  const [localData, setLocalData] = useState<Record<string, any>>({});

  const { data: deptData } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentApi.getAll({ limit: 100 }).then(r => r.data.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["attendance", year, month, departmentId],
    queryFn: () => attendanceApi.getByPeriod({ year, month, departmentId: departmentId || undefined })
      .then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (records: any[]) => attendanceApi.bulkUpsert(records),
    onSuccess: () => {
      toast.success("Attendance data saved successfully");
      setLocalData({});
      refetch();
    },
  });

  const saveOneMutation = useMutation({
    mutationFn: (record: any) => attendanceApi.upsert(record),
    onSuccess: (_, record: any) => {
        toast.success(`Attendance for ${record.employeeName} saved`);
      refetch();
    },
  });

  const handleSaveOne = (emp: any) => {
    const local = localData[emp.id] || {};
    const att = emp.attendance;
    saveOneMutation.mutate({
      employeeId: emp.id,
      employeeName: emp.name,
      periodYear: year,
      periodMonth: month,
      workingDays: local.workingDays ?? att.workingDays,
      presentDays: local.presentDays ?? att.presentDays,
      sickDays: local.sickDays ?? att.sickDays,
      permissionDays: local.permissionDays ?? att.permissionDays,
      absentDays: local.absentDays ?? att.absentDays,
      overtimeHours: local.overtimeHours ?? att.overtimeHours,
      notes: local.notes ?? att.notes,
    });
  };

  const handleChange = (employeeId: string, field: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      [employeeId]: { ...(prev[employeeId] || {}), [field]: value },
    }));
  };

  const handleSaveAll = () => {
    if (!data?.employees) return;
    const records = data.employees.map((emp: any) => {
      const local = localData[emp.id] || {};
      const att = emp.attendance;
      return {
        employeeId: emp.id,
        periodYear: year,
        periodMonth: month,
        workingDays: local.workingDays ?? att.workingDays,
        presentDays: local.presentDays ?? att.presentDays,
        sickDays: local.sickDays ?? att.sickDays,
        permissionDays: local.permissionDays ?? att.permissionDays,
        absentDays: local.absentDays ?? att.absentDays,
        overtimeHours: local.overtimeHours ?? att.overtimeHours,
        notes: local.notes ?? att.notes,
      };
    });
    saveMutation.mutate(records);
  };

  const getValue = (emp: any, field: string, defaultVal: string = "0") => {
    return localData[emp.id]?.[field] ?? emp.attendance?.[field] ?? defaultVal;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        subtitle="Enter employee attendance per period"
        action={
          <button onClick={handleSaveAll} className="btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="input-base w-32" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input-base w-40" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
          ))}
        </select>
        <select className="input-base w-48" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
          <option value="">All Departments</option>
          {deptData?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="text-sm text-gray-500 flex items-center">
          Period: <span className="font-medium ml-1">{getMonthName(month)} {year}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th sticky left-0 bg-gray-50 z-10">Employee</th>
                  <th className="table-th text-center">Working Days</th>
                  <th className="table-th text-center">Present</th>
                  <th className="table-th text-center">Sick</th>
                  <th className="table-th text-center">Leave</th>
                  <th className="table-th text-center">Absent</th>
                  <th className="table-th text-center">Overtime (hours)</th>
                  <th className="table-th">Notes</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.employees?.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No active employees</td></tr>
                ) : data?.employees?.map((emp: any) => (
                  <tr key={emp.id} className="border-t hover:bg-gray-50">
                    <td className="table-td sticky left-0 bg-white">
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.departmentName || "—"}</p>
                      </div>
                    </td>
                    {["workingDays", "presentDays", "sickDays", "permissionDays", "absentDays"].map(field => (
                      <td key={field} className="table-td text-center p-2">
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={getValue(emp, field)}
                          onChange={e => handleChange(emp.id, field, e.target.value)}
                          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </td>
                    ))}
                    <td className="table-td p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={getValue(emp, "overtimeHours")}
                        onChange={e => handleChange(emp.id, "overtimeHours", e.target.value)}
                        className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="table-td p-2">
                      <input
                        type="text"
                        value={getValue(emp, "notes", "")}
                        onChange={e => handleChange(emp.id, "notes", e.target.value)}
                        placeholder="Optional"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => handleSaveOne(emp)}
                        disabled={saveOneMutation.isPending}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                        title="Save this employee's attendance"
                      >
                        {saveOneMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
