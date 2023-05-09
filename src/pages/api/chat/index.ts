// import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // const supabase = createClient(
  //   process.env.SUPABASE_URL ?? '',
  //   process.env.SUPABASE_ANON_KEY ?? ''
  // );

  const supabase = createServerSupabaseClient({
    req, res
  })

  const { input } = req.body;

  const { data, error } = await supabase.functions.invoke("vector", {
    body: { query: input },
  });

  if (data) res.status(200).json(data)
  if (error) res.status(error?.code || 500).json(error.message)
}