"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartPoint = { date: string; accuracy: number; topic: string };

export function AccuracyChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground text-sm">
        No quiz data yet. Take a quiz to see your accuracy trend.
      </div>
    );
  }
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="rounded-md border bg-card px-3 py-2 text-sm shadow">
                  <p className="font-medium">{p.topic || "Quiz"}</p>
                  <p className="text-muted-foreground">{p.date} · {p.accuracy}%</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#accuracyGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
