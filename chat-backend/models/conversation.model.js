import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participantsKey: { type: String, required: true, unique: true },
    participants: [{ type: String, required: true }],
    lastSeq: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    type: { type: String, enum: ["dm", "group"], default: "dm" },
    name: { type: String },
    admins: [{ type: String }],
    createdBy: { type: String }
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
