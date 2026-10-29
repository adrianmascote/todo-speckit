# Data Model Reference

**Status:** Feature 1 — users, sessions, and list ownership rows for authenticated `GET /todo/lists`.

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
| `name` | STRING | Required |
| `userId` | INTEGER FK | Required; references `users.id` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

List **create/update/delete** is Feature 2. Feature 1 persists this table so authenticated `GET /todo/lists` can prove per-user scoping.

## Associations

- `User hasMany Session` (`foreignKey: userId`)
- `Session belongsTo User`
- `User hasMany List` (`foreignKey: userId`)
- `List belongsTo User`

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` table + `userId` FK | Feature 1 (read path); Feature 2 owns CRUD |
