// Creating a new supabase server client object (e.g. in API route):
// import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'

const Server = async (req: NextApiRequest, res: NextApiResponse) => {
  const requestMethod = req.method;

  const supabase = createServerSupabaseClient({
    req, res
  })

  switch (requestMethod) {
    case "GET": {
      const { data: { user } } = await supabase.auth.getUser();
      console.log(user)

      return res.status(200).json(user)
    }
    case "POST": {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      console.log(data, error);

      if (data) res.status(200).json(data)
      if (error) res.status(error?.code || 500).json(error.message)
      return;
    }
    default: res.status(200).json("Server API")
  }




}

export default Server;