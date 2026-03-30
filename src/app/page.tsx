import { auth0 } from "@/lib/auth0";
import Chat from "@/components/Chat";

/**
 * Home page
 *
 * - If the user is NOT logged in → show login page
 * - If the user IS logged in → show the chat interface
 *
 * Auth0 handles the full OAuth flow including Google token acquisition
 * for Token Vault on first login.
 */
export default async function Home() {
  const session = await auth0.getSession();

  // Not logged in — show login screen
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Auth Demo</h1>
          <p className="text-gray-500 mb-2 text-sm">
            A demo of{" "}
            <a
              href="https://auth0.com/ai"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Auth0 for AI Agents
            </a>{" "}
            built for OpenClaw
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Powered by Token Vault · Human-in-the-Loop · Async Authorization
          </p>

          <a
            href="/api/auth/login"
            className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Sign in with Google
          </a>

          <div className="mt-8 text-left bg-gray-50 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              What this demo shows
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex gap-2">
                <span>🔑</span>
                <span>
                  <strong>Token Vault</strong> — securely stores your Google token,
                  no re-auth needed
                </span>
              </div>
              <div className="flex gap-2">
                <span>📧</span>
                <span>
                  <strong>Gmail access</strong> — agent reads and can send emails
                </span>
              </div>
              <div className="flex gap-2">
                <span>📅</span>
                <span>
                  <strong>Calendar access</strong> — agent reads and creates events
                </span>
              </div>
              <div className="flex gap-2">
                <span>✋</span>
                <span>
                  <strong>Human-in-the-Loop</strong> — you approve before any write action
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — show chat interface
  return <Chat user={session.user} />;
}
