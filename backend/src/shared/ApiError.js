export class ApiError extends Error {
  constructor(statusCode, message, code = 'REQUEST_ERROR', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
