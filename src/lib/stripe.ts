import Stripe from 'stripe'

// Let the SDK’s bundled API version apply (no apiVersion pin).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export type { Stripe }; // handy for typings elsewhere
