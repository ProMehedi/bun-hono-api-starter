# Bun + Hono API Starter

A modern, fast API starter built with Bun, Hono, Drizzle, and TypeScript.

Designed for production-ready projects with authentication, security, logging, and clean architecture out of the box.

✅ Demo link: https://hono-api.jsify.org/api/v1

---

## ✨ Features

- ⚡ Bun runtime (fast startup + execution)
- 🧩 Modular project structure
- 🔐 JWT authentication with role-based access
- 🛡️ Rate limiting, secure headers, CSRF (production)
- ✅ Request validation + centralized error handling
- 🗃️ PostgreSQL (Drizzle ORM)
- 📝 Pino logging (console + rotating files)
- 🎨 Prettier + Husky for code quality
- 🔄 Hot reload for development
- 💪 Fully typed with TypeScript

---

## 🚀 Getting Started

### Prerequisites

- Bun (v1+)
- PostgreSQL (local or Neon)

---

### Installation

```bash
git clone https://github.com/ProMehedi/bun-hono-api-starter.git
cd bun-hono-api-starter
bun install
```

---

### Environment Setup

Create `.env`:

```env
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/bun_hono_api

PORT=8000
NODE_ENV=development

LOG_LEVEL=debug
LOG_TO_FILE=both

# Production only
ALLOWED_ORIGINS=https://yourdomain.com
```

> ⚠️ **Never commit `.env`.**

---

## ▶️ Usage

### Development

```bash
bun dev
```

### Production

```bash
bun start
```

---

## 🧹 Formatting

```bash
bun run format
bun run format:check
```

Pre-commit and pre-push hooks automatically enforce formatting and type safety.

---

## 🔐 Security Overview

- JWT auth (7-day expiration)
- Role-based authorization (admin routes)
- Rate limiting:
  - Auth routes: 5 / 15 min
  - Other routes: 60 / min
- Secure headers (XSS, clickjacking, MIME)
- CSRF in production
- Input validation everywhere
- Password hashing
- Stack traces only in development

---

## 🛣️ API Routes

| Method | Route                   | Auth | Admin |
| ------ | ----------------------- | ---- | ----- |
| GET    | `/api/v1`               | No   | No    |
| POST   | `/api/v1/users`         | No   | No    |
| POST   | `/api/v1/users/login`   | No   | No    |
| GET    | `/api/v1/users/profile` | Yes  | No    |
| PUT    | `/api/v1/users/profile` | Yes  | No    |
| GET    | `/api/v1/users`         | Yes  | Yes   |
| GET    | `/api/v1/users/:id`     | Yes  | Yes   |

### Request/Response Examples

**Create User:**

```
POST /api/v1/users
```

**Note:** This endpoint has strict rate limiting (5 requests per 15 minutes)

```json
{
  "name": "Mehedi Hasan",
  "email": "mehedi@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Mehedi Hasan",
    "email": "mehedi@example.com",
    "isAdmin": false,
    "token": "jwt_token_here"
  },
  "message": "User created successfully"
}
```

**Note:** The `isAdmin` field cannot be set via API - it's always `false` for security.

**Protected Routes:**
Include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

---

## 📁 Project Structure

```text
src/
├── config/          # Configuration (db, compress, etc.)
├── controllers/     # Route handlers
├── middlewares/     # Auth, error, logger, rate limit
├── models/          # Database schemas
├── routes/          # API route definitions
├── utils/           # Helpers (logger, token, etc.)
└── server.ts        # App entry
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

```bash
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**Mehedi Hasan** - [admin@promehedi.com](mailto:admin@promehedi.com)  
[https://promehedi.com](https://promehedi.com)
