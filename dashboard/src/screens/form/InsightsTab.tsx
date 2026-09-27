import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../../lib/api";
import type { FormStats } from "../../lib/types";
import type { FormContext } from "./FormScreen";
import { PageSpinner } from "../../components/ui/Spinner";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function InsightsTab() {
  const { form } = useOutletContext<FormContext>();
  const [stats, setStats] = useState<FormStats | null>(null);

  useEffect(() => {
    api<FormStats>(`/api/forms/${form.id}/stats`).then(setStats);
  }, [form.id]);

  const theme = useMemo(
    () => ({
      accent: cssVar("--accent") || "#35e5a3",
      accentStrong: cssVar("--accent-strong") || "#10b981",
      border: cssVar("--border-strong") || "#2f463a",
      muted: cssVar("--text-faint") || "#5f7469",
      surface: cssVar("--surface-2") || "#16221d",
      text: cssVar("--text") || "#e9f4ee",
    }),
    []
  );

  if (!stats) return <PageSpinner />;

  const tooltipStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    color: theme.text,
    fontSize: 13,
  };

  const last7 = stats.perDay.slice(-7).reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="stack-24">
      <div className="insight-stats">
        <div className="card insight-stat">
          <span className="insight-stat-value">{stats.total.toLocaleString()}</span>
          <span className="insight-stat-label">Total submissions</span>
        </div>
        <div className="card insight-stat">
          <span className="insight-stat-value">{last7.toLocaleString()}</span>
          <span className="insight-stat-label">Last 7 days</span>
        </div>
        <div className="card insight-stat">
          <span className="insight-stat-value">
            {stats.byCountry[0]?.country ?? "—"}
          </span>
          <span className="insight-stat-label">Top country</span>
        </div>
      </div>

      <div className="card">
        <h3 className="insight-title">Submissions · last 30 days</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={stats.perDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: theme.muted, fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(5)}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: theme.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: theme.border }} />
            <Area
              type="monotone"
              dataKey="count"
              name="Submissions"
              stroke={theme.accent}
              strokeWidth={2}
              fill="url(#fillSubmissions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-grid">
        <div className="card">
          <h3 className="insight-title">By country</h3>
          {stats.byCountry.length === 0 ? (
            <p className="insight-empty">No location data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats.byCountry}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: theme.muted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={90}
                  tick={{ fill: theme.muted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(53,229,163,0.06)" }} />
                <Bar
                  dataKey="count"
                  name="Submissions"
                  fill={theme.accentStrong}
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <MapContainer
            center={[24, 8]}
            zoom={1.6}
            scrollWheelZoom={false}
            style={{ height: 320, width: "100%", background: "#0d1512" }}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {stats.points.map((p, i) => (
              <CircleMarker
                key={i}
                center={[p.latitude, p.longitude]}
                radius={6}
                pathOptions={{
                  color: theme.accent,
                  fillColor: theme.accent,
                  fillOpacity: 0.55,
                  weight: 1.5,
                }}
              >
                <Popup>
                  {[p.city, p.country].filter(Boolean).join(", ") || "Unknown location"}
                  <br />
                  {new Date(p.createdAt).toLocaleDateString()}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
