import Stripe from "stripe";

// Constructed lazily (not at module scope) so a missing STRIPE_SECRET_KEY only breaks
// billing-related requests at runtime, rather than failing the entire `next build`.
let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}

export function formatPrice(price: Stripe.Price): string {
  const amount = ((price.unit_amount ?? 0) / 100).toFixed(2);
  const interval = price.recurring ? `/${price.recurring.interval}` : "";
  return `$${amount}${interval}`;
}

export async function getPriceLabel(priceId: string | undefined): Promise<string | null> {
  if (!priceId) return null;
  try {
    const price = await getStripe().prices.retrieve(priceId);
    return formatPrice(price);
  } catch {
    return null;
  }
}
