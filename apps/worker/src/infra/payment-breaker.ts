import { createCircuitBreaker } from "./circuit-breaker.js";
import { getPaymentProvider } from "./payment/payment-provider.factory.js";
import { requireEnv } from "../env.js";

const providerName = process.env.PAYMENT_PROVIDER ?? "mock";

if (process.env.NODE_ENV === "production" && providerName === "mock") {
  throw new Error(
    "PAYMENT_PROVIDER=mock is not allowed in production. Set PAYMENT_PROVIDER to a real provider.",
  );
}

const provider = getPaymentProvider(providerName);

/**
 * Circuit Breaker for Payment Provider
 * Wraps createIntent to isolate failures from the rest of the registration flow.
 */
export const paymentBreaker = createCircuitBreaker(
  async (amount: number, currency: string, metadata: Record<string, string>) => {
    return provider.createIntent(amount, currency, metadata);
  },
);

paymentBreaker.on("open", () => {
  console.warn("⚠️ [CIRCUIT_BREAKER] Payment Circuit OPENED - failing fast");
});

paymentBreaker.on("halfOpen", () => {
  console.info("ℹ️ [CIRCUIT_BREAKER] Payment Circuit HALF-OPEN - probing gateway");
});

paymentBreaker.on("close", () => {
  console.info("✅ [CIRCUIT_BREAKER] Payment Circuit CLOSED - gateway healthy");
});

paymentBreaker.fallback(() => {
  console.error("🚨 [CIRCUIT_BREAKER] Payment fallback triggered (Circuit OPEN or Timeout)");
  return { intentId: undefined, clientSecret: undefined } as any;
});
