# EchoMind

EchoMind is a browser-only reflection app. It does not use Supabase, accounts, or a server-side database. Reflections are stored in the current browser's local storage and do not sync between devices.

Local browser storage is not encrypted. Anyone with access to the browser profile may be able to read the saved reflections. Clearing the app's local memory or the browser's site data permanently removes them.

## Run locally

```sh
npm install
npm run dev
```

## Verify a production build

```sh
npm run build
```
