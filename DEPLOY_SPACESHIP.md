# Deploying Larry Academy on Spaceship Hosting

This project is a full Next.js app with API routes, authentication, Prisma, and server-side rendering. Deploy it as a Node.js application, not as a static site.

## Spaceship / cPanel Settings

In Spaceship Web Hosting, open cPanel, then open **Setup Node.js App**.

- Node.js version: Node 20 or newer
- Application mode: Production
- Application root: `larryacademy`
- Application URL: `larryacademy.com`
- Application startup file: `server.js`

After creating the app, upload or clone the repository into the application root.

## Environment Variables

Set these in the Node.js application settings, then restart the app:

```env
NODE_ENV=production
NEXTAUTH_URL=https://larryacademy.com
NEXTAUTH_SECRET=<generate-a-long-random-secret>
DATABASE_URL=file:./prod.db
OPENAI_API_KEY=<optional-until-ai-generation-is-live>
OPENAI_BASE_URL=<optional-openai-compatible-base-url>
OPENAI_MODEL=<optional-model-name>
STRIPE_SECRET_KEY=<optional-until-payments-are-live>
STRIPE_WEBHOOK_SECRET=<optional-until-payments-are-live>
```

For SQLite, `file:./prod.db` stores the database at `prisma/prod.db`, because Prisma resolves the path relative to `prisma/schema.prisma`.

## Build On The Server

From the Spaceship Node.js virtual environment or SSH shell:

```bash
npm install
npm run deploy:build
npm run db:push
npm run db:seed
```

Then restart the Node.js application in cPanel.

## Notes

- Do not upload `.env`, `.next`, `node_modules`, or local SQLite database files from development.
- If cPanel offers **Run NPM Install**, use it first, then run `npm run deploy:build` over SSH.
- If the app starts but login fails, verify `NEXTAUTH_URL` exactly matches `https://larryacademy.com` and that `NEXTAUTH_SECRET` is set.
