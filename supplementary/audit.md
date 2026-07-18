# Tracker: Next.js App Router Usage Audit

**Date:** 2026-07-08 · **Scope:** all 6 Next.js (v16) UIs in the monorepo

## Purpose

This audit exists to answer one question: how far does our actual usage of the App Router diverge
from the model the framework is built around? It was performed as the factual baseline for the App
Router Guide. Before asking the team to adopt server-first patterns, we need a specific, cited
picture of where we stand today, so the guide's recommendations map to real code rather than
hypotheticals, and so we can prioritize the fixes that matter most.

To be explicit about the spirit of this document: it is not meant to be bashful, and it is not a
critique of any individual's work. Every pattern documented here is the industry-default way React
was written for a decade, and all of it "works" today. The reason to write it down anyway is that
these are the kinds of problems that do not stay the same size. Every new page copies the patterns
of the page before it; every hook written around a client-side fetch becomes a dependency of the
next feature. The gaps below will compound and get worse the longer they go unaddressed, and the
cost of fixing them is the cheapest it will ever be right now. The focus throughout is therefore on
the gaps, because the gaps are the work.

**Verdict:** These apps are SPAs wearing an App Router costume. The Next server is used almost
exclusively to serve an empty shell and proxy API calls; nearly all data fetching, authorization,
and loading-state management happens client-side after hydration. Notably, none of this is imposed
by our infrastructure: the same auth setup already supports direct server-side reads (portal-ui's
root page does so today), so the client-fetch architecture is a choice, not a constraint.

## The numbers

| App              | page.tsx | Client pages | Async server pages | `"use client"` files | useEffect | loading.tsx | error.tsx | Suspense |
| ---------------- | -------- | ------------ | ------------------ | -------------------- | --------- | ----------- | --------- | -------- |
| ojl-ui           | 32       | 8            | 1\*                | 454 / 760            | 141       | 8           | 8         | 5        |
| craft-profile-ui | 11       | 9            | 0                  | 55 / 74              | 49        | 0           | 0         | 6        |
| forms-ui         | 8        | 5            | 1                  | 19 / 29              | 12        | 0           | 0         | 0        |
| iam-ui           | 7        | 6            | 0                  | 9 / 14               | 6         | 0           | 0         | 4        |
| portal-ui        | 1        | 0            | 1                  | 8 / 19               | 3         | 0           | 0         | 0        |
| compliance-ui    | 1        | 0            | 0                  | 2 / 4                | 2         | 0           | 0         | 0        |

\* The one async page in ojl-ui only awaits `params`, then hands off to an 862-line client
component.

Zero server actions (`"use server"`), zero
`unstable_cache`/`"use cache"`/`revalidate`/`React.cache()`, and zero `useSWR` across the entire
repo. Every `<Suspense>` exists to silence the `useSearchParams` build error, not to stream.

---

## Finding 1: All data fetching is client-side through a self-hosted proxy

**ojl-ui** has **73 route handlers** under `src/app/api/`, all pass-through proxies
(`src/app/api/proxy/[...path]/route.ts` forwards to `OJL_API_URL`, converting the `access_token`
cookie to a Bearer header). `src/services/api.ts` points every service call at `/api/proxy`. So
every read is: browser → Next route handler → upstream API. That is an extra network hop per
request, and the server never uses any of this data to render.

**craft-profile-ui** is the same pattern, hand-rolled: 13 hooks in `src/hooks/` (`usePeople`,
`usePeoplePageData`, `useProfile`, `useOnboardingState`, …) each duplicating `useState` +
`useEffect` + manual `isLoading`/`error`/`refetch`, calling `/api/bff/*` and `/api/proxy/*` route
handlers. No React Query, no SWR: no dedupe, no cache, remounting any page refetches everything.

**Representative trace** (`ojl-ui/src/app/(participant)/my/home/page.tsx`): a 5-line server shell →
`<HomePage />` (`"use client"`) → children fetch via `useSubmissionSummary()` after hydration. Same
shape everywhere.

**Why it matters:** every page pays shell → hydrate → `/users/me` → data. The proxy's cookie→Bearer
logic works identically inside a server component; page-level reads should be `async` server
components calling the upstream API directly, one hop, before first paint. The gap is architectural,
not infrastructural: the exact same cookie logic is already exercised server-side elsewhere in the
repo.

## Finding 2: `"use client"` poisons whole subtrees instead of leaves

The directive sits at page/feature level, usually just to call
`useParams`/`useSearchParams`/`useRouter`, values a server page receives as props:

- `ojl-ui/src/app/(admin)/manage/programs/[programId]/page.tsx`: entire page client to read params
  and run a fetch effect.
- `ojl-ui/.../reports/ojt-hours-summary/page.tsx`: client page pulling 4 router hooks + 4 data
  hooks; the KPI band and table are display-only, only the filter strip and export buttons need
  interactivity.
- `ojl-ui/src/components/admin/appendix-a/DraftDetail.tsx` (862 lines),
  `ProgramManagerDetailView.tsx` (679), `RosterGapReportsPage.tsx` (626): full read-mostly views
  shipped as client JS end to end.
- `craft-profile-ui/src/app/system/people/page.tsx`: 575-line client page; one hook returns ~30
  values threaded down as a `state` object; any mutation calls `refetchAll()` which refires both
  fetch hooks.
- `craft-profile-ui/src/app/system/onboarding/layout.tsx` and
  `ojl-ui/src/app/(participant)/layout.tsx`: **client layouts**, which force the entire segment
  client-side. The participant layout fetches `/users/me` post-hydration just to render a first name
  the server already has via the auth cookie.

**Fix:** pages/layouts stay server; render static structure and fetched data on the server; isolate
interactivity into leaf client components (buttons, filter bars, dialogs, sheets).

## Finding 3: useEffect used for fetching, mutations, and prop-syncing

- **Fetch-in-effect with hand-rolled state, next to an installed React Query**:
  `ojl-ui/.../programs/[programId]/page.tsx:26-47`, `DraftDetail.tsx:553-576` (two sequential fetch
  effects), `DashboardPageContent.tsx:64-95` (React Query _and_ a raw `Promise.all` effect into
  three `useState`s in the same component).
- **A hand-written React Query**: `ojl-ui/src/hooks/useProfile.ts`: `useState`+`useEffect` fetch of
  `/users/me` with a module-level in-flight-promise dedup hack.
- **A mutation in an effect**: `iam-ui/src/app/verify-email/page.tsx:33-56` fires the verify-email
  POST from `useEffect`, with a `useRef` guard against StrictMode double-invoke. The token is a
  search param; this should be verified server-side and rendered as plain HTML.
- **Prop→state sync effects**: `ojl-ui/.../EditOrganizationDialog.tsx:107-112` (and
  `AddOrganizationDialog`, `BasicProgramInfoDialog`); `craft-profile-ui/.../PeopleFilterBar.tsx:63`
  carries an eslint-disable for `set-state-in-effect`. `MemberDetailSlideout.tsx:122` uses the
  reset-key pattern, but it is applied inconsistently: the same problem is solved three different
  ways across sibling dialogs.
- **Dynamic-route params fetched client-side**: `forms-ui/templates/[id]/preview` (read-only page,
  `"use client"`, `fetch` in effect, workaround comment for `id === undefined` during prefetch),
  `forms-ui/r/[token]` initial load, `craft-profile-ui/invitations/accept/[token]`.

## Finding 4: Client-side authorization

`craft-profile-ui/src/components/admin/CraftAdminGuard.tsx` gates the admin subtree by fetching
`/api/proxy/users/me/status` in a `useEffect` and toggling state, showing a spinner meanwhile.
Authorization decided in the browser, per mount, with a round trip. ojl-ui has no `middleware.ts`;
auth lives in the proxy handlers, so unauthenticated users get a full page render before any 401.
Fix: server layout check with `redirect()`/`notFound()` (as
`craft-profile-ui/src/app/system/layout.tsx` already does for cookie presence).

## Finding 5: No streaming, no route-level loading/error boundaries

24 of 32 ojl-ui routes, including all 15 participant/reviewer pages, the highest-traffic surfaces,
have no `loading.tsx` or `error.tsx`. craft-profile-ui, forms-ui, iam-ui, portal-ui: zero across all
four. Every loading state is a hand-rolled `isLoading` conditional; every error path falls through
to `global-error.tsx` or a blank crash. No `<Suspense>` streams server data anywhere;
`ojl-ui/.../organizations/page.tsx` even renders `<Suspense>` with no fallback.

## Finding 6: Structural waterfalls

The dependency chains are serialized on the client: `useProfile` →
`organizationId = profile?.organizations?.[0]?.id` → `useDashboardData`
(`enabled: !!organizationId`). There are **53 `enabled:`-gated dependent queries** in ojl-ui, each
one a client round-trip that a server component would resolve in a single pass with `Promise.all`.
The `consistencyToken` searchParam hack in program detail (read-your-writes after create) is a
problem `revalidatePath` + server actions solve natively.

## Finding 7: Caching opted out globally, then not replaced

`ojl-ui` and `craft-profile-ui` set `export const dynamic = "force-dynamic"` on the **root layout**
(to read boot-time env), and every fetch is `no-store`. So the apps opt out of static rendering,
partial prerendering, and the data cache, while also fetching nothing on the server. The only cache
anywhere is React Query's in-memory `staleTime: 60s` in ojl-ui, which evaporates on every full page
load.

## Finding 8: Missing App Router features entirely

No parallel routes (`@slot`), no intercepting routes (`(.)`), anywhere, despite many drawer/sheet
flows (`FocusedReviewDrawer`, `LogTimeSheet`, `ObservationsModuleSheet`) that are pure client state
and not URL-addressable. No server actions despite dozens of form mutations. No `not-found.tsx`
outside roots.

---

## Prioritized fixes

1. **Convert page-level reads to async server components** (start: ojl-ui program/participant
   detail + dashboard; craft-profile-ui `system/people`, `system/platform/organizations`). Fetch
   upstream APIs directly server-side using the cookie, `Promise.all` for parallel loads. Keep React
   Query for mutations/polling/filter-driven re-queries only.
2. **Push `"use client"` to leaves.** Pages and layouts server by default; params/searchParams via
   props, not hooks. De-clientify the participant and onboarding layouts first, because they poison
   everything below them.
3. **Add `loading.tsx` + `error.tsx` per segment and stream with `<Suspense>`**, then delete the
   hand-rolled `isLoading`/`error` state they replace.
4. **Move authorization server-side** (`CraftAdminGuard` → server layout `redirect()`; add
   middleware for coarse auth).
5. **Kill fetch-in-useEffect.** Server component for initial data; React Query (one paradigm, not
   three) for client-side needs; `key` prop instead of prop-sync effects; server actions +
   `revalidatePath` instead of the `consistencyToken` hack.
6. **Restore caching deliberately**: scope `force-dynamic` to what needs it, use `React.cache()` for
   per-request dedupe, `revalidate`/`"use cache"` for static-ish data (templates, org lists, filter
   options).
