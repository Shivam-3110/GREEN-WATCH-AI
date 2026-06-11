import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'New Conversation',
    },
    category: {
      type: String,
      enum: [
        'general',
        'carbon',
        'pollution',
        'sustainability',
        'waste',
        'energy',
        'water',
      ],
      default: 'general',
      index: true,
    },
    messages: {
      type: [messageSchema],
      validate: {
        validator: (val) => val.length <= 100,
        message: 'Conversation cannot exceed 100 messages',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

conversationSchema.index({ user: 1, lastMessageAt: -1 })
conversationSchema.index({ user: 1, isActive: 1, lastMessageAt: -1 })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation
