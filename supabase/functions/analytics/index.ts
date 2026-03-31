import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const ageFilter = url.searchParams.get("age");
    const genderFilter = url.searchParams.get("gender");
    const featureName = url.searchParams.get("feature_name");

    // Build query for bar chart data (aggregate by feature)
    let barQuery = supabase
      .from("feature_clicks")
      .select("feature_name, user_id, clicked_at, profiles!inner(age, gender)", { count: "exact" });

    if (startDate) barQuery = barQuery.gte("clicked_at", startDate);
    if (endDate) barQuery = barQuery.lte("clicked_at", endDate);
    if (genderFilter && genderFilter !== "all") {
      barQuery = barQuery.eq("profiles.gender", genderFilter);
    }
    if (ageFilter && ageFilter !== "all") {
      if (ageFilter === "<18") {
        barQuery = barQuery.lt("profiles.age", 18);
      } else if (ageFilter === "18-40") {
        barQuery = barQuery.gte("profiles.age", 18).lte("profiles.age", 40);
      } else if (ageFilter === ">40") {
        barQuery = barQuery.gt("profiles.age", 40);
      }
    }

    const { data: barData, error: barError } = await barQuery;

    if (barError) {
      return new Response(JSON.stringify({ error: barError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate bar data by feature_name
    const featureCounts: Record<string, number> = {};
    (barData || []).forEach((row: any) => {
      featureCounts[row.feature_name] = (featureCounts[row.feature_name] || 0) + 1;
    });
    const barChartData = Object.entries(featureCounts).map(([name, count]) => ({
      feature_name: name,
      count,
    }));

    // Line chart data: time trend for a specific feature
    let lineChartData: any[] = [];
    if (featureName) {
      let lineQuery = supabase
        .from("feature_clicks")
        .select("clicked_at, user_id, profiles!inner(age, gender)")
        .eq("feature_name", featureName)
        .order("clicked_at", { ascending: true });

      if (startDate) lineQuery = lineQuery.gte("clicked_at", startDate);
      if (endDate) lineQuery = lineQuery.lte("clicked_at", endDate);
      if (genderFilter && genderFilter !== "all") {
        lineQuery = lineQuery.eq("profiles.gender", genderFilter);
      }
      if (ageFilter && ageFilter !== "all") {
        if (ageFilter === "<18") {
          lineQuery = lineQuery.lt("profiles.age", 18);
        } else if (ageFilter === "18-40") {
          lineQuery = lineQuery.gte("profiles.age", 18).lte("profiles.age", 40);
        } else if (ageFilter === ">40") {
          lineQuery = lineQuery.gt("profiles.age", 40);
        }
      }

      const { data: lineData, error: lineError } = await lineQuery;
      if (lineError) {
        return new Response(JSON.stringify({ error: lineError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Group by day
      const dayCounts: Record<string, number> = {};
      (lineData || []).forEach((row: any) => {
        const day = row.clicked_at.split("T")[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      lineChartData = Object.entries(dayCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return new Response(
      JSON.stringify({ barChartData, lineChartData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
