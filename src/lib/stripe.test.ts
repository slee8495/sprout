import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { formatPrice } from "./stripe";

function price(overrides: Partial<Stripe.Price>): Stripe.Price {
  return { unit_amount: 0, recurring: null, ...overrides } as Stripe.Price;
}

describe("formatPrice", () => {
  it("formats a recurring monthly price with the interval suffix", () => {
    expect(formatPrice(price({ unit_amount: 499, recurring: { interval: "month" } as Stripe.Price.Recurring }))).toBe(
      "$4.99/month",
    );
  });

  it("formats a one-time price with no interval suffix", () => {
    expect(formatPrice(price({ unit_amount: 299, recurring: null }))).toBe("$2.99");
  });

  it("treats a missing unit_amount as zero", () => {
    expect(formatPrice(price({ unit_amount: null, recurring: null }))).toBe("$0.00");
  });
});
