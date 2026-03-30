import { auth0 } from "@/lib/auth0";

/**
 * Auth0 catch-all route handler.
 * Handles: /auth/login, /auth/logout, /auth/callback, /auth/profile
 *
 * This single file wires up the full Auth0 authentication flow.
 */
export const GET = auth0.handler;
export const POST = auth0.handler;
