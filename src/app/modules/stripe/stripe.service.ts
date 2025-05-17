import { appConfig } from "../../config";
import { stripe } from "./stripe";

const createAndConnect = async (mechanicId: string) => {
  const account = await stripe.accounts.create({
    type: "express",
    capabilities: { transfers: { requested: true } },
    metadata: { mechanicId },
  });

  // Save account.id to DB mapped to this mechanicId
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${appConfig.server.base_url}/stripe/onboarding/refresh`,
    return_url: `${appConfig.server.base_url}/stripe/onboarding/success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url, accountId: account.id };
};

export const StripeService = { createAndConnect };
