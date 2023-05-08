import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const Server = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );
  const { error } = await supabase.auth.signOut()

  console.log(error);
  res.status(200).json("Logged Out!")
}

export default Server