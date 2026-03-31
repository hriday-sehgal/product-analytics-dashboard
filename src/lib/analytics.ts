import { supabase } from "@/integrations/supabase/client";

export async function trackEvent(featureName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  try {
    await supabase.functions.invoke("track", {
      body: { feature_name: featureName },
    });
  } catch (e) {
    console.error("Track error:", e);
  }
}

// Cookie helpers
export function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export interface Filters {
  startDate: string;
  endDate: string;
  age: string;
  gender: string;
}

export function saveFilters(filters: Filters) {
  setCookie("analytics_filters", JSON.stringify(filters));
}

export function loadFilters(): Filters | null {
  const raw = getCookie("analytics_filters");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface BarDataPoint {
  feature_name: string;
  count: number;
}

export interface LineDataPoint {
  date: string;
  count: number;
}

export async function fetchAnalytics(
  filters: Filters,
  featureName?: string
): Promise<{ barChartData: BarDataPoint[]; lineChartData: LineDataPoint[] }> {
  const params: Record<string, string> = {};
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.age) params.age = filters.age;
  if (filters.gender) params.gender = filters.gender;
  if (featureName) params.feature_name = featureName;

  const { data, error } = await supabase.functions.invoke("analytics", {
    body: null,
    headers: { "Content-Type": "application/json" },
    method: "GET",
  });

  // Since functions.invoke doesn't support query params well for GET,
  // we'll construct manually
  const url = new URL(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics`
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const session = (await supabase.auth.getSession()).data.session;
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
