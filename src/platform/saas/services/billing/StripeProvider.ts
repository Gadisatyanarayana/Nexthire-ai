import { BillingProvider, Invoice } from './BillingProvider';

/**
 * Stripe Implementation Stub
 * In production, this uses the official 'stripe' node SDK.
 */
export class StripeProvider implements BillingProvider {
  async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    // Stub: const customer = await stripe.customers.create({ email, name, metadata: { tenantId } });
    // return customer.id;
    return `cus_stripe_${tenantId}`;
  }

  async createSubscription(customerId: string, planId: string): Promise<string> {
    // Stub: const sub = await stripe.subscriptions.create({ customer: customerId, items: [{ price: planId }] });
    // return sub.id;
    return `sub_stripe_${customerId}`;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Stub: await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }

  async reportUsage(subscriptionId: string, eventType: string, quantity: number): Promise<void> {
    // Stub: await stripe.subscriptionItems.createUsageRecord(...)
    console.log(`[STRIPE] Reporting usage: ${quantity} x ${eventType} for sub ${subscriptionId}`);
  }

  async getLatestInvoice(customerId: string): Promise<Invoice | null> {
    // Stub: const invoices = await stripe.invoices.list({ customer: customerId, limit: 1 });
    return {
      id: `in_stripe_123`,
      status: 'paid',
      amountDue: 0,
      currency: 'usd',
      items: [{ description: 'NextHire Enterprise (Monthly)', amount: 99900, currency: 'usd' }]
    };
  }
}
