import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  mealType: { type: String, enum: ['LUNCH', 'DINNER'], required: true },
  status: { type: String, enum: ['RECEIVED', 'NOT_RECEIVED'], required: true },
  note: { type: String, maxlength: 200, default: '' }
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, serviceDate: 1, mealType: 1 }, { unique: true });
schema.index({ serviceDate: 1, status: 1 });
export const TiffinEntry = mongoose.model('TiffinEntry', schema);
