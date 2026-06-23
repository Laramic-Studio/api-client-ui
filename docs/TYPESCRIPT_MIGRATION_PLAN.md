# Frontend TypeScript migration plan

> Incremental migration for `frontend/` after the Vite move. Do not block feature work — new code can land in TS while legacy JS remains.

## Current state

| Item | Status |
|------|--------|
| Bundler | Vite 6 |
| Language | ~136 `.jsx`, ~101 `.js`, ~25k lines |
| Path alias | `@/*` via `jsconfig.json` |
| Env types | `src/vite-env.d.ts` (partial) |
| shadcn | `components.json` → `"tsx": false` |

## Goals

1. Type-safe API contract (`client`, mappers, auth payloads)
2. Safer refactors in builder, collections, and workspace modules
3. IDE autocomplete for Zustand store and React Query hooks
4. Optional strict mode once core layers are covered

## Principles

- **Incremental** — JS and TS coexist; rename files one module at a time
- **Bottom-up** — types flow from API → store → hooks → UI
- **Pragmatic strictness** — start with `strict: false`, tighten later
- **No big-bang** — ship in small PRs, keep `npm run build` green

---

## Phase 0 — Bootstrap (~1 hour)

**Install**

```bash
npm install -D typescript @types/react @types/react-dom
```

**Add `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Add `tsconfig.node.json`** for `vite.config.js` (optional, can stay JS).

**Remove** `jsconfig.json` once `tsconfig.json` is in place.

**Update `components.json`**

```json
"tsx": true
```

New shadcn components will scaffold as `.tsx`.

**Verify**

```bash
npm run build
npm run dev
```

---

## Phase 1 — Shared types & API layer (~1 day)

Highest ROI. Everything else imports from here.

| File (current) | Target | Notes |
|----------------|--------|-------|
| `src/lib/config.js` | `config.ts` | Env + constants |
| `src/lib/api/http.js` | `http.ts` | `ApiError`, request helpers |
| `src/lib/api/client.js` | `client.ts` | Interface + mock impl types |
| `src/lib/api/fetch-client.js` | `fetch-client.ts` | Implements `Client` |
| `src/lib/api/auth-api.js` | `auth-api.ts` | Login/register payloads |
| `src/lib/api/map-*.js` | `map-*.ts` | API ↔ frontend shapes |
| `src/lib/api/query-keys.js` | `query-keys.ts` | TanStack Query keys |

**Create `src/types/`**

```
src/types/
  api.ts       # snake_case API responses
  domain.ts    # camelCase frontend models (User, Team, Request, Env, …)
  auth.ts      # LoginCredentials, RegisterPayload, Session
```

**Pattern**

```ts
// domain.ts
export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

// client.ts
export interface ApiClient {
  login(credentials: LoginCredentials): Promise<User>;
  register(payload: RegisterPayload): Promise<User>;
  // …
}
```

---

## Phase 2 — Store & hooks (~1 day)

| File | Target |
|------|--------|
| `src/store/useAppStore.js` | `useAppStore.ts` |
| `src/hooks/use-auth.js` | `use-auth.ts` |
| `src/hooks/use-*.js` | `use-*.ts` |
| `src/lib/auth/*.js` | `*.ts` |

Use Zustand's `create<T>()` and typed selectors. Type React Query `useMutation`/`useQuery` generics from Phase 1 types.

---

## Phase 3 — Auth module (~0.5 day)

First UI slice — small, isolated, good template for the rest.

| File | Target |
|------|--------|
| `src/components/auth/*.jsx` | `*.tsx` |
| `src/pages/auth/*.jsx` | `*.tsx` |
| `src/constants/testIds.js` | `testIds.ts` |

Checklist per page: props, form state, mutation payloads, test IDs unchanged.

---

## Phase 4 — Core app shell (~0.5 day)

| Area | Files |
|------|-------|
| Routes | `src/routes/AppRoutes.jsx` |
| Layout | `src/components/layout/*` |
| Providers | `src/providers/*` |
| Entry | `src/index.jsx`, `src/App.jsx` |

---

## Phase 5 — Feature modules (ongoing, match WEB_IMPLEMENTATION_PLAN order)

Migrate one module at a time after API types exist:

1. **Workspaces / Teams** — pages + hooks + mappers
2. **Collections & environments**
3. **Builder** — largest surface; do subfolders (`components/builder/`, `lib/builder/`)
4. **Docs / Lexical** — editor state types
5. **AI tools** — `src/ai-tools/*`
6. **Settings / billing**

For each module:

1. Add/extend types in `src/types/`
2. Convert `lib/` helpers
3. Convert hooks
4. Convert components/pages
5. Smoke test in browser

---

## Phase 6 — UI components (~1–2 days, can interleave)

| Batch | Scope |
|-------|-------|
| A | `src/components/ui/*` (shadcn) — regenerate or rename to `.tsx` |
| B | Shared components (`builder/`, `docs/`, etc.) |

shadcn CLI with `"tsx": true` for any new components; bulk-rename existing ones when touching a folder.

---

## Phase 7 — Strict mode & cleanup (~1 day)

Enable incrementally in `tsconfig.json`:

```json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true
```

Fix errors module-by-module. Remove `allowJs` when no `.js`/`.jsx` remain.

**Cleanup**

- Delete leftover `.js` duplicates
- Add `npm run typecheck` → `tsc --noEmit`
- Optional CI step: `typecheck` + `build`

---

## Vite-specific notes

- `.js` files with JSX: prefer renaming to `.jsx`/`.tsx`; `optimizeDeps.esbuildOptions.loader` is a bridge only
- Env vars: extend `src/vite-env.d.ts` as you add `VITE_*` keys
- No CRA/CRACO concerns — TS works out of the box

---

## Suggested PR order

| PR | Scope | Est. |
|----|-------|------|
| 1 | Phase 0 bootstrap + `typecheck` script | 1 h |
| 2 | Phase 1 types + API layer | 1 d |
| 3 | Phase 2 store + auth hooks | 1 d |
| 4 | Phase 3 auth UI | 0.5 d |
| 5+ | One feature module per PR | 0.5–2 d each |
| Last | Strict mode + remove `allowJs` | 1 d |

**Total:** ~4–6 days focused work, or spread across feature sprints.

---

## Definition of done

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run build` passes
- [ ] No `.js`/`.jsx` in `src/` (except config if kept JS)
- [ ] `strict: true` in tsconfig
- [ ] API client fully typed; components consume domain types, not raw API shapes
