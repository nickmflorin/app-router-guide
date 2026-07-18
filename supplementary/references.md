# External References Ledger

Every external source used in the guide. Rendered at the bottom of all derived documents. Format:
`- [Title](URL) - what we used it for`

## Official docs: Next.js

- [Next.js 16 release post](https://nextjs.org/blog/next-16) - Cache Components model, "use cache"
  replacing implicit caching, PPR-by-default under cacheComponents, Turbopack
- [Getting Started: Caching](https://nextjs.org/docs/app/getting-started/caching) - current opt-in
  caching model
- [next.config.js: cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
  - flag semantics; PPR as default behavior
- [Guide: Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
  - migration semantics for existing apps
- [Getting Started: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
  - boundary mechanics, composition patterns
- [Getting Started: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) -
  parallel vs sequential fetching, dedupe, streaming
- [Getting Started: Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
  - prefetch modes (static full / dynamic partial), client-side transitions, RSC payload on
    navigation, dynamic-routes-without-loading.tsx trap, useLinkStatus, hydration delay (§4.5)
- [Guide: Prefetching](https://nextjs.org/docs/app/guides/prefetching) - prefetch configuration,
  hover-only prefetching, disabling for large link lists (§4.5)
- [Rendering: Server Components (v14 guide)](https://nextjs.org/docs/14/app/building-your-application/rendering/server-components)
  - benefits of server rendering enumerated; "perceived loading performance" quote;
    static/dynamic/streaming strategies (§4)
- [File conventions: loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
  - instant loading states / streaming
- [File conventions: error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error) -
  error boundaries per segment
- [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) -
  slots, default.js, independent loading/error per slot
- [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Lazy Loading / dynamic imports](https://nextjs.org/docs/app/guides/lazy-loading)
- [Getting Started: Updating Data](https://nextjs.org/docs/app/getting-started/updating-data) -
  server actions from client components, revalidation after mutations (§5.7–5.8)
- [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) ·
  [revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) - cache
  invalidation as the post-mutation refresh channel (§5.8, §11.4)
- [useRouter - router.refresh()](https://nextjs.org/docs/app/api-reference/functions/use-router) -
  refresh for mutations outside server actions (§5.8)
- [Guide: Package Bundling](https://nextjs.org/docs/app/guides/package-bundling) -
  @next/bundle-analyzer for measuring first-render JS (§6.4)
- [page.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/page) -
  params/searchParams as async page props (§7.2)
- [useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - client
  read of the query string; Suspense requirement (§5.6, §7)
- [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies) - server-side preference
  reads; dynamic-rendering implications (§7.4)
- [Form component](https://nextjs.org/docs/app/api-reference/components/form) - string vs function
  action semantics, prefetching, progressive enhancement (§17)
- [useLinkStatus](https://nextjs.org/docs/app/api-reference/functions/use-link-status) - pending
  state of the enclosing Link; fixed-size-hint guidance (§17)
- [next.config.js: reactCompiler](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler)
  - enabling the React Compiler in Next.js (§17)

## Official docs: React

- [React 19.2 release post](https://react.dev/blog/2025/10/01/react-19-2) - Activity, useEffectEvent
  (stable), Suspense SSR batching, DevTools perf tracks, compiler 1.0 era
- [React blog index](https://react.dev/blog) - direction-of-travel narrative
- [Introducing Zero-Bundle-Size React Server Components (Dec 2020)](https://react.dev/blog/2020/12/21/data-fetching-with-react-server-components) -
  timeline anchor for the server era (§1)
- [React v18 (Mar 2022)](https://react.dev/blog/2022/03/29/react-v18) - concurrent rendering,
  streaming SSR (§1 timeline)
- [React v19 (Dec 2024)](https://react.dev/blog/2024/12/05/react-19) - Actions, use(), stable RSC
  APIs (§1 timeline)
- [Next.js 13 (Oct 2022)](https://nextjs.org/blog/next-13) ·
  [Next.js 13.4 (May 2023)](https://nextjs.org/blog/next-13-4) - App Router beta → stable (§1
  timeline)
- [Server Components](https://react.dev/reference/rsc/server-components) - RSC reference
- [cache](https://react.dev/reference/react/cache) - per-request memoization for server components
- [Suspense](https://react.dev/reference/react/Suspense) - triggers, fallback semantics, SSR
  streaming
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) -
  anti-pattern canon for fetch-in-effect / derived state / prop-sync
- [Server Actions / "use server"](https://react.dev/reference/rsc/use-server)
- ['use client' directive](https://react.dev/reference/rsc/use-client) - module-graph semantics,
  serialization rules (§5)
- [useTransition](https://react.dev/reference/react/useTransition) - isPending indicators,
  no-fallback transitions (§9); pending state for encapsulated mutation buttons (§5.7)
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) - the
  "before you use context" checklist (§11)
- [lazy](https://react.dev/reference/react/lazy) - deferred component loading; top-level declaration
  rule (verified against v19.2 docs) (§6.3)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) ·
  [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) -
  state placement principles behind §7
- [use](https://react.dev/reference/react/use) - reading promises with Suspense semantics (§9, §17)
- [useActionState](https://react.dev/reference/react/useActionState) - action result as form state +
  pending flag; replaced useFormState (§17)
- [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus) - nearest-form pending
  state for composable submit buttons (§17)
- [useOptimistic](https://react.dev/reference/react/useOptimistic) - optimistic value with automatic
  revert on action failure (§17)
- [useId](https://react.dev/reference/react/useId) - hydration-safe unique ids (§17)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) - external-store
  subscriptions with a server snapshot (§17)
- [useEffectEvent](https://react.dev/reference/react/useEffectEvent) - non-reactive effect logic;
  stable in 19.2 (§17)
- [Activity](https://react.dev/reference/react/Activity) - hide/restore subtrees without unmounting;
  state survives (§17)
- [ViewTransition](https://react.dev/reference/react/ViewTransition) - canary-only status verified
  2026-07-17; watch for stabilization (§17)
- [Profiler](https://react.dev/reference/react/Profiler) - programmatic render-cost measurement
  (§17)
- [React Compiler](https://react.dev/learn/react-compiler) - automatic memoization; 1.0 era guidance
  (§17)
- [form (react-dom)](https://react.dev/reference/react-dom/components/form) - function-action form
  semantics underlying Next's Form (§17)

## Talks & essays (the "voices" table in §1)

- [7 Principles of Rich Web Applications - Guillermo Rauch, Nov 2014](https://rauchg.com/2014/7-principles-of-rich-web-applications) -
  "server rendered pages are not optional," pre-Next.js
- [Sneak Peek: Beyond React 16 - Dan Abramov, JSConf Iceland, Mar 2018](https://legacy.reactjs.org/blog/2018/03/01/sneak-peek-beyond-react-16.html) -
  first public Suspense demo
- [The Two Reacts - Dan Abramov, overreacted.io, Jan 2024](https://overreacted.io/the-two-reacts/) -
  UI = f(data, state) essay
- [React Conf 2024 Recap - May 2024](https://react.dev/blog/2024/05/22/react-conf-2024-recap) -
  React 19 RC keynote, Compiler open-sourced
- [React for Two Computers - Dan Abramov, React Conf 2024](https://conf2024.react.dev/talks/6) -
  conceptual case for the server/client paradigm
- [Supporting the Future of React - Vercel, Dec 2021](https://vercel.com/blog/supporting-the-future-of-react) -
  Markbåge hire; React core co-staffed by Vercel (§1)
- [Meet the Team - react.dev](https://react.dev/community/team) - current React core roster across
  Meta and Vercel (§1)
- [Understanding React Server Components - Vercel](https://vercel.com/blog/understanding-react-server-components) -
  Vercel's own RSC explainer; complements §4–§5

## Vercel / ecosystem

- [Cache Components for Instant and Fresh Pages - Vercel Academy](https://vercel.com/academy/nextjs-foundations/cache-components)
  - teaching framing for the caching model
- [SWR docs](https://swr.vercel.app) - client-side dedupe/cache (stale-while-revalidate)
- [SWR mutate](https://swr.vercel.app/docs/mutation) - keyed revalidation: the key replaces the
  refetch callback (§5.8, §11.4)

## Community / secondary (verification & narrative only; prefer official above)

- [How Next.js renders server components on updates - jonfk, May 2024](https://www.jonfk.ca/blog/nextjs-14-server-components-update/) - network-level walkthrough of URL-param writes triggering RSC payload requests (Next 14 era; mechanics verified against Next 16 for 8.4)
- [React 19.2 is here - LogRocket](https://blog.logrocket.com/react-19-2-is-here/) - 19.2 feature
  summary cross-check
- [What's Next for React in 2026 - Telerik](https://www.telerik.com/blogs/whats-next-react-2026) -
  ecosystem direction cross-check
- [The State of Server Components in 2026 - PkgPulse](https://www.pkgpulse.com/guides/state-of-server-components-2026)
  - adoption narrative cross-check

> To verify before publishing: exact URLs return 200; claims sourced to community posts should be
> re-anchored to official docs where possible.
