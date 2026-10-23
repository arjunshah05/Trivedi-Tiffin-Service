import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/db.js';
import { User } from '../src/modules/users/User.js';
import { PricingRate } from '../src/modules/pricing/PricingRate.js';
import { env } from '../src/config/env.js';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding.');
}
if (process.env.ADMIN_PASSWORD.length < 14) {
  throw new Error('ADMIN_PASSWORD must be at least 14 characters for the initial admin.');
}
await connectDatabase();
const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
let admin = await User.findOne({ email });
if (!admin) {
  admin = await User.create({
    fullName: process.env.ADMIN_NAME || 'Trivedi Admin',
    email,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: 'ADMIN',
    status: 'ACTIVE'
  });
  console.info(`Created admin account: ${admin.email}`);
} else {
  console.info(`Admin account already exists: ${admin.email}`);
}
const today = new Date().toISOString().slice(0, 10);
const rateExists = await PricingRate.findOne({
  effectiveFrom: today,
  $or: [{ userId: null }, { userId: { $exists: false } }]
});
if (!rateExists) {
  await PricingRate.create({ amountPaise: Math.round(env.defaultPriceRupees * 100), effectiveFrom: today, createdBy: admin._id });
  console.info(`Created initial rate ₹${env.defaultPriceRupees} effective ${today}`);
}
process.exit(0);
