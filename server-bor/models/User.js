import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  handle: {
    type: String,
    unique: true,
    sparse: true  // Allows null values while maintaining uniqueness
  },
  pfp: {
    type: String  // URL to profile picture
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;