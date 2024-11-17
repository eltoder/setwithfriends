import { loadStripe } from "@stripe/stripe-js";

import config from "./config";

const stripe = !config.stripe ? null : loadStripe(config.stripe.publishableKey);

export async function patronCheckout(email) {
  if (!stripe) {
    return {
      error: {
        message: "Stripe is not currently supported. Sorry!",
      },
    };
  }
  const origin = window.location.origin;
  return (await stripe).redirectToCheckout({
    lineItems: [{ price: config.stripe.priceId, quantity: 1 }],
    mode: "subscription",
    successUrl: origin + "/donate",
    cancelUrl: origin + "/donate",
    customerEmail: email,
  });
}

export default stripe;
