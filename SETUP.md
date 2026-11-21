# Setup and deployment

## What is included

Source, Bun lockfile, configuration, database schema/migrations, tests, documentation and screenshots. Hosted database rows, auth accounts, provider settings, credentials and storage are not exported. Videos are separate downloads.

## Local development

1. Install a recent Bun release and extract the archive.
2. Run `bun install --frozen-lockfile`.
3. Copy `.env.example` to `.env` and fill in your own environment values. Variable names follow the generated client's convention. Private keys must never use the `VITE_` prefix.
4. Run `bun run dev` and open the URL printed by Vite.
5. Run `bun run test`.

Lovable supplies managed configuration to the hosted app. This is not an offline application or a one-click recreation of its hosted services. An external host needs equivalent services and configuration. Managed administrative credentials and database passwords are not available from this export.

## Full-flow prerequisites

- A compatible auth/database service with `public.phone_searches` and the included owner-only policies. Review `drizzle/schema.ts` and `drizzle/migrations/0000_create_phone_searches.sql`; apply the migration once to a fresh environment, not repeatedly to an existing table.
- Email authentication/confirmation and permitted redirect URLs configured for your host.
- Google and Lovable OAuth configured before using their buttons. Redirects must use the app's same-origin public URL. External hosting may require provider-specific adaptation; the export does not verify those settings.
- Server-side Lovable AI Gateway access, credits and availability of the current model (`openai/gpt-6.1-sol`).
- A linked Parallel connector providing server-only `PARALLEL_API_KEY`, plus gateway access via `LOVABLE_API_KEY`. All Parallel requests must use the connector gateway. Searches are paid and run only on submission, never when viewing saved results.
- HTTPS or localhost, browser camera permission, and network access to MediaPipe model/WASM assets for optional hand sizing.

The ordinary screening path uses the authenticated caller's client, not the generated privileged client. Do not put administrative credentials in browser configuration.

## Deployment

The existing Vite config uses the Lovable TanStack preset and a Worker-compatible target. Run `bun run build` in a configured environment and follow your host's supported TanStack Start deployment process. Static-file hosting alone does not run authenticated server functions. Keep credentials in a secret store.

Code saving and publishing are separate. Git commits do not publish a new live app version. Lovable Git sync creates a new private repository rather than attaching to an already existing one.

## Target-environment smoke test

Sign in, answer required questions, skip or independently test hand sizing, submit, confirm three picks and rejections, and revisit the saved screening through My results. Then verify a second account cannot access the first account's result. Real-hand physical accuracy and that cross-account security check are target-environment checks, not new claims made by this export.
