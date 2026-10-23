import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  amountPaise: { type: Number, required: true, min: 1, max: 100000000 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  effectiveFrom: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false });

schema.index({ effectiveFrom: -1 });
schema.index({ userId: 1, effectiveFrom: -1 });
export const PricingRate = mongoose.model('PricingRate', schema);
