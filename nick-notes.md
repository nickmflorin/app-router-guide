# Nick's raw content notes (verbatim, 2026-07-13)

> Messy/disorganized by his own description — source material for the guide outline. Practices herein are a mix of framework best practice and Nick's recommendations (see PROJECT.md decisions log for the authority-spectrum labeling).

For charts, trying to model them after the ones that NextJS docs have in terms of style color and design.

Intro
- Do not fight the framework, it will bite you in the ass.
- READ the docs, understand the patterns, step outside of the traditional model that we have all become so acustomed to with React.
- We do not want a rerecraft, imagine how much more confusing hte Slack channels, product names and team names would become.
- The architecture and approach you guys use now will set the stage for the rest of the product's life. Trust me - as someone who has tried to refactor ojl-tracker out the wazoo to fix these issues it will become a never ending battle.
- Docs I will share and this is just a less detailed ppt
- Good news is ya'll are smart and you'll figure it out - but if you keep building into this thing WITHOUT heeding my warning and trying to understand how to use this technology you will wind up in a world of pain. You'll start to see pages take forever to navigate to - in production - you'll start to lose the ability to leverage the tools and patterns that are designed to fix the problems that you are simultaneously creating.

* Big Three Sections
   * Maximizing Above the Fold
      * Content Shifting (Could maybe be in maximizing above the fold)
      * Dynamic importing
   * Data Fetching Patterns
      * Minimizing Dependencies
      * Parallel routes
   * Pushing interactions down
   * If you treat this like an SPA or traditional React you are going to wind up in a world of hurt and it will bite you in the ass. We don't want rerecraft
* Goals as a Next developer:
   * Content Shifting
   * MINIMIZE the wires that connect parts of the UI together (props). It is better to repeat yourself than to add dependencies, hooks made this possible at the start (with context) - in Next its also deduped queries and cached functions.
   * Maximum what is known the first time the page renders.
   * Break components down based on both UI AND responsibility. Breaking down components small, separate files, etc. Portability
   * Benefits of SSR
      * Maximum above the fold area
      * Far less timing dependencies, worrying about whehter or not the data is available at a given time. General note about how client side stuff is always more complicated than backend because you have user interactions and timing to worry about. Additional variables from user's network connection, browser, speed, internet, firewalls, ad blockers. etc.
* Suspense
   * Fallbacks should always sit in side of a container that reserves space for both the fallback and the normal content.
   * Things that trigger a suspense boundary
* useDeferredValue
* Data Loading Patterns
   * Deduping
      * Next just manipulates fetch to support deduping but you need to use useSWR to gain that behavior.
      * Diagram that shows where the suspense boundary lies, if props are passed to children in parallel suspense boundary lives above parent. If children make their own request suspense boundaries live in parent above children.
   * React's `cache`
   * Parallel Routing
      * Example with header and content on a page both where header depends on server data and when header is static.
      * default file
   * useSWR
   * Client components rendering server components
* everything related to the core parts of a page, its layout, its structure, its core content - should live in the app directory. the app directory is not "routes" - its your app, your core scaffold that everything slots inside of.
* use the URL more
* Known vs. Unknown Maximizing ABOVE the fold
   * Job is to separate what can be known on first render vs. what cannot be known.
   * Job is to maximum the amount that is known. SSR allows that surface area to be dramatically larger than it otherwise would be.
   * Minimizing what sits behind a blocking request - both on the server AND on the client. We do this on the server with layouts, parallel routes, etc. Suspense boundaries around data dependent parts. This allows changes in data requirements to only affect the part that it determines, not the surrounding content.
   * Pushing interactivity down as far as humanly possible.
   * Client/Server Boundaries & "use client" Directive. External UI libs have to have "use client" on everything that uses state or interaction. Wrapping third-party components in a new file with "use client"
   * Containers should be known - they should allocate space for the unknown so that regardless of what is there in the interim, it doesn't shift everything around
* Newer React Components (Lower Priority)
   * Form Hooks
   * Server Actions
   * ViewTransition
   * Activity
* Containers in layout - let teh container reserve the space, suspend the inside of it
* Examples
   * Page Header & Data Table Simple Example
      * Parallel routes for header and data table
      * Containers in layout
      * Suspense boundaries
      * Discussion of table problems with suspense boundaries
      * Deferred Values
      * Flex Grow and Scroll
      * Deduped Queries
* Importance of 1 component per file
* Questions
   * Does anyone know why NextJS uses file based routing?

Signs You are Doing it Wrong

* You have "use client" directives in the app directory.
* You are passing external data from a parent to multiple components in parallel
* You are passing external data to a child component when the parent does not need it. You are passing ANYTHING to a child component that the parent does not need.
* You are performing mutations via NextJS API routes
* You are performing queries via NextJS API routes when the data does not need to be fetched for the first time after an interaction occurs.
* You are putting a large number of components in a single file, esp in the app directory.
* You are managing tabs in state.
* You are importing very large client heavy packages on first render.
* You are importing anything that is not needed on first render without a dynamic boundary.
* You are unnecessarily communicating via callbacks up to a parent component. URL state, cache invalidation, SWR, etc.
* You are fetching data inside of effects manually.
* You are letting a component show its own loading state.
* Your loading state includes a container that the suspended component sits inside of.
* Your suspended component includes a container.
* Your containers are not rendered immediately on the server and are not allocating an accurate amount of space for fallback content and the actual component.
* You are using query parameters to manage content visibility on teh client
* You are reading query parameters and conditionally rendering based on them on the client.
