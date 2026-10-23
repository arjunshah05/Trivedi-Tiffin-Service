import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  billingPeriod: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
  amountPaise: { type: Number, required: true, min: 1, max: 1000000000 },
  method: { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'], required: true },
  status: { type: String, enum: ['CONFIRMED', 'REVERSED'], default: 'CONFIRMED' },
  paidAt: { type: Date, required: true },
  reference: { type: String, trim: true, maxlength: 100, default: '' },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  idempotencyKey: { type: String, trim: true, maxlength: 120, default: undefined },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reversedAt: { type: Date, default: null },
  reversalReason: { type: String, maxlength: 300, default: '' },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, billingPeriod: 1, paidAt: -1 });
schema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
export const Payment = mongoose.model('Payment', schema);
