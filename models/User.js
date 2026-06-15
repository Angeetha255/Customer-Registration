import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  customerId: { type: String, unique: true, sparse: true },
  introducerId: { type: String, unique: true, sparse: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  registeredAt: { type: Date, default: () => new Date() },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
})

const User = mongoose.model('User', userSchema)
export default User
