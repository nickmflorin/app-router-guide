# External References Ledger

Every external source used in the guide. Rendered at the bottom of all derived documents.
Format: `- [Title](URL) — what we used it for`

## Official docs — Next.js

- [Next.js 16 release post](https://nextjs.org/blog/next-16) — Cache Components model, "use cache" replacing implicit caching, PPR-by-default under cacheComponents, Turbopack
- [Getting Started: Caching](https://nextjs.org/docs/app/getting-started/caching) — current opt-in caching model
- [next.config.js: cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) — flag semantics; PPR as default behavior
- [Guide: Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components) — migration semantics for existing apps
- [Getting Started: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — boundary mechanics, composition patterns
- [Getting Started: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) — parallel vs sequential fetching, dedupe, streaming
- [Getting Started: Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) — prefetch, client-side transitions
- [File conventions: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading) — instant loading states / streaming
- [File conventions: error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error) — error boundaries per segment
- [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) — slots, default.js, independent loading/error per slot
- [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Lazy Loading / dynamic imports](https://nextjs.org/docs/app/guides/lazy-loading)

## Official docs — React

- [React 19.2 release post](https://react.dev/blog/2025/10/01/react-19-2) — Activity, useEffectEvent (stable), Suspense SSR batching, DevTools perf tracks, compiler 1.0 era
- [React blog index](https://react.dev/blog) — direction-of-travel narrative
- [Server Components](https://react.dev/reference/rsc/server-components) — RSC reference
- [cache](https://react.dev/reference/react/cache) — per-request memoization for server components
- [Suspense](https://react.dev/reference/react/Suspense) — triggers, fallback semantics, SSR streaming
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — anti-pattern canon for fetch-in-effect / derived state / prop-sync
- [Server Actions / "use server"](https://react.dev/reference/rsc/use-server)
- ['use client' directive](https://react.dev/reference/rsc/use-client) — module-graph semantics, serialization rules (§4)
- [useTransition](https://react.dev/reference/react/useTransition) — isPending indicators, no-fallback transitions (§8)
- [use](https://react.dev/reference/react/use) — reading promises with Suspense semantics (§8)

## Vercel / ecosystem

- [Cache Components for Instant and Fresh Pages — Vercel Academy](https://vercel.com/academy/nextjs-foundations/cache-components) — teaching framing for the caching model
- [SWR docs](https://swr.vercel.app) — client-side dedupe/cache (stale-while-revalidate)

## Community / secondary (verification & narrative only — prefer official above)

- [React 19.2 is here — LogRocket](https://blog.logrocket.com/react-19-2-is-here/) — 19.2 feature summary cross-check
- [What's Next for React in 2026 — Telerik](https://www.telerik.com/blogs/whats-next-react-2026) — ecosystem direction cross-check
- [The State of Server Components in 2026 — PkgPulse](https://www.pkgpulse.com/guides/state-of-server-components-2026) — adoption narrative cross-check

> To verify before publishing: exact URLs return 200; claims sourced to community posts should be re-anchored to official docs where possible.
