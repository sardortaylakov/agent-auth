import { tool } from "ai";
import { z } from "zod";
import {
  getTokenVaultCredentials,
  getAsyncAuthorizationCredentials,
} from "@auth0/ai-vercel";
import { withGoogleToken, withAsyncAuthorization } from "../auth0-ai";

/**
 * Tool: Send Gmail message
 *
 * This tool is wrapped with TWO Auth0 layers:
 * 1. withAsyncAuthorization — user must approve via push notification before the tool runs
 * 2. withGoogleToken — Auth0 Token Vault injects the Google OAuth token
 *
 * Demo flow:
 * 1. User asks agent to send an email
 * 2. Agent calls this tool → PAUSED
 * 3. Auth0 sends push notification to user's phone: "Your agent wants to send an email to X. Approve?"
 * 4. User approves → tool resumes → email sent
 * 5. If user denies → tool returns rejection message
 */
export const sendGmailTool = withAsyncAuthorization(
  withGoogleToken(
    tool({
      description:
        "Send an email on the user's behalf. IMPORTANT: This always requires user approval before sending.",
      parameters: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body text"),
        action: z
          .string()
          .optional()
          .describe("Human-readable description shown in the approval prompt"),
      }),
      execute: async ({ to, subject, body }) => {
        // Try async auth credentials first (from CIBA approval)
        const asyncCreds = getAsyncAuthorizationCredentials();
        // Fallback to token vault credentials
        const vaultCreds = getTokenVaultCredentials();
        const token = asyncCreds?.accessToken ?? vaultCreds?.accessToken;

        if (!token) {
          return "No Google token available. Please reconnect your Google account.";
        }

        // Construct RFC 2822 email
        const emailLines = [
          `To: ${to}`,
          `Subject: ${subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          body,
        ];
        const email = emailLines.join("\n");
        const encodedEmail = Buffer.from(email)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const res = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: encodedEmail }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          return `Failed to send email: ${JSON.stringify(err)}`;
        }

        return `Email sent successfully to ${to}.`;
      },
    })
  )
);
