import type { NextApiRequest, NextApiResponse } from "next";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
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

    const { redirectUrl, email } = req.body;
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: redirectUrl
          ? `${req.headers.origin}${redirectUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`
          : `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: redirectUrl
          ? `${req.headers.origin}${redirectUrl}/?canceled=true`
          : `${req.headers.origin}/?canceled=true`,
      });
      res.redirect(303, session.url);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        res.status(500).json(error.message);
      }
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
