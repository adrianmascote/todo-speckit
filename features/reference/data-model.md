# Data Model Reference

**Status:** Feature 2 — users, sessions, and owned lists (CRUD).

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope |
| `role` | STRING(20) | Default `worker` |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; empty string after logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required; references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create; never changes |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

## Associations

- `User hasMany Session` (`foreignKey: userId`)
- `Session belongsTo User`
- `User hasMany List` (`foreignKey: userId`)
- `List belongsTo User`

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` table + `userId` FK | Feature 1 (read path); Feature 2 owns CRUD and `name` max length |
