import mongoose from 'mongoose';

const SceneConfigSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: 0
  },
  name: {
    type: String,
    default: "Default Scene"
  },
  description: {
    type: String,
    default: "Interactive Scene"
  },
  clothes: {
    type: String,
    default: "casual"
  },
  model: {
    type: String,
    required: true
  },
  environmentURL: {
    type: String,
    required: true
  },
  defaultAnimation: {
    type: String,
    default: "idle"
  },
  cameraPosition: {
    type: [Number],
    default: [0, 1.15, -2.5]
  },
  cameraRotation: {
    type: Number,
    default: 0
  },
  modelPosition: {
    type: [Number],
    default: [0, 0, -4]
  },
  modelRotation: {
    type: [Number],
    default: [0, 0, 0]
  },
  modelScale: {
    type: [Number],
    default: [1, 1, 1]
  },
  environmentScale: {
    type: [Number],
    default: [1, 1, 1]
  },
  environmentPosition: {
    type: [Number],
    default: [0, -1, -5]
  },
  environmentRotation: {
    type: [Number],
    default: [0, 1.5707963267948966, 0]
  },
  cameraPitch: {
    type: Number,
    default: 0
  }
});

const StreamingStatusSchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isStreaming: {
    type: Boolean,
    required: true,
    default: false
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now,
    index: true
  },
  title: {
    type: String,
    required: false
  },
  description: {
    type: String,
    default: "Interactive Scene"
  },
  modelName: {
    type: String,
    required: false
  },
  identifier: {
    type: String,
    required: false
  },
  model: {
    type: String,
    required: false
  },
  twitter: {
    type: String,
    required: false
  },
  color: {
    type: String,
    default: "#FE2C55"
  },
  type: {
    type: String,
    enum: ['default', 'coming-soon', '3d', 'stream'],
    default: 'stream'
  },
  component: {
    type: String,
    default: "ThreeScene"
  },
  walletAddress: {
    type: String,
    required: false
  },
  creator: {
    username: String,
    title: String,
    avatar: String
  },
  sceneConfigs: [SceneConfigSchema],
  startedAt: {
    type: Date,
    required: false
  },
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
StreamingStatusSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const StreamingStatus = mongoose.model('StreamingStatus', StreamingStatusSchema);
export default StreamingStatusSchema;