import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['tenant', 'host', 'admin'], default: 'tenant' },
  verified: {type:Boolean, default:false},
  createdAt:{ type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);