import { tool } from "ai";
import { z } from "zod";
import { getTokenVaultCredentials } from "@auth0/ai-vercel";
import { withGoogleToken } from "../auth0-ai";

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
}

interface GmailMessageList {
  messages?: Array<{ id: string }>;
}

/**
 * Tool: Read Gmail messages
 *
 * Uses Auth0 Token Vault to securely retrieve the user's Google OAuth token.
 * No token handling needed in your code — Auth0 manages it automatically.
 *
 * Demo flow:
 * 1. User logs in via Auth0 with Google
 * 2. Auth0 stores Google token in Token Vault
 * 3. Agent calls this tool → Token Vault injects token → Gmail API returns emails
 */
export const readGmailTool = withGoogleToken(
  tool({
    description:
      "Read the user's recent Gmail messages. Use this to summarize emails, find specific messages, or check the inbox.",
    parameters: z.object({
      count: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("Number of recent emails to retrieve"),
      query: z
        .string()
        .optional()
        .describe(
          "Optional Gmail search query (e.g. 'from:boss@company.com' or 'subject:invoice')"
        ),
    }),
    execute: async ({ count, query }) => {
      const credentials = getTokenVaultCredentials();
      const token = credentials?.accessToken;

      if (!token) {
        return "No Google token available. Please reconnect your Google account.";
      }

      const searchQuery = query
        ? `?q=${encodeURIComponent(query)}&maxResults=${count}`
        : `?maxResults=${count}`;

      // Fetch message list
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listRes.ok) {
        return `Gmail API error: ${listRes.statusText}`;
      }

      const listData: GmailMessageList = await listRes.json();
      const messageIds = listData.messages?.slice(0, count) ?? [];

      if (messageIds.length === 0) {
        return "No emails found.";
      }

      // Fetch each message's details
      const messages = await Promise.all(
        messageIds.map(async ({ id }) => {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!msgRes.ok) return null;
          const msg: GmailMessage = await msgRes.json();
          const headers = msg.payload?.headers ?? [];
          const from = headers.find((h) => h.name === "From")?.value ?? "Unknown";
          const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
          const date = headers.find((h) => h.name === "Date")?.value ?? "";
          return { id: msg.id, from, subject, date, snippet: msg.snippet };
        })
      );

      return messages.filter(Boolean);
    },
  })
);
