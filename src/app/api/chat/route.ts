import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { setAIContext } from "@auth0/ai-vercel";
import { readGmailTool } from "@/lib/tools/gmail-read";
import { sendGmailTool } from "@/lib/tools/gmail-send";
import { listCalendarEventsTool, createCalendarEventTool } from "@/lib/tools/calendar";

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to the user's Gmail and Google Calendar.

You can:
- Read and summarize emails
- Search for specific emails
- Send emails on behalf of the user (requires their approval)
- List upcoming calendar events
- Create new calendar events (requires their approval)

Important rules:
- Always confirm before sending emails or creating calendar events — these actions require user approval automatically
- Be concise and helpful
- If asked to send an email or create an event, tell the user you're requesting their approval
- Format dates in a human-readable way
- Respect the user's privacy`;

/**
 * POST /api/chat
 *
 * Main agent endpoint. Streams responses back to the client.
 * All tools are registered here — Auth0 AI SDK handles auth automatically.
 */
export async function POST(req: NextRequest) {
  // Require authentication
  const session = await auth0.getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id } = await req.json();

  // Set the AI context (used by async authorization for thread tracking)
  setAIContext({ threadID: id ?? "default" });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      readGmail: readGmailTool,
      sendGmail: sendGmailTool,
      listCalendarEvents: listCalendarEventsTool,
      createCalendarEvent: createCalendarEventTool,
    },
    maxSteps: 5, // Allow multi-step tool use
    onError: (error) => {
      console.error("Agent error:", error);
    },
  });

  return result.toDataStreamResponse();
}
