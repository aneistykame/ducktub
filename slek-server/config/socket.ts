import app from "@adonisjs/core/services/app";
import { authenticateWithAdonisAuth, defineConfig } from "@rlanz/socket";
import type User from "#models/user";

const socketConfig = defineConfig({
  websocket: {
    /**
     * WebSocket endpoint (ws://localhost:3333/socket)
     */
    path: "/socket",

    /**
     * Browser origins allowed to open a socket. By default only the same
     * origin is allowed, but our Quasar client runs on a different port
     * (http://localhost:9000). We mirror the policy from "config/cors.ts".
     */
    origin: app.inDev ? true : [],

    /**
     * HTTP middleware executed for the upgrade request. The browser sends
     * the session cookie with the upgrade request, so we can initialize
     * the session and auth exactly like for a regular HTTP request.
     */
    middleware: [
      () => import("@adonisjs/session/session_middleware"),
      () => import("@adonisjs/auth/initialize_auth_middleware"),
    ],

    /**
     * Resolve the logged in user (default "web" session guard). If the user
     * is not logged in, the upgrade is rejected with 401 Unauthorized.
     * The resolved user is available as "socket.user" in channels.
     */
    authenticate: authenticateWithAdonisAuth<User>(),
  },
});

export default socketConfig;
