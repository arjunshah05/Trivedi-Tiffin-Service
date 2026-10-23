import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  billingPeriod: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
  lunchCount: { type: Number, required: true, min: 0 },
  dinnerCount: { type: Number, required: true, min: 0 },
  monthlyChargesPaise: { type: Number, required: true, min: 0 },
  openingOutstandingPaise: { type: Number, required: true, min: 0 },
  adjustmentsPaise: { type: Number, required: true, default: 0 },
  totalDuePaise: { type: Number, required: true, min: 0 },
  totalPaidPaise: { type: Number, required: true, min: 0 },
  remainingBalancePaise: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], required: true },
  calculatedAt: { type: Date, required: true }
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, billingPeriod: 1 }, { unique: true });
export const MonthlyBill = mongoose.model('MonthlyBill', schema);
