// import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

const Server = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = createServerSupabaseClient({
    req,
    res,
  });
  const { error } = await supabase.auth.signOut();

  console.log(error);
  res.status(200).json("Logged Out!");
};

export default Server;
