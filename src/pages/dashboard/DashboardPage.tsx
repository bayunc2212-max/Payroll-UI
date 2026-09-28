import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, Banknote, TrendingUp, CreditCard } from "lucide-react";
import { dashboardApi } from "../../api";
import { StatCard, PageLoader } from "../../components/ui";
import { formatCurrency, getMonthName } from "../../utils";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const summary = data?.summary;
  const chartData = data?.chartData?.map((p: any) => ({
    name: `${getMonthName(p.periodMonth).slice(0, 3)} ${p.periodYear}`,
    bruto: p.totalGross,
    bersih: p.totalNet,
    pph21: p.totalPph21,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Company payroll summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Employees"
          value={String(summary?.totalActiveEmployees || 0)}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          subtitle="Employees"
        />
        <StatCard
          title="Total Payroll (Last Period)"
          value={formatCurrency(summary?.currentPeriodNet || 0)}
          icon={<Banknote className="w-5 h-5" />}
          color="green"
          subtitle="Net salary"
          trend={
            summary?.growthPercentage !== "0"
              ? {
                  value: `${Math.abs(parseFloat(summary?.growthPercentage || "0"))}%`,
                  positive: parseFloat(summary?.growthPercentage || "0") >= 0,
                }
              : undefined
          }
        />
        <StatCard
          title="Total PPh 21"
          value={formatCurrency(summary?.currentPeriodPph21 || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
          subtitle="Last period"
        />
        <StatCard
          title="Active Loans"
          value={String(summary?.totalActiveLoans || 0)}
          icon={<CreditCard className="w-5 h-5" />}
          color="orange"
          subtitle="Employees with loans"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Gaji per bulan */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Payroll Trend (6 Months)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="bruto" name="Gross Salary" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bersih" name="Net Salary" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              No payroll data yet
            </div>
          )}
        </div>

        {/* Line Chart - PPh 21 */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">PPh 21 Trend (6 Months)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="pph21" name="PPh 21" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              No PPh 21 data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Periods */}
      <div className="card">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Recent Payroll Periods</h3>
        </div>
        {data?.recentPeriods?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Period</th>
                <th className="table-th">Payment Date</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPeriods.map((p: any) => (
                <tr key={p.periodId} className="border-t hover:bg-gray-50">
                  <td className="table-td font-medium">{p.name}</td>
                  <td className="table-td text-gray-500">{p.paymentDate || "-"}</td>
                  <td className="table-td">
                    <span className={
                      p.status === "finalized" ? "badge-active" :
                      p.status === "processed" ? "badge-pending" : "badge-inactive"
                    }>
                      {p.status === "finalized" ? "Finalized" :
                       p.status === "processed" ? "Processed" :
                       p.status === "processing" ? "Processing" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            No payroll periods yet
          </div>
        )}
      </div>
    </div>
  );
}
