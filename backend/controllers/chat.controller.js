import Message from "../models/message.model.js";

export const getChatHistory = async (req, res) => {
  try {
    const { myId, otherUserId } = req.params;

    // Find messages where I am sender and they are receiver, OR vice versa
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // Oldest to newest

    // Format output to match frontend interface
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      timestamp: msg.timestamp
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};