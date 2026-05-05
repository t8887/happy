const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
