# Stripe Course Products

Larry Academy uses one Stripe Product per paid course and one active Stripe Price per current course price.

## Price strategy

- IB Big Math courses: USD 29.00
- NGSS Science courses: USD 19.00

The sync script reads published courses from the database where `courseTrack` is `ib-big-math` or `ngss-science`, creates or updates the matching Stripe Product, creates a stable Price with a lookup key, and writes the resulting `stripePriceId` back to `Course`.

## Commands

Dry run:

```bash
npm run stripe:sync-courses -- --dry-run
```

Create or update Stripe Products and Prices, then mark those courses as paid:

```bash
STRIPE_SECRET_KEY=sk_live_... npm run stripe:sync-courses -- --activate-paid
```

Never commit `STRIPE_SECRET_KEY` to Git. Put it in the server `.env` for runtime Checkout and use a local shell variable only when running the sync command.

## WeChat Pay

WeChat Pay should be enabled in the Stripe Dashboard payment method settings. Checkout uses Stripe dynamic payment methods, so the same Checkout Session can show WeChat Pay when Stripe determines it is available for the customer, currency, and account configuration.
