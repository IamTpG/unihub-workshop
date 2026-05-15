import type { PaymentProvider } from "@unihub/shared";
import { MockPaymentProvider } from "./mock-payment-provider.js";

const providers = new Map<string, PaymentProvider>();

providers.set("mock", new MockPaymentProvider());

export const getPaymentProvider = (name: string = "mock"): PaymentProvider => {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return provider;
};

export const registerProvider = (name: string, provider: PaymentProvider): void => {
  providers.set(name, provider);
};
