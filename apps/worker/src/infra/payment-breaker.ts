import { createCircuitBreaker } from "./circuit-breaker.js";
import { getPaymentProvider } from "./payment/payment-provider.factory.js";

const provider = getPaymentProvider("mock");

/**
 * Circuit Breaker for Payment Provider
 * Wraps createIntent to isolate failures
 */
export const paymentBreaker = createCircuitBreaker(
  async (amount: number, currency: string, metadata: Record<string, string>) => {
    return provider.createIntent(amount, currency, metadata);
  },
);

// Event Logging (Task 2.5)
paymentBreaker.on("open", () => {
  console.warn("⚠️ [CIRCUIT_BREAKER] Payment Circuit OPENED - failing fast");
});

paymentBreaker.on("halfOpen", () => {
  console.info("ℹ️ [CIRCUIT_BREAKER] Payment Circuit HALF-OPEN - probing gateway");
});

paymentBreaker.on("close", () => {
  console.info("✅ [CIRCUIT_BREAKER] Payment Circuit CLOSED - gateway healthy");
});

// Fallback behavior (Task 2.3)
paymentBreaker.fallback(() => {
  console.error("🚨 [CIRCUIT_BREAKER] Payment fallback triggered (Circuit OPEN or Timeout)");
  // Return undefined intentId to trigger existing retry logic in processor
  return { intentId: undefined, clientSecret: undefined } as any;
});
