# API Reference

**Status:** Feature 4 — auth, lists, todos, and self-service profile.

Base path: `/todo/`. Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create account and return session payload |
| `POST` | `/todo/login` | No | Authenticate and return session payload |
| `POST` | `/todo/logout` | Yes | Clear the current session token |
| `GET` | `/todo/lists` | Yes | Return lists owned by `req.user.id`, ordered by name |
| `POST` | `/todo/lists` | Yes | Create a list owned by `req.user.id` |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list (todos in the list are removed) |
| `GET` | `/todo/lists/:listId/todos` | Yes | Return todos in an owned list (incomplete first, then `createdAt` ASC) |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (`title` and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile (`:id` must be `req.user.id`) |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile |

## Auth success payload

`POST /todo/register` → `201`; `POST /todo/login` → `200`. Flat JSON:

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

## List success payload

`POST /todo/lists` → `201`; `PUT /todo/lists/:listId` → `200`; `GET /todo/lists` → `200` (array of these objects). `DELETE` → `200` with the deleted list object.

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Create / rename body:** `{ "name": "Groceries" }`. Any `userId` in the body is ignored; ownership is always `req.user.id`.

## Todo success payload

`POST /todo/lists/:listId/todos` → `201`; `PUT /todo/todos/:id` → `200`; `GET /todo/lists/:listId/todos` → `200` (array). `DELETE` → `200` with the deleted todo object.

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Create body:** `{ "title": "Buy milk" }`. `userId` and `listId` in the body are ignored; ownership is the session user and `:listId` after an ownership check. New todos default to `completed: false`.

## Profile success payload

`GET /todo/users/:id` and `PUT /todo/users/:id` → `200`. Password hashes are never returned. `role` is read-only.

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

**Update body:** `{ "fName", "lName", "email", "username", "password?" }`. Username is stored `trim().toLowerCase()`. Omit `password` to leave the current hash unchanged. Cross-user `:id` → `404`.

## Errors

`{ "message": "Human-readable explanation." }`

| Case | Status | Message |
|------|--------|---------|
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| Missing register email | `400` | `Email is required.` |
| Password shorter than 8 | `400` | `Password must be at least 8 characters.` |
| Invalid credentials | `401` | `Invalid username or password.` |
| Missing/invalid/expired token | `401` | `Unauthorized! …` |
| Empty or whitespace-only list name | `400` | `List name is required.` |
| List name longer than 100 characters | `400` | `List name must be 100 characters or fewer.` |
| Invalid `listId` | `400` | `List id is invalid.` |
| List not found or not owned | `404` | `List with id=<id> not found.` |
| Empty or whitespace-only todo title | `400` | `Todo title is required.` |
| Todo title longer than 255 characters | `400` | `Todo title must be 255 characters or fewer.` |
| Invalid todo `id` | `400` | `Todo id is invalid.` |
| Todo not found or not owned | `404` | `Todo with id=<id> not found.` |
| User not found or not self | `404` | `User with id=<id> not found.` |
| Missing profile first name | `400` | `First name is required.` |

## Feature provenance

| Area | Introduced |
|------|------------|
| Register, login, logout | Feature 1 |
| `GET /todo/lists` (read, scoped) | Feature 1 |
| `POST` / `PUT` / `DELETE /todo/lists` | Feature 2 |
| Todo items nested under lists | Feature 3 |
| Self-service `GET` / `PUT /todo/users/:id` | Feature 4 |
