import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );
  const { input } = req.body;

  const { data, error } = await supabase.functions.invoke("vector", {
    body: { query: input },
  });

  if (data) res.status(200).json(data)
  if (error) res.status(error?.code || 500).json(error.message)
}