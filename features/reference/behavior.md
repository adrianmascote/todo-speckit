# Behavior & Rules Reference

**Living snapshot** of product rules currently in force (Feature 5).

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
| Client session cache is `localStorage` key `user` | `Utils.setStore` / `removeItem` | Feature 1 |
| Axios sends `Authorization: Bearer <token>`; `401` clears `user` and routes to login | `services.js` | Feature 1 |
| Unauthenticated SPA routes redirect to login; signed-in users hitting login go home | `router.beforeEach` | Feature 1 |
| Register email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid → **"Enter a valid email address."** | `emailRules` | Feature 1 |
| Register password min 8 characters | Vue rules + register controller | Feature 1 |
| `GET /todo/lists` returns only rows with `userId: req.user.id` | List controller | Feature 1 |
| Lists ordered alphabetically by name | `findAll` `order: name ASC` | Feature 2 |
| List names trimmed; empty/whitespace rejected | List controller + Dashboard form | Feature 2 |
| List name max 100 characters | List controller (`400`) | Feature 2 |
| Create ownership always `req.user.id` (body `userId` ignored) | List `create` | Feature 2 |
| Update/delete scoped with `id` + `userId`; unowned → `404` (never `403`) | `getAccessibleListOrNull` | Feature 2 |
| Dashboard is a single lists view (`Dashboard.vue`); add/rename/delete use dialogs | `Dashboard.vue` | Feature 2 |
| Empty lists copy: **"No lists yet. Create your first list."** | Dashboard | Feature 2 |
| Primary list CTAs use class `oc-cta` (`+ New List`, **Create**, **Save**) | Dashboard | Feature 2 |
| Row actions are icon-only, `size="small"`, aria-labels **Edit list** / **Delete list** | Dashboard | Feature 2 |
| `MenuBar` is hidden on login and register | `MenuBar.vue` | Feature 2 |
| Todo create requires owned parent list; else `404` | `getAccessibleListOrNull` | Feature 3 |
| Todo read/update/delete scoped with `id` + `userId`; unowned → `404` | `getAccessibleTodoOrNull` | Feature 3 |
| Todo titles trimmed; empty/whitespace rejected (**"Todo title is required."**) | Todo controller + Dashboard | Feature 3 |
| Todo title max 255 characters | Todo controller (`400`) | Feature 3 |
| New todos default to `completed: false`; body `userId`/`listId` ignored | Todo `create` | Feature 3 |
| Todos ordered incomplete first, then `createdAt` ASC | `findAllForList` | Feature 3 |
| Deleting a list deletes its todos | List `delete` + `onDelete: CASCADE` | Feature 3 |
| List rows expose an **Items** icon; todos managed in nested dialogs | `Dashboard.vue` | Feature 3 |
| Empty todos copy: **"No todos in this list yet."** | Items dialog | Feature 3 |
| Completed todos use struck-through / muted title styling | Items dialog | Feature 3 |
| **+ Add Item** is only inside the items dialog | Dashboard | Feature 3 |
| Profile read/update is self-only (`:id === req.user.id`); else `404` | `getAccessibleUserOrNull` | Feature 4 |
| Profile fields trimmed; username `trim().toLowerCase()`; empty required → `400` | User controller | Feature 4 |
| Password on `PUT` is optional; when set, min 8 chars and bcrypt hashed | User controller | Feature 4 |
| Profile responses never include the password hash; `role` is read-only | User controller | Feature 4 |
| After profile save, `localStorage` `user` is refreshed and `user-logged-in` dispatched | `MenuBar.vue` | Feature 4 |
| Menu bar uses a profile icon dropdown (name, username, email, **Edit Profile**, **Log out**) | `MenuBar.vue` | Feature 4 |
| Standalone menu-bar **Sign out** is removed; logout is **Log out** in the dropdown | `MenuBar.vue` | Feature 4 |
| `dueDate` is optional; `null` means no due date; API is `YYYY-MM-DD` | Todo controller + Dashboard | Feature 5 |
| Invalid `dueDate` → `400` (**"Due date must be a valid date in YYYY-MM-DD format."**) | Todo controller | Feature 5 |
| `PUT` with `dueDate: null` clears; omitting `dueDate` leaves the stored value | Todo `update` | Feature 5 |
| Incomplete todos with `dueDate` before today (local calendar) use overdue styling; completed do not | Dashboard items dialog | Feature 5 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
