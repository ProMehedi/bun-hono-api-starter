# Bun + Hono API Starter

A modern, high-performance API starter template using [Bun](https://bun.sh), [Hono](https://hono.dev), [MongoDB](https://mongodb.com), and TypeScript.

## Features

- ⚡️ **Ultra-fast performance** with Bun runtime
- 🔄 **Hot reloading** for fast development cycles
- 🧩 **Modular architecture** for scalability
- 🔒 **Built-in authentication** middleware and JWT support with expiration
- 🛡️ **Security-first design** with rate limiting, secure headers, and CSRF protection
- 🚦 **Request validation** for robust API design
- 🗃️ **MongoDB integration** with Mongoose
- 📦 **Compression support** for optimized responses
- ✅ **TypeScript** for type safety
- 🔍 **Error handling** middleware with proper stack trace management
- 🚨 **Rate limiting** to prevent brute force attacks
- 🔐 **Secure headers** (XSS, clickjacking, MIME sniffing protection)
- 🎨 **Prettier** code formatting with automated enforcement
- 🪝 **Husky git hooks** for pre-commit and pre-push quality checks
- 📝 **Winston logger** with daily rotation, structured logging, and multiple log levels

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Development](#development)
  - [Production](#production)
- [Logging](#logging)
- [Security](#security)
- [API Routes](#api-routes)
- [User Model](#user-model)
- [Project Structure](#project-structure)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- [Bun](https://bun.sh) (v1.0.0 or newer)
- [MongoDB](https://mongodb.com) or [MongoDB Atlas](https://www.mongodb.com/atlas/database)

### Installation

1. Clone this repository:

```bash
git clone https://github.com/ProMehedi/bun-hono-api-starter.git
cd bun-hono-api-starter
```

2. Install dependencies:

```bash
bun install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Required
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
MONGO_URI=mongodb://localhost:27017/bun-hono-api

# Optional
PORT=8000
NODE_ENV=development

# Logging (Optional)
LOG_LEVEL=info                    # Log level: debug, info, warn, error (default: debug in dev, info in production)
LOG_TO_FILE=both                  # Log destination: console, file, both, auto (default: both)
                                  # - console: console only
                                  # - file: file only
                                  # - both: console + file
                                  # - auto: console in dev, file in production

# Production only (comma-separated list)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

**Security Note:**

- `JWT_SECRET` must be at least 32 characters long and kept secure
- Never commit `.env` file to version control
- In production, set `NODE_ENV=production` and configure `ALLOWED_ORIGINS` for CORS

## Usage

### Development

Run the development server with hot reloading:

```bash
bun dev
```

### Production

Start the production server:

```bash
bun start
```

### Code Formatting

This project uses Prettier for code formatting with automatic enforcement via Husky git hooks.

**Format all files (auto-fix):**

```bash
bun run format
```

**Check formatting (verify only):**

```bash
bun run format:check
```

**Git Hooks:**

- **Pre-commit**: Automatically checks code formatting and TypeScript types before allowing commits
- **Pre-push**: Ensures all formatting and type checks pass before pushing to remote

If formatting fails, run `bun run format` to auto-fix issues.

## Logging

This starter template includes comprehensive logging capabilities using Winston with daily log rotation.

### 📝 Logger Features

- **Structured JSON logging** for production environments
- **Human-readable console output** for development
- **Daily log rotation** with automatic compression
- **Multiple log levels**: `debug`, `info`, `warn`, `error`
- **Separate log files** for different log types:
  - `app-YYYY-MM-DD.log` - General application logs (info, warn, error)
  - `error-YYYY-MM-DD.log` - Error logs only
  - `debug-YYYY-MM-DD.log` - Debug logs (when `LOG_LEVEL=debug`)
  - `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
  - `rejections-YYYY-MM-DD.log` - Unhandled promise rejections
- **HTTP request logging** with method, path, status, duration, IP, and user agent
- **Configurable log destinations** (console, file, or both)
- **Automatic log retention** and cleanup

### 🔧 Configuration

Configure logging behavior using environment variables:

**LOG_LEVEL** (Optional):
- `debug` - Most verbose, includes debug logs
- `info` - Standard logging (default in production)
- `warn` - Warnings and errors only
- `error` - Errors only
- Default: `debug` in development, `info` in production

**LOG_TO_FILE** (Optional):
- `console` - Log to console only
- `file` - Log to files only
- `both` - Log to both console and files (default)
- `auto` - Console in development, files in production
- Default: `both`

### 📊 Log File Details

**App Logs** (`app-YYYY-MM-DD.log`):
- Contains: info, warn, error level logs
- Max size: 50MB per file
- Retention: 14 days
- Compressed: Yes (after rotation)

**Error Logs** (`error-YYYY-MM-DD.log`):
- Contains: error level logs only
- Max size: 20MB per file
- Retention: 30 days
- Compressed: Yes (after rotation)

**Debug Logs** (`debug-YYYY-MM-DD.log`):
- Contains: debug level logs (only when `LOG_LEVEL=debug`)
- Max size: 100MB per file
- Retention: 3 days (short retention due to verbosity)
- Compressed: Yes (after rotation)

**Exception/Rejection Logs**:
- Contains: Uncaught exceptions and unhandled promise rejections
- Max size: 20MB per file
- Retention: 30 days
- Compressed: Yes (after rotation)

### 📍 Log File Location

All log files are stored in the `logs/` directory at the project root:
```
logs/
├── app-2026-01-06.log
├── error-2026-01-06.log
├── debug-2026-01-06.log (if LOG_LEVEL=debug)
├── exceptions-2026-01-06.log
├── rejections-2026-01-06.log
└── .audit/              # Audit files for log rotation
```

### 🔍 HTTP Request Logging

Every HTTP request is automatically logged with the following information:
- HTTP method (GET, POST, PUT, etc.)
- Request path
- Full URL
- Response status code
- Request duration (in milliseconds)
- User agent
- Client IP address

Example log entry:
```json
{
  "timestamp": "2026-01-06T10:30:45.123Z",
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "path": "/api/v1/users/login",
  "url": "http://localhost:8000/api/v1/users/login",
  "status": 200,
  "duration": "45ms",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
```

### 💡 Usage Examples

**Development (console + file logging):**
```env
LOG_LEVEL=debug
LOG_TO_FILE=both
```

**Production (file logging only):**
```env
LOG_LEVEL=info
LOG_TO_FILE=file
```

**Debugging (verbose console output):**
```env
LOG_LEVEL=debug
LOG_TO_FILE=console
```

## Security

This starter template includes comprehensive security features:

### 🔐 Authentication & Authorization

- **JWT-based authentication** with 7-day token expiration
- **Protected routes** requiring valid JWT tokens
- **Admin-only routes** with role-based access control
- **Password hashing** using Bun's built-in bcrypt implementation
- **Mass assignment protection** - prevents privilege escalation

### 🛡️ Security Middleware

- **Rate Limiting**:

  - Strict rate limiting (5 requests per 15 minutes) on sensitive endpoints (login, register)
  - Standard rate limiting (60 requests per minute) on general endpoints
  - Prevents brute force attacks and API abuse

- **Secure Headers**:

  - X-Frame-Options: DENY (prevents clickjacking)
  - X-XSS-Protection: 1; mode=block (XSS protection)
  - X-Content-Type-Options: nosniff (prevents MIME sniffing)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy (in production)

- **CSRF Protection**: Enabled in production mode
- **CORS Configuration**: Configurable allowed origins for production

### 🔒 Security Best Practices

- ✅ Input validation on all user inputs
- ✅ Email format validation
- ✅ Password length requirements (minimum 6 characters)
- ✅ Error messages don't leak sensitive information
- ✅ Stack traces only shown in development
- ✅ Environment variable validation (throws error if missing)
- ✅ Password hashes never returned in API responses
- ✅ Admin role cannot be set during user registration

### 🚨 Rate Limiting Details

The API implements two levels of rate limiting:

1. **Strict Rate Limit** (Login/Register endpoints):

   - 5 requests per 15 minutes per IP
   - Prevents brute force attacks

2. **Standard Rate Limit** (All other endpoints):
   - 60 requests per minute per IP
   - Prevents API abuse

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait when limit exceeded (429 status)

## API Routes

| Method | Route                   | Description         | Auth Required | Admin Only |
| ------ | ----------------------- | ------------------- | ------------- | ---------- |
| GET    | `/api/v1`               | API welcome message | No            | No         |
| POST   | `/api/v1/users`         | Create a new user   | No            | No         |
| POST   | `/api/v1/users/login`   | User login          | No            | No         |
| GET    | `/api/v1/users/profile` | Get user profile    | Yes           | No         |
| PUT    | `/api/v1/users/profile` | Update user profile | Yes           | No         |
| GET    | `/api/v1/users`         | Get all users       | Yes           | Yes        |
| GET    | `/api/v1/users/:id`     | Get user by ID      | Yes           | Yes        |

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

**User Login:**

```
POST /api/v1/users/login
```

**Note:** This endpoint has strict rate limiting (5 requests per 15 minutes) to prevent brute force attacks

```json
{
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
  "message": "User logged in successfully"
}
```

**Note:** JWT tokens expire after 7 days. Include the token in the `Authorization` header for protected routes.

**Update Profile:**

```
PUT /api/v1/users/profile
Authorization: Bearer your_jwt_token
```

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "newpassword"
}
```

All fields are optional. The response will not include the password hash:

**Response:**

```json
{
  "user": {
    "_id": "...",
    "name": "Updated Name",
    "email": "updated@example.com",
    "isAdmin": false
  }
}
```

**Protected Routes:**
Include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## User Model

The user model includes the following properties:

```typescript
interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
  isAdmin: boolean
  matchPassword: (pass: string) => Promise<boolean>
  createdAt: Date
  updatedAt: Date
}
```

Key features:

- **Password hashing** with Bun's built-in bcrypt implementation (cost: 10)
- **Automatic email validation** (must match email pattern)
- **Admin role support** with the `isAdmin` property
- **Password matching method** for secure authentication
- **Timestamps** automatically managed by Mongoose
- **Security**: The `isAdmin` field cannot be set via API endpoints - it must be set directly in the database for security reasons

## Project Structure

```
├── config/              # Configuration files
│   ├── compress.config.ts  # Compression configuration
│   ├── db.config.ts     # Database configuration
│   └── index.ts         # Config exports
├── controllers/         # Route controllers
│   ├── user.controllers.ts # User-related controllers
│   └── index.ts         # Controller exports
├── middlewares/         # Hono middlewares
│   ├── auth.middlewares.ts # Authentication middleware
│   ├── error.middlewares.ts # Error handling middleware
│   ├── logger.middlewares.ts # HTTP request logging middleware
│   ├── rateLimit.middlewares.ts # Rate limiting middleware
│   └── index.ts         # Middleware exports
├── models/              # Database models
│   ├── user.model.ts    # User model schema
│   └── index.ts         # Model exports
├── routes/              # API routes
│   ├── user.routes.ts   # User routes
│   └── index.ts         # Route exports
├── utils/               # Utility functions
│   ├── genToken.ts      # JWT token generator
│   ├── logger.ts        # Winston logger configuration
│   └── index.ts         # Utils exports
├── server.ts            # Main application entry
├── .env                 # Environment variables (create this)
├── .gitignore           # Git ignore file
├── bun.lock             # Bun lock file
├── package.json         # Package configuration
├── README.md            # This file
├── tsconfig.json        # TypeScript configuration
└── wrangler.toml        # Cloudflare Workers configuration
```

## Changelog

### Version 1.2.1 (Latest)

**Logging Feature:**

- 📝 Added comprehensive Winston logger with daily log rotation
- 🔄 Implemented HTTP request logging middleware with method, path, status, duration, IP, and user agent
- 📊 Added structured JSON logging for production and human-readable console output for development
- 🗂️ Created separate log files for app logs, errors, debug logs, exceptions, and rejections
- ⚙️ Added configurable log destinations (`LOG_TO_FILE`: console, file, both, auto)
- 📈 Added configurable log levels (`LOG_LEVEL`: debug, info, warn, error)
- 🗜️ Implemented automatic log compression and retention policies
- 📁 Log files stored in `logs/` directory with daily rotation
- 🔍 Added context logger helper for structured logging with custom context

**Dependencies:**

- Added `winston` v3.19.0 for logging
- Added `winston-daily-rotate-file` v5.0.0 for log rotation

### Version 1.2.0

**TypeScript Fixes:**

- ✅ Fixed `IUser` interface type incompatibility - changed `Schema.Types.ObjectId` to `Types.ObjectId` for proper TypeScript type checking
- ✅ Fixed Mongoose pre-save hook - removed deprecated `next()` callback in favor of modern async/await pattern
- ✅ Improved type safety with correct Mongoose TypeScript types
- ✅ All TypeScript compilation errors resolved

**Code Quality & Developer Experience:**

- 🔧 Updated user model to use modern Mongoose async hook pattern
- 📝 Fixed typo in comment ("Heiger" → "Higher")
- 🎨 Added Prettier code formatting with comprehensive configuration
- 🪝 Integrated Husky git hooks for automated code quality checks
  - **pre-commit hook**: Automatically runs `format:check` and `typecheck` before commits
  - **pre-push hook**: Ensures code formatting and type checking pass before pushing
- 📦 Added format scripts: `format` (auto-fix) and `format:check` (verify only)
- ✅ Automatic code quality enforcement prevents committing unformatted or type-unsafe code

### Version 1.1.0

**Security Improvements:**

- 🔒 Fixed critical mass assignment vulnerability - `isAdmin` can no longer be set during registration
- 🔐 Added JWT token expiration (7 days) with proper validation
- 🛡️ Implemented rate limiting middleware to prevent brute force attacks
- 🔒 Added secure headers middleware (XSS, clickjacking, MIME sniffing protection)
- 🛡️ Added CSRF protection for production environments
- 🔐 Fixed JWT secret validation - now throws error if missing
- 🔒 Fixed password hash leak in profile update response
- 🛡️ Improved CORS configuration with environment-based origin restrictions
- 🔍 Fixed error handler stack trace exposure logic
- ✅ Added comprehensive input validation (email format, password length)

**Code Quality:**

- 📦 Removed deprecated `@types/mongoose` dependency
- 🔄 Standardized environment variable access to `process.env`
- ✅ Improved TypeScript types and error handling
- 🔄 Updated to modern Hono JWT API (`sign`/`verify` instead of deprecated `Jwt`)
- 📝 Enhanced error messages and validation feedback

**Dependencies:**

- Updated to Hono v4.11.3
- Mongoose v9.1.1 (includes built-in TypeScript types)

### Version 1.0.2

- Complete project restructuring with improved modularity
- Added compression support with polyfill for `CompressionStream`
- Enhanced error handling middleware
- Updated MongoDB connection with better error feedback
- Improved CORS configuration for better security
- Updated to latest Hono v4.7.4 and Mongoose v8.12.1
- Enhanced TypeScript support and typings
- Standardized export patterns across modules
- Added admin role functionality with middleware protection
- Added profile editing functionality

### Version 1.0.0

- Initial release with basic CRUD functionality
- MongoDB integration
- JWT-based authentication
- Basic error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Mehedi Hasan - [admin@promehedi.com](mailto:admin@promehedi.com)

Project Link: [https://github.com/ProMehedi/bun-hono-api-starter](https://github.com/ProMehedi/bun-hono-api-starter)
