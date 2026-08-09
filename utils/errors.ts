export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Ensures the prototype chain is correct in all runtimes
    Object.setPrototypeOf(this, new.target.prototype)
    // Captures clean stack traces (hides the error class constructor)
    Error.captureStackTrace?.(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(403, message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
  }
}
