import type { PaymentProvider, CreateIntentResult, WebhookEvent, RefundResult } from "@unihub/shared";

let counter = 0;
const nextId = () => `mock_${++counter}_${Date.now()}`;

export class MockPaymentProvider implements PaymentProvider {
  async createIntent(
    _amount: number,
    _currency: string,
    _metadata: Record<string, string>,
  ): Promise<CreateIntentResult> {
    return {
      intentId: `mock_intent_${nextId()}`,
      clientSecret: "mock_secret",
    };
  }

  verifyWebhook(
    payload: Uint8Array | string,
    _signature: string,
    _providerSecret: string,
  ): WebhookEvent {
    const raw = typeof payload === "string" ? payload : new TextDecoder().decode(payload);
    const parsed = JSON.parse(raw) as Partial<WebhookEvent>;

    if (!parsed.eventType || !parsed.intentId || !parsed.eventId) {
      throw new Error("MockPaymentProvider: invalid webhook payload");
    }

    return {
      eventType: parsed.eventType,
      intentId: parsed.intentId,
      eventId: parsed.eventId,
    };
  }

  async refund(_intentId: string, _amount: number): Promise<RefundResult> {
    return { refundId: `mock_refund_${nextId()}` };
  }
}
