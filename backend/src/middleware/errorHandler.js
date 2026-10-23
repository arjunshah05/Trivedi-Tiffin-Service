import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} was not found.` } });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : 500);
  const code = err.code || (err.code === 11000 ? 'DUPLICATE_RECORD' : 'INTERNAL_ERROR');
  const message = status >= 500 && env.nodeEnv === 'production' ? 'An unexpected server error occurred.' : err.message || 'Request failed.';
  if (status >= 500) console.error({ message: err.message, stack: env.nodeEnv === 'development' ? err.stack : undefined, path: req.originalUrl });
  res.status(status).json({ error: { code, message, ...(err.details ? { details: err.details } : {}) } });
}
