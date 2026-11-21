<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Phone screening runs in one authenticated server function (src/lib/research.functions.ts) that calls the AI gateway and saves to phone_searches; why: keeps prompts/keys server-side and results owned per user via RLS.
- Screening fetches live review excerpts through Parallel's gateway inside the authenticated function, validates five cited non-brand domains and fetched citation URLs, and saves the source snapshot with the verdict; why: prevent silent model-knowledge fallback and preserve auditable evidence without extra page-load searches.
- Hand measurement runs fully in the browser: a Letter sheet detected in frame gives true cm scale (homography), MediaPipe gives palm-down landmarks, median of steady frames; only outline + cm values leave the device; why: model-estimated depth was unreliable and user requires no fingerprint capture.

- Source showcase exports include source/config, migrations, tests and docs but exclude credentials, hosted data, repository metadata, dependencies, build output and companion MP4s; why: keep GitHub packages safe and lightweight.
