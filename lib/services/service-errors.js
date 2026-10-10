export class ServiceError extends Error {
  constructor(code, message, status = 400, fields = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}
