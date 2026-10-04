/**
 * Domain error hierarchy. Services throw these; the HTTP layer maps them to
 * responses. Keeps business logic free of HTTP concerns.
 */
export class DomainError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "domain_error"
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "مورد پیدا نشد.") {
    super(404, message, "not_found")
  }
}

export class ValidationError extends DomainError {
  constructor(message = "اطلاعات ارسالی معتبر نیست.") {
    super(400, message, "validation_error")
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "برای ادامه وارد حساب شوید.") {
    super(401, message, "unauthorized")
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "دسترسی ندارید.") {
    super(403, message, "forbidden")
  }
}

export class ConflictError extends DomainError {
  constructor(message = "این عملیات با وضعیت فعلی سازگار نیست.") {
    super(409, message, "conflict")
  }
}

export class PaymentRequiredError extends DomainError {
  constructor(message = "پرداخت تأیید نشد.") {
    super(402, message, "payment_required")
  }
}

export class BadGatewayError extends DomainError {
  constructor(message = "سرویس خارجی پاسخ معتبر نداد.") {
    super(502, message, "bad_gateway")
  }
}
