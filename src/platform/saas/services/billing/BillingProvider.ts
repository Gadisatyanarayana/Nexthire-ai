export interface InvoiceItem {
  description: string;
  amount: number;
  currency: string;
}

export interface Invoice {
  id: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amountDue: number;
  currency: string;
  hostedInvoiceUrl?: string;
  items: InvoiceItem[];
}

export interface BillingProvider {
  /**
   * Provisions a new customer record in the billing system.
   */
  createCustomer(tenantId: string, email: string, name: string): Promise<string>;

  /**
   * Creates a subscription for the customer on a specific plan.
   */
  createSubscription(customerId: string, planId: string): Promise<string>;

  /**
   * Cancels an active subscription at the end of the billing period.
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Reports metered usage for a specific event (e.g. AI token consumption).
   */
  reportUsage(subscriptionId: string, eventType: string, quantity: number): Promise<void>;

  /**
   * Retrieves the latest invoice for a customer.
   */
  getLatestInvoice(customerId: string): Promise<Invoice | null>;
}
