import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    );
  }
  return stripePromise;
}

export const stripeElementsOptions = (clientSecret: string) => ({
  clientSecret,
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#1E3A5F',
      colorBackground: '#ffffff',
      colorText: '#1A1A2E',
      colorDanger: '#DC3545',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        border: '1px solid #DEE2E6',
        padding: '12px',
      },
      '.Input:focus': {
        border: '1px solid #1E3A5F',
        boxShadow: '0 0 0 1px #1E3A5F',
      },
    },
  },
});
