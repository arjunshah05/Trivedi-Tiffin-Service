import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieName: process.env.COOKIE_NAME || 'tts_session',
  defaultPriceRupees: Number(process.env.DEFAULT_TIFFIN_PRICE_RUPEES),
};
