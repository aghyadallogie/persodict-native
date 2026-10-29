# Persodict — Mobile

A React Native (Expo) client for Persodict, a personal translation dictionary.
Translations are created on the device and synced with a NestJS backend.

## Stack

- **Expo SDK 57** (React Native, Expo Router)
- **TypeScript**
- **SWR** — server state, caching, revalidation
- **expo-secure-store** — JWT persistence
- **@react-native-async-storage/async-storage** — theme preference
- **NestJS + PostgreSQL backend** — deployed at `https://persodict-be.vercel.app/api`

## Features

- Email/password authentication (JWT stored in SecureStore)
- Translate a word into the user's selected languages, saved server-side
- History of all past translations, with delete (swipe or tap)
- Language selection (15 languages) with per-flag optimistic toggle
- Light / dark theme toggle, persisted on device
- Auth-gated navigation via Expo Router's `Stack.Protected`

## Getting Started

### Prerequisites

- Node.js 20+
- Expo Go installed on your phone (SDK 57 build — from [expo.dev/go](https://expo.dev/go))
- A running instance of the backend, or access to the deployed one

### Install

```bash
npm install



### 📌 A few notes on the content

- **The "Roadmap" section is intentional.** It documents where the app is heading (local-first sync), which is useful context for anyone reviewing the repo — and it keeps the "cache-first" promise visible rather than buried in commit history.
- **The "Architecture Notes" section is the most valuable part.** It explains *why* the repository pattern exists, which prevents a future contributor (or you in three months) from bypassing it and calling `fetch` directly from a screen.
- **The backend endpoint table** is accurate to what we've confirmed from the Swagger and controllers. If the backend gains endpoints later, this is the place to update.
- **The `Do not use localhost` warning** is there because it's the single most common RN + local backend mistake — and it cost time earlier in this project.

Trim any sections that don't apply (e.g., if you'd rather not commit the Roadmap publicly, drop it). Otherwise this is ready to drop at the repo root as `README.md`.