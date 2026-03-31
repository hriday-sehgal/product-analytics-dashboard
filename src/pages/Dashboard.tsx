import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";
import FilterBar from "@/components/FilterBar";
import FeatureBarChart from "@/components/FeatureBarChart";
import TrendLineChart from "@/components/TrendLineChart";
import {
  type Filters,
  type BarDataPoint,
  type LineDataPoint,
  fetchAnalytics,
  saveFilters,
  loadFilters,
  trackEvent,
} from "@/lib/analytics";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => {
    const saved = loadFilters();
    return saved || { startDate: "", endDate: "", age: "all", gender: "all" };
  });
  const [barData, setBarData] = useState<BarDataPoint[]>([]);
  const [lineData, setLineData] = useState<LineDataPoint[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const loadData = useCallback(async (f: Filters, feature?: string | null) => {
    setLoading(true);
    try {
      const result = await fetchAnalytics(f, feature || undefined);
      setBarData(result.barChartData);
      if (feature) setLineData(result.lineChartData);
      else setLineData([]);
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters, selectedFeature);
  }, [filters, selectedFeature, loadData]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    saveFilters(newFilters);
  };

  const handleSelectFeature = (name: string) => {
    setSelectedFeature(name);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await supabase.functions.invoke("seed");
      if (res.error) throw res.error;
      toast.success(`Seeded: ${res.data.clicks_created} clicks, ${res.data.users_created} users`);
      loadData(filters, selectedFeature);
    } catch (err: any) {
      toast.error("Seed failed: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleRefresh = () => {
    trackEvent("dashboard_refresh");
    loadData(filters, selectedFeature);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-gradient tracking-tight">
            Product Analytics
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              <Database className="h-3.5 w-3.5 mr-1.5" />
              {seeding ? "Seeding..." : "Seed Data"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="glass-card p-5">
          <FilterBar filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureBarChart
            data={barData}
            selectedFeature={selectedFeature}
            onSelectFeature={handleSelectFeature}
          />
          <TrendLineChart data={lineData} featureName={selectedFeature} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clicks", value: barData.reduce((s, d) => s + d.count, 0) },
            { label: "Features Tracked", value: barData.length },
            { label: "Top Feature", value: barData.sort((a, b) => b.count - a.count)[0]?.feature_name || "—" },
            { label: "Trend Points", value: lineData.length },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-foreground font-display">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
