# TohdohBoard Web

A minimalist 2D Kanban board for task management, built with Next.js (App Router), TypeScript, Tailwind CSS, and dnd-kit.

## Overview
TohdohBoard is a flexible task management tool that organizes tasks into both Swimlanes (Contexts) and Columns (Statuses), creating a 2D matrix.

## Collapsing & Archiving

- Click the chevron next to a swimlane's name to collapse it. Collapsed lanes are remembered per device (browser storage), not on the board.
- **Archive** in a swimlane's Done column moves that lane's done tasks to the archive; a single task can be archived from its edit dialog. The header's **Archive** button lists archived tasks and restores them.
- The "Done" column is the column with id `done`, the backend's default `archive.done_column`. Only it gets the bulk **Archive** button. If the backend is configured with another done column, the web app does not know: archive single tasks from their dialog instead.
- The backend also archives done tasks automatically after a while. The thresholds (`[archive]` in the backend's `config.toml`) are configured there, not in the web app.
- The board reloads when you return to its tab or window, so tasks archived automatically or changed on another device show up there without a manual refresh.

## Running the Web App

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Network & Tailnet Access

The browser only talks to the web app's own origin: requests to `/api/*` are proxied by the Next.js server to the backend at `TOHDOH_BACKEND_URL` (default `http://127.0.0.1:3001`). The backend therefore only needs to listen on loopback, and anything placed in front of the web app (Tailscale Serve, a reverse proxy) also covers the API.

```
browser ──► web (:3000) ──/api/*──► backend (127.0.0.1:3001)
```

`TOHDOH_BACKEND_URL` is read when the config loads, i.e. at `npm run build` (and by `npm run dev`). Set it before building; changing it for `npm start` alone has no effect.

Request headers, including `Authorization` and identity headers such as `Tailscale-User-Login`, are forwarded to the backend unchanged. That is why `npm start` listens on loopback only (`127.0.0.1:3000`): a client that could reach the web app directly could claim any identity when the backend trusts such a header (proxy auth mode).

> **Upgrading:** earlier versions of `npm start` listened on all interfaces. Other devices now reach the board through Tailscale Serve (below) or another reverse proxy on the same machine — or opt out of the loopback default.

To reach the board from other devices in your Tailnet, serve the web app over HTTPS with Tailscale Serve:

```bash
tailscale serve --bg --https=443 http://127.0.0.1:3000
```

and open `https://<machine>.<tailnet>.ts.net`. Tailscale Serve adds `Tailscale-User-Login` for tailnet users, which the backend can use to give each user their own board (proxy auth mode; see the backend README).

For access from outside your Tailnet, use the backend's token auth mode (see the backend README). When the backend answers `401` with a `WWW-Authenticate: Bearer` challenge, the web app asks for an access token, keeps it in this browser's local storage and sends it as `Authorization: Bearer <token>`. The key button in the header forgets it. A `401` without that challenge (proxy auth mode) means the request did not come through the sign-in proxy; the app says so instead of asking for a token.

To let devices reach port 3000 directly instead (backend in its default no-auth mode, e.g. on a home LAN or tailnet without Serve), listen on all interfaces:

```bash
npm start -- -H 0.0.0.0
```

Never do this with the backend in proxy auth mode.

### Static export

`TOHDOH_STATIC_EXPORT=1 NEXT_PUBLIC_TOHDOH_API_URL=https://board.example.com/api npm run build` writes a static site to `out/` with no Next.js server and therefore no `/api` proxy: the browser calls `NEXT_PUBLIC_TOHDOH_API_URL` (the API base, ending in `/api`) directly, so the backend must allow that origin (CORS). The variable is required in this mode and is baked into the build.

## Security Notice

The web app has no authentication of its own; it relies on the backend's auth mode and on whatever is in front of it.

- With the backend in its default mode (no auth), anyone who can reach the web app can read and change the board. If you opt out of the loopback default, keep port 3000 on your Tailnet or LAN; if the machine is exposed to the internet, make sure your firewall (e.g. `ufw`) blocks public access to it.
- With the backend in proxy mode, the identity header is trusted as-is and the web app forwards client-supplied headers. Keep the web app on loopback (the `npm start` default) so that only Tailscale Serve (or your proxy) can reach it; otherwise anyone who can reach port 3000 directly can claim any identity.
- `npm run dev` (`next dev`) is for development only and listens on all interfaces.

## Deployment

For a persistent web setup, run the build version with a process manager like `pm2`:
```bash
npm run build   # with TOHDOH_BACKEND_URL set if the backend is not on 127.0.0.1:3001
pm2 start npm --name "tohdoh-web" -- start
```
This listens on loopback only; append `-- -H 0.0.0.0` only if devices should reach port 3000 directly (no auth proxy in front, see above).
