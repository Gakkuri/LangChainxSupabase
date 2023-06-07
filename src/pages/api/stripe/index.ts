import type { NextApiRequest, NextApiResponse } from "next";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST": {
      const supabase = createServerSupabaseClient({
        req,
        res,
      });
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        return res.status(401).json({
          error: "not_authenticated",
          description:
            "The user does not have an active session or is not authenticated",
        });

      const { customer, redirectUrl } = req.body;
      console.log(customer);
      try {
        const returnUrl = `${req.headers.origin}${redirectUrl}`;

        const portalSession = await stripe.billingPortal.sessions.create({
          customer,
          return_url: returnUrl,
        });

        res.redirect(303, portalSession.url);
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          res.status(500).json(error.message);
        }
      }
      return;
    }
    case "GET": {
      const { sessionId } = req.query;
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          sessionId
        );
        const subs = await stripe.subscriptions.retrieve(
          checkoutSession.subscription
        );
        res.status(200).json(subs);
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          res.status(500).json(error.message);
        }
      }

      return;
    }
    default: {
      res.setHeader("Allow", "POST");
      res.setHeader("Allow", "GET");
      res.status(405).end("Method Not Allowed");
    }
  }
}
