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
        <p className="text-sm text-gray-500">Ringkasan data payroll perusahaan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Karyawan Aktif"
          value={String(summary?.totalActiveEmployees || 0)}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          subtitle="Karyawan"
        />
        <StatCard
          title="Total Gaji (Periode Terakhir)"
          value={formatCurrency(summary?.currentPeriodNet || 0)}
          icon={<Banknote className="w-5 h-5" />}
          color="green"
          subtitle="Gaji bersih"
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
          subtitle="Periode terakhir"
        />
        <StatCard
          title="Pinjaman Aktif"
          value={String(summary?.totalActiveLoans || 0)}
          icon={<CreditCard className="w-5 h-5" />}
          color="orange"
          subtitle="Karyawan dengan pinjaman"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Gaji per bulan */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Trend Penggajian (6 Bulan)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="bruto" name="Gaji Bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bersih" name="Gaji Bersih" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              Belum ada data penggajian
            </div>
          )}
        </div>

        {/* Line Chart - PPh 21 */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Trend PPh 21 (6 Bulan)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="pph21" name="PPh 21" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              Belum ada data PPh 21
            </div>
          )}
        </div>
      </div>

      {/* Recent Periods */}
      <div className="card">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Periode Penggajian Terakhir</h3>
        </div>
        {data?.recentPeriods?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Periode</th>
                <th className="table-th">Tanggal Bayar</th>
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
                      {p.status === "finalized" ? "Final" :
                       p.status === "processed" ? "Diproses" :
                       p.status === "processing" ? "Memproses" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            Belum ada periode penggajian
          </div>
        )}
      </div>
    </div>
  );
}
