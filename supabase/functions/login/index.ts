import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { type } = await req.json();

    switch (type) {
      case "GET_USER": {
        const { data: { session } } = await client.auth.getSession();
        console.log(session)

        return new Response(JSON.stringify(session), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "LOGIN": {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
        })

        console.log(data)

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});