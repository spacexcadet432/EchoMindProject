# EchoMind

EchoMind stores the local profile and conversation history in the current browser's local storage; it does not use Supabase, remote accounts, or a server-side database. A new device needs a separate local profile. When a user sends a message, the message and recent conversation context are sent through the server-side `/api/chat` endpoint to the configured NVIDIA AI service. The NVIDIA key is never exposed to the browser.

Local browser storage is not encrypted. Anyone with access to the browser profile may be able to read the saved name, roll number, phone number, and reflections. Do not use a shared/public browser. The app menu can sign out and clear local profile and reflections; clearing browser site data also removes them.

The chat includes a phrase-based local safety gate for possible self-harm or suicidal content. It pauses that session and shows crisis contact options before any request reaches NVIDIA. This is not a clinical risk assessment and can miss or misclassify messages; it is not an emergency service.

## Run locally

```sh
npm install
npm run dev
```

For local chat replies, create a `.env` file using `.env.example` and set `NVIDIA_API_KEY`, `NVIDIA_MODEL`, and optionally `NVIDIA_API_URL`. Never use a `VITE_` prefix for the API key. In production, set these values as server-side environment variables in the hosting provider (for example, Vercel Project Settings → Environment Variables), then redeploy.

`NVIDIA_API_URL` defaults to `https://integrate.api.nvidia.com/v1/chat/completions`. The `NVIDIA_MODEL` value must be a model ID available to your NVIDIA API account.

## Verify a production build

```sh
npm run build
```
