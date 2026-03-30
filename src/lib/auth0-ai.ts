import { Auth0AI } from "@auth0/ai-vercel";
import { AccessDeniedInterrupt } from "@auth0/ai/interrupts";
import { getUser } from "./auth0";

const auth0AI = new Auth0AI();

/**
 * Token Vault wrapper — automatically injects the user's stored OAuth token
 * (e.g. Google) into the tool at execution time.
 *
 * Usage: wrap any tool that calls a third-party API on behalf of the user.
 * Auth0 stores, refreshes, and manages the token automatically.
 *
 * Requires:
 * - Google Social Connection enabled in Auth0
 * - Token Vault grant type enabled on the Auth0 Application
 */
export const withGoogleToken = auth0AI.withTokenForConnection({
  connection: process.env.AUTH0_CONNECTION ?? "google-oauth2",
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
  ],
});

/**
 * Async Authorization wrapper — pauses tool execution and sends the user
 * a push notification (via Auth0 Guardian) asking for approval.
 *
 * Use this for high-stakes actions: sending emails, creating events, etc.
 * The agent only proceeds after the user explicitly approves.
 *
 * Requires:
 * - CIBA grant type enabled on the Auth0 Application
 * - Auth0 Guardian MFA enabled for the tenant
 * - User enrolled in Auth0 Guardian push notifications
 */
export const withAsyncAuthorization = auth0AI.withAsyncAuthorization({
  userID: async () => {
    const user = await getUser();
    return user?.sub as string;
  },
  bindingMessage: async (params: Record<string, unknown>) => {
    // Customize the approval message shown to the user
    const action = (params.action as string) ?? "perform an action";
    return `Your AI agent wants to: ${action}. Approve?`;
  },
  scopes: ["openid"],
  audience: process.env.AUTH0_AUDIENCE!,
  onAuthorizationRequest: async () => {
    console.log("Authorization request sent to user's device.");
  },
  onUnauthorized: async (e: Error) => {
    if (e instanceof AccessDeniedInterrupt) {
      return "The user denied this action.";
    }
    return `Authorization failed: ${e.message}`;
  },
});
