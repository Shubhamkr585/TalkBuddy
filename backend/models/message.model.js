import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { 
      type: String, 
      default: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Message = mongoose.model("Message", messageSchema);
export default Message;