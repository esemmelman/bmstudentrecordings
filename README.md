# Torah recordings

Live website: https://esemmelman.github.io/bmstudentrecordings/

Displays `name`, `start_time_pacific`, and clickable `playback_url` from Supabase's `public.brady_torah_passage_recordings_v1`. Dates use `m/d ddd h:mm am/pm` without shifting the Pacific wall-clock database values into the visitor's timezone. Links start the shared audio player; a direct link is available if the browser cannot play the source format.

The page fetches live data on load and every minute while visible, sorted by name ascending and Pacific time descending. No rebuild is needed for new database records. Existing Brady player links are resolved using their recording ID and the existing per-recording access policy, then played as audio in the page.

## Database access

The public, read-only `list_brady_recordings` RPC returns only the three requested fields. It calls `recordings_site_private.list_recordings`, a tightly scoped SQL security-definer function with an empty search path, fixed fully qualified table reference, and no arguments or dynamic SQL. Its execute permission is limited to anon and authenticated. This deliberately makes the requested recording listing public without changing the source table's existing row policies or exposing its other columns. The public wrapper is security-invoker. The browser uses only a publishable API key.

## Publish changes

Run `npm run push` to test, commit website changes, and push them to GitHub. GitHub Actions tests and deploys `site/` to GitHub Pages automatically after every push to `main`. Future coding-agent changes follow the automatic-push instruction in AGENTS.md.

## Local development

Serve `site/` using any static HTTP server. Run `npm test` for date formatting, URL validation, pagination, and API failure tests. There are no build dependencies.
