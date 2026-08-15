export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details: any;

  constructor(message: string, statusCode: number, errorCode: string, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 401, "AUTHENTICATION_ERROR", details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 403, "AUTHORIZATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 404, "NOT_FOUND_ERROR", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 409, "CONFLICT_ERROR", details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 422, "BUSINESS_RULE_ERROR", details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", details);
  }
}
