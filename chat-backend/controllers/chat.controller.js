import prisma from "../prismaClient.js";

export const getChatHistory = async (req, res) => {
  try {
    const { myId, otherUserId } = req.params;
    const { cursor } = req.query;

    const me = req.headers["x-user-id"];
    if (!me || me !== myId) return res.status(403).json({ error: "forbidden" });

    console.log(`Fetching messages between ${myId} and ${otherUserId}`);

    const whereClause = {
      OR: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    };

    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    let messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
      
    messages = messages.reverse();

    const formattedMessages = messages.map(msg => {
      const timeString = new Date(msg.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return {
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: msg.text,
        clientMsgId: msg.clientMsgId,
        createdAt: msg.createdAt, 
        status: msg.status || 'sent' 
      };
    });

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

export const getGroupHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers["x-user-id"];
    
    const { cursor } = req.query;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Check membership
    const group = await prisma.conversation.findFirst({
      where: {
        id: groupId,
        type: "group",
        participants: {
          has: userId
        }
      }
    });
    
    if (!group) {
      return res.status(403).json({ error: "not_a_member" });
    }

    const whereClause = { conversationId: groupId };
    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      groupId: groupId,
      text: msg.text,
      clientMsgId: msg.clientMsgId,
      createdAt: msg.createdAt,
      status: msg.status || 'sent'
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching group history:", error);
    res.status(500).json({ error: "Failed to fetch group history" });
  }
};