import { tool } from "ai";
import { z } from "zod";
import { getTokenVaultCredentials } from "@auth0/ai-vercel";
import { withGoogleToken, withAsyncAuthorization } from "../auth0-ai";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

interface CalendarEventList {
  items?: CalendarEvent[];
}

/**
 * Tool: List upcoming calendar events
 *
 * Read-only. Uses Token Vault to get the Google token.
 * No approval needed — just reading data.
 */
export const listCalendarEventsTool = withGoogleToken(
  tool({
    description:
      "List the user's upcoming Google Calendar events. Use this to check availability, find meetings, or summarize the schedule.",
    parameters: z.object({
      count: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("Number of upcoming events to retrieve"),
    }),
    execute: async ({ count }) => {
      const credentials = getTokenVaultCredentials();
      const token = credentials?.accessToken;

      if (!token) {
        return "No Google token available. Please reconnect your Google account.";
      }

      const now = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=${count}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        return `Calendar API error: ${res.statusText}`;
      }

      const data: CalendarEventList = await res.json();
      const events = data.items ?? [];

      if (events.length === 0) {
        return "No upcoming events found.";
      }

      return events.map((e) => ({
        id: e.id,
        title: e.summary ?? "(no title)",
        start: e.start?.dateTime ?? e.start?.date ?? "Unknown",
        end: e.end?.dateTime ?? e.end?.date ?? "Unknown",
        location: e.location ?? null,
        description: e.description ?? null,
      }));
    },
  })
);

/**
 * Tool: Create a calendar event
 *
 * Wrapped with async authorization — user must approve before the event is created.
 * Demo flow: "Schedule a meeting with John tomorrow at 2pm" →
 *   push notification → user approves → event created
 */
export const createCalendarEventTool = withAsyncAuthorization(
  withGoogleToken(
    tool({
      description:
        "Create a new event on the user's Google Calendar. IMPORTANT: Requires user approval before creating.",
      parameters: z.object({
        title: z.string().describe("Event title"),
        startDateTime: z
          .string()
          .describe("Start date and time in ISO 8601 format (e.g. 2024-04-01T14:00:00)"),
        endDateTime: z
          .string()
          .describe("End date and time in ISO 8601 format (e.g. 2024-04-01T15:00:00)"),
        description: z.string().optional().describe("Optional event description"),
        location: z.string().optional().describe("Optional event location"),
        attendees: z
          .array(z.string())
          .optional()
          .describe("Optional list of attendee email addresses"),
        action: z
          .string()
          .optional()
          .describe("Human-readable action for the approval prompt"),
      }),
      execute: async ({
        title,
        startDateTime,
        endDateTime,
        description,
        location,
        attendees,
      }) => {
        const credentials = getTokenVaultCredentials();
        const token = credentials?.accessToken;

        if (!token) {
          return "No Google token available. Please reconnect your Google account.";
        }

        const event = {
          summary: title,
          description,
          location,
          start: { dateTime: startDateTime, timeZone: "America/Los_Angeles" },
          end: { dateTime: endDateTime, timeZone: "America/Los_Angeles" },
          attendees: attendees?.map((email) => ({ email })),
        };

        const res = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          return `Failed to create event: ${JSON.stringify(err)}`;
        }

        const created: CalendarEvent = await res.json();
        return `Event "${created.summary}" created successfully. Start: ${created.start?.dateTime ?? created.start?.date}`;
      },
    })
  )
);
