import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/users/User.js';
import { ApiError } from '../shared/ApiError.js';
import { asyncHandler } from '../shared/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw new ApiError(401, 'Please sign in to continue.', 'AUTH_REQUIRED');
  let payload;
  try { payload = jwt.verify(token, env.jwtSecret); }
  catch { throw new ApiError(401, 'Your session is invalid or expired. Please sign in again.', 'INVALID_SESSION'); }
  const user = await User.findById(payload.sub).select('_id fullName email phone role status');
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'This account is unavailable. Please sign in again.', 'ACCOUNT_UNAVAILABLE');
  req.user = user;
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to perform this action.', 'FORBIDDEN'));
    next();
  };
}
