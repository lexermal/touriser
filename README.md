# Touriser — travel navigator

Turn a trip plan (Markdown) into an app on your Android phone. When you open it, it shows where you are on your trip right now; one tap opens Google Maps to the stop.

Live: https://touriser.rimori.se

## How it works

1. On the landing page, copy the planning prompt into any AI chat (ChatGPT, Claude, …) and plan your trip.
2. Paste the finished plan. It is checked right away.
3. You get a link `/t/<id>`. Opened on Android, it walks you through installing the trip as an app (PWA). The installed app always opens this trip.

The format is shown in [`public/examples/berlin-trip.md`](public/examples/berlin-trip.md) and described in the prompt ([`src/lib/planningPrompt.ts`](src/lib/planningPrompt.ts)).

### Privacy

- No accounts. The random link is the only key: anyone with it can view **and delete** the trip.
- Every upload is a new trip. Plans are deleted **30 days after upload**, no exceptions: expired trips are never returned, a sweep deletes them every 15 minutes, and the SQLite file uses `secure_delete` + `VACUUM` so nothing stays on disk. The phone's offline copy deletes itself too.
- Don't add backups for the data volume. They would keep plans past 30 days.

### Notifications

The app posts its own notification while it runs (no push server, no Firebase). It works as a shortcut: tap it to open the trip on the current stop, or tap "Navigate" to open Maps to the next stop. Its text only updates while the app is open.

## Development

Needs Node 24+ (uses the built-in `node:sqlite`) and pnpm.

```bash
pnpm install
pnpm dev               # http://localhost:3000, DB in ./data/touriser.db
pnpm test              # unit tests (parser, timeline, storage)
pnpm test:e2e          # Playwright, Android (Pixel 7) emulation
pnpm lint && pnpm typecheck
```

In dev the service worker only handles install + notifications; offline caching is production-only.

**Testing on a phone:** Chrome only installs from HTTPS or localhost. Either connect by USB and run `adb reverse tcp:3000 tcp:3000` (then open `http://localhost:3000` on the phone), or on the phone enable `chrome://flags/#unsafely-treat-insecure-origin-as-secure` for `http://<your-lan-ip>:3000`.

| Path | What |
|---|---|
| `src/lib/parser.ts` | Markdown → trip (days, stops, options, notes) |
| `src/lib/timeline.ts` | Time zone handling, "where am I now" |
| `src/lib/db.ts` | SQLite storage + 30-day deletion |
| `src/app/api/trips` | `POST` create, `GET`/`DELETE` by id |
| `src/app/t/[id]` | The trip app + per-trip web app manifest |
| `src/components/trip` | Navigator, day plan, info, install guide |
| `public/sw.js` | Offline cache + notification clicks |

## Deployment

A push to `main` runs tests, builds `registry.rimori.se/language/touriser`, and deploys with Helm (`deploy/chart`) to namespace `touriser` at `touriser.rimori.se`. Pull requests only run tests.

One-time setup:

- DNS: `touriser.rimori.se` → cluster ingress.
- Repo secrets: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, `KUBECONFIG` (base64).
- Image pull secret `rimori-registry` in namespace `touriser`.

The app needs no runtime secrets.
