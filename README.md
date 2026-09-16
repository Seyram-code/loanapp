# lendgh

Admin-only loan management system built with Next.js, TypeScript, Prisma, MySQL, Zod, Tailwind CSS, and Recharts.

## Architecture

- `src/app/`: App Router pages and API route handlers
- `components/`: reusable UI components grouped by domain, with shared `ui/` primitives
- `config/`: navigation and application configuration
- `hooks/`: client-side interaction state
- `lib/`: authentication, authorization, Prisma, and shared server utilities
- `prisma/`: database schema and migrations
- `schemas/`: Zod validation schemas
- `services/`: business operations and database access
- `types/`: domain types
- `utils/`: small framework-agnostic helpers
- `proxy.ts`: server-side role gate for protected routes

Keep Prisma imports inside server-only services and route handlers. Client components should consume client-safe services, hooks, and types only.

## Development

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
2. Run `npm install`.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Start the app with `npm run dev`.

For local development, seed both admin accounts, sample loan types, and development data with `npm run db:seed`. Sign in at `/login` using either the `SUPER_ADMIN_*` or `ADMIN_*` credentials from `.env`. Set `SEED_DEMO_DATA="false"` to seed only the admin accounts and loan types.

Only `SUPER_ADMIN` and `ADMIN` can access the current application. Customer-facing routes are intentionally not implemented.

## Production deployment

This is a server-rendered Next.js application and must be deployed to a Node.js host with a reachable MySQL or MariaDB database. Vercel, Railway, Render, or a managed Node.js server are suitable options.

1. Create a production MySQL or MariaDB database. Do not use the local development database or enable demo seeding in production.
2. Create a private Git repository and push this project. `.env` is ignored and must never be committed.
3. Import the repository into the hosting provider. Use `npm run build` as the build command and `npm run start` as the start command for a Node.js host.
4. Add these production environment variables: `DATABASE_URL`, `AUTH_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
5. Set `SEED_DEMO_DATA` to `false` or omit it. Use a long random `AUTH_SECRET` and strong unique administrator passwords.
6. Before the first release, run `npm run db:migrate:deploy` against the production database from a trusted environment with the production `DATABASE_URL`. Do not run `npm run db:migrate` in production.
7. Deploy, open `/login`, sign in, and verify login, customer creation and editing, profile navigation, loan actions, repayment recording, and logout.

For Vercel, configure the environment variables for Production. Run migrations separately during release rather than as part of the build so preview builds cannot modify production data.
