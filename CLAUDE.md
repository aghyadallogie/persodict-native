# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The Expo-wide rules imported above (versioned docs lookup, `npx expo install`, CNG — never hand-edit `ios/`/`android/`) apply here; the rest of this file covers what is specific to Persodict.

## What this is

Persodict mobile: an Expo SDK 57 / React Native 0.86 / Expo Router client for a personal translation dictionary. A user logs in, translates a phrase into their chosen languages (the backend does the translation and stores it), and browses/deletes their history. Backend is a separate NestJS + PostgreSQL service (deployed at `https://persodict-be.vercel.app/api`); its base URL comes from `EXPO_PUBLIC_API_URL` in `.env`. On a physical device, don't point it at `localhost`.

## Commands

npm project (`package-lock.json`), so use `npx`, not `bunx`.

```bash
npx expo start          # dev server (npm start / android / ios / web)
npx expo lint           # lint (npm run lint)
npx tsc --noEmit        # typecheck
```

The README targets Expo Go (SDK 57) on a phone, so a dependency with native code that Expo Go doesn't bundle would require switching to a development build.

There is no test setup. `npm run reset-project` is a leftover template script — `scripts/` doesn't exist.

`app.json` enables `typedRoutes` and `reactCompiler` experiments. Path alias `@/*` → `src/*`.

## Architecture

**Provider stack / auth gating** (`src/app/_layout.tsx`): `GestureHandlerRootView` → `ThemeProvider` → `AuthProvider` → root `Stack`. Navigation is gated with `Stack.Protected`: `(tabs)` when there is a session, `login` otherwise. Don't redirect manually after login/logout — changing the session flips the guard. `ThemeProvider` renders `null` until the theme preference loads from AsyncStorage, and the navigator renders `null` while auth is loading.

**Auth** (`src/lib/auth.tsx`): `signIn` POSTs `/auth/login`, stores the JWT in SecureStore under `persodict_session`, and keeps it as `session`. Feature API code reads the token straight from SecureStore (that key is repeated as a local `SESSION_KEY` const in several files) and sends `Authorization: Bearer`. A 401 throws `AuthError` (defined in `src/features/history/api-repository.ts` and shared by other features). Hooks catch it and call `signOut()`, and the guard then sends the user to login.

**Features** (`src/features/<name>/`): each feature has API calls plus SWR hooks. Shared SWR cache keys are plain strings:
- `'phrases'`: history list (`useHistory`, through the `HistoryRepository` interface / `historyRepository` singleton in `features/history/index.ts`; the repository pattern is there so the data source can be swapped, e.g. for local-first sync — but today only the list read goes through it; delete, translate and settings call `fetch` directly). `useDeletePhrase` does an optimistic remove and rolls back on failure. `useSubmitTranslate` revalidates `'phrases'` after a successful translate.
- `'settings'`: user language list (`useSettings`). `toggleLang` uses SWR `optimisticData` + `rollbackOnError`. `GET /settings` can return either a bare object or a `{ data }` envelope (see `unwrap`), and a 404 means a new user with no settings yet.
- Translate (`POST /phrases/translate`) is a `useSWRMutation` and needs at least one selected language.

The `Phrase` type mirrors the backend model: `{ id, authorId, translations: Record<langCode, string> }`.

**Screens**: `src/app/(tabs)/` holds home (translate), history, quiz, settings. `theme-toggle` is a fake tab: its `tabBarButton` toggles the theme instead of navigating. `quiz` and `src/app/index.tsx` are still placeholders. Non-route UI goes in `src/components/` (`ui/`, `history/`, `translate/`).

**Theming**: colors live in `src/constants/theme.ts` (`Colors.light` / `Colors.dark`). `useTheme()` returns `{ colors, isDark, mode, setMode }`. `mode: null` means follow the system, and an explicit mode is saved in AsyncStorage. Build styles with `useThemedStyles(factory)` (`src/lib/use-themed-styles.ts`), and reuse shared input/button styles from `commonStyles(colors)` in `src/styles/common.ts`. Don't hardcode colors in components.
