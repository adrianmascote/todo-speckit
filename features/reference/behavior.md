# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Feature 1).

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign in uses **username + password** (username `trim().toLowerCase()`) | `POST /todo/login` | Feature 1; ADR-0002 |
| New users receive role `worker` | `User.create` | Feature 1 |
| Passwords hashed with bcrypt, `SALT_ROUNDS = 10`; hashes never returned | Auth controller + User `defaultScope` | Feature 1 |
| Session lifetime **24 hours**; JWT stored in `sessions` | Session row + `expiresIn: 86400` | Feature 1 |
| Login **reuses** a non-expired session for the same user | `issueSession` | Feature 1 |
| Logout clears the session **token** (revokes Bearer) | `POST /todo/logout` | Feature 1 |
| Authenticated requests resolve to `req.user.id` | `authenticate` middleware | Feature 1 |
| Missing/expired/revoked token → `401` | `authenticate` | Feature 1 |
| `GET /todo/lists` returns only rows with `userId: req.user.id` | List controller | Feature 1 |
| Client session cache is `localStorage` key `user` | `Utils.setStore` / `removeItem` | Feature 1 |
| Axios sends `Authorization: Bearer <token>`; `401` clears `user` and routes to login | `services.js` | Feature 1 |
| Unauthenticated SPA routes redirect to login; signed-in users hitting login go home | `router.beforeEach` | Feature 1 |
| Register email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid → **"Enter a valid email address."** | `emailRules` | Feature 1 |
| Register password min 8 characters | Vue rules + register controller | Feature 1 |
| Sign out is a standalone button on the home placeholder (no `MenuBar`) | `Home.vue` | Feature 1 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
