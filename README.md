# How to start

A chat app in two parts:

| Part | Folder | Stack | URL |
|---|---|---|---|
| Frontend | `/` (repo root) | Quasar 2, Vue 3, Pinia | http://localhost:9000 |
| Backend | `slek-server/` | AdonisJS 7, Lucid ORM, SQLite | http://localhost:3333 |

Both must be running at the same time.

## Requirements

- Node.js 24 or newer (`node -v`)
- npm (ships with Node)

You don't need a database server: SQLite stores everything in `slek-server/tmp/db.sqlite3`.

## 1. Backend (first time)

```bash
cd slek-server
npm install
```

Create `slek-server/.env`. It is gitignored, so every machine needs its own:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=<paste a generated key here>
APP_URL=http://localhost:3333
NODE_ENV=development
SESSION_DRIVER=cookie
```

Generate a value for `APP_KEY`. It encrypts the session cookie:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Create the database tables and fill them with demo data:

```bash
node ace migration:fresh --seed
```

## 2. Backend (every time)

```bash
cd slek-server
npm run dev
```

You should see the server listening on `http://localhost:3333`. Opening that URL returns `{"hello":"world"}`.

## 3. Frontend

In a second terminal, from the repo root:

```bash
npm install      # first time only
npm run dev
```

The browser opens at http://localhost:9000. The frontend calls the backend at `http://localhost:3333`. To use a different address, set `API_URL` before `npm run dev`.

## Demo accounts

The seeder creates 16 users, 5 channels, messages and one invitation. All seeded accounts use the password `quack123`. Log in with either the nickname or the email:

| Nickname | Email | Note |
|---|---|---|
| `pip` | pip@example.com | Member of most channels, invited to `secret-lake` |
| `ed` | ed@example.com | |
| `tom` | tom@example.com | Admin of `secret-lake` |

You can also register a new account on the login page.

## Resetting the database

This drops every table, re-runs the migrations and re-seeds the data:

```bash
cd slek-server
node ace migration:fresh --seed
```

Don't run `node ace db:seed` on its own against a database that already has data. The seeder uses fixed IDs and will fail on duplicates.

Channels with no activity for 30 days are deleted automatically the next time someone loads or creates channels. If the seeded channels vanish after a long break, reset the database.

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend exits with `Missing environment variable` | `slek-server/.env` is missing a key. Compare it with the block in step 1. |
| Login succeeds but you're immediately sent back to the login page | Open the frontend at `localhost:9000`, not `127.0.0.1:9000`. The session cookie only reaches the backend when both use the same hostname. |
| `no such table` errors | Run `node ace migration:fresh --seed` in `slek-server`. |
| Network errors in the browser console | The backend isn't running. Start it with `npm run dev` in `slek-server`. |
| Port 3333 or 9000 already in use | Stop the other process, or change `PORT` in `.env` and set `API_URL` to match. |

## Other commands

| Where | Command | What it does |
|---|---|---|
| root | `npm run lint` | Formats and lints the frontend |
| root | `npm run build` | Builds the frontend for production into `dist/spa` |
| `slek-server` | `npm run typecheck` | Type-checks the backend |
| `slek-server` | `npm run lint` | Lints the backend |
| `slek-server` | `npm test` | Runs the backend tests |
