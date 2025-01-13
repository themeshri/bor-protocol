import mongoose from 'mongoose';
const ReplyContextSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  }
});

const AIResponseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  replyToUser: {
    type: String,
    required: false
  },
  replyToMessageId: {
    type: String,
    required: false
  },
  replyToMessage: {
    type: String,
    required: false
  },
  replyToHandle: {
    type: String,
    required: false
  },
  replyToPfp: {
    type: String,
    required: false
  },
  intensity: {
    type: Number,
    required: false
  },
  animation: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isGiftResponse: {
    type: Boolean,
    required: false
  },
  giftId: {
    type: String,
    required: false
  },
  thought: {
    type: Boolean,
    required: false
  },

});

const AIResponse = mongoose.model('AIResponse', AIResponseSchema);
export default AIResponse;