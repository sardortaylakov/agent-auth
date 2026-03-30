# agent-auth

A demo of [Auth0 for AI Agents](https://auth0.com/ai) — showing how to build secure, production-ready AI agents that act on behalf of users.

Built with **Next.js 15**, **Vercel AI SDK**, and **Auth0 AI SDK**.

---

## What this demo shows

| Feature | Description |
|---|---|
| 🔑 **Token Vault** | Auth0 stores and manages the user's Google OAuth token. No manual token handling. |
| 📧 **Gmail access** | Agent reads emails and can send on the user's behalf |
| 📅 **Calendar access** | Agent lists events and can create new ones |
| ✋ **Human-in-the-Loop** | Write actions (send email, create event) require explicit user approval via push notification |
| 👤 **User identity** | Each user's agent only accesses their own data |

---

## Demo flow

```
1. User logs in via Auth0 (Google OAuth)
2. Auth0 stores Google token in Token Vault
3. User opens chat → "Summarize my last 5 emails"
4. Agent reads Gmail via Token Vault (no approval needed)
5. User → "Reply to John saying I'll be late"
6. Agent pauses → sends push notification to user's phone
7. User approves → email sent → agent confirms
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/sardortaylakov/agent-auth.git
cd agent-auth
npm install
```

### 2. Configure Auth0

1. Create an [Auth0 account](https://auth0.com/signup)
2. Go to **Applications → Applications → Create Application** (Regular Web App)
3. Set **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
4. Set **Allowed Logout URLs**: `http://localhost:3000`
5. Under **Advanced → Grant Types**, enable:
   - ✅ Token Vault
   - ✅ Client Initiated Backchannel Authentication (CIBA) ← for human-in-the-loop
   - ✅ Refresh Token
6. Go to **Auth → Social → Google** and enable Google OAuth connection
7. Go to **Security → Multi-factor Auth** and enable **Guardian Push Notifications**
8. Register an API: **Applications → APIs → Create API** with identifier `https://agent-auth-api`

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
APP_BASE_URL=http://localhost:3000
AUTH0_SECRET=                   # openssl rand -hex 32
AUTH0_DOMAIN=                   # your-tenant.us.auth0.com
AUTH0_CLIENT_ID=                # from Auth0 dashboard
AUTH0_CLIENT_SECRET=            # from Auth0 dashboard
AUTH0_AUDIENCE=https://agent-auth-api

OPENAI_API_KEY=                 # from platform.openai.com

AUTH0_CONNECTION=google-oauth2
```

### 4. Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                   # Login page + chat UI (server component)
│   ├── api/
│   │   ├── auth/[auth0]/route.ts  # Auth0 catch-all handler (login/logout/callback)
│   │   └── chat/route.ts          # Agent streaming endpoint
│   └── globals.css
├── components/
│   └── Chat.tsx                   # Chat UI (client component)
└── lib/
    ├── auth0.ts                   # Auth0 client setup
    ├── auth0-ai.ts                # Token Vault + Async Authorization wrappers
    └── tools/
        ├── gmail-read.ts          # Read Gmail (Token Vault, no approval needed)
        ├── gmail-send.ts          # Send Gmail (Token Vault + Async Authorization)
        └── calendar.ts            # Read/create Calendar events
```

---

## How it works

### Token Vault
```ts
// Auth0 injects the user's Google token automatically
export const readGmailTool = withGoogleToken(
  tool({ ... execute: async () => {
    const { accessToken } = getTokenVaultCredentials();
    // use token to call Gmail API
  }})
);
```

### Human-in-the-Loop (Async Authorization)
```ts
// Tool is paused until user approves on their phone
export const sendGmailTool = withAsyncAuthorization(
  withGoogleToken(
    tool({ ... })
  )
);
```

---

## Built for OpenClaw

This demo was built as a reference for integrating Auth0 AI into [OpenClaw](https://openclaw.ai) — specifically for cloud deployments where agents act on behalf of users across Gmail, Calendar, LinkedIn, and other integrations.

---

## Resources

- [Auth0 for AI Agents](https://auth0.com/ai)
- [Auth0 AI SDK (JS)](https://github.com/auth0/auth0-ai-js)
- [Token Vault docs](https://auth0.com/ai/docs/get-started/token-vault)
- [Async Authorization docs](https://auth0.com/ai/docs/get-started/asynchronous-authorization)
- [Vercel AI SDK](https://sdk.vercel.ai)
