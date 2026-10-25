import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../users/User.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/ApiError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
const isProduction = env.nodeEnv === 'production';

const sameSite = isProduction ? 'none' : 'lax';
const cookieOptions = () => ({
  httpOnly: true, secure: isProduction, sameSite,
  path: '/', maxAge: 24 * 60 * 60 * 1000
});
function setSession(res, user) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie(env.cookieName, token, cookieOptions());
}
function safeUser(user) {
  return { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status };
}

router.post('/register', asyncHandler(async (req, res) => {
  const { fullName, email, phone = '', password } = req.body || {};
  if (typeof fullName !== 'string' || fullName.trim().length < 2) throw new ApiError(400, 'Enter your full name.', 'VALIDATION_ERROR');
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.', 'VALIDATION_ERROR');
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) throw new ApiError(400, 'Password must be 10–128 characters.', 'VALIDATION_ERROR');
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ fullName: fullName.trim(), email: email.toLowerCase().trim(), phone: String(phone).trim(), passwordHash, role: 'CUSTOMER' });
  setSession(res, user);
  res.status(201).json({ data: { user: safeUser(user) } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') throw new ApiError(400, 'Email and password are required.', 'VALIDATION_ERROR');
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'This account is inactive. Contact the administrator.', 'ACCOUNT_INACTIVE');
  setSession(res, user);
  res.json({ data: { user: safeUser(user) } });
}));

router.post('/logout', (req, res) => {
  res.clearCookie(env.cookieName, { httpOnly: true, secure: isProduction, sameSite, path: '/' });
  res.json({ data: { loggedOut: true } });
});

router.get('/me', requireAuth, (req, res) => res.json({ data: { user: safeUser(req.user) } }));
export default router;