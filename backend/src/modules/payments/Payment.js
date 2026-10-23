import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema({
  requestedAmountPaise: { type: Number, required: true, min: 1, immutable: true },
  originalAmountPaise: { type: Number, required: true, min: 1, immutable: true },
  reason: { type: String, required: true, trim: true, maxlength: 500, immutable: true },
  idempotencyKey: { type: String, required: true, maxlength: 120, immutable: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  requestedAt: { type: Date, required: true, immutable: true },
  previousPaymentStatus: { type: String, required: true, immutable: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  decisionReason: { type: String, trim: true, maxlength: 500, default: '' },
  updatedPaymentStatus: { type: String, default: null }
}, { timestamps: false });

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  billingPeriod: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
  amountPaise: { type: Number, required: true, min: 1, max: 1000000000 },
  correctedAmountPaise: { type: Number, min: 1, max: 1000000000, default: null },
  correctionRequests: { type: [correctionSchema], default: [] },
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
schema.index({ 'correctionRequests.status': 1, paidAt: -1 });
schema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
export const Payment = mongoose.model('Payment', schema);
