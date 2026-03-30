"use client";

import { useChat } from "@ai-sdk/react";
import { useId } from "react";

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

interface ChatProps {
  user: User;
}

const SUGGESTED_PROMPTS = [
  "Summarize my last 5 emails",
  "Show my upcoming calendar events",
  "Find emails from my boss",
  "What meetings do I have this week?",
];

export default function Chat({ user }: ChatProps) {
  const threadId = useId();

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      id: threadId,
      body: { id: threadId },
    });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Agent Auth Demo</h1>
          <p className="text-sm text-gray-500">Auth0 AI · Token Vault · Human-in-the-Loop</p>
        </div>
        <div className="flex items-center gap-3">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name ?? "User"}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <a
            href="/api/auth/logout"
            className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Hi {user.name?.split(" ")[0]}! I&apos;m your AI assistant.
            </h2>
            <p className="text-gray-500 mb-8">
              I have access to your Gmail and Google Calendar. I&apos;ll always ask for
              your approval before sending emails or creating events.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    handleInputChange({
                      target: { value: prompt },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-2xl mx-auto flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.role === "assistant" &&
                message.parts?.some((p) => p.type === "tool-invocation") && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                    🔧 Tools used:{" "}
                    {message.parts
                      ?.filter((p) => p.type === "tool-invocation")
                      .map((p) => (p as { toolName?: string }).toolName)
                      .join(", ")}
                  </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="max-w-2xl mx-auto flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠️ {error.message}
            </div>
          </div>
        )}
      </div>

      {/* Approval notice banner */}
      {isLoading && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-2 text-center text-sm text-yellow-700">
          ⏳ Check your phone — your agent may be waiting for your approval
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything about your Gmail or Calendar..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
