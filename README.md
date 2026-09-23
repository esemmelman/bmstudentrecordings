# Student recordings

Live website: https://esemmelman.github.io/bmstudentrecordings/

The Torah and Service radio buttons select recordings from `public.brady_torah_passage_recordings_v1` plus `public.vivienne_torah_passage_recordings_v1` (Torah), and `public.bradymenu_service_recordings_v1` (Service). Service rows show Name, Prayer (`passage_key_text`), Date/Time, and Playback; `start_time` is converted to Pacific time. Dates use `m/d ddd h:mm am/pm` without shifting the Pacific wall-clock values into the visitor's timezone. Links start the shared audio player; Torah recordings also offer a direct link.

The page fetches live data on load and every minute while visible, sorted by name ascending and Pacific time descending. No rebuild is needed for new database records. Existing Brady, Aria, and Vivienne player links are resolved using their recording ID and the existing per-recording access policy, then played as audio in the page.

## Database access

The public, read-only `list_brady_recordings` and `list_brady_service_recordings` RPCs return only listing fields. Each calls a tightly scoped function in `recordings_site_private` with an empty search path and fixed table references. Their execute permissions are limited to anon and authenticated. The public wrappers are security-invoker. Audio uses the existing per-recording access policies. The browser uses only a publishable API key.

## Publish changes

Run `npm run push` to test, commit website changes, and push them to GitHub. GitHub Actions tests and deploys `site/` to GitHub Pages automatically after every push to `main`. Future coding-agent changes follow the automatic-push instruction in AGENTS.md.

## Local development

Serve `site/` using any static HTTP server. Run `npm test` for date formatting, URL validation, pagination, and API failure tests. There are no build dependencies.
