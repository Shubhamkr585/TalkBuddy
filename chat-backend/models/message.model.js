import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String },
    text: { type: String, required: true },
    clientMsgId: { type: String, required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    seq: { type: Number },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Indexes for idempotency and ordering
messageSchema.index({ conversationId: 1, seq: 1 }, { unique: true });
messageSchema.index({ senderId: 1, clientMsgId: 1 }, { unique: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;