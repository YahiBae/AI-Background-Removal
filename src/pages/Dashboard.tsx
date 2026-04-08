import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Upload, ImageIcon, Clock, TrendingUp, GaugeCircle, CalendarDays } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { clearProcessingEvents, getProcessingEvents } from "@/lib/analytics";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const HISTORY_STORAGE_KEY = "snap-background-history";

const dayLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
  });

const Dashboard = () => {
  const currentUser = getCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const analytics = useMemo(() => {
    const events = getProcessingEvents();
    const historyRaw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const historyItems = historyRaw ? (JSON.parse(historyRaw) as Array<{ id: string; originalName: string; createdAt: string }>) : [];

    const successEvents = events.filter((event) => event.success);
    const failedEvents = events.filter((event) => !event.success);

    const todayKey = new Date().toDateString();
    const imagesToday = successEvents.filter((event) => new Date(event.createdAt).toDateString() === todayKey).length;
    const averageMs = successEvents.length
      ? Math.round(successEvents.reduce((sum, event) => sum + event.durationMs, 0) / successEvents.length)
      : 0;
    const successRate = events.length ? Math.round((successEvents.length / events.length) * 100) : 0;

    const dailyMap = new Map<string, { day: string; count: number }>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toDateString(), { day: dayLabel(d), count: 0 });
    }

    successEvents.forEach((event) => {
      const key = new Date(event.createdAt).toDateString();
      const row = dailyMap.get(key);
      if (row) {
        row.count += 1;
      }
    });

    const modeBreakdown = [
      { name: "Single", value: successEvents.filter((event) => event.mode === "single").length },
      { name: "Batch", value: successEvents.filter((event) => event.mode === "batch").length },
    ];

    const recentUploads = [...historyItems]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 6);

    return {
      totalProcessed: successEvents.length,
      totalFailed: failedEvents.length,
      imagesToday,
      averageMs,
      successRate,
      weeklyData: Array.from(dailyMap.values()),
      modeBreakdown,
      recentUploads,
    };
  }, [refreshKey]);

  const clearAnalytics = () => {
    clearProcessingEvents();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back{currentUser ? `, ${currentUser.name}` : ""}! Your processing metrics are live.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={clearAnalytics}>
              Clear Analytics
            </Button>
            <Link to="/upload">
              <Button variant="cta" className="rounded-xl">
                <Upload className="w-4 h-4 mr-2" />
                New Upload
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: ImageIcon,
              label: "Images Today",
              value: analytics.imagesToday,
              color: "text-primary",
            },
            {
              icon: Clock,
              label: "Avg Time",
              value: `${(analytics.averageMs / 1000).toFixed(2)}s`,
              color: "text-secondary",
            },
            {
              icon: TrendingUp,
              label: "Total Processed",
              value: analytics.totalProcessed,
              color: "text-primary",
            },
            {
              icon: GaugeCircle,
              label: "Success Rate",
              value: `${analytics.successRate}%`,
              color: "text-accent",
            },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">7-Day Processing Trend</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8dffb" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Mode Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.modeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#7c3aed"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
          {analytics.recentUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upload history found yet. Process an image to populate analytics.</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentUploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.originalName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
