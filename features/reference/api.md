# API Reference

**Status:** Feature 1 auth API plus authenticated `GET /todo/lists`.

Base path: `/todo/`. Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Starter health check |
| `POST` | `/todo/register` | No | Create account and return session payload |
| `POST` | `/todo/login` | No | Authenticate and return session payload |
| `POST` | `/todo/logout` | Yes | Clear the current session token |
| `GET` | `/todo/lists` | Yes | Return lists owned by `req.user.id` |

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

## Feature provenance

| Area | Introduced |
|------|------------|
| Register, login, logout | Feature 1 |
| `GET /todo/lists` (read, scoped) | Feature 1 |
