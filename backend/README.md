# COMP3123 Assignment 1 – Secure Employee Management REST API

**Student:** Mjd Arow (101513153)
**Deployed URL:** https://101513153-comp-3123-assignment1.vercel.app

## 1. Purpose

A REST API where users can sign up, log in, and manage **their own** employee records.
Every employee belongs to the user who created it, and the API makes sure no user can read,
change, or delete another user's employees. The API also validates input, returns consistent
JSON errors, limits request rates, sets security headers, and logs activity without
logging secrets.

## 2. Tech Stack

| Package | Used for |
|---|---|
| **Node.js + Express 5** | HTTP server and routing |
| **MongoDB Atlas + Mongoose** | Database and schema/validation layer |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |
| **express-validator** | Request validation |
| **helmet** | Security HTTP headers |
| **express-rate-limit** | Rate limiting |
| **winston + morgan** | Application and request logging |
| **dotenv** | Loading environment variables from `.env` |
| **cors** | Cross-origin requests |
| **nodemon** (dev) | Auto-restart during development |

## 3. Project Structure

```
├── api/
│   └── index.js               # Vercel serverless entry (exports the Express app)
├── logs/
│   └── sample.log             # Example log output (real logs are git-ignored)
├── postman/
│   └── COMP3123_Assignment1.postman_collection.json
├── src/
│   ├── app.js                 # Builds the Express app (middleware + routes), no listen()
│   ├── config/
│   │   ├── env.js             # Loads + validates env vars (fails fast if required ones are missing)
│   │   └── db.js              # Cached MongoDB connection + connection state for /health
│   ├── controllers/           # Thin HTTP layer: read request -> call service -> send response
│   │   ├── user.controller.js
│   │   └── employee.controller.js
│   ├── middleware/
│   │   ├── auth.js            # Verifies the JWT, sets req.user
│   │   ├── ensureDb.js        # Connects to MongoDB before /api requests (needed on Vercel)
│   │   ├── errorHandler.js    # Converts every error to the standard JSON error shape
│   │   ├── notFound.js        # 404 for unknown routes
│   │   ├── rateLimiters.js    # Signup, login and general API limiters
│   │   ├── requestLogger.js   # morgan -> winston request logs
│   │   └── validate.js        # Turns express-validator failures into a 400 response
│   ├── models/
│   │   ├── User.js            # Password hashing hook, password hidden from output
│   │   └── Employee.js        # Owner reference (user), owner must exist
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── user.routes.js
│   │   └── employee.routes.js
│   ├── services/              # Business logic (signup/login, ownership-checked CRUD)
│   │   ├── user.service.js
│   │   └── employee.service.js
│   ├── utils/
│   │   ├── AppError.js        # Error class carrying an HTTP status code
│   │   ├── logger.js          # winston logger with secret redaction
│   │   └── response.js        # Standard success response helper
│   └── validators/
│       ├── user.validators.js
│       └── employee.validators.js
├── server.js                  # Local entry: connect to DB, then app.listen()
├── vercel.json                # Sends every route to api/index.js
├── .env.example               # Template for environment variables
└── package.json
```

**Request flow:** `route -> rate limiter -> auth (employee routes) -> validators -> validate -> controller -> service -> model`.
Any error at any step is passed to `errorHandler`, so error responses always look the same.

## 4. Installation and Running Locally

1. **Clone and install**
   ```bash
   git clone https://github.com/Majd205/101513153_COMP3123_Assignment1.git
   cd 101513153_COMP3123_Assignment1
   npm install
   ```
2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `MONGODB_URI` (your Atlas connection string) and `JWT_SECRET`. To generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Start MongoDB.** Create a free MongoDB Atlas cluster, add a database user, and allow your IP under
   *Network Access*. A local MongoDB also works (`MONGODB_URI=mongodb://127.0.0.1:27017`).
   The database name is always forced to **`comp3123_assignment1`**.
4. **Run the server**
   ```bash
   npm run dev     # development, auto-restarts on file changes
   npm start       # plain node
   ```
   Check http://localhost:3000/health. It should show `"database": "connected"`.
5. **Test with Postman.** Import `postman/COMP3123_Assignment1.postman_collection.json` and run the
   folders in order (see [Testing with Postman](#14-testing-with-postman)).

## 5. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` | Local server port (not used on Vercel) |
| `NODE_ENV` | no | `development` | `production` hides error details from responses |
| `MONGODB_URI` | **yes** | – | MongoDB connection string |
| `JWT_SECRET` | **yes** | – | Secret used to sign JWTs; use a long random string |
| `JWT_EXPIRES_IN` | no | `1h` | Token lifetime (e.g. `15m`, `1h`, `1d`) |
| `AUTH_RATE_LIMIT_MAX` | no | `5` | Max signup/login requests per window per IP |
| `AUTH_RATE_LIMIT_WINDOW_MIN` | no | `15` | Auth limiter window, in minutes |
| `API_RATE_LIMIT_MAX` | no | `100` | Max `/api` requests per window per IP |
| `API_RATE_LIMIT_WINDOW_MIN` | no | `15` | API limiter window, in minutes |

If `MONGODB_URI` or `JWT_SECRET` is missing, the app **refuses to start**
(`Missing required environment variable(s): ...`). The real `.env` is git-ignored.

## 6. Response Format

Every response uses one of two shapes:

```json
// Success
{ "status": true, "message": "Employee created successfully", "data": { ... } }

// Error (errors[] is only present for field-level problems)
{ "status": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Email format is invalid" } ] }
```

The exceptions are `DELETE` (204, no body by definition) and `/health` (see section 12).

## 7. API Endpoints

| Method | Path | Auth | Success |
|---|---|---|---|
| POST | `/api/v1/user/signup` | – | 201 |
| POST | `/api/v1/user/login` | – | 200 |
| GET | `/api/v1/emp/employees` | JWT | 200 |
| POST | `/api/v1/emp/employees` | JWT | 201 |
| GET | `/api/v1/emp/employees/:eid` | JWT | 200 |
| PUT | `/api/v1/emp/employees/:eid` | JWT | 200 |
| DELETE | `/api/v1/emp/employees?eid=<id>` | JWT | 204 |
| GET | `/health` | – | 200 |

### POST `/api/v1/user/signup`

```json
// Request
{ "username": "alice_comp3123", "email": "alice.comp3123@example.com", "password": "AlicePass123" }

// 201 Created (the password is never returned)
{
  "status": true,
  "message": "User created successfully",
  "data": {
    "_id": "6ace7088d13bfed8f6b558dd",
    "username": "alice_comp3123",
    "email": "alice.comp3123@example.com",
    "created_at": "2026-10-13T17:55:21.064Z",
    "updated_at": "2026-10-13T17:55:21.064Z"
  }
}

// 409 Conflict (duplicate)
{ "status": false, "message": "Duplicate value: resource already exists",
  "errors": [ { "field": "username", "message": "username is already in use" } ] }
```

### POST `/api/v1/user/login`

Send `password` plus **exactly one** of `username` or `email`.

```json
// Request
{ "username": "alice_comp3123", "password": "AlicePass123" }
// or
{ "email": "alice.comp3123@example.com", "password": "AlicePass123" }

// 200 OK
{
  "status": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "1h",
    "user": { "_id": "6ace7088d13bfed8f6b558dd", "username": "alice_comp3123", "email": "alice.comp3123@example.com", "created_at": "...", "updated_at": "..." }
  }
}

// 401 Unauthorized (same message whether the username or the password was wrong)
{ "status": false, "message": "Invalid credentials" }
```

### POST `/api/v1/emp/employees`

```json
// Request (header: Authorization: Bearer <token>)
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "position": "Software Developer",
  "salary": 75000,
  "date_of_joining": "2024-01-15",
  "department": "Engineering"
}

// 201 Created ("user" is the owner, always taken from the JWT)
{
  "status": true,
  "message": "Employee created successfully",
  "data": {
    "_id": "6ace708dd13bfed8f6b558e2",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "position": "Software Developer",
    "salary": 75000,
    "date_of_joining": "2024-01-15T00:00:00.000Z",
    "department": "Engineering",
    "user": "6ace7088d13bfed8f6b558dd",
    "created_at": "2026-10-13T17:55:25.130Z",
    "updated_at": "2026-10-13T17:55:25.130Z"
  }
}
```

### GET `/api/v1/emp/employees`

Returns **only the logged-in user's** employees, newest first.

```json
{ "status": true, "message": "Employees retrieved successfully", "data": [ { "_id": "...", "first_name": "Jane", "...": "..." } ] }
```

### GET `/api/v1/emp/employees/:eid`

```json
// 200
{ "status": true, "message": "Employee retrieved successfully", "data": { "_id": "6ace708dd13bfed8f6b558e2", "...": "..." } }
// 400 (eid is not a valid ObjectId)
{ "status": false, "message": "Validation failed", "errors": [ { "field": "eid", "message": "Invalid employee id" } ] }
// 404
{ "status": false, "message": "Employee not found" }
// 403 (employee belongs to another user)
{ "status": false, "message": "Forbidden: you do not have access to this employee" }
```

### PUT `/api/v1/emp/employees/:eid`

Send any subset of the employee fields (at least one). The `user` (owner) field cannot be changed.

```json
// Request
{ "position": "Senior Software Developer", "salary": 85000 }
// 200
{ "status": true, "message": "Employee updated successfully", "data": { "...": "...", "position": "Senior Software Developer", "salary": 85000 } }
// 400 when trying to change the owner
{ "status": false, "message": "Validation failed", "errors": [ { "field": "user", "message": "The owner (user) field cannot be changed" } ] }
```

### DELETE `/api/v1/emp/employees?eid=<id>`

The id is passed in the **query string**. On success the response is **204 No Content with an empty body**.
The same 400 / 403 / 404 rules apply as for GET.

## 8. Authentication Flow

1. The user signs up. The password is hashed with bcrypt before it is saved.
2. The user logs in and receives a **JWT** signed with `JWT_SECRET` (HS256). Its payload is `{ sub: <userId> }` and it expires after `JWT_EXPIRES_IN`.
3. For every employee request the client sends the header:
   ```
   Authorization: Bearer <token>
   ```
4. The `auth` middleware checks the token and sets `req.user = { id }` **from the token only**.

| Situation | Response |
|---|---|
| No `Authorization` header | 401 `Authentication required: no token provided` |
| Header is not `Bearer <token>` | 401 `Invalid Authorization header: expected "Bearer <token>"` |
| Tampered or invalid token | 401 `Invalid token` |
| Expired token | 401 `Token has expired, please log in again` |

## 9. How Ownership Is Enforced

- **The owner always comes from the JWT.** Controllers only use `req.user.id`. A user id in the body, URL, or query string is never trusted.
- **Create:** any `user` field in the body is ignored. Only the 7 employee fields are kept, and `user` is set to `req.user.id`. The model also checks that this user exists.
- **List:** the query is `Employee.find({ user: req.user.id })`.
- **Get / Update / Delete by id:**
  1. If `eid` is not a valid ObjectId, return **400**.
  2. If no employee has that id, return **404**.
  3. If the employee belongs to a different user, return **403** and log an authorization failure.
  4. Otherwise the update/delete runs with the filter `{ _id: eid, user: req.user.id }`, so even the database write can only touch the caller's document.
- **The owner cannot be changed:** a PUT with `user` returns 400, and the schema marks `user` as `immutable`.

## 10. Security

| Measure | What it does |
|---|---|
| **bcrypt** (12 salt rounds) | Passwords are hashed in a Mongoose `pre('save')` hook, so plain-text passwords never reach the database. The `password` field has `select: false` and is removed by `toJSON`, so it is never returned. |
| **Login timing** | When the username/email doesn't exist, the code still runs a bcrypt comparison against a dummy hash. "Unknown user" and "wrong password" take the same time and return the same message, so attackers can't find valid usernames. |
| **JWT** | Stateless authentication. The token is signed and has an expiry; the algorithm is pinned to HS256. |
| **helmet** | Adds security headers to every response (for example `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`) and removes `X-Powered-By`. |
| **Rate limiting** | Limits how many requests one IP can make in a time window (see below). |
| **Validation** | All input is validated, and unknown fields are rejected. |
| **Secrets** | All secrets come from environment variables. The app won't start without `MONGODB_URI` and `JWT_SECRET`. |
| **Error responses** | Stack traces and internal error details are never sent when `NODE_ENV=production`. |
| **Body size limit** | JSON bodies are limited to 10 KB. |

### Rate Limiting

| Limiter | Applies to | Default |
|---|---|---|
| Signup limiter | `POST /api/v1/user/signup` | 5 requests / 15 min per IP |
| Login limiter | `POST /api/v1/user/login` | 5 requests / 15 min per IP |
| General API limiter | everything under `/api` | 100 requests / 15 min per IP |

- The strict limits slow down password guessing (brute force) and mass account creation. The general limit protects the server from request floods.
- Signup and login have separate counters, and every request counts, including invalid ones.
- When a limit is exceeded, the API responds with **429 Too Many Requests**:
  ```json
  { "status": false, "message": "Too many attempts, please try again after 15 minutes" }
  ```
  It also sends a `Retry-After` header (seconds to wait). Every response carries a `RateLimit` header showing the remaining requests. Each 429 is logged as `Rate limit exceeded`.
- `/health` is not rate limited.

> **Note about Vercel:** the limiter uses the default **in-memory store**. On Vercel each
> serverless instance has its own memory, so limits apply **per instance**, not globally, and
> counters reset when an instance is recycled. The **429 demonstration was therefore done locally.**
> A shared store such as Redis would be needed for exact global limits in production.

## 11. Validation

Validation failures return **400** with a list of field errors, for example:

```json
{ "status": false, "message": "Validation failed",
  "errors": [ { "field": "salary", "message": "Salary must be a number greater than 0" } ] }
```

| Endpoint | Rules |
|---|---|
| Signup | `username` 3–30 chars, letters/numbers/`_ . -` only; `email` valid format (stored lowercase); `password` 8–72 chars with at least one letter and one number. 72 is bcrypt's maximum input length. |
| Login | `password` required, plus **exactly one** of `username` / `email` |
| Create employee | All 7 fields required. `first_name`/`last_name` ≤ 50 chars, `position`/`department` ≤ 100 chars, valid `email`, `salary` a number > 0, `date_of_joining` a strict ISO 8601 date (e.g. `2024-01-15`; `2024-02-30` is rejected) |
| Update employee | Same rules, but every field is optional (at least one required); `user` is not allowed |
| `:eid` / `?eid=` | Must be a valid MongoDB ObjectId |

- **Unknown fields** in the body (e.g. `"role": "admin"`) are rejected with 400.
- **Strings** are trimmed, and whitespace-only values are rejected. Values are stored as typed, not HTML-escaped: this is a JSON API, so escaping is the job of whatever page displays the data.
- **Malformed JSON** (e.g. `{bad`) returns 400 `Malformed JSON in request body`.
- **Submitted values are never echoed back** in validation errors, so passwords can't leak through error messages.

## 12. Logging

- **Library:** winston. morgan measures each request and passes it to winston.
- **Where:**
  - **Locally:** JSON lines in `logs/app.log` (everything) and `logs/error.log` (errors only), plus colored console output.
  - **On Vercel** (`VERCEL` env var is set): console only, because the serverless filesystem is read-only. Logs appear in the Vercel dashboard under *Logs*.
- **What is logged:**
  - server start and database connection
  - every request (timestamp, method, path, status, response time, IP)
  - signups, logins and failed logins (with the internal reason: `wrong_password` / `user_not_found`)
  - authentication failures (missing / invalid / expired token)
  - validation failures (field names only)
  - authorization failures (403)
  - rate-limit hits
  - all errors (with stack traces, in the log file only)
- **What is never logged:** passwords, JWTs, the `Authorization` header, `JWT_SECRET`, the MongoDB URI, and request bodies. A redaction step in the logger replaces any field named like `password`, `token`, `authorization`, `secret` or `mongodb_uri`, plus any text that looks like a JWT, Bearer token or `mongodb://` URI, with `[REDACTED]`.
- **Sample:** [`logs/sample.log`](logs/sample.log) contains real output from a full Postman run. All other files in `logs/` are git-ignored.

Example entries:

```json
{"level":"info","message":"Login successful","loginBy":"username","userId":"6ace7088d13bfed8f6b558dd","timestamp":"2026-10-13T17:55:22.706Z"}
{"level":"warn","message":"Authorization failed: user does not own this employee","action":"read","employeeId":"6ace708dd13bfed8f6b558e4","userId":"6ace7088d13bfed8f6b558dd","timestamp":"..."}
{"level":"warn","message":"Rate limit exceeded","limiter":"login","ip":"::1","method":"POST","path":"/api/v1/user/login","timestamp":"..."}
```

### Health Check

`GET /health` (local: http://localhost:3000/health, deployed: https://101513153-comp-3123-assignment1.vercel.app/health)

```json
{
  "status": "ok",
  "uptime": 125,
  "timestamp": "2026-10-13T17:55:20.381Z",
  "environment": "development",
  "database": "connected"
}
```

`status` is `"degraded"` and `database` shows the actual state (`disconnected`, `connecting`, ...) when MongoDB is unreachable.
`uptime` is in seconds.

## 13. HTTP Status Codes

| Code | Meaning | When this API returns it |
|---|---|---|
| **200** OK | Request succeeded | Login, list/get/update employees, health check |
| **201** Created | A new resource was created | Signup, create employee |
| **204** No Content | Success, nothing to return | Delete employee (empty body) |
| **400** Bad Request | The client sent invalid data | Validation errors, unknown fields, invalid ObjectId, malformed JSON |
| **401** Unauthorized | Not authenticated | Missing/invalid/expired JWT, wrong login credentials |
| **403** Forbidden | Authenticated, but not allowed | Accessing an employee owned by another user |
| **404** Not Found | Resource or route doesn't exist | Unknown employee id, unknown URL |
| **409** Conflict | Clashes with existing data | Duplicate username or email (MongoDB E11000) |
| **413** Payload Too Large | Body is too big | JSON body over 10 KB |
| **429** Too Many Requests | Rate limit exceeded | Too many signup/login/API requests from one IP |
| **500** Internal Server Error | Unexpected server bug | Any unhandled error (details are hidden in production) |
| **503** Service Unavailable | Temporary server-side problem | Database connection failed |

## 14. Testing with Postman

1. Import `postman/COMP3123_Assignment1.postman_collection.json`.
2. The collection variable `baseUrl` defaults to `http://localhost:3000`. Change it to the Vercel URL to test the deployment.
3. Run the folders **in order**: Health → Signup → Login → Employees (User A) → Cross-user ownership.
   - Successful logins automatically save `{{tokenA}}` and `{{tokenB}}`.
   - Created employees are saved as `{{empA_id}}` and `{{empB_id}}`.
   - Every request has `pm.test` assertions on the status code and response.
4. **For a full collection run**, set `AUTH_RATE_LIMIT_MAX=10` in `.env` and restart the server. The Signup folder alone sends 8 requests, more than the default limit of 5.
5. **Restart the server before running the collection again.** Rate-limit counters are kept in memory, and the "Login - rate limit (429)" request uses up the login limit for 15 minutes.

### Test Credentials (for marking)

These are non-sensitive test accounts. They are created by the first two Signup requests in the collection.

| | Username | Email | Password |
|---|---|---|---|
| User A | `alice_comp3123` | `alice.comp3123@example.com` | `AlicePass123` |
| User B | `bob_comp3123` | `bob.comp3123@example.com` | `BobPass1234` |

## 15. Deployment (Vercel)

- `api/index.js` exports the Express app as a serverless function, and `vercel.json` rewrites every path to it.
- The MongoDB connection promise is cached on `global`, so warm invocations reuse the existing connection instead of opening a new one on every request.
- Environment variables are set in **Vercel → Project → Settings → Environment Variables**: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and the four rate-limit variables.
- Atlas *Network Access* must allow `0.0.0.0/0`, because Vercel's outgoing IP addresses change.
