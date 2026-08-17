# Architecture

This repository contains the Angular frontend for the Cyber Phishing Simulator. It is a route-driven, feature-organised application with NgRx used for authentication and scenario state.

## High-level design

```text
Browser
  |
  v
main.ts -> AppModule -> AppComponent
                        |
                        +-- Nav and Breadcrumbs (when authenticated)
                        +-- Router outlet
                             +-- Auth screens
                             +-- Learner screens
                             +-- Trainer/admin screens
                             +-- Scenario screens

Feature components -> NgRx actions/effects -> feature services -> HTTP API
                         |
                         +-- reducers/selectors -> components and guards
```

## Application shell and routing

- `src/main.ts` bootstraps `AppModule` in the browser.
- `src/app/app.component.*` is the application shell. It conditionally renders the navigation and breadcrumb components, then renders the active page through `<router-outlet>`.
- `src/app/app-routing.module.ts` owns the route table. It defines public authentication routes, protected learner and trainer route trees, settings, redirects, and route metadata used by breadcrumbs.
- `src/app/guards/auth.guard.ts` protects authenticated routes. It reads the `auth` state slice and redirects unauthenticated users to `/login`. The guard also supports an optional `data.role` requirement.

### Primary route areas

| Route prefix | Purpose |
| --- | --- |
| `/login`, `/sign-out` | Authentication entry and exit |
| `/learner/*` | Learner dashboard, modules, scenarios, feedback, and results |
| `/trainer/*` | Trainer dashboard plus learner, cohort, and scenario management |
| `/settings` | User settings |

## Feature structure

Features are grouped by domain beneath `src/app`:

```text
src/app/
+-- auth/       Authentication service, screens, and NgRx feature state
+-- learner/    Learner dashboards, module pages, progress, and results
+-- modules/    Learner module-list screen
+-- scenario/   Scenario delivery, editing, listing, service, and NgRx state
+-- admin/      Trainer/admin dashboard and activity components
+-- cohorts/    Cohort management screen
+-- guards/     Route guards
+-- shared/     Reusable UI components, models, and constants
```

Most UI components are standalone and import their dependencies directly. `AppModule` remains the composition root: it imports the router, feature state modules, shared standalone components, and infrastructure providers.

## State management

NgRx state is registered by feature modules:

| Feature key | Location | Responsibility |
| --- | --- | --- |
| `auth` | `src/app/auth/+state` | Signed-in user, token, loading state, and authentication status |
| `scenario` | `src/app/scenario/+state` | Scenario list, selected scenario, loading state, and errors |

Each state feature follows the same convention:

```text
+state/
+-- *.actions.ts    Events initiated by components or effects
+-- *.effects.ts    Asynchronous work and service calls
+-- *.reducer.ts    Immutable state transitions
+-- *.selectors.ts  Read models for components and guards
```

`src/app/meta.reducer.ts` configures `ngrx-store-localstorage` to persist and rehydrate the `auth` slice. The authentication service also manages its token and user storage keys during sign-in and sign-out.

## API and environment configuration

`provideHttpClient()` is registered in `AppModule`. Feature services make HTTP requests using the configured API URL:

- Development: `src/environments/environment.development.ts` uses `http://localhost:3000/`.
- Production: `src/environments/environment.ts` uses the relative `/api` path.

Keep backend endpoints inside feature services (for example, `auth.service.ts` and `scenario/+state/scenario.service.ts`) rather than in components.

## Shared UI

`src/app/shared/components` contains reusable presentation and utility components, including navigation, headers, cards, list/table primitives, search/filter controls, confirmation modal, progress rows, and breadcrumbs.

Breadcrumbs read the active router path and route `data.breadcrumb` values. This produces a navigable hierarchy such as `Trainer > Dashboard` for `/trainer/dashboard` without page components needing to build breadcrumbs themselves.

## Adding a feature

1. Place route-specific screens and models in the relevant domain folder, or create a new domain folder.
2. Add its route in `app-routing.module.ts`; use `AuthGuard` and `data.breadcrumb` where appropriate.
3. Add reusable UI only to `shared/` when it has no feature-specific dependency.
4. If the feature has shared asynchronous state, add a `+state` folder and register its reducer/effects through a feature module.
5. Put HTTP operations in a feature service and consume them from effects or a deliberately local component flow.
6. Add a focused `*.spec.ts` test alongside each component or service.
