import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_UPLOAD_API_BASE_URL;

type Activity = {
  userID: string;
  start_time: number; // Unix seconds
  total_timer_time?: number; // seconds
  avg_speed?: number; // km/h
};

function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${m}:${String(ss).padStart(2, "0")}`;
}

export default function ActivitiesChart() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) throw new Error("No idToken");

        const res = await fetch(`${API_BASE_URL}/activities`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`GET /activities failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        setItems(data.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const chartData = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => a.start_time - b.start_time)
      .map((a) => ({
        start_time: a.start_time,
        duration_s: a.total_timer_time ?? 0,
        speed_kmh: a.avg_speed ?? 0,
      }));
  }, [items]);

  if (loading) return <div>Loading activities…</div>;
  if (!chartData.length) return <div>No activities found.</div>;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: "16px 16px 10px",
        background: "rgba(255, 255, 255, 0.88)",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Speed vs. Duration</div>
      </div>

      {/* Wichtig: ResponsiveContainer braucht eine feste Höhe */}
      <div style={{ width: "100%", height: 320, marginTop: 8 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="duration_s"
              tickFormatter={(v) => formatDuration(Number(v))}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "km/h", angle: -90, position: "insideLeft" }}
            />

            <Tooltip
              contentStyle={{ borderRadius: 12 }}
              labelFormatter={(v) => `${formatDuration(Number(v))}`}
              formatter={(v, name) => {
                if (name === "speed_kmh") return [`${v} km/h`, "avg_speed"];
                return [v as any, name as any];
              }}
            />

            <Line
              type="monotone"
              dataKey="speed_kmh"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
        X: total_timer_time (Dauer) • Y: avg_speed (km/h)
      </div>
    </div>
  );
}