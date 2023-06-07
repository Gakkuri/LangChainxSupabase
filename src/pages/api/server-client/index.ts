// Creating a new supabase server client object (e.g. in API route):
// import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

const Server = async (req: NextApiRequest, res: NextApiResponse) => {
  const requestMethod = req.method;

  const supabase = createServerSupabaseClient({
    req,
    res,
  });

  switch (requestMethod) {
    case "GET": {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return res.status(200).json(user);
    }
    case "POST": {
      const { isCheckout } = req.body;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: isCheckout
            ? `${process.env.NEXT_PUBLIC_REDIRECT_LINK}?isCheckout=${isCheckout}`
            : `${process.env.NEXT_PUBLIC_REDIRECT_LINK}/chat`,
          // skipBrowserRedirect: true
        },
      });

      if (data) res.status(200).json(data);
      if (error) res.status(500).json(error.message);
      return;
    }
    default:
      res.status(200).json("Server API");
  }
};

export default Server;
