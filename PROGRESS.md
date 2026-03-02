# VoltexaForum - Progress

## Tech Stack
- Vue 3 + Vite + Tailwind CSS v4
- Pinia state management
- Axios HTTP client
- Laravel Echo + Pusher (real-time)
- Font Awesome Free (icons)

## Features Implemented

### Core Forum
- Forum hierarchy: Games > Categories > Forums
- Thread & post creation, reactions, deletion
- User profiles with awards, achievements, cosmetics
- Direct messaging / conversations
- Real-time notifications via WebSocket (Echo)
- Store / credits system
- Dark/light theme

### Admin Panel
- Dashboard with stats
- User management (ban/unban, credits, awards)
- Forum tree management (games, categories, forums)
- Moderation (pin, lock, solve threads; delete posts)
- Store item management
- Achievements & Awards management
- Site configuration

### Recent Additions
- **Font Awesome Icon Picker** — Reusable `FaIconPicker.vue` component with ~120 curated icons, search, and grid selection. Integrated into Admin Forums for setting forum icons.
- **Forum FA Icons** — Forums now display Font Awesome icons instead of emoji. Default: `fa-solid fa-comment`. Shown on HomeView and Admin forum tree.
- **Award Image Uploads** — Admin can upload custom PNG/JPG/GIF icons (max 2MB) for awards via `FormData` multipart upload. Awards display `icon_url` image where available, with emoji fallback.
- **Award Edit Form** — Inline edit for awards in Admin Awards page with image preview.
- **Soketi WebSocket Script** — `scripts/soketi-start.sh` for starting the Soketi server with VoltexaHub config.

## Running

```bash
# Frontend dev server
npm run dev

# Build for production
npm run build

# Start Soketi WebSocket server
./scripts/soketi-start.sh
```

## Soketi Configuration
- APP_ID: `voltexahub`
- KEY: `voltexahub-key`
- SECRET: `voltexahub-secret`
- PORT: `6001`

Install Soketi globally if not installed:
```bash
npm install -g @soketi/soketi
```
