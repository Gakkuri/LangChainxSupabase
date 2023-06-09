import type { NextApiRequest, NextApiResponse } from "next";
// import { buffer } from "micro";
// import Cors from "micro-cors";
import { createClient } from "@supabase/supabase-js";
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
import Stripe from "stripe";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2022-11-15",
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];

    let event;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    console.log(`Sign: ${sig},\nBuffer: ${buf}`);

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      if (err instanceof Error) {
        console.log(webhookSecret);
        res
          .status(400)
          .send(`Webhook Error: ${err.message}, Sign: ${sig}, Buffer: ${buf}`);
        return;
      }
    }

    let subscription;
    let status;
    let supabaseData;

    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;

        const customer = await stripe.customers.retrieve(subscription.customer);

        supabaseData = await supabase
          .from("users")
          .update({
            stripe_customer_id: null,
            stripe_sub_id: null,
            stripe_session_id: null,
            upgraded: false,
          })
          .eq("email", customer.email);

        console.log(supabaseData.error);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;

        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        // console.log(subscription)
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;

      case "checkout.session.completed":
        const checkout = event.data.object;

        supabaseData = await supabase
          .from("users")
          .update({
            stripe_session_id: checkout.id,
            stripe_customer_id: checkout.customer,
            stripe_sub_id: checkout.subscription,
            upgraded: true,
          })
          .eq("email", checkout.customer_email);

        console.log(supabaseData.error);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;

      default:
      // Unexpected event type
      // console.log(`Unhandled event type ${event.type}.`);
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

const buffer = (req: NextApiRequest) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
