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

The web app is configured to dynamically connect to the TohdohBoard backend at your server's current IP address (port 3001).

To access the web app from other devices in your Tailnet:
1. Ensure the **TohdohBoard Backend** is running on your server.
2. Ensure you have the **Next.js app** running (`npm run dev`).
3. Access the board via your server's Tailscale hostname: `http://<tailscale-hostname>:3000`.

## Security Notice

TohdohBoard lacks built-in authentication. Access should be restricted to your **Tailscale** network. If your server is exposed to the internet, ensure your firewall (e.g., `ufw`) blocks public access to port 3000 and only allows it via the `tailscale0` interface.

## Deployment

For a persistent web setup, run the build version with a process manager like `pm2`:
```bash
npm run build
pm2 start npm --name "tohdoh-web" -- start
```
