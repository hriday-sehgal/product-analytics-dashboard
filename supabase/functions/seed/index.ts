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
    // Use service role for seeding
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const genders = ["Male", "Female", "Other"];
    const features = [
      "date_filter",
      "gender_filter",
      "age_filter",
      "bar_chart_click",
      "line_chart_hover",
      "dashboard_refresh",
    ];

    // Create 10 demo users
    const userIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const email = `demo${i}@analytics.test`;
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: "password123",
          email_confirm: true,
        });

      if (authError) {
        // User might already exist
        const { data: existingUsers } =
          await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u: any) => u.email === email
        );
        if (existing) {
          userIds.push(existing.id);
          continue;
        }
        console.error(`Failed to create user ${email}:`, authError);
        continue;
      }

      userIds.push(authData.user.id);

      // Create profile
      await supabase.from("profiles").upsert({
        user_id: authData.user.id,
        username: `user${i}`,
        age: Math.floor(Math.random() * 50) + 14,
        gender: genders[Math.floor(Math.random() * genders.length)],
      });
    }

    // Generate 100 click events spread over 30 days
    const clicks = [];
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      if (!userId) continue;
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const ts = new Date(
        now - daysAgo * 86400000 - hoursAgo * 3600000
      ).toISOString();
      clicks.push({
        user_id: userId,
        feature_name: features[Math.floor(Math.random() * features.length)],
        clicked_at: ts,
      });
    }

    const { error: clickError } = await supabase
      .from("feature_clicks")
      .insert(clicks);

    if (clickError) {
      return new Response(JSON.stringify({ error: clickError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_created: userIds.length,
        clicks_created: clicks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
