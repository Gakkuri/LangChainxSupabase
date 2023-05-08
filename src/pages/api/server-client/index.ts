// Creating a new supabase server client object (e.g. in API route):
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const Server = async (req: NextApiRequest, res: NextApiResponse) => {
  const requestMethod = req.method;

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_ANON_KEY ?? ''
  );

  switch (requestMethod) {
    case "GET": {
      // const { data: { session } } = await supabase.auth.getSession();
      // console.log(session)

      const { data, error } = await supabase.functions.invoke("login", {
        body: { type: "GET_USER" }
      });
      console.log(data)

      return res.status(200).json(data)
    }
    case "POST": {
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      // })

      const { data, error } = await supabase.functions.invoke("login", {
        body: { type: "LOGIN" }
      });

      console.log(data, error);

      if (data) res.status(200).json(data)
      if (error) res.status(error?.code || 500).json(error.message)
      return;
    }
    default: res.status(200).json("Server API")
  }




}

export default Server;