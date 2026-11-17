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
npm test                # jest (jest-expo preset) — one run, not watch mode
```

The README targets Expo Go (SDK 57) on a phone, so a dependency with native code that Expo Go doesn't bundle would require switching to a development build.

**Tests** live in `src/__tests__/`, mirroring `src/` (outside `src/app/`, which Expo Router treats as routes), named `*.test.ts(x)`. Stack: Jest 29 + `jest-expo` + `@testing-library/react-native` v14 (config is the `jest` block in `package.json`; `@/*` is mapped to `src/*`). Things that differ from older RNTL / what you'd expect:
- In RNTL v14, `render`, `renderHook`, `fireEvent` and `act` are all async: `await` them.
- Updates that come from SWR don't render inside RNTL's `waitFor` and don't refresh `renderHook`'s `result.current`. In SWR tests, read the hook's values during render into a local variable and poll inside `act` (see the `eventually` helper in `use-delete-phrase.test.tsx`). SWR also only re-renders for fields read during render, so destructure them there.
- `jest.setup.js` (registered as `setupFilesAfterEnv`) mocks `react-native-reanimated` and `react-native-worklets` with their built-in mocks, so components with animations render in tests (animations resolve instantly). Without it, importing Reanimated fails with a worklets native-module error.
- Mock the boundary, not SWR: `jest.mock('@/lib/api')` (keep `AuthError` via `jest.requireActual`), `@/lib/auth`, and `@/lib/theme` for components. Give each test its own cache with `<SWRConfig value={{ provider: () => new Map() }}>`.
- Covered so far: `apiFetch`, the settings/history API code, `useDeletePhrase` (optimistic remove + rollback), `useSubmitTranslate`, `useAuthSubmit`, the register screen's validation, and the quiz (`buildQuestion`, `useQuiz`, the quiz screen). Jest may print a harmless "worker failed to exit gracefully" warning (SWR timers).

`npm run reset-project` is a leftover template script that points at a `scripts/reset-project.js` which doesn't exist. `scripts/generate-icons.mjs` regenerates the app icon/splash/favicon PNGs from the logo geometry (`npm i --no-save sharp && node scripts/generate-icons.mjs`; `sharp` is intentionally not a dependency). `eas.json` defines an internal `preview` APK build profile.

`app.json` enables `typedRoutes` and `reactCompiler` experiments. Path alias `@/*` → `src/*`.

## Architecture

**Provider stack / auth gating** (`src/app/_layout.tsx`): `GestureHandlerRootView` → `ThemeProvider` → `AuthProvider` → root `Stack`. Navigation is gated with `Stack.Protected`: `(tabs)` when there is a session, `login` / `register` otherwise. Don't redirect manually after login/logout — changing the session flips the guard. `ThemeProvider` renders `null` until the theme preference loads from AsyncStorage, and the navigator renders `null` while auth is loading.

**Auth** (`src/lib/auth.tsx`): `signIn` / `signUp` POST `/auth/login` / `/auth/register` (unauthenticated, with a timeout), store the JWT in SecureStore and keep it as `session`. `signOut` deletes the token, resets `session` and clears the whole SWR cache (the cache keys aren't per-user, so without this the next login would briefly see the previous user's data).

**API client** (`src/lib/api.ts`): every authenticated request goes through `apiFetch(path, init)`. It prefixes `EXPO_PUBLIC_API_URL`, reads the JWT from SecureStore (`SESSION_KEY` lives here), sends `Authorization: Bearer` + JSON content type, and throws `AuthError` when there is no token or the response is 401. Any other status is returned for the caller to handle. Hooks catch `AuthError` and call `signOut()`, and the guard then sends the user to login. Use `apiFetch` for new endpoints instead of calling `fetch` directly.

**Features** (`src/features/<name>/`): each feature has API calls plus SWR hooks. Shared SWR cache keys are plain strings:
- `'phrases'`: history list (`useHistory`, through the `HistoryRepository` interface / `historyRepository` singleton in `features/history/index.ts`; the repository pattern is there so the data source can be swapped, e.g. for local-first sync — but today only the list read goes through it; delete, translate and settings call `apiFetch` directly). `useDeletePhrase` does an optimistic remove and rolls back on failure. `useSubmitTranslate` appends the new phrase to the `'phrases'` cache without revalidating, shows the result, then revalidates in the background.
- `'settings'`: user language list (`useSettings`). `toggleLang` uses SWR `optimisticData` + `rollbackOnError`. `GET /settings` can return either a bare object or a `{ data }` envelope (see `unwrap`), and a 404 means a new user with no settings yet.
- Translate (`POST /phrases/translate`) is a `useSWRMutation` and needs at least one selected language. `handleSubmit` resolves to `true` only on success, so the home screen keeps the typed text when a translation fails.

**Quiz** (`src/features/quiz/`, screen `src/app/(tabs)/quiz.tsx`): an endless multiple-choice streak, client-side only (no API, the streak lives in component state and resets when the app restarts). Needs `MIN_PHRASES` (8) phrases in History, otherwise the tab shows `QuizLocked` with progress. `buildQuestion` (pure, injectable `rng`) shows the `en` text of a random phrase and offers its translation in a random one of the user's languages among 3 distinct random wrong answers taken from other phrases; it skips languages/phrases with missing translations and returns `null` if it can't build 4 distinct options. `useQuiz` reads `useHistory` + `useSettings`, exposes a `status` (`loading` / `error` / `locked` / `unavailable` / `playing`), and after an answer shows green/red for `NEXT_QUESTION_DELAY_MS` before dealing the next question (never the same phrase twice in a row). The first question is dealt by adjusting state during render, not in an effect (`react-hooks/set-state-in-effect` is an error here).

Quiz layout and motion: the prompt area and `OptionButton` have fixed heights (long text shrinks/truncates), so nothing shifts between questions; the streak sits at the bottom. All animation is Reanimated: each new question remounts (key = `phraseId:targetLang`) and replays a staggered `FadeInDown`; `OptionButton` fades to green/red, pops when correct and shakes when wrong; `StreakCounter` bumps up on a correct answer and dips on a reset; the `QuizLocked` bar fills in. Shared values are driven from `useEffect` on a state change. Animations respect the system "reduce motion" setting by default.

Haptics (`src/lib/haptics.ts`, `expo-haptics`): `useQuiz.answer` calls `correctHaptic()` / `wrongHaptic()` once per accepted answer (taps while an answer is showing are ignored, so they give no haptic). On Android these use `performAndroidHapticsAsync` (`Confirm` / `Reject`, which the Expo docs prefer and which needs no `VIBRATE` permission); elsewhere `notificationAsync` (`Success` / `Error`). They are fire-and-forget and swallow every failure, so a device without haptics can't break an answer. Add any new haptic as a function in that file rather than calling `expo-haptics` from components.

The `Phrase` type mirrors the backend model: `{ id, authorId, translations: Record<langCode, string> }`.

**Screens**: `src/app/(tabs)/` holds home (translate), history, quiz, settings. `theme-toggle` is a fake tab: its `tabBarButton` toggles the theme instead of navigating. `src/app/index.tsx` just redirects to `/home` or `/login`. Non-route UI goes in `src/components/` (`ui/`, `history/`, `translate/`, `auth/`, `quiz/`). `login` and `register` are thin screens (fields + validation) on top of the shared `AuthScreen` layout (`components/auth/auth-screen.tsx`) and the `useAuthSubmit` hook (`features/auth/use-auth-submit.ts`, submitting/error state).

**Theming**: colors live in `src/constants/theme.ts` (`Colors.light` / `Colors.dark`). `useTheme()` returns `{ colors, isDark, mode, setMode }`. `mode: null` means follow the system, and an explicit mode is saved in AsyncStorage. Build styles with `useThemedStyles(factory)` (`src/lib/use-themed-styles.ts`), and use the shared `Input` / `Button` / `Screen` from `src/components/ui/` (an ESLint rule forbids raw `TextInput`; use `Input`). Write any color with alpha as `rgba(...)` (or 8-digit hex), never `rgb(r, g, b, a)`: React Native tolerates the 4-value `rgb()`, but Reanimated's own parser rejects it, so an animated style that touches that color (e.g. `interpolateColor`) throws on first run. That can leave Reanimated stuck in "inside an updater" mode and surface later as an unrelated `Cannot create property 'reduceMotion' on number '1'` on the next `entering` animation. `src/__tests__/constants/theme.test.ts` checks every token against Reanimated's parser. Don't hardcode colors in components: add a token to `Colors` instead (`danger` / `success` for error and correct states, `white` for text on solid fills).
