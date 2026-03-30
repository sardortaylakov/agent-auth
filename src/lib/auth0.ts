import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Auth0 client — handles login, session management, and token refresh.
 * Configured via environment variables in .env.local
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: "openid profile email",
    audience: process.env.AUTH0_AUDIENCE,
  },
});

/**
 * Get the current user from the session.
 * Returns null if the user is not authenticated.
 */
export const getUser = async () => {
  const session = await auth0.getSession();
  return session?.user ?? null;
};

/**
 * Get the current user's access token.
 * Used to authorize calls to your own APIs.
 */
export const getAccessToken = async () => {
  const tokenResult = await auth0.getAccessToken();
  if (!tokenResult?.token) {
    throw new Error("No access token found in session.");
  }
  return tokenResult.token;
};
