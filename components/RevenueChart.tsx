"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export type RevenuePoint = { label: string; revenue: number };

const idr = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

export default function RevenueChart({ data, emptyLabel }: { data: RevenuePoint[]; emptyLabel?: string }) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc5d24" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#dc5d24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcebe0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7a70" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7a70" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : v)}
          />
          <Tooltip
            formatter={(value: number) => [idr(value), "Pendapatan"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dcebe0" }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#dc5d24" strokeWidth={2.5} fill="url(#revFill)" />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink/45">
          {emptyLabel ?? "Belum ada transaksi lunas pada periode ini."}
        </div>
      )}
    </div>
  );
}
