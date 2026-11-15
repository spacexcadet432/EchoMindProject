# EchoMind

EchoMind is a browser-only reflection app. It does not use Supabase, remote accounts, or a server-side database. A local profile and reflections are stored in the current browser's local storage. The profile is not verified against a school roster and does not sync between devices; a new device needs a separate local profile.

Local browser storage is not encrypted. Anyone with access to the browser profile may be able to read the saved name, roll number, phone number, and reflections. Do not use a shared/public browser. The app menu can sign out and clear local profile and reflections; clearing browser site data also removes them.

## Run locally

```sh
npm install
npm run dev
```

## Verify a production build

```sh
npm run build
```
