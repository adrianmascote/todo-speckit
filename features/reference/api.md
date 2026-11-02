# API Reference

**Status:** Feature 2 — auth API plus authenticated list CRUD.

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
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

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

## Feature provenance

| Area | Introduced |
|------|------------|
| Register, login, logout | Feature 1 |
| `GET /todo/lists` (read, scoped) | Feature 1 |
| `POST` / `PUT` / `DELETE /todo/lists` | Feature 2 |
