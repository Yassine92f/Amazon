# API Testing Guide — Yaak / Postman

Hands-on guide to exercise the **auth & admin** API surface from a REST client (Yaak, Postman, Insomnia, Bruno…). All payload examples are copy/paste-ready.

## Prerequisites

```bash
docker compose -f docker-compose.dev.yml up -d   # MongoDB + Redis
pnpm dev                                          # boots server (:5001) + client (:3000)
```

The server listens on `http://localhost:5001`. All API routes are prefixed with `/api`.

## Yaak Environment Variables

Create a Yaak environment (top-right icon) with these vars. You reference them via `${[ varName ]}` in URLs, headers and body.

| Variable       | Initial value                          |
| -------------- | -------------------------------------- |
| `baseUrl`      | `http://localhost:5001/api`            |
| `clientUrl`    | `http://localhost:3000`                |
| `accessToken`  | _(empty — filled after login)_         |
| `refreshToken` | _(empty — filled after login)_         |
| `userId`       | _(empty — useful for admin endpoints)_ |

**Pro tip — auto-extract tokens.** On the `POST /auth/login` and `POST /auth/register` requests, open the request's `<>` (Post-response script) and paste:

```js
yaak.environment.set('accessToken', response.body.data.accessToken);
yaak.environment.set('refreshToken', response.body.data.refreshToken);
yaak.environment.set('userId', response.body.data.user._id);
```

You'll never copy a token by hand again.

---

## 1. Authentication

### Register

```
POST  ${[ baseUrl ]}/auth/register
Headers:
  Content-Type: application/json
Body:
{
  "email":     "test@example.com",
  "password":  "Password123",
  "firstName": "Test",
  "lastName":  "User"
}
```

Returns `data: { user, accessToken, refreshToken }`. Server also fires a welcome email — in dev the **Ethereal preview URL** is logged to the server console.

**Validation rules (Zod):**

- `email`: valid format, ≤ 254 chars
- `password`: 8–128 chars, ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit
- `firstName` / `lastName`: 1–50 chars

### Login

```
POST  ${[ baseUrl ]}/auth/login
Body: { "email": "test@example.com", "password": "Password123" }
```

### Get current user (protected)

```
GET   ${[ baseUrl ]}/auth/me
Headers:
  Authorization: Bearer ${[ accessToken ]}
```

### Refresh tokens (rotated)

```
POST  ${[ baseUrl ]}/auth/refresh
Body: { "refreshToken": "${[ refreshToken ]}" }
```

The old refresh token is blacklisted; use the new pair from the response.

### Logout

```
POST  ${[ baseUrl ]}/auth/logout
Body: { "refreshToken": "${[ refreshToken ]}" }
```

### Forgot / reset password

```
POST  ${[ baseUrl ]}/auth/forgot-password
Body: { "email": "test@example.com" }
```

Read the reset token from the Ethereal preview URL printed in the server logs, then:

```
POST  ${[ baseUrl ]}/auth/reset-password
Body: { "token": "<paste>", "newPassword": "NewPassword123" }
```

### Email verification

```
POST  ${[ baseUrl ]}/auth/verify-email
Body: { "token": "<paste from welcome email>" }

POST  ${[ baseUrl ]}/auth/resend-verification
Body: { "email": "test@example.com" }
```

### Change password (protected)

```
PUT   ${[ baseUrl ]}/auth/change-password
Headers: Authorization: Bearer ${[ accessToken ]}
Body: { "currentPassword": "Password123", "newPassword": "NewPass456" }
```

---

## 2. Profile (authenticated user)

All endpoints require `Authorization: Bearer ${[ accessToken ]}`.

### Profile

```
GET   ${[ baseUrl ]}/users/profile
PUT   ${[ baseUrl ]}/users/profile
Body: { "firstName": "New", "lastName": "Name", "currentPassword": "Password123" }
```

Password confirmation is **required** to change profile fields (defense against session-hijack profile rewrites).

### Addresses (CRUD)

```
GET    ${[ baseUrl ]}/users/addresses
POST   ${[ baseUrl ]}/users/addresses
Body:  { "label": "Home", "street": "1 rue X", "city": "Paris",
         "postalCode": "75001", "country": "FR", "isDefault": true }
PUT    ${[ baseUrl ]}/users/addresses/:addressId
DELETE ${[ baseUrl ]}/users/addresses/:addressId
```

### Preferences

```
GET   ${[ baseUrl ]}/users/preferences
PUT   ${[ baseUrl ]}/users/preferences
Body:
{
  "language":  "fr",
  "currency":  "EUR",
  "notifications": {
    "email": true, "push": false, "orderUpdates": true,
    "promotions": false, "priceDrops": false
  }
}
```

---

## 3. Admin (admin role required)

**Promote your test user to admin** in MongoDB:

```bash
docker exec -it $(docker ps -qf name=mongo) mongosh ecommerce \
  --eval 'db.users.updateOne({email:"test@example.com"},{$set:{role:"admin"}})'
```

Then **log in again** to get a token containing `role: "admin"`.

### Dashboard

```
GET   ${[ baseUrl ]}/admin/dashboard
```

### Users management

```
GET   ${[ baseUrl ]}/admin/users?page=1&limit=20&query=test&role=user&status=active
GET   ${[ baseUrl ]}/admin/users/${[ userId ]}
PUT   ${[ baseUrl ]}/admin/users/${[ userId ]}/status
Body: { "status": "suspended", "reason": "Spam reports" }
PUT   ${[ baseUrl ]}/admin/users/${[ userId ]}/role
Body: { "role": "seller" }
DELETE ${[ baseUrl ]}/admin/users/${[ userId ]}
```

### Audit log

Every admin action above is logged. Query the log:

```
GET   ${[ baseUrl ]}/admin/audit-log?page=1&limit=20
GET   ${[ baseUrl ]}/admin/audit-log?action=user.role_changed
GET   ${[ baseUrl ]}/admin/audit-log?actorId=${[ userId ]}
GET   ${[ baseUrl ]}/admin/audit-log?targetId=${[ userId ]}
```

Available `action` filter values: `user.status_changed`, `user.role_changed`, `user.deleted`.

---

## 4. Security guarantees to exercise

### Rate limiting

- `/auth/login`, `/auth/register` → **5 requests / 15 min / IP**, then `429 Too many attempts`.
- `/auth/forgot-password`, `/auth/reset-password`, `/auth/resend-verification` → **3 requests / 1 hour / IP**.
- `/auth/refresh`, `/auth/verify-email` → **30 requests / 15 min / IP**.

### Account lockout

Send 5 failed login attempts with the same email. The 6th attempt — even with the correct password — returns:

```
HTTP 423
{ "success": false, "message": "Account temporarily locked. Try again in 15 minutes." }
```

Unlock manually in MongoDB:

```bash
docker exec -it $(docker ps -qf name=mongo) mongosh ecommerce --eval \
  'db.users.updateOne({email:"test@example.com"},{$set:{failedLoginAttempts:0},$unset:{accountLockedUntil:""}})'
```

### Input validation (Zod)

Send a password without an uppercase letter:

```
POST  ${[ baseUrl ]}/auth/register
Body: { "email": "x@y.com", "password": "password1", "firstName": "A", "lastName": "B" }
```

→ `400 password: Password must contain at least one uppercase letter`

### RBAC gate

Hit any `/admin/*` endpoint with a `user` (non-admin) token:
→ `403 Forbidden`

### Refresh token rotation

- Call `/auth/refresh` once → get a new pair.
- Call `/auth/refresh` again with the **old** refresh token → `401 Invalid token` (it's blacklisted in Redis).

---

## 5. Response envelope

All API responses follow:

**Success**

```json
{ "success": true, "data": { ... }, "message": "optional" }
```

**Paginated**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 42, "page": 1, "limit": 20, "totalPages": 3,
    "hasNext": true, "hasPrev": false
  }
}
```

**Error**

```json
{ "success": false, "message": "Human-readable English message" }
```

All API messages are in English. UI text (frontend) remains French. Email content (welcome, password reset, verification) is in French because it's end-user content, not API contract.

---

## 6. Troubleshooting

| Symptom                                | Cause / Fix                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `connect ECONNREFUSED 127.0.0.1:27017` | MongoDB not running — `docker compose -f docker-compose.dev.yml up -d`   |
| `Missing access token`                 | Forgot `Authorization: Bearer …` header                                  |
| `Invalid or expired token`             | Access token expired (15 min TTL) — call `/auth/refresh`                 |
| `429 Too many attempts`                | Rate-limited. Wait or restart the server to reset the in-memory counter. |
| `423 Account locked`                   | 5 bad logins. Unlock in DB (see Account lockout section).                |
| Emails never arrive                    | Dev mode uses Ethereal — check server logs for `Preview URL:`.           |
| `403 Forbidden` on `/admin/*`          | Token doesn't carry `role: "admin"`. Promote user + login again.         |
