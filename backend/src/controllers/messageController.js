import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { getIO } from '../config/socket.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, groupChatId, content, mediaUrl } = req.body;
    const senderId = req.user.id;

    if (!recipientId && !groupChatId) {
      return res.status(400).json({ success: false, message: 'Recipient or Group Chat ID is required' });
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId || null,
      groupChat: groupChatId || null,
      content,
      mediaUrl,
      seenBy: [senderId]
    });

    const populatedMsg = await message.populate([
      { path: 'sender', select: 'displayName username profilePicture' },
      { path: 'recipient', select: 'displayName username profilePicture' }
    ]);

    const io = getIO();
    if (io) {
      if (groupChatId) {
        // Emit to Group Socket Room
        io.to(`group:${groupChatId}`).emit('message_received', populatedMsg);
      } else {
        // Emit to Recipient Personal Socket Room and Sender Personal Socket Room
        io.to(`user:${recipientId}`).emit('message_received', populatedMsg);
        io.to(`user:${senderId}`).emit('message_received', populatedMsg);
      }
    }

    return res.status(201).json({ success: true, message: populatedMsg });
  } catch (error) {
    next(error);
  }
};

export const getChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all messages where current user is sender or recipient
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
    .populate('sender', 'displayName username profilePicture')
    .populate('recipient', 'displayName username profilePicture')
    .populate('groupChat', 'name slug coverImage')
    .sort({ createdAt: -1 });

    // Deduplicate to extract unique conversations
    const conversations = [];
    const seenChats = new Set();

    for (const msg of messages) {
      if (msg.groupChat) {
        const key = `group:${msg.groupChat._id}`;
        if (!seenChats.has(key)) {
          seenChats.add(key);
          conversations.push({
            type: 'group',
            id: msg.groupChat._id,
            name: msg.groupChat.name,
            slug: msg.groupChat.slug,
            coverImage: msg.groupChat.coverImage,
            latestMessage: msg
          });
        }
      } else {
        const partner = msg.sender._id.toString() === userId ? msg.recipient : msg.sender;
        if (!partner) continue;
        const key = `user:${partner._id}`;
        if (!seenChats.has(key)) {
          seenChats.add(key);
          conversations.push({
            type: 'direct',
            id: partner._id,
            name: partner.displayName,
            username: partner.username,
            profilePicture: partner.profilePicture,
            latestMessage: msg
          });
        }
      }
    }

    // If empty list, check following list to suggest users to start a chat with
    return res.status(200).json({ success: true, chats: conversations });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { groupChatId } = req.query;
    const userId = req.user.id;

    let query = {};

    if (groupChatId) {
      query = { groupChat: groupChatId };
    } else {
      query = {
        $or: [
          { sender: userId, recipient: partnerId },
          { sender: partnerId, recipient: userId }
        ],
        groupChat: null
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'displayName username profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as seen
    const unseenIds = messages
      .filter(m => m.sender._id.toString() !== userId && !m.seenBy.includes(userId))
      .map(m => m._id);

    if (unseenIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unseenIds } },
        { $addToSet: { seenBy: userId } }
      );
      
      // Notify sender that messages were seen
      const io = getIO();
      if (io) {
        if (groupChatId) {
          io.to(`group:${groupChatId}`).emit('messages_seen_broadcast', { seenBy: userId, groupChatId });
        } else {
          io.to(`user:${partnerId}`).emit('messages_seen_broadcast', { seenBy: userId, partnerId: userId });
        }
      }
    }

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};
