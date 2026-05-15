export interface CreateIntentResult {
  intentId: string;
  clientSecret: string;
}

export interface WebhookEvent {
  eventType: "PAYMENT_SUCCEEDED" | "PAYMENT_FAILED" | "PAYMENT_EXPIRED";
  intentId: string;
  eventId: string;
}

export interface RefundResult {
  refundId: string;
}

export interface PaymentProvider {
  createIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<CreateIntentResult>;
  verifyWebhook(payload: Uint8Array | string, signature: string, providerSecret: string): WebhookEvent;
  refund(intentId: string, amount: number): Promise<RefundResult>;
}
